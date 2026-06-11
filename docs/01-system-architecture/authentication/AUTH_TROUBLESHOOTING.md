# Auth Troubleshooting

**Status**: 🟢 Production · **Last Updated**: 2026-04-26 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

Diagnosed issues with confirmed fixes. For background on *why* these were tricky, see [lessons.md](./lessons.md).

---

## Issue 1 · "Failed to fetch" on login

**Symptoms** — error at `signInWithPassword`, both local and production.

**Likely causes** — network, CORS, Supabase outage, SSL, browser extension.

**Diagnose**
```ts
const r = await fetch('https://your-project-ref.supabase.co/rest/v1/', { method: 'HEAD' });
console.log('status:', r.status);
```

**Fix** — try mobile hotspot · check Supabase CORS settings include the production domain · check https://status.supabase.com · disable extensions · try incognito.

## Issue 2 · "User profile not found"

**Symptoms** — login succeeds, `get_user_profile()` returns empty.

**Causes** — `auth.users` row exists but no `public.users` row · `person_id` is NULL · RPC missing.

**Diagnose**
```sql
SELECT u.id, u.person_id, p.first_name, p.last_name
FROM public.users u
LEFT JOIN public.people p ON u.person_id = p.id
WHERE u.id = (SELECT id FROM auth.users WHERE email = ?);
```

**Fix** — admin must approve via [/peoplemanagement → Pending tab](../../02-security/USER_APPROVAL_WORKFLOW.md), which links `person_id`.

## Issue 3 · Module not appearing for a user

**Causes** — no `role_modules` row for that role · `user_modules` row with `is_granted = false` · `modules.is_active = false` · path mismatch between DB and `ProtectedRoute`'s `modulePath`.

**Diagnose**
```sql
SELECT * FROM get_user_modules('user-uuid');
SELECT * FROM user_modules WHERE user_id = 'user-uuid';
```

**Fix** — match `modules.path` exactly between DB and the `modulePath` prop. Add the missing `role_modules` row, or remove the negative `user_modules` override.

## Issue 4 · Blank rendering after login

**Cause** — `<AuthProvider>` is below `<QueryClientProvider>`, so auth state changes corrupt the React Query cache.

**Fix** — in `main.tsx`:
```tsx
<AuthProvider>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</AuthProvider>
```
Background: [../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md](../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md).

## Issue 5 · "Loading…" stuck after back-button or window focus

**Symptoms** — back button after >1 minute idle shows "No data found" briefly, then data appears.

**Cause** — `enabled: !loading && !!user` on a query couples it to AuthContext loading. When token refresh fires, the query is *disabled* (not loading), so React Query reports `isLoading = false` and the page renders empty.

**Fix** — remove the `enabled` guard. Let the query run; React Query handles 401 retries.
```ts
useQuery({ queryKey: queryKeys.companies.list({}), queryFn: fetchCompanies });
// no enabled guard
```
Already removed in `CompanyList`, `GeneralWorks`, `AdminDashboard` (2025-01-28). If you find another, delete the line.

## Issue 6 · Random mid-session logouts (`TOKEN_REFRESHED` bug)

**Symptoms** — user gets logged out without acting · console shows `getSession call timed out after 10 seconds` · happens around the hourly token-refresh boundary.

**Cause** — `onAuthStateChange` was calling `checkAuth()` on `TOKEN_REFRESHED`. `checkAuth` had a 10s timeout around `getSession()`; under slow network it tripped, was treated as "no session," and signed the user out.

**Fix** — only call `checkAuth()` on `SIGNED_IN`. Ignore `TOKEN_REFRESHED`. Supabase handles it.
```ts
onAuthStateChange((event) => {
  if (event === 'SIGNED_IN')  checkAuth();
  if (event === 'SIGNED_OUT') clearState();
});
```
Implemented in [src/contexts/AuthContext.tsx](../../../src/contexts/AuthContext.tsx) on 2025-11-29. Do not re-add the timeout. See [lessons.md](./lessons.md#token_refreshed-handler-caused-random-mid-session-logouts-2025-11-29).

## Issue 7 · Login redirect stuck after logout (race condition)

**Symptoms** — after logout, logging back in shows the success toast but the user remains on `/login`. Refreshing the page and trying again works.

**Cause** — `signInWithPassword` resolves *after* the `SIGNED_IN` event fires. Login.tsx was navigating immediately, beating AuthContext's `checkAuth()` — `<ProtectedRoute>` then bounced the user back because auth state was still loading.

**Fix** — Login.tsx watches `useAuth()` and navigates inside a `useEffect` only when `!authLoading && user`. No inline navigation in `handleLogin`.

```tsx
const { loading: authLoading, user } = useAuth();
useEffect(() => {
  if (!authLoading && user) navigate('/dashboard', { replace: true });
}, [authLoading, user, navigate]);
```

## Issue 8 · Pending-user counts diverge between admin dashboard and People module

**Symptoms** — `/admin` shows N pending users; `/peoplemanagement → Pending` shows zero (or fewer).

**Cause** — two RPCs:
- `get_pending_users()` — no `is_active` filter (admin User-Approvals tab uses this)
- `get_unapproved_users_with_metadata()` — `is_active = TRUE` filter (People module + dashboard badge use this)

The "missing" rows are `is_approved = FALSE AND is_active = FALSE` — stale legacy registrations.

**Fix** (workaround, current) — those rows are not actionable. The People module hides them correctly. Either soft-delete the stale rows or align the RPCs (project decision pending). See [lessons.md](./lessons.md#dashboard-and-people-module-pending-counts-diverged-2026-04-26).

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) · [AUTH_FLOWS.md](./AUTH_FLOWS.md) · [AUTH_DATABASE.md](./AUTH_DATABASE.md) · [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) · [decisions.md](./decisions.md) · [lessons.md](./lessons.md)
- [../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md](../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md)
