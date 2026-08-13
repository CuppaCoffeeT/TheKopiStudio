-- =============================================================================
-- Register CRM module surfaces (PRD: CRM_MODULE_PRD.md · Phase P1)
--
-- Registers 2 module rows + role_modules grants:
--   /crm      — CRM dashboard (DASHBOARD archetype, KPI tiles)
--   /clients  — client book LIST + DETAIL (/:id shares modulePath)
--
-- modules.path must byte-match the App.tsx route + ProtectedRoute modulePath.
-- UNIQUE(path) already exists (modules_path_key, added by
-- 20260611_174434_register_profiler_modules.sql) — upserts key on it directly.
-- =============================================================================

-- 1. Module rows (idempotent upsert keyed on path).
INSERT INTO public.modules (name, description, icon_name, path, category, sort_order, is_active) VALUES
  ('CRM Dashboard', 'Your book at a glance',                      'Briefcase', '/crm',     'general', 30, true),
  ('Clients',       'Client book — policies, reviews, balances',  'Contact',   '/clients', 'general', 40, true)
ON CONFLICT (path) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name   = EXCLUDED.icon_name,
  category    = EXCLUDED.category,
  sort_order  = EXCLUDED.sort_order,
  is_active   = EXCLUDED.is_active;

-- 2. Role grants — advisor / manager / super_admin get both surfaces.
--    (Advisors see their own book via RLS; manager/super_admin read all via
--    view_all_clients — same module grant, row scope handled by Pattern D RLS.)
INSERT INTO public.role_modules (role, module_id, is_granted)
SELECT r.role, m.id, true
FROM (VALUES ('advisor'), ('manager'), ('super_admin')) AS r(role)
CROSS JOIN public.modules m
WHERE m.path IN ('/crm', '/clients')
ON CONFLICT (role, module_id) DO UPDATE SET is_granted = EXCLUDED.is_granted;
