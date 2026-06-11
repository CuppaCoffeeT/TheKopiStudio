# Authentication — Decisions

**Last Updated**: 2026-04-27 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md) · Sibling: [lessons.md](./lessons.md)

Append-only architectural decisions. Newest first. Never edit past entries — if reversed, the new entry prepends `**Supersedes**: …`.

---

## Pre-auth pages migrate under W09 archetype = `tool` + feature-local `AuthShell` (2026-04-27)

**Decision**: `/auth/reset-password` (W09 #20) and future pre-auth pages (`/login`, `/auth/verify`, `/auth/verified`) compose against a feature-local `AuthShell` (centered-card layout) instead of the standard `<DashboardHeader>` archetype frames. Archetype detection routes them to the **tool** fallback.

**Why**: pre-auth pages render before `useAuth` has a session — they have no module path, no user profile, no breadcrumb. The detail/list/dashboard/form/settings detection rules all assume an authenticated chrome that doesn't apply. `<DashboardHeader>` would attempt to read `useAuth().modules` and break the recovery-session probe race window.

**How to apply**: when migrating `Login.tsx` / `EmailVerification.tsx` / `EmailVerified.tsx`, reuse `<AuthShell>` (currently feature-local at [src/features/auth/components/AuthShell.tsx](../../../src/features/auth/components/AuthShell.tsx)). Once a second auth page composes it, promote `AuthShell` to `src/components/primitives/shell/` via `/design-prompt`. Document new pre-auth pages by appending a flow section to [AUTH_FLOWS.md](./AUTH_FLOWS.md) or splitting into a focused sub-guide if the flow exceeds one screen (the password-reset flow earned its own [AUTH_PASSWORD_RESET.md](./AUTH_PASSWORD_RESET.md)).

---

## Hardcode `handle_new_user` default role (2026-04-26)

**Decision**: `handle_new_user` trigger inserts `role = 'supervisor'` literally; `raw_user_meta_data.role` is no longer read.

**Why**: `raw_user_meta_data` is client-controllable. A signup payload could pass `role: 'super_admin'`. While `is_approved = FALSE` blocks login regardless, the role string still surfaced in admin UIs and was a foot-gun. Hardcoding to `'supervisor'` makes the trigger deterministic and removes an attack surface.

**How to apply**: Never reintroduce the COALESCE. The real role is assigned by `approve_user_and_link_person()` on admin approval. Migration: [supabase/migrations/20260426_115937_harden_handle_new_user_default_role.sql](../../../supabase/migrations/20260426_115937_harden_handle_new_user_default_role.sql).

---

## All login validation lives in `Login.tsx`, not `AuthContext` (2025-11-29)

**Decision**: `AuthContext` is a state-sync layer only. Email-verified / approved / active gates live in `Login.tsx`.

**Why**: Splitting validation across both led to duplicate checks, redundant signOut calls, and a 380-line AuthContext nobody could safely edit. Single-pass validation in Login.tsx gives the user immediate feedback; AuthContext's only job is to load profile + modules.

**How to apply**: When adding a login-time check, add it to Login.tsx — never to AuthContext. AuthContext stays under ~150 lines.

---

## Trust the Supabase SDK — no timeouts, guards, or failsafes around it (2025-11-29)

**Decision**: AuthContext does not wrap `getSession()` / `rpc()` in `withTimeout`, recursive-call guards, or failsafe `setTimeout` resets.

**Why**: Each safeguard introduced a new failure mode. The 10s `getSession` timeout caused `TOKEN_REFRESHED`-triggered logouts (lessons.md). The recursive-call guard masked the real bug (calling `checkAuth` from the wrong event). Failsafe timers ran *after* the `finally` they were meant to guard.

**How to apply**: If `AuthContext` hangs in production, fix Supabase connectivity, not the auth code. Adding complexity here is the bug pattern, not the fix.

---

## Centralized `ProtectedRoute` over per-page guards (2025-11-30)

**Decision**: `<ProtectedRoute>` in `App.tsx` does the auth + module gate. Pages have zero auth code.

**Why**: Per-page `if (loading) … if (!hasAccess) …` guards drifted between pages, were trivially forgotten, and competed with AuthContext loading. Centralizing it means one component owns the contract.

**How to apply**: New protected route → wrap in `<ProtectedRoute modulePath="/x">`. Don't add `useAuth().modules.some(...)` checks to pages that already sit behind `ProtectedRoute`.

---

## `AuthProvider` ABOVE `QueryClientProvider` (2025-11-21)

**Decision**: `<AuthProvider>` wraps `<QueryClientProvider>` in `main.tsx`, never the reverse.

**Why**: AuthProvider state changes (setUser/setProfile) re-render its subtree. If QueryClient is *above*, those re-renders happen during in-flight queries and corrupt the cache (empty shells in results). Putting Auth above isolates query lifecycle from auth state.

**How to apply**: Don't reorder providers. New top-level providers go above or below this pair, never between them.

---

## Minimal RLS — security at the application layer (project-wide, pre-2025)

**Decision**: Every public table uses `USING (true) WITH CHECK (true)` for authenticated. Module-based access is enforced in app code.

**Why**: Complex RLS recursed (policies referencing each other), broke under JWT staleness, and made debugging asymmetric (works in SQL editor, fails from app, or vice versa). Single RLS pattern + app-level module gate is simpler to reason about and faster to fix.

**How to apply**: New table migration MUST include the minimal RLS template. Sole exception: `notifications` (`auth.uid() = user_id`).

---

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [lessons.md](./lessons.md) · [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md)
