-- ============================================================================
-- CRM TABLES MIGRATION — the Insurance-CRM book, upgraded to AppBase conventions.
--
-- Source of truth for the business columns:
--   "/Users/tenshi/Documents/Projects/Insurance CRM/supabase/schema.sql"
--   (old project uivdgousiyfeyrebloaz). Every source column is reproduced with
-- the same type/default, PLUS the AppBase standard upgrades:
--   • user_id uuid NOT NULL → public.users(id) ON DELETE CASCADE (never auth.users)
--   • created_at / updated_at timestamptz NOT NULL DEFAULT now()
--     (+ update_<table>_updated_at trigger via public.update_updated_at_column())
--   • created_by / updated_by uuid NULL → public.users(id)
--   • is_deleted boolean NOT NULL DEFAULT false (soft delete)
--   • covering index on EVERY FK column (idx_<table>_<col>)
--   • UNIQUE (policy_id, age) on projected_cash_values — the app delete-reinserts
--     whole projection sets, so duplicate ages per policy are always a bug
--
-- RLS: Pattern D — owner + capability read (see supabase/migrations/decisions.md,
-- 2026-06-11 entry). Advisors own their book (full CRUD where user_id = self);
-- managers/super_admins read everything via the view_all_clients capability;
-- writes stay owner-only. Every function call in a policy is (SELECT …)-wrapped —
-- bare USING(fn()) re-evaluates per row and is a known RAM/CPU hotspot.
--
-- Additive only: this DB also serves the still-deployed legacy app
-- (public.profiles / public.results) — nothing here touches those tables.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. clients — the advisor's book of clients
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name               text NOT NULL,
    email              text,
    phone              text,
    date_of_birth      date,
    occupation         text,
    annual_income      numeric,
    risk_profile       text DEFAULT 'Moderate',
    notes              text,
    created_date       date DEFAULT current_date,
    last_review_date   date,
    next_review_date   date,
    review_frequency   text DEFAULT 'Annual',
    total_bank_balance numeric DEFAULT 0,
    cpf_oa             numeric DEFAULT 0,
    cpf_sa             numeric DEFAULT 0,
    cpf_ma             numeric DEFAULT 0,
    created_by         uuid REFERENCES public.users(id),
    updated_by         uuid REFERENCES public.users(id),
    is_deleted         boolean NOT NULL DEFAULT false,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. policies — insurance policies held by a client
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.policies (
    id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id                       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    type                            text NOT NULL,
    provider                        text,
    policy_number                   text,
    premium                         numeric DEFAULT 0,
    frequency                       text DEFAULT 'Annual',
    coverage_amount                 numeric DEFAULT 0,
    tpd_coverage                    numeric DEFAULT 0,
    tpd_same_as_death               boolean DEFAULT false,
    critical_illness_coverage       numeric DEFAULT 0,
    ci_notes                        text,
    early_critical_illness_coverage numeric DEFAULT 0,
    eci_notes                       text,
    start_date                      date,
    end_date                        date,
    status                          text DEFAULT 'Active',
    has_cash_value                  boolean DEFAULT false,
    current_cash_value              numeric DEFAULT 0,
    is_investment_linked            boolean DEFAULT false,
    current_account_value           numeric DEFAULT 0,
    investment_allocation           text,
    illustrated_value_age_55        numeric DEFAULT 0,
    illustrated_value_age_65        numeric DEFAULT 0,
    ilp_premium_inclusion_percent   numeric DEFAULT 0,
    is_hospitalization              boolean DEFAULT false,
    hospital_type                   text DEFAULT 'Private',
    integrated_shield_cpf           numeric DEFAULT 0,
    integrated_shield_cash          numeric DEFAULT 0,
    rider_cash                      numeric DEFAULT 0,
    created_by                      uuid REFERENCES public.users(id),
    updated_by                      uuid REFERENCES public.users(id),
    is_deleted                      boolean NOT NULL DEFAULT false,
    created_at                      timestamptz NOT NULL DEFAULT now(),
    updated_at                      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. projected_cash_values — per-age cash-value projections for a policy
--    UNIQUE (policy_id, age): the app replaces whole projection sets, so a
--    duplicate age within one policy can only ever be corrupt data.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projected_cash_values (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    policy_id  uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
    age        integer NOT NULL,
    value      numeric NOT NULL,
    created_by uuid REFERENCES public.users(id),
    updated_by uuid REFERENCES public.users(id),
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (policy_id, age)
);

-- ---------------------------------------------------------------------------
-- 4. interactions — client touchpoints (meetings, calls, reviews)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interactions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date       date NOT NULL DEFAULT current_date,
    type       text DEFAULT 'Meeting',
    notes      text,
    follow_up  date,
    created_by uuid REFERENCES public.users(id),
    updated_by uuid REFERENCES public.users(id),
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. bank_balance_history — dated balance snapshots per client
--    (clients.total_bank_balance / last_review_date derive from the
--    latest-by-date row here; the import recomputes them.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_balance_history (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    date       date NOT NULL DEFAULT current_date,
    balance    numeric NOT NULL,
    notes      text,
    created_by uuid REFERENCES public.users(id),
    updated_by uuid REFERENCES public.users(id),
    is_deleted boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 6. Covering indexes — one per FK column (idx_<table>_<col>)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clients_user_id    ON public.clients (user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients (created_by);
CREATE INDEX IF NOT EXISTS idx_clients_updated_by ON public.clients (updated_by);

CREATE INDEX IF NOT EXISTS idx_policies_user_id    ON public.policies (user_id);
CREATE INDEX IF NOT EXISTS idx_policies_client_id  ON public.policies (client_id);
CREATE INDEX IF NOT EXISTS idx_policies_created_by ON public.policies (created_by);
CREATE INDEX IF NOT EXISTS idx_policies_updated_by ON public.policies (updated_by);

CREATE INDEX IF NOT EXISTS idx_projected_cash_values_user_id    ON public.projected_cash_values (user_id);
-- policy_id is covered by the UNIQUE (policy_id, age) index — no separate index needed
CREATE INDEX IF NOT EXISTS idx_projected_cash_values_created_by ON public.projected_cash_values (created_by);
CREATE INDEX IF NOT EXISTS idx_projected_cash_values_updated_by ON public.projected_cash_values (updated_by);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id    ON public.interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_client_id  ON public.interactions (client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_by ON public.interactions (created_by);
CREATE INDEX IF NOT EXISTS idx_interactions_updated_by ON public.interactions (updated_by);

CREATE INDEX IF NOT EXISTS idx_bank_balance_history_user_id    ON public.bank_balance_history (user_id);
CREATE INDEX IF NOT EXISTS idx_bank_balance_history_client_id  ON public.bank_balance_history (client_id);
CREATE INDEX IF NOT EXISTS idx_bank_balance_history_created_by ON public.bank_balance_history (created_by);
CREATE INDEX IF NOT EXISTS idx_bank_balance_history_updated_by ON public.bank_balance_history (updated_by);

-- ---------------------------------------------------------------------------
-- 7. updated_at triggers — public.update_updated_at_column() (foundation §0)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_policies_updated_at ON public.policies;
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projected_cash_values_updated_at ON public.projected_cash_values;
CREATE TRIGGER update_projected_cash_values_updated_at
  BEFORE UPDATE ON public.projected_cash_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_interactions_updated_at ON public.interactions;
CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_balance_history_updated_at ON public.bank_balance_history;
CREATE TRIGGER update_bank_balance_history_updated_at
  BEFORE UPDATE ON public.bank_balance_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 8. RLS — enable + Pattern D (owner + capability read) on all 5 tables
--    {table}_select: owner OR view_all_clients · {table}_insert/_update/_delete:
--    owner only. Every fn call (SELECT …)-wrapped (initplan caching).
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projected_cash_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_balance_history  ENABLE ROW LEVEL SECURITY;

-- clients
DROP POLICY IF EXISTS clients_select ON public.clients;
CREATE POLICY clients_select
  ON public.clients FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')));

DROP POLICY IF EXISTS clients_insert ON public.clients;
CREATE POLICY clients_insert
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS clients_update ON public.clients;
CREATE POLICY clients_update
  ON public.clients FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS clients_delete ON public.clients;
CREATE POLICY clients_delete
  ON public.clients FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- policies
DROP POLICY IF EXISTS policies_select ON public.policies;
CREATE POLICY policies_select
  ON public.policies FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')));

DROP POLICY IF EXISTS policies_insert ON public.policies;
CREATE POLICY policies_insert
  ON public.policies FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS policies_update ON public.policies;
CREATE POLICY policies_update
  ON public.policies FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS policies_delete ON public.policies;
CREATE POLICY policies_delete
  ON public.policies FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- projected_cash_values
DROP POLICY IF EXISTS projected_cash_values_select ON public.projected_cash_values;
CREATE POLICY projected_cash_values_select
  ON public.projected_cash_values FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')));

DROP POLICY IF EXISTS projected_cash_values_insert ON public.projected_cash_values;
CREATE POLICY projected_cash_values_insert
  ON public.projected_cash_values FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS projected_cash_values_update ON public.projected_cash_values;
CREATE POLICY projected_cash_values_update
  ON public.projected_cash_values FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS projected_cash_values_delete ON public.projected_cash_values;
CREATE POLICY projected_cash_values_delete
  ON public.projected_cash_values FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- interactions
DROP POLICY IF EXISTS interactions_select ON public.interactions;
CREATE POLICY interactions_select
  ON public.interactions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')));

DROP POLICY IF EXISTS interactions_insert ON public.interactions;
CREATE POLICY interactions_insert
  ON public.interactions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS interactions_update ON public.interactions;
CREATE POLICY interactions_update
  ON public.interactions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS interactions_delete ON public.interactions;
CREATE POLICY interactions_delete
  ON public.interactions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- bank_balance_history
DROP POLICY IF EXISTS bank_balance_history_select ON public.bank_balance_history;
CREATE POLICY bank_balance_history_select
  ON public.bank_balance_history FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')));

DROP POLICY IF EXISTS bank_balance_history_insert ON public.bank_balance_history;
CREATE POLICY bank_balance_history_insert
  ON public.bank_balance_history FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS bank_balance_history_update ON public.bank_balance_history;
CREATE POLICY bank_balance_history_update
  ON public.bank_balance_history FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS bank_balance_history_delete ON public.bank_balance_history;
CREATE POLICY bank_balance_history_delete
  ON public.bank_balance_history FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 9. Seed — capabilities consumed by Pattern D, the profiler module (later
--    PRD), and the role-sync edge function. manager + super_admin only;
--    management/supervisor are unused template roles and get nothing.
-- ---------------------------------------------------------------------------
INSERT INTO public.rls_capabilities (capability, role, description) VALUES
  ('view_all_clients', 'manager',     'Read every advisor''s CRM book (clients, policies, projections, interactions, balances)'),
  ('view_all_clients', 'super_admin', 'Read every advisor''s CRM book (clients, policies, projections, interactions, balances)'),
  ('view_all_results', 'manager',     'Read every advisor''s profiler results'),
  ('view_all_results', 'super_admin', 'Read every advisor''s profiler results'),
  ('manage_accounts',  'manager',     'Promote/demote/approve users via the role-sync edge function'),
  ('manage_accounts',  'super_admin', 'Promote/demote/approve users via the role-sync edge function')
ON CONFLICT DO NOTHING;
