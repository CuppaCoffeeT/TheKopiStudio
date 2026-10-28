# Edge Functions

Deno functions deployed to Supabase (project `mymzcbalyqqgdmzsfmam`). Deploy via `mcp__supabase__deploy_edge_function` — NEVER the CLI. Logs via `mcp__supabase__get_logs` (service: edge-function). Secrets via the Supabase dashboard, read with `Deno.env.get()`; redeploy after changing.

## Functions

| Function | Auth | Purpose |
|---|---|---|
| `role-sync` | caller JWT (verify_jwt ON) + DB-authoritative `manage_accounts` check | Privileged promote/demote/approve: updates `public.users` + syncs `auth.users.app_metadata.role`. Contract: [docs/01-system-architecture/CRM_DATA_SPINE.md](../../docs/01-system-architecture/CRM_DATA_SPINE.md) |

`_shared/cors.ts` holds the shared CORS headers — tighten `Access-Control-Allow-Origin` to the app's domain at cutover.

## Conventions

- Two auth archetypes: user-context (anon-key client bound to the caller's Authorization header → `auth.getUser()`) and machine/webhook (HMAC over `req.text()` before parse, service-role client).
- Privileged mutations use the service-role client (`SUPABASE_SERVICE_ROLE_KEY`, `autoRefreshToken:false, persistSession:false`) and authorize from the DATABASE, never from JWT claims alone.
- JSON responses always spread `corsHeaders` + `Content-Type: application/json`; OPTIONS preflight returns `ok`.
- Deploy: MCP only (see top of this file). The AppBase CLI deploy guide + `deploy-edge-functions.sh` were deleted 2026-10-28.
