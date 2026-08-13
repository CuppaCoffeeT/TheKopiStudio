-- =============================================================================
-- Legacy Map storage: public.legacy_plans
-- (reference: `legacy_planner_v3.html` — tool 06 in the customer chain)
--
-- ONE plan per customer. The plan is the family, the assets, the nominations
-- and the will allocations that the Legacy Map builds; the tool reads it back
-- and re-derives every figure, so nothing computed is stored.
--
-- WHY JSONB AND NOT FOUR CHILD TABLES: the plan is only ever read and written
-- WHOLE. There is no query that asks "every beneficiary across all customers"
-- or "which assets are un-nominated book-wide" — the Legacy Map loads one
-- customer's plan, mutates it in the browser, and saves it back. Four
-- normalised tables would buy join-level integrity nobody queries and cost
-- four round trips per save. The shape is versioned (`schema_version`) so a
-- future migration can rewrite plans in place if the model changes.
--
-- The document shape is `LegacyPlan` in src/features/planning/lib/legacy.ts:
--   { spouseName, people[], assets[], nominations[], allocations[] }
--
-- RLS mirrors public.clients exactly — Pattern D: owner OR the
-- `view_all_clients` capability for reads, owner-only for writes. A manager
-- can therefore READ an advisor's legacy plan (they can already read the
-- customer it belongs to) and can never write one.
--
-- Additive-safety: brand-new table, nothing existing references it.
--
-- AFTER APPLYING: regenerate types with `npm run db:types`.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.legacy_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One plan per customer. ON DELETE CASCADE is correct here even though the
  -- CRM soft-deletes: a HARD delete of a client should not strand its plan.
  client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,

  -- Owner stamp, same contract as every other CRM table (FK to public.users,
  -- never auth.users — CLAUDE.md hard rule 3).
  user_id uuid NOT NULL REFERENCES public.users(id),
  created_by uuid REFERENCES public.users(id),
  updated_by uuid REFERENCES public.users(id),

  -- The whole LegacyPlan document. Defaults to an empty plan so a row can be
  -- created before the advisor has entered anything.
  plan jsonb NOT NULL DEFAULT '{"spouseName":"","people":[],"assets":[],"nominations":[],"allocations":[]}'::jsonb,

  -- Bumped when the document shape changes, so a reader can migrate old plans.
  schema_version smallint NOT NULL DEFAULT 1,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legacy_plans_client_id ON public.legacy_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_legacy_plans_user_id ON public.legacy_plans(user_id);

-- `updated_at` is maintained by the same trigger function every other CRM table
-- uses (public.update_updated_at_column, via update_clients_updated_at on
-- public.clients). Without it the column would keep its INSERT value forever
-- and "when was this plan last revised?" would silently be wrong.
DROP TRIGGER IF EXISTS update_legacy_plans_updated_at ON public.legacy_plans;
CREATE TRIGGER update_legacy_plans_updated_at
  BEFORE UPDATE ON public.legacy_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.legacy_plans ENABLE ROW LEVEL SECURITY;

-- Pattern D, identical to public.clients: owner OR view_all_clients reads,
-- owner-only writes.
DROP POLICY IF EXISTS legacy_plans_select ON public.legacy_plans;
CREATE POLICY legacy_plans_select
  ON public.legacy_plans FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')));

DROP POLICY IF EXISTS legacy_plans_insert ON public.legacy_plans;
CREATE POLICY legacy_plans_insert
  ON public.legacy_plans FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS legacy_plans_update ON public.legacy_plans;
CREATE POLICY legacy_plans_update
  ON public.legacy_plans FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS legacy_plans_delete ON public.legacy_plans;
CREATE POLICY legacy_plans_delete
  ON public.legacy_plans FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

COMMENT ON COLUMN public.legacy_plans.plan IS
  'A whole LegacyPlan document — see src/features/planning/lib/legacy.ts. Read and written whole; nothing derived is stored.';
