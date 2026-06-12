-- =============================================================================
-- Register the CRM portfolio-report module surface
-- (PRD: REPORTS_LINK_PRD.md · Phase P3)
--
-- Registers 1 module row + role_modules grants:
--   /crm-reports — Portfolio Report (TOOL archetype, book-wide printable
--                  financial summary; /clients/:id/report shares the existing
--                  /clients modulePath and needs NO row here)
--
-- modules.path must byte-match the App.tsx route + ProtectedRoute modulePath.
-- UNIQUE(path) already exists (modules_path_key, added by
-- 20260611_174434_register_profiler_modules.sql) — upsert keys on it directly.
-- Mirrors 20260611_201717_register_crm_modules.sql.
-- =============================================================================

-- 1. Module row (idempotent upsert keyed on path).
INSERT INTO public.modules (name, description, icon_name, path, category, sort_order, is_active) VALUES
  ('Portfolio Report', 'Book-wide financial summary', 'FileChartColumn', '/crm-reports', 'general', 50, true)
ON CONFLICT (path) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name   = EXCLUDED.icon_name,
  category    = EXCLUDED.category,
  sort_order  = EXCLUDED.sort_order,
  is_active   = EXCLUDED.is_active;

-- 2. Role grants — advisor / manager / super_admin (same trio as /crm +
--    /clients: advisors report on their own book via RLS; manager/super_admin
--    read all books via view_all_clients — row scope is Pattern D RLS, the
--    module grant is identical).
INSERT INTO public.role_modules (role, module_id, is_granted)
SELECT r.role, m.id, true
FROM (VALUES ('advisor'), ('manager'), ('super_admin')) AS r(role)
CROSS JOIN public.modules m
WHERE m.path = '/crm-reports'
ON CONFLICT (role, module_id) DO UPDATE SET is_granted = EXCLUDED.is_granted;
