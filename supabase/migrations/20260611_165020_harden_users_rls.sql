-- ============================================================================
-- USERS-TABLE HARDENING — closes a live privilege-escalation hole.
--
-- VULNERABILITY (Data Spine research, 2026-06-11): the foundation migration
-- left public.users with a single permissive policy
-- "Authenticated can CRUD users" USING(true) WITH CHECK(true) — ANY
-- authenticated user could UPDATE any row, including role / is_approved /
-- is_active. Module access (get_user_modules) and approval gating read those
-- columns, so any signed-in account could self-elevate to super_admin.
--
-- FIX (two layers; idempotent; additive — no table shape changes):
--   1. RLS: split the FOR ALL policy into per-command policies — read-all
--      (the app shows user names app-wide), self-only UPDATE, and
--      super-admin-only INSERT / DELETE.
--   2. BEFORE UPDATE guard trigger protect_user_privileges(): the privileged
--      columns (role, is_approved, is_active, is_deleted) may only change via
--        • direct postgres / migration sessions (request.jwt.claims unset),
--        • service-role REST calls (claims role = 'service_role' — the
--          role-sync edge function path),
--        • a super_admin end-user JWT.
--      Any other JWT touching those columns raises 42501. Plain column
--      updates (name, phone, …) are unaffected for everyone.
--
-- MUST KEEP WORKING (verified against the foundation migration):
--   • AuthContext reads — get_user_profile()/get_all_users() are SECURITY
--     DEFINER; direct user-name lookups pass users_select.
--   • handle_new_user() signup inserts — SECURITY DEFINER owned by postgres
--     (the table owner, which bypasses RLS); the guard trigger is UPDATE-only,
--     so INSERTs never hit it. Do NOT add FORCE ROW LEVEL SECURITY here.
--   • The role-sync edge function — service_role sessions bypass RLS
--     (BYPASSRLS) and take the service_role branch of the guard trigger.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Replace the permissive FOR ALL policy with per-command policies
--    NOTE: every fn call in a policy is wrapped in (SELECT …) — bare fn()
--    re-evaluates per row.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can CRUD users" ON public.users;

DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select
  ON public.users FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update
  ON public.users FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS users_insert ON public.users;
CREATE POLICY users_insert
  ON public.users FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS users_delete ON public.users;
CREATE POLICY users_delete
  ON public.users FOR DELETE TO authenticated
  USING ((SELECT public.is_super_admin()));

-- ---------------------------------------------------------------------------
-- 2. protect_user_privileges() — column-level guard the policies cannot give
--    (RLS is row-level; users_update legitimately allows self-row updates,
--    so without this trigger a user could still flip their OWN role).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_user_privileges()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
  jwt_claims text;
BEGIN
  IF NEW.role           IS DISTINCT FROM OLD.role
     OR NEW.is_approved IS DISTINCT FROM OLD.is_approved
     OR NEW.is_active   IS DISTINCT FROM OLD.is_active
     OR NEW.is_deleted  IS DISTINCT FROM OLD.is_deleted
  THEN
    -- current_setting(..., true) returns NULL when the GUC was never set
    -- (direct postgres / migration sessions) and can return '' after a
    -- RESET; NULLIF folds both into NULL so ::json below never sees ''.
    jwt_claims := NULLIF(current_setting('request.jwt.claims', true), '');

    IF jwt_claims IS NULL THEN
      RETURN NEW;                       -- direct postgres / migration session
    END IF;

    IF jwt_claims::json->>'role' = 'service_role' THEN
      RETURN NEW;                       -- service-role REST (role-sync fn)
    END IF;

    IF public.is_super_admin() THEN
      RETURN NEW;                       -- super_admin end-user JWT
    END IF;

    RAISE EXCEPTION
      'changing role/is_approved/is_active/is_deleted on public.users requires super_admin or the role-sync function'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Wire the guard (fires before update_users_updated_at — alphabetical)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS protect_user_privileges ON public.users;
CREATE TRIGGER protect_user_privileges
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileges();
