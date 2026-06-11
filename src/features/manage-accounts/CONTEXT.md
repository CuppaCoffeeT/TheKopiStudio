# Manage Accounts — Feature Memory

Approvals + role management at `/manage-accounts` (LIST archetype). Granted to manager + super_admin only; advisor has an explicit `is_granted=false` deny row in `role_modules`. Unblocks approval of new sign-ups (foundation defaults `is_approved=false`).

**Status: BUILT (P5b).** ListPageFrame with StatusTabs (All / Pending approval + alert count badge), 350ms debounced search, URL-synced page/tab, mobile cards, per-row role SelectMenu + Approve action through role-sync v2 (which now mirrors `profiles.role` for legacy results visibility).

## Map

| Dir | Contents |
|---|---|
| `pages/` | `ManageAccountsPage` (Name/Email/Role/Approved/Joined; `useURLPagination` + `useDebounce`) |
| `api/` | `usersService.getUsersPaginated` — direct `users` select with count + pending badge count; LIKE + PostgREST-quoted `.or()` search escaping |
| `hooks/` | `useUsersList` (queryKeys.users.list, keepPreviousData) · `useRoleSync` (POST role-sync w/ caller JWT; verbatim error toasts; invalidates `users.all`) |
| `components/` | `RoleCell` (SelectMenu, self-disabled + "This is you" Chip) · `ApprovalCell` (StatusBadge + Approve) · `UsersMobileList` (MobileListCard, lg controls ≥44px) |
| `lib/` | `roleLabels.ts` — ASSIGNABLE_ROLES / ROLE_LABELS / isAssignableRole |
| `types.ts` | flat; re-exports `users` row type + assignable-role union |

## Hard constraints (from PRD research — verified against live DB)

- List data: direct `supabase.from('users').select('*', {count:'exact'}).eq('is_deleted', false).range(...)` — NEVER `get_all_users()` (super_admin-gated; managers silently get 0 rows).
- ALL role/approval mutations POST to the role-sync edge function with the caller's JWT — direct `users.role` UPDATEs match 0 rows / raise 42501 by design. Role-sync errors surface verbatim (incl. last-super-admin 400).
- Self row fully read-only (disabled select + "This is you" Chip; no Approve button).
- Query keys via `queryKeys.users`; every select bounded (`.range()` / head-count `.limit(1)`).

## 📚 Related

`docs/05-implementation/active/PROFILER_MODULE_PRD.md` · `docs/01-system-architecture/CRM_DATA_SPINE.md` (role-sync v2 contract) · `docs/01-system-architecture/MODULE_SYSTEM.md`
