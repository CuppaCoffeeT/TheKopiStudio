# Manage Accounts — Feature Memory

Approvals + role management at `/manage-accounts` (LIST archetype). Granted to manager + super_admin only; advisor has an explicit `is_granted=false` deny row in `role_modules`. Unblocks approval of new sign-ups (foundation defaults `is_approved=false`).

**Status: IN BUILD (P1 scaffold).** The page is an honest ListPageFrame stub — final columns, empty state, no data wiring. Query + mutations land in PROFILER_MODULE_PRD phase P5.

## Map

| Dir | Contents |
|---|---|
| `pages/` | `ManageAccountsPage` (ListPageFrame: name/email/role/approval/joined) |
| `api/` / `hooks/` / `components/` / `lib/` | empty until P5 (`hooks/useRoleSync.ts` arrives there) |
| `types.ts` | flat; re-exports `users` row type + assignable-role union |

## Hard constraints (from PRD research — verified against live DB)

- List data: direct `supabase.from('users').select('*', {count:'exact'}).eq('is_deleted', false).range(...)` — NEVER `get_all_users()` (super_admin-gated; managers silently get 0 rows).
- ALL role/approval mutations POST to the role-sync edge function with the caller's JWT — direct `users.role` UPDATEs match 0 rows / raise 42501 by design. Surface role-sync errors verbatim (incl. last-super-admin 400).
- Self-row guarded ("This is you"). Pending sign-ups get badge + Approve action.
- Query keys via `queryKeys.users`; every select bounded.

## 📚 Related

`docs/05-implementation/active/PROFILER_MODULE_PRD.md` · `docs/01-system-architecture/MODULE_SYSTEM.md`
