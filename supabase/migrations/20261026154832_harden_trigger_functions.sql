-- Security-advisor cleanup after the legacy retirement (CUTOVER_RUNBOOK §4).
--
-- Applied to prod via Supabase MCP on 2026-10-26 (supabase/CONTEXT.md: MCP
-- only, never the CLI, for DB changes). This file is the repo's copy so
-- `supabase db reset` can rebuild the same schema on the ephemeral CI DB.
--
-- update_updated_at_column  WARN function_search_path_mutable — same fix as
--                           update_updated_at; the body only calls now(),
--                           which pg_catalog always resolves.
-- handle_new_user /         WARN *_security_definer_function_executable —
-- protect_user_privileges   trigger-only functions were also reachable as
--                           /rest/v1/rpc/*. EXECUTE is not checked when a
--                           trigger fires, so revoking it closes the RPC door
--                           without touching signup or the users guard.
-- The capability helpers (has_capability, is_super_admin, …) keep EXECUTE:
-- RLS policies call them as the querying role.

alter function public.update_updated_at_column() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_user_privileges() from public, anon, authenticated;
