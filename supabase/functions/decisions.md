# Edge Functions — Decisions

**Last Updated**: 2026-06-11 SGT

Workspace-scoped per [`.claude/rules/lessons-logging.md`](../../.claude/rules/lessons-logging.md). Cross-domain entries get promoted to a parent `lessons.md`.

## 2026-06-11 — role-sync v2 mirrors the role into legacy public.profiles (non-fatal)

**Decision**: after the `public.users` update + `app_metadata` sync succeed, any request that includes `role` also mirrors it into `public.profiles.role` via the service-role client: `'advisor'`/`'manager'` as-is, `'super_admin'` → `'manager'` (the legacy profiles CHECK constraint only allows `advisor|manager`). The mirror is **non-fatal**: on DB error OR a missing profiles row (detected via `.select('id').maybeSingle()` returning null) the function logs and returns `"profiles_mirror": "failed"` in the 200 body — it does NOT roll back `public.users`. v1's "profiles is never touched" rule is superseded.

**Why**: the legacy results read-all policy goes through `get_my_role()`, which reads `profiles.role` — without the mirror, a manager promoted via Manage Accounts would silently lack results visibility in BOTH apps until cutover (PRD research finding, MCP-verified). Non-fatal because `users` stays canonical and a stale legacy mirror is recoverable by re-running the role change, while rolling back a successful canonical update over a legacy-table hiccup would invert the source of truth.

**How to apply**: cutover removes the mirror together with the legacy policies; until then, role changes happen ONLY through role-sync so the mirror is never skipped.

## 2026-06-11 — role-sync authorizes from the database, never the JWT claim

**Decision**: `role-sync` reads the caller's role from `public.users` via the service-role client and checks `rls_capabilities` for `manage_accounts` — the JWT `app_metadata.role` claim is never trusted for authorization because it can lag the database (the very drift this function exists to fix). It also refuses to demote the last active approved super_admin, and reads-then-spreads the target's existing `app_metadata` before `auth.admin.updateUserById` (GoTrue REPLACES the object; naive writes would drop `provider`/`providers`).

**Why**: a forged or stale claim must not grant account management; provider metadata must survive role changes.

**How to apply**: any future privileged function follows the same composite — caller identity via `auth.getUser()`, authorization via service-role DB reads, mutation via service-role, partial-failure rollback reported in the response body.

(Donor-template Xero/Gmail entries removed 2026-06-11 — those functions do not exist in this app.)
