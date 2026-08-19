-- Furnish `clients` with the figures the tax calculator and the SRS planner
-- collect, so a saved form updates the customer's profile instead of being
-- thrown away when the tab closes.
--
-- Applied to prod via Supabase MCP on 2026-08-19 (supabase/CONTEXT.md: MCP
-- only, never the CLI, for DB changes). This file is the repo's copy so
-- `supabase db reset` can rebuild the same schema on the ephemeral CI DB.
--
-- REVERSES A STATED POSITION. planning/CONTEXT.md said "Tax + SRS are NOT
-- persisted — conversation aids"; both pages carried a note saying so. The
-- advisor asked for the opposite: the numbers they gather in a meeting are
-- customer facts, and re-typing an SRS balance at every review is how the
-- balance goes stale. Both tools now have an explicit Save; nothing is written
-- without one, so the "edit freely" property survives right up to the click.
--
-- COLUMNS, NOT A SNAPSHOT TABLE. These are the customer's CURRENT position,
-- the same kind of thing `cpf_oa` or `personal_investment_value` already are,
-- and they read back as the tools' pre-fill. `customer_activity` already keeps
-- the history of who changed what and when, so a second per-run table would
-- duplicate an audit trail that exists.
--
-- Two jsonb exceptions: nineteen reliefs × {on, quantity, manualAmount} and
-- three withdrawal periods × {amount, years} are lists, not customer
-- attributes. Flattening them would mean 57 columns nothing will ever query
-- individually, and would pin the relief catalogue into the schema — it
-- changes every Budget.

alter table public.clients
  -- ── Tax calculator (tool 04) ──────────────────────────────────────────────
  add column if not exists tax_employment_type text,
  add column if not exists tax_other_income numeric,
  add column if not exists tax_donations numeric,
  add column if not exists tax_use_fedr boolean not null default false,
  add column if not exists tax_fedr_rate numeric,
  add column if not exists tax_reliefs jsonb,
  add column if not exists tax_saved_at timestamptz,
  -- ── SRS planner (tool 05) · contribution half ─────────────────────────────
  add column if not exists srs_current_balance numeric,
  add column if not exists srs_contribution_this_year numeric,
  add column if not exists srs_annual_contribution numeric,
  add column if not exists srs_growth_rate numeric,
  add column if not exists srs_contribute_until_age smallint,
  add column if not exists srs_withdrawal_age smallint,
  -- ── SRS planner · withdrawal half ─────────────────────────────────────────
  add column if not exists srs_withdrawal_strategy text,
  add column if not exists srs_balance_override numeric,
  add column if not exists srs_withdrawal_start_age smallint,
  add column if not exists srs_withdrawal_years smallint,
  add column if not exists srs_withdrawal_growth numeric,
  add column if not exists srs_withdrawal_other_income numeric,
  add column if not exists srs_withdrawal_periods jsonb,
  add column if not exists srs_saved_at timestamptz;

-- Enumerations are CHECKed rather than typed: a Postgres enum would need a
-- migration to add a value, and both of these track app unions that may grow.
-- Null is allowed throughout — "never saved this tool" is a real state, and is
-- what makes the pre-fill fall back to the statutory default.
alter table public.clients
  drop constraint if exists clients_tax_employment_type_check;
alter table public.clients
  add constraint clients_tax_employment_type_check
  check (tax_employment_type is null or tax_employment_type in ('employed', 'selfEmployed'));

alter table public.clients
  drop constraint if exists clients_srs_withdrawal_strategy_check;
alter table public.clients
  add constraint clients_srs_withdrawal_strategy_check
  check (srs_withdrawal_strategy is null or srs_withdrawal_strategy in ('equal', 'custom'));

-- Ages are bounded the same way `seedAge` bounds its output. A stored 2086 date
-- of birth once opened the tax calculator on age -60 (planning/lessons.md
-- 2026-07-28); the DatePicker that caused it is fixed, but the column should
-- not be the place that trusts it.
alter table public.clients
  drop constraint if exists clients_srs_ages_check;
alter table public.clients
  add constraint clients_srs_ages_check
  check (
    (srs_contribute_until_age is null or srs_contribute_until_age between 16 and 120)
    and (srs_withdrawal_age is null or srs_withdrawal_age between 16 and 120)
    and (srs_withdrawal_start_age is null or srs_withdrawal_start_age between 16 and 120)
    and (srs_withdrawal_years is null or srs_withdrawal_years between 0 and 100)
  );

comment on column public.clients.tax_reliefs is
  'Tax calculator relief state as {"<reliefId>": {"on": bool, "quantity": num, "manualAmount": num}}. Null until the calculator is first saved.';
comment on column public.clients.tax_saved_at is
  'When the tax calculator last wrote to this record. Null = never saved.';
comment on column public.clients.srs_withdrawal_periods is
  'SRS custom drawdown periods as [{"amount": num, "years": num}]. Only meaningful when srs_withdrawal_strategy = ''custom''.';
comment on column public.clients.srs_saved_at is
  'When the SRS planner last wrote to this record. Null = never saved.';

-- No RLS change. These are columns on an existing table; `clients` already
-- carries the own-or-view_all_clients pair, and column-level grants are not
-- part of this schema's model.
