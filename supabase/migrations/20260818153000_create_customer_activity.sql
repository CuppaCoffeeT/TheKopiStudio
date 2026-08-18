-- customer_activity — the automatic record of everything that happens to a
-- customer, and the field-level history behind it.
--
-- Applied to prod via Supabase MCP on 2026-08-18 (supabase/CONTEXT.md: MCP
-- only, never the CLI, for DB changes). This file is the repo's copy so
-- `supabase db reset` can rebuild the same schema on the ephemeral CI DB.
--
-- ONE table, not two. A "Prospect Profiler history" entry and a "Tax
-- calculator was used" entry differ only in whether a diff came with them, so
-- splitting them would mean two queries, two RLS pairs and two chances for the
-- customer's timeline to disagree with itself about what happened when.
--
-- `user_id` is the OWNING advisor (copied from clients.user_id) and carries
-- RLS, exactly as interactions/policies/legacy_plans do — the same
-- own-or-view_all_clients pair, so an activity row is visible to precisely
-- whoever may already see the customer. `actor_id` is WHO DID IT, which is a
-- different question the moment a manager touches another advisor's record.
--
-- `changes` is the diff, as [{"field","label","from","to"}]. Null for entries
-- that are events rather than edits (a report generated, a tool opened).
-- Values are stored as display STRINGS, deliberately: this is an audit trail
-- of what the advisor saw change, and re-deriving "$4,500" from a numeric 4500
-- years later means re-deriving the formatting rules of the day too.

create table if not exists public.customer_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  activity_type text not null,
  tool text,
  summary text not null,
  changes jsonb,
  occurred_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.customer_activity is
  'Automatic per-customer activity log: tool usage, information edits (with field-level diffs) and generated reports. Written by the app, never edited by hand.';
comment on column public.customer_activity.user_id is
  'Owning advisor — carries RLS, mirrors clients.user_id.';
comment on column public.customer_activity.actor_id is
  'Who performed the action. Differs from user_id when a manager touches another advisor''s customer.';
comment on column public.customer_activity.changes is
  'Field-level diff as [{"field","label","from","to"}] of display strings. Null for non-edit events.';

-- The timeline read: newest first, for one customer.
create index if not exists customer_activity_client_occurred_idx
  on public.customer_activity (client_id, occurred_at desc)
  where is_deleted = false;

alter table public.customer_activity enable row level security;

-- Same pair as interactions / legacy_plans (capability-based, no role strings).
create policy customer_activity_select on public.customer_activity
  for select
  using (
    (select auth.uid()) = user_id
    or (select public.has_capability('view_all_clients'))
  );

-- INSERT is allowed for anyone who may WRITE to the customer — which, in this
-- schema, is the owning advisor. A manager reading another advisor's record
-- cannot log activity onto it, matching the read-only detail page they get.
create policy customer_activity_insert on public.customer_activity
  for insert
  with check ((select auth.uid()) = user_id);

-- No UPDATE and no DELETE policy, deliberately. An audit trail that the
-- audited party can rewrite is not one. `is_deleted` exists for a future
-- admin/service-role prune, not for the app.
