# Account Settings — Feature Memory

Self profile & security at `/account-settings` (SETTINGS archetype: AppHeaderShell + TabNav — never StatusTabs). Profile tab: read-only email/role/member-since/legacy-username + editable name/phone. Security tab: email change (confirmation-link flow) + password change. Page-level Session card signs out.

## Map

- `pages/AccountSettingsPage` — TabNav (Profile · Security) + Session sign-out card
- `components/` — `ProfileTab` (facts grid + name/phone form) · `SecurityEmailForm` · `SecurityPasswordForm`
- `api/accountService` — `getAccountProfile` (RPC + users + profiles.username) · `updateSelf`
- `hooks/` — `useAccountProfile` (key `users.detail(uid)`) · `useUpdateProfile` (invalidates, then `refreshAuth()`) · `useUpdateEmail` · `useUpdatePassword`
- `types.ts` — flat; `AccountUser`, `AccountProfile`, `UpdateSelfInput`, tab union

## Hard constraints (verified against live DB)

- Reads: `get_user_profile()` RPC (no phone) + direct `users` select for phone/created_at.
- Writes: self name/phone via `users_update`; email/password ONLY via `supabase.auth.updateUser` — never bare `users.email` writes.
- Username lives in legacy `profiles` — display-only; this app never edits `profiles` (frozen until cutover).
- AuthContext has no `signOut` — the page mirrors AppHeaderShell's flow (auth.signOut + clearAuthStorage + navigate /login).
- Every select bounded; toasts via `showSuccess`/`showError`.

## 📚 Related

`docs/03-features/profiler/PROFILER_MODULE.md` · `CANONICAL_SETTINGS_PAGE_PATTERN.md`
