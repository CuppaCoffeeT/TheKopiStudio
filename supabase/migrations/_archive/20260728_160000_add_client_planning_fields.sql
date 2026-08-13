-- =============================================================================
-- CRM model extension: personal investments + stepped future income
-- (reference: `insurance_crm (36).html`, the advisor's own working CRM)
--
-- Twelve additive columns on public.clients. They exist to feed ONE thing the
-- current report cannot do: project CPF to 55 *with future contributions*.
-- Today `projectCPFTo55` grows the existing balances and stops — it has no way
-- to know what the customer will still earn, so a 35-year-old and a 54-year-old
-- with the same balances project identically, which is wrong by a wide margin.
--
--   personal_investment_value          holdings outside CPF and outside policies
--   personal_investment_growth_rate    expected annual return, PERCENT (6 = 6%)
--   include_personal_investment_in_retirement
--                                      advisor's call on whether that pot is
--                                      genuinely earmarked for retirement; the
--                                      reference defaults it TRUE
--   future_income_step{1,2,3}          annual income during a life stage
--   future_income_start_age{1,2,3}     inclusive
--   future_income_end_age{1,2,3}       inclusive
--
-- THREE STEPS, not an open-ended table, because that is what the reference
-- models and what advisors actually fill in: earning years → wind-down →
-- semi-retirement. A `client_income_steps` child table would be the "correct"
-- shape and would buy nothing here; revisit only if a fourth step is ever
-- asked for.
--
-- Additive-safety:
--   • Every column is NULLABLE with no default, so existing rows are untouched
--     and every existing INSERT (which names its columns explicitly) keeps
--     working. A client with no steps filled in projects exactly as it does
--     today — the projection treats "no income defined" as zero contributions.
--   • Percent, not fraction, for the growth rate: it mirrors the reference's
--     input and the CRM's other percent columns
--     (policies.ilp_premium_inclusion_percent).
--   • Ages are smallint — a human age never needs more.
--   • IF NOT EXISTS on every statement → idempotent re-apply.
--   • No RLS change: the clients policies are row-scoped on user_id /
--     view_all_clients and do not reference column lists.
--
-- AFTER APPLYING: regenerate types with `npm run db:types`.
-- =============================================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS personal_investment_value numeric,
  ADD COLUMN IF NOT EXISTS personal_investment_growth_rate numeric,
  ADD COLUMN IF NOT EXISTS include_personal_investment_in_retirement boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS future_income_step1 numeric,
  ADD COLUMN IF NOT EXISTS future_income_start_age1 smallint,
  ADD COLUMN IF NOT EXISTS future_income_end_age1 smallint,
  ADD COLUMN IF NOT EXISTS future_income_step2 numeric,
  ADD COLUMN IF NOT EXISTS future_income_start_age2 smallint,
  ADD COLUMN IF NOT EXISTS future_income_end_age2 smallint,
  ADD COLUMN IF NOT EXISTS future_income_step3 numeric,
  ADD COLUMN IF NOT EXISTS future_income_start_age3 smallint,
  ADD COLUMN IF NOT EXISTS future_income_end_age3 smallint;

COMMENT ON COLUMN public.clients.personal_investment_growth_rate IS
  'Expected annual return as a PERCENT (6 = 6%), matching the reference CRM input.';

COMMENT ON COLUMN public.clients.include_personal_investment_in_retirement IS
  'Advisor''s call: does this pot count toward the retirement sum? Defaults true.';
