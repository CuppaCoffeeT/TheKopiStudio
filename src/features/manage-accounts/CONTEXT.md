# Manage Accounts — Feature Memory

Approvals + role management at `/manage-accounts` (LIST archetype). Manager + super_admin only; advisor has an explicit deny row in `role_modules`. ListPageFrame with tabs (All / Pending + alert badge), debounced search, URL-synced page/tab, per-row role SelectMenu + Approve via role-sync v2 (mirrors `profiles.role` for legacy results visibility).

## Map

- `pages/ManageAccountsPage` — Name/Email/Role/Approved/Joined; `useURLPagination` + `useDebounce`
- `api/usersService.getUsersPaginated` — direct `users` select + pending badge count; LIKE + PostgREST-quoted `.or()` escaping
- `hooks/` — `useUsersList` (users.list, keepPreviousData) · `useRoleSync` (POST role-sync; invalidates `users.all`)
- `components/` — `RoleCell` (self-disabled + "This is you" Chip) · `ApprovalCell` · `UsersMobileList` (≥44px targets)
- `lib/roleLabels.ts` — ASSIGNABLE_ROLES / ROLE_LABELS / isAssignableRole

## Hard constraints (verified against live DB)

- List data: direct `users` select with `.eq('is_deleted', false)` + `.range()` — NEVER `get_all_users()` (super_admin-gated; managers get 0 rows).
- ALL role/approval mutations POST to role-sync with the caller's JWT — direct `users.role` UPDATEs match 0 rows / 42501 by design. Errors surface verbatim (incl. last-super-admin 400).
- Self row read-only (disabled select; no Approve button).
- Keys via `queryKeys.users`; every select bounded.

## 📚 Related

`docs/03-features/profiler/PROFILER_MODULE.md` · `docs/01-system-architecture/CRM_DATA_SPINE.md` (role-sync contract)
