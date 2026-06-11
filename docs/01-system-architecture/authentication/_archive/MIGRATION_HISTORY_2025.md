# Migration History — Authentication (2025)

**Status**: 🔴 Archived (frozen reference)

👉 Live workspace: [../CONTEXT.md](../CONTEXT.md)

Frozen migration log from the 2025 auth-system rewrite. Kept for git-archaeology context — current behaviour lives in [../AUTHENTICATION_SYSTEM.md](../AUTHENTICATION_SYSTEM.md), [../decisions.md](../decisions.md), [../lessons.md](../lessons.md).

---

## 2025-11-09 · People Normalization

**Migration**: `supabase/migrations/20251109_112411_normalize_users_table.sql`

Moved `name`, `email`, `phone` out of `public.users` into a centralized `public.people` table. Added `users.person_id` FK. `get_user_profile()` rewritten to JOIN with `people`. Direct queries to `users.name` / `users.email` no longer compile.

```sql
UPDATE public.users u
SET person_id = p.id
FROM public.people p
WHERE p.email = u.email;
```

## 2025-11-09 · RPC Function Restoration

**Migration**: `supabase/migrations/20251109_142000_restore_get_user_modules.sql`

`get_user_modules()` was accidentally dropped during the normalization migration, breaking login. Restored.

## 2025-11-21 · AuthContext Refactor

Migrated from 60+ component-level `useAuth` hook calls to a single `<AuthProvider>`. Each hook instance had been running its own `getSession`/`rpc`, re-rendering and corrupting React Query cache. Provider order locked: `<AuthProvider>` above `<QueryClientProvider>`.

**Files**: created `src/contexts/AuthContext.tsx`; renamed `src/hooks/useAuth.tsx` → `useAuth.tsx.deprecated` (deleted entirely on 2026-04-26).

## 2025-01-28 · Query Loading State Decoupling

Removed `enabled: !loading && !!user` from `CompanyList.tsx`, `GeneralWorks.tsx` (×2), `AdminDashboard.tsx`. Pattern caused stuck loading states after back-button + token refresh. Mutation handlers gained `finally` blocks. See [../lessons.md](../lessons.md#loading-stuck-after-back-button-2025-01-28).

## 2025-11-29 · TOKEN_REFRESHED Bug Fix

`onAuthStateChange` no longer calls `checkAuth()` on `TOKEN_REFRESHED`. The 10s `getSession` timeout inside `checkAuth` was tripping during background refreshes and signing users out mid-session. See [../lessons.md](../lessons.md#token_refreshed-handler-caused-random-mid-session-logouts-2025-11-29).

## 2025-11-29 · AuthContext Complete Rewrite

380 lines → 130 lines. Removed:
- `withTimeout` wrapper
- All `getSession` / `rpc` timeouts
- `isCheckingAuth.current` recursive-call guard
- `lastRoleUpdateTime` JWT-role-sync delay (40+ lines)
- Email-verification / approval / active checks (moved to Login.tsx)
- Failsafe `setTimeout` reset (ran after `finally`, never useful)
- Toast-message error handling (now `console.error` + simple state clear)

Result: trust Supabase SDK; no safeguards. See [../decisions.md](../decisions.md#trust-the-supabase-sdk--no-timeouts-guards-or-failsafes-around-it-2025-11-29).

## 2025-11-29 · Login Redirect Race Fix

Login.tsx now watches `useAuth()` and navigates inside a `useEffect` only when `!authLoading && user`. Removed inline `navigate('/dashboard')` after `signInWithPassword`. Eliminates the SIGNED_IN-vs-promise-resolution race that left users on `/login` after re-login. See [../lessons.md](../lessons.md#login-redirect-stuck-after-logout-2025-11-29).

## 2025-11-30 · ProtectedRoute Centralization

`<ProtectedRoute modulePath="/x">` introduced. Per-page `if (loading) … if (!hasAccess) …` guards removed across the app. Pages now hold zero auth code.

## 📚 Related

- [../CONTEXT.md](../CONTEXT.md) · [../AUTHENTICATION_SYSTEM.md](../AUTHENTICATION_SYSTEM.md) · [../decisions.md](../decisions.md) · [../lessons.md](../lessons.md)
