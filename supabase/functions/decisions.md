# Edge Functions — Decisions

**Last Updated**: 2026-06-11 SGT

Workspace-scoped per [`.claude/rules/lessons-logging.md`](../../.claude/rules/lessons-logging.md). Cross-domain entries get promoted to a parent `lessons.md`.

## 2026-06-11 — role-sync authorizes from the database, never the JWT claim

**Decision**: `role-sync` reads the caller's role from `public.users` via the service-role client and checks `rls_capabilities` for `manage_accounts` — the JWT `app_metadata.role` claim is never trusted for authorization because it can lag the database (the very drift this function exists to fix). It also refuses to demote the last active approved super_admin, and reads-then-spreads the target's existing `app_metadata` before `auth.admin.updateUserById` (GoTrue REPLACES the object; naive writes would drop `provider`/`providers`).

**Why**: a forged or stale claim must not grant account management; provider metadata must survive role changes.

**How to apply**: any future privileged function follows the same composite — caller identity via `auth.getUser()`, authorization via service-role DB reads, mutation via service-role, partial-failure rollback reported in the response body.

(Donor-template Xero/Gmail entries removed 2026-06-11 — those functions do not exist in this app.)
