# Authentication — Workspace Router

**Status**: 🟢 Production · **Priority**: 🔴 Critical · **Last Updated**: 2026-04-27 SGT

## Purpose

Routing-only index for the auth domain: Supabase Auth + application-level module authorization.

## What belongs / what doesn't

**Belongs**: anything tied to login, session, token refresh, logout, registration, approval, AuthContext, ProtectedRoute, auth-related RPCs (`get_user_profile`, `get_user_modules`, `handle_new_user`, `approve_user_and_link_person`).
**Doesn't**: module catalog ([../MODULE_SYSTEM.md](../MODULE_SYSTEM.md)), people normalization ([../PEOPLE_SYSTEM.md](../PEOPLE_SYSTEM.md)), end-to-end approval SOP ([../../02-security/USER_APPROVAL_WORKFLOW.md](../../02-security/USER_APPROVAL_WORKFLOW.md)).

## Navigation

| File | Purpose |
|---|---|
| [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) | Architecture overview, principles, summary |
| [AUTH_FLOWS.md](./AUTH_FLOWS.md) | Login · session restore · token refresh · logout · registration flows |
| [AUTH_PASSWORD_RESET.md](./AUTH_PASSWORD_RESET.md) | `/auth/reset-password` recovery-token flow (W09 #20) |
| [AUTH_EMAIL_VERIFICATION.md](./AUTH_EMAIL_VERIFICATION.md) | `/auth/verify` URL-resolution dispatcher + Supabase quirks (W09 #24) |
| [AUTH_DATABASE.md](./AUTH_DATABASE.md) | `auth.users` · `public.users` · `people` · `modules` · `role_modules` · `user_modules` · RPCs · RLS pattern |
| [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) | `ProtectedRoute` · `useAuth()` · login implementation · error / mutation handling · anti-patterns |
| [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md) | Issues 1–7 with diagnosis + fix |
| [decisions.md](./decisions.md) | Architectural decisions (with **Why**) |
| [lessons.md](./lessons.md) | Bugs + anti-patterns we learned from |
| [_archive/MIGRATION_HISTORY_2025.md](./_archive/MIGRATION_HISTORY_2025.md) | Frozen 2025 migration log |

## Before working here

- **AuthProvider MUST be above QueryClientProvider** in `main.tsx` — anything else corrupts React Query cache.
- **All validation lives in `Login.tsx`**, not `AuthContext`. AuthContext just syncs state.
- **No timeouts, guards, or failsafes in AuthContext** — keep it under ~150 lines. Adding complexity is the bug.
- **`handle_new_user` ignores `raw_user_meta_data.role`** — hardcoded `'supervisor'`. Admin assigns the real role on approval.
- **Module-based RBAC only** — never compare against role strings in components.

## 📚 Related

- [../CONTEXT.md](../CONTEXT.md) — parent (`01-system-architecture`)
- [../DATABASE_POLICY.md](../DATABASE_POLICY.md) — minimal RLS standard
- [../MODULE_SYSTEM.md](../MODULE_SYSTEM.md) — module access model
- [../../02-security/USER_APPROVAL_WORKFLOW.md](../../02-security/USER_APPROVAL_WORKFLOW.md) — admin SOP
- [../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md](../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md) — auth ↔ React Query race causes
