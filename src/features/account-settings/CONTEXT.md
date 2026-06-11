# Account Settings — Feature Memory

Self-service profile & security surface at `/account-settings` (SETTINGS archetype: AppHeaderShell + TabNav — never StatusTabs).

**Status: IN BUILD (P1 scaffold).** The page is an honest stub: real shell + Profile/Security tabs with in-build notices, zero data wiring. Forms land in PROFILER_MODULE_PRD phase P5.

## Map

| Dir | Contents |
|---|---|
| `pages/` | `AccountSettingsPage` (AppHeaderShell + TabNav: Profile · Security) |
| `api/` / `hooks/` / `components/` / `lib/` | empty until P5 |
| `types.ts` | flat; re-exports `users` row type + tab union |

## Hard constraints (from PRD research — verified against live DB)

- Reads: `get_user_profile()` RPC (has no phone) + direct `users` select for phone.
- Writes: self name/phone via the `users_update` policy; email/password ONLY via `supabase.auth.updateUser` — never bare `users.email` writes.
- Username lives in legacy `profiles` — display-only here; this app never edits `profiles` (old-app semantics frozen until cutover).
- Toasts via `showSuccess`/`showError`; every select bounded (`.single()`/`.maybeSingle()`).

## 📚 Related

`docs/05-implementation/active/PROFILER_MODULE_PRD.md` · `docs/01-system-architecture/canonical-page-patterns/CANONICAL_SETTINGS_PAGE_PATTERN.md`
