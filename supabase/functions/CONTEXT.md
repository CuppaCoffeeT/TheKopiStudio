# Edge Functions — Supabase Deno Functions

Server-side Deno functions deployed to Supabase Edge. Used for integrations (Gmail, Xero, NAS, Resend), file generation (PDFs, attachments), and async jobs.

## Scope

**Belongs**: Deno TypeScript functions deployed via `mcp__supabase__deploy_edge_function`.
**Doesn't**: Migrations (`migrations/`); React app code (`src/`); function *docs* (`docs/04-integrations/`).

## Navigation

| Folder | Purpose |
|--------|---------|
| `_shared/` | Shared utilities (CORS, env, Supabase admin client) — import from siblings, not duplicate |
| `gmail-*` | `gmail-auth`, `gmail-sync`, `gmail-send`, `gmail-webhook`, `gmail-attachment` — Gmail integration |
| `xero-*` | `xero-auth`, `xero-sync` — Xero integration |
| `synology-nas`, `nas-thumbnail`, `process-nas-operations` | NAS file ops |
| `attachment-preview`, `download-attachment`, `upload-trial-trench-attachment` | File transit |
| `nda-upload-signed` | Signed NDA upload + RPC |
| `pdf-generation`, `generate-payslip-pdf`, `site-form-pdf-generation` | PDF rendering |
| `send-email`, `resend-webhook` | Resend email + webhooks |
| `onemap-search` | OneMap address search proxy |
| `cleanup-synced-storage` | Storage cleanup job |

## Before working here

- **Runtime**: Deno (not Node) — use `Deno.env.get()`, web standard `fetch`, JSR/esm.sh imports.
- **Auth**: validate JWT via `Authorization: Bearer` header; service-role calls only when explicitly required (cron / webhook).
- **CORS**: always import + apply the `_shared/cors.ts` headers — browser callers fail silently otherwise.
- **Deploy**: via `mcp__supabase__deploy_edge_function` (project_id `your-project-ref`) — NEVER `supabase functions deploy` CLI.
- **Logs**: read with `mcp__supabase__get_logs` (`service: edge-function`) when debugging.
- **Secrets**: managed via Supabase dashboard (env vars). Don't commit secrets to function code.
- **Idempotency**: webhook handlers (`gmail-webhook`, `resend-webhook`) must be idempotent — Supabase retries on non-2xx.

## 📚 Related

- [supabase/CONTEXT.md](../CONTEXT.md)
- [docs/04-integrations/CONTEXT.md](../../docs/04-integrations/CONTEXT.md) — feature docs for Gmail, Resend, Xero, NAS
