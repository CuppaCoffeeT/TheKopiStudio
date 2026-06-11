-- ============================================================================
-- FOUNDATION MIGRATION — identity, module-based RBAC, and RLS capability system.
--
-- This is the domain-agnostic spine every feature builds on. It reconstructs the
-- canonical (current/live) shapes — NOT the abandoned 2025-09 enum/module_key
-- forms. Hard rules it encodes:
--   • users.id REFERENCES auth.users(id); every other FK → public.users(id)
--   • access is module-based (useAuth().modules), never hardcoded role strings
--   • RLS reads role from the JWT app_metadata claim via has_capability()
--   • new tables default to minimal authenticated RLS (security at app/module layer)
--
-- WIRING NOTE: the capability helpers read role from auth.jwt()->app_metadata->>'role'.
-- Keep public.users.role in sync with that JWT claim on role change (an admin RPC /
-- DB webhook calling auth.admin.updateUserById). AuthContext self-heals a stale JWT
-- via refreshSession() when the claim lags users.role.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Generic updated_at trigger function (attach to any table with updated_at)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. roles — role registry (users.role + role_modules.role FK to roles.name)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name           text UNIQUE NOT NULL,
    display_name   text NOT NULL,
    description    text,
    is_system_role boolean NOT NULL DEFAULT false,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. users — identity table (business layer over auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       text UNIQUE NOT NULL,
    name        text NOT NULL,
    phone       text,
    role        text NOT NULL DEFAULT 'supervisor' REFERENCES public.roles(name),
    is_approved boolean NOT NULL DEFAULT false,
    is_active   boolean NOT NULL DEFAULT true,
    is_deleted  boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. module-registry / RBAC tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    description text NOT NULL,
    icon_name   text NOT NULL,                       -- lucide icon name
    path        text NOT NULL,                       -- route path, e.g. '/dashboard'
    category    text NOT NULL DEFAULT 'general',
    sort_order  integer NOT NULL DEFAULT 0,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_modules (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role       text NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
    module_id  uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    is_granted boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (role, module_id)
);

CREATE TABLE IF NOT EXISTS public.user_modules (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id  uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    is_granted boolean NOT NULL,
    granted_by uuid REFERENCES public.users(id),
    granted_at timestamptz NOT NULL DEFAULT now(),
    notes      text,
    UNIQUE (user_id, module_id)
);

-- rls_capabilities — dynamic role→capability map read by has_capability()
CREATE TABLE IF NOT EXISTS public.rls_capabilities (
    capability  text NOT NULL,   -- slug: admin | finance | manage_projects | field_or_above
    role        text NOT NULL,   -- matches auth.users app_metadata.role
    description text,
    created_at  timestamptz DEFAULT now(),
    PRIMARY KEY (capability, role)
);

-- ---------------------------------------------------------------------------
-- 4. is_super_admin() — gates RBAC-table writes (reads JWT directly)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', 'unauthorized') = 'super_admin';
$$;

-- ---------------------------------------------------------------------------
-- 5. Enable RLS + policies
--    NOTE: every fn call in a policy is wrapped in (SELECT …) — bare USING(fn())
--    re-evaluates per row and is a known RAM/CPU hotspot.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_modules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rls_capabilities ENABLE ROW LEVEL SECURITY;

-- users: minimal authenticated CRUD (default pattern; access stays at app layer)
CREATE POLICY "Authenticated can CRUD users"
  ON public.users FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- RBAC tables: authenticated read, super-admin write
CREATE POLICY "Authenticated can read roles"            ON public.roles            FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read modules"          ON public.modules          FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read role_modules"     ON public.role_modules     FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read user_modules"     ON public.user_modules     FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read rls_capabilities" ON public.rls_capabilities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins manage roles"            ON public.roles            FOR ALL TO authenticated USING ((SELECT public.is_super_admin())) WITH CHECK ((SELECT public.is_super_admin()));
CREATE POLICY "Super admins manage modules"          ON public.modules          FOR ALL TO authenticated USING ((SELECT public.is_super_admin())) WITH CHECK ((SELECT public.is_super_admin()));
CREATE POLICY "Super admins manage role_modules"     ON public.role_modules     FOR ALL TO authenticated USING ((SELECT public.is_super_admin())) WITH CHECK ((SELECT public.is_super_admin()));
CREATE POLICY "Super admins manage user_modules"     ON public.user_modules     FOR ALL TO authenticated USING ((SELECT public.is_super_admin())) WITH CHECK ((SELECT public.is_super_admin()));
CREATE POLICY "Super admins manage rls_capabilities" ON public.rls_capabilities FOR ALL TO authenticated USING ((SELECT public.is_super_admin())) WITH CHECK ((SELECT public.is_super_admin()));

-- updated_at triggers
CREATE TRIGGER update_users_updated_at   BEFORE UPDATE ON public.users   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at   BEFORE UPDATE ON public.roles   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 6. Capability helpers (thin wrappers over has_capability) — use in policies
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_capability(capability_name text)
  RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rls_capabilities
    WHERE capability = capability_name
      AND role = COALESCE(auth.jwt()->'app_metadata'->>'role', 'unauthorized')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT has_capability('admin'); $$;

CREATE OR REPLACE FUNCTION public.is_finance_role()
  RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT has_capability('finance'); $$;

CREATE OR REPLACE FUNCTION public.can_manage_projects()
  RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT has_capability('manage_projects'); $$;

CREATE OR REPLACE FUNCTION public.is_field_or_above()
  RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT has_capability('field_or_above'); $$;

CREATE OR REPLACE FUNCTION public.is_approved_user()
  RETURNS boolean LANGUAGE sql STABLE PARALLEL SAFE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_approved = TRUE AND is_active = TRUE
  );
$$;

-- ---------------------------------------------------------------------------
-- 7. Client-facing RPCs (consumed by AuthContext + chrome hooks)
-- ---------------------------------------------------------------------------

-- get_user_modules(uuid) — drives useAuth().modules. role-granted ∪ user overrides.
CREATE OR REPLACE FUNCTION public.get_user_modules(p_user_id uuid)
  RETURNS TABLE(module_id uuid, name text, description text, icon_name text, path text, category text, sort_order integer)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_role_modules AS (
    SELECT DISTINCT m.id, m.name, m.description, m.icon_name, m.path, m.category, m.sort_order
    FROM public.users u
    JOIN public.roles r         ON r.name = u.role
    JOIN public.role_modules rm ON rm.role = r.name
    JOIN public.modules m       ON m.id = rm.module_id
    WHERE u.id = p_user_id AND rm.is_granted = true AND m.is_active = true AND r.is_active = true
  ),
  user_override_modules AS (
    SELECT m.id, m.name, m.description, m.icon_name, m.path, m.category, m.sort_order
    FROM public.user_modules um
    JOIN public.modules m ON m.id = um.module_id
    WHERE um.user_id = p_user_id AND um.is_granted = true AND m.is_active = true
  )
  SELECT * FROM user_role_modules
  UNION
  SELECT * FROM user_override_modules
  ORDER BY sort_order, name;
END;
$$;

-- get_user_profile() — AuthContext.checkAuth() reads the caller's own profile.
CREATE OR REPLACE FUNCTION public.get_user_profile()
  RETURNS TABLE(id uuid, name text, email text, role text, is_approved boolean, is_active boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT u.id, u.name, u.email, u.role, u.is_approved, u.is_active
  FROM public.users u
  WHERE u.id = auth.uid() AND u.is_deleted = false;
$$;

-- get_all_users() — admin user list (impersonation / view-as). Super-admin only.
CREATE OR REPLACE FUNCTION public.get_all_users()
  RETURNS TABLE(id uuid, name text, email text, role text, is_approved boolean, is_active boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT u.id, u.name, u.email, u.role, u.is_approved, u.is_active
  FROM public.users u
  WHERE u.is_deleted = false AND public.is_super_admin();
$$;

-- ---------------------------------------------------------------------------
-- 8. notifications — per-user notification feed (powers the AppHeader bell)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title      text NOT NULL,
    body       text,
    link       text,
    type       text NOT NULL DEFAULT 'info',
    is_read    boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 9. handle_new_user() — auth signup → public.users row (HARDENED)
--    role is hardcoded 'supervisor' + is_approved=FALSE so a signup cannot
--    self-elevate via raw_user_meta_data; an admin assigns the real role on approval.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, is_approved, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'supervisor',   -- hardcoded; metadata role ignored to prevent self-elevation
    FALSE,          -- requires admin approval before access
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 10. Grants — SECURITY DEFINER fns are callable by the client
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_user_modules(uuid)    TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile()        TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_all_users()           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_capability(text)      TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 11. Seed — foundational roles, the base Dashboard module, capabilities
-- ---------------------------------------------------------------------------
INSERT INTO public.roles (name, display_name, is_system_role) VALUES
  ('super_admin', 'Super Admin', true),
  ('management',  'Management',  true),
  ('supervisor',  'Supervisor',  true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.modules (name, description, icon_name, path, category, sort_order) VALUES
  ('Dashboard', 'Main dashboard', 'LayoutDashboard', '/dashboard', 'general', 0)
ON CONFLICT DO NOTHING;

INSERT INTO public.role_modules (role, module_id, is_granted)
  SELECT r.name, m.id, true
  FROM public.roles r CROSS JOIN public.modules m
  WHERE m.path = '/dashboard'
ON CONFLICT (role, module_id) DO NOTHING;

INSERT INTO public.rls_capabilities (capability, role, description) VALUES
  ('admin',          'super_admin', 'Full admin access'),
  ('admin',          'management',  'Management admin access'),
  ('field_or_above', 'super_admin', 'Field operations access'),
  ('field_or_above', 'management',  'Field operations access'),
  ('field_or_above', 'supervisor',  'Field operations access')
ON CONFLICT DO NOTHING;
