# External Integrations
> Last updated: 2026-07-27

Documentation for the third-party services this app connects to: Vercel hosting, Supabase edge functions + MCP, and the toast library.

## What belongs here

- API references and configuration guides for external services
- Deployment and troubleshooting guides for integrations
- Integration-specific debugging history

## What does NOT belong here

- Feature specifications that use integrations → `docs/03-features/`
- Implementation plans for new integrations → `docs/05-implementation/active/`
- MCP configuration → `CLAUDE.md` and `.claude/CONTEXT.md`

## Navigation

Four docs live here. Every row was path-verified 2026-07-27.

| File | Service | Purpose |
|------|---------|---------|
| `VERCEL_DEPLOYMENT_GUIDE.md` | Vercel | App hosting (`prospect-profiler-app.vercel.app`) — CLI setup, env, deploy flow, SPA rewrite |
| `EDGE_FUNCTION_DEPLOYMENT_GUIDE.md` | Supabase | Edge function deployment (`deploy-edge-functions.sh`) |
| `MCP_DB_ACCESS.md` | Supabase MCP | MCP database access patterns — MCP only, never the CLI |
| `TOAST_SYSTEM.md` | Sonner | Toast notification library (legacy doc — enforceable rules in `.claude/rules/toast-system.md`) |

The AppBase-template integration docs (Synology NAS ×5 · Resend ×2 · OneMap · SG Gov APIs · PostGIS · Railway PDF · Xero) are **not present in this repo** and those services are not wired — do not link them.

## Before working here

- Integration code lives in `src/integrations/supabase/` and `supabase/functions/` (`pdf-generation` · `resend-webhook` · `role-sync` · `_shared`). There is no `src/services/`.
- Edge function SQL + migrations: `supabase/` workspace (MCP only)
