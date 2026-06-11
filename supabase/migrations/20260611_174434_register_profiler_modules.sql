-- =============================================================================
-- Register Profiler module surfaces (PRD: PROFILER_MODULE_PRD.md · Phase P1)
--
-- Registers 4 module rows + role_modules grants:
--   /profiler          — public DISC × MBTI wizard (tile shown to logged-in users)
--   /profiler-results  — saved results LIST + DETAIL (/:id shares modulePath)
--   /account-settings  — self profile & security
--   /manage-accounts   — approvals + role management (manager/super_admin only)
--
-- modules.path must byte-match the App.tsx route + ProtectedRoute modulePath.
-- Live `modules` has NO UNIQUE on path (documented ON CONFLICT (path) fails
-- with 42P10) — add the constraint first, guarded for idempotent re-runs.
-- =============================================================================

-- 1. UNIQUE(path) — required by ON CONFLICT (path); additive, guarded.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'modules_path_key'
      AND conrelid = 'public.modules'::regclass
  ) THEN
    ALTER TABLE public.modules ADD CONSTRAINT modules_path_key UNIQUE (path);
  END IF;
END $$;

-- 2. Module rows (idempotent upsert keyed on path).
INSERT INTO public.modules (name, description, icon_name, path, category, sort_order, is_active) VALUES
  ('Profiler',         'Run a DISC × MBTI prospect profile',   'UserSearch',    '/profiler',         'general', 10, true),
  ('Results',          'Saved profiling results & playbooks',  'ClipboardList', '/profiler-results', 'general', 20, true),
  ('Account Settings', 'Your profile & security',              'Settings',      '/account-settings', 'admin',   90, true),
  ('Manage Accounts',  'Approve users & manage roles',         'Users',         '/manage-accounts',  'admin',   80, true)
ON CONFLICT (path) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name   = EXCLUDED.icon_name,
  category    = EXCLUDED.category,
  sort_order  = EXCLUDED.sort_order,
  is_active   = EXCLUDED.is_active;

-- 3. Role grants — advisor / manager / super_admin only. The template roles
--    management/supervisor exist in public.roles but get no grants (unused).
-- 3a. Profiler + Results + Account Settings → all three roles.
INSERT INTO public.role_modules (role, module_id, is_granted)
SELECT r.role, m.id, true
FROM (VALUES ('advisor'), ('manager'), ('super_admin')) AS r(role)
CROSS JOIN public.modules m
WHERE m.path IN ('/profiler', '/profiler-results', '/account-settings')
ON CONFLICT (role, module_id) DO UPDATE SET is_granted = EXCLUDED.is_granted;

-- 3b. Manage Accounts → manager + super_admin granted; advisor gets an
--     explicit is_granted=false deny marker (per MODULE_SYSTEM docs).
INSERT INTO public.role_modules (role, module_id, is_granted)
SELECT v.role, m.id, v.is_granted
FROM (VALUES
  ('manager',     true),
  ('super_admin', true),
  ('advisor',     false)
) AS v(role, is_granted)
CROSS JOIN public.modules m
WHERE m.path = '/manage-accounts'
ON CONFLICT (role, module_id) DO UPDATE SET is_granted = EXCLUDED.is_granted;
