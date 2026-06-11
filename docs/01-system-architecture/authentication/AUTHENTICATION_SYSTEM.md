# Authentication System

**Created**: 2025-11-24 SGT
**Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Supabase Auth handles authentication (email + password). Authorization is enforced **at the application layer** via the module permission system, not in the database. RLS is intentionally minimal (`USING (true) WITH CHECK (true)`).

**Core principles**

1. Authentication = Supabase Auth.
2. Authorization = module-based, not role-based — check `useAuth().modules`, never `user.role` strings.
3. RLS = minimal; security lives in application logic.
4. Auth state is centralized in `AuthContext` (Provider, NOT a per-component hook).
5. `Login.tsx` owns the user-facing validation UX (email-verified, approved, active messaging). `AuthContext` does NOT duplicate that messaging, but re-enforces a hard approval+active gate on every session restore (signs out silently on fail) as defense-in-depth.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  React app                                   │
│  ─ Login page (unauthenticated)              │
│  ─ AuthProvider ──► useAuth() in components  │
│       provides: user · profile · modules     │
└─────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────┐
│  @supabase/supabase-js client                │
│  ─ persistSession: true (localStorage)       │
│  ─ autoRefreshToken: true                    │
│  ─ signInWithPassword · signOut              │
│  ─ getSession · onAuthStateChange            │
└─────────────────────────────────────────────┘
                       │
┌─────────────────────────────────────────────┐
│  Supabase Postgres                           │
│  ─ auth.users (managed by Supabase)          │
│  ─ public.users (role, approved, active)     │
│  ─ public.people (name, email, phone)        │
│  ─ modules · role_modules · user_modules     │
│  ─ RPC: get_user_profile, get_user_modules   │
│  ─ Trigger: handle_new_user (auth.users)     │
└─────────────────────────────────────────────┘
```

**Component tree (`main.tsx`)**

```tsx
<AuthProvider>                  {/* MUST be above QueryClientProvider */}
  <QueryClientProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
</AuthProvider>
```

If AuthProvider sits *below* QueryClientProvider, auth state changes corrupt React Query cache.

## Key files

| File | Purpose |
|---|---|
| [src/contexts/AuthContext.tsx](../../../src/contexts/AuthContext.tsx) | Single source of auth state. ~395 lines. No timeouts/recursion failsafes. Re-checks approval+active on session restore, self-heals stale JWT `app_metadata.role`, and owns super-admin impersonation. |
| [src/pages/Login.tsx](../../../src/pages/Login.tsx) | Login form + email/approval/active validation. |
| [src/components/auth/ProtectedRoute.tsx](../../../src/components/auth/ProtectedRoute.tsx) | Route-level auth + module gate. |
| [src/integrations/supabase/client.ts](../../../src/integrations/supabase/client.ts) | Supabase client (persistSession, autoRefreshToken). |
| [src/utils/authStorage.ts](../../../src/utils/authStorage.ts) | Targeted clearing of Supabase auth keys (never `localStorage.clear()`). |
| [src/main.tsx](../../../src/main.tsx) | Provider order — AuthProvider above QueryClient. |

## Hard rules

| ✅ DO | ❌ DON'T |
|---|---|
| Own user-facing email/approval/active validation UX in `Login.tsx` | Duplicate Login's validation *messaging* in `AuthContext` (the silent approval+active re-gate stays) |
| Check `modules.some(m => m.path === '/x')` | Hardcode `if (user.role === 'admin')` |
| Use minimal RLS (`USING (true)`) | Build complex/recursive RLS policies |
| Reference `public.users(id)` for FKs | Reference `auth.users(id)` directly |
| `clearAuthStorage()` on logout | `localStorage.clear()` (nukes React Query cache) |
| Trust Supabase SDK to refresh tokens | Add timeouts/guards/failsafes around it |
| Keep `AuthContext` free of `withTimeout`/recursion guards/failsafe timers | Re-add `withTimeout`, recursive call guards, failsafe timers |
| `await checkAuth()` only on `SIGNED_IN` | Call it on `TOKEN_REFRESHED` (causes random logouts) |

## Login validation chain

```
Email + Password → Supabase Auth
   ↓ (pass)
Email verified? (auth.users.email_confirmed_at)
   ↓ (pass)
Approved? (public.users.is_approved)
   ↓ (pass)
Active? (public.users.is_active)
   ↓ (pass)
Profile + modules loaded → redirect /dashboard
```

For each flow's full sequence diagram, see [AUTH_FLOWS.md](./AUTH_FLOWS.md).

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [AUTH_FLOWS.md](./AUTH_FLOWS.md) · [AUTH_DATABASE.md](./AUTH_DATABASE.md) · [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) · [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md) · [decisions.md](./decisions.md) · [lessons.md](./lessons.md)
- [../DATABASE_POLICY.md](../DATABASE_POLICY.md) · [../MODULE_SYSTEM.md](../MODULE_SYSTEM.md) · [../PEOPLE_SYSTEM.md](../PEOPLE_SYSTEM.md)
- [../../02-security/USER_APPROVAL_WORKFLOW.md](../../02-security/USER_APPROVAL_WORKFLOW.md)
- [../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md](../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md)
