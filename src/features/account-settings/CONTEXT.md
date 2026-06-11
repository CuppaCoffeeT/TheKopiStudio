# Account Settings — Feature Memory

Self-service profile & security surface at `/account-settings` (SETTINGS archetype: AppHeaderShell + TabNav — never StatusTabs).

**Status: BUILT (P5a).** Profile tab (read-only email/role/member-since/legacy-username + editable name/phone) and Security tab (email change with confirmation flow + password change, both via `supabase.auth.updateUser`) are live, plus a page-level Session sign-out card.

## Map

| Dir | Contents |
|---|---|
| `pages/` | `AccountSettingsPage` (AppHeaderShell + TabNav: Profile · Security + Session sign-out card) |
| `components/` | `ProfileTab` (facts grid + name/phone form) · `SecurityEmailForm` · `SecurityPasswordForm` |
| `api/` | `accountService` — `getAccountProfile` (RPC + users phone/created_at + profiles.username) · `updateSelf` |
| `hooks/` | `useAccountProfile` (key `queryKeys.users.detail(uid)`) · `useUpdateProfile` (invalidates users.all + detail, then `refreshAuth()`) · `useUpdateEmail` · `useUpdatePassword` |
| `types.ts` | flat; `AccountUser` row type, `AccountProfile`, `UpdateSelfInput`, tab union |

## Hard constraints (from PRD research — verified against live DB)

- Reads: `get_user_profile()` RPC (has no phone) + direct `users` select for phone/created_at.
- Writes: self name/phone via the `users_update` policy; email/password ONLY via `supabase.auth.updateUser` — never bare `users.email` writes.
- Username lives in legacy `profiles` — display-only here; this app never edits `profiles` (old-app semantics frozen until cutover).
- AuthContext exposes `refreshAuth` but NO `signOut` — the page mirrors AppHeaderShell's sign-out flow (auth.signOut + clearAuthStorage + navigate /login).
- Toasts via `showSuccess`/`showError`; every select bounded (`.single()`/`.maybeSingle()`).

## 📚 Related

`docs/05-implementation/active/PROFILER_MODULE_PRD.md` · `docs/01-system-architecture/canonical-page-patterns/CANONICAL_SETTINGS_PAGE_PATTERN.md`
