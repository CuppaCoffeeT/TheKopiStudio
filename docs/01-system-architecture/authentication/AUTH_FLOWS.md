# Authentication Flows

**Status**: 🟢 Production · **Last Updated**: 2026-04-27 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

End-to-end sequences for login, session restore, token refresh, logout, and registration → approval.

---

## 1. Login flow

```
Login.tsx: handleLogin(email, password)
  ↓
1. supabase.auth.signInWithPassword()
   → returns { user, session } or error
  ↓
2. Verify email
   if !user.email_confirmed_at → signOut + show "verify email"
  ↓
3. supabase.rpc('get_user_profile')
   → { id, name, email, role, is_approved, is_active }
  ↓
4. Validate is_approved && is_active
   if either false → signOut + show pending/deactivated message
  ↓
5. Show success toast. DO NOT navigate yet.
  ↓
6. Supabase fires SIGNED_IN → AuthContext.checkAuth() runs
   → loads user · profile · modules
  ↓
7. Login.tsx useEffect detects (!authLoading && user)
   → navigate('/dashboard', { replace: true })
```

**Why step 7 is a `useEffect` and not an inline `navigate()`:** the `SIGNED_IN` event fires *before* `signInWithPassword()` resolves. If Login navigates immediately, AuthContext is still loading and the route guard bounces the user back. Wait for AuthContext, then navigate. See [AUTH_TROUBLESHOOTING.md#issue-7-login-redirect-stuck-after-logout](./AUTH_TROUBLESHOOTING.md#issue-7-login-redirect-stuck-after-logout-race-condition).

## 2. Session restore (app load)

```
main.tsx renders <AuthProvider>
  ↓
AuthContext useEffect → checkAuth()
  ↓
1. supabase.auth.getSession()  ← reads localStorage['sb-*-auth-token']
   if no session → setLoading(false), unauth state
  ↓
2. supabase.rpc('get_user_profile')
3. supabase.rpc('get_user_modules', { p_user_id })
  ↓
4. setUser / setProfile / setModules / setLoading(false)
```

No re-validation of `email_confirmed_at` / `is_approved` / `is_active` here — that's Login.tsx's job. AuthContext only syncs.

## 3. Token refresh flow

```
JWT nears expiry → Supabase SDK refreshes in background
  ↓
onAuthStateChange fires with event = 'TOKEN_REFRESHED'
  ↓
AuthContext IGNORES this event   ← critical
  ↓
New token written to localStorage automatically
Subsequent requests use the new token. No re-validation.
```

**⚠️ Critical:** never call `checkAuth()` on `TOKEN_REFRESHED`. Doing so re-runs `getSession()` + RPCs; if any timeout or guard is wrapped around them, slow networks fire the timeout and log the user out mid-session. See [lessons.md — TOKEN_REFRESHED bug](./lessons.md#token_refreshed-handler-caused-random-mid-session-logouts-2025-11-29).

```typescript
// ✅ correct
onAuthStateChange((event) => {
  if (event === 'SIGNED_IN')  checkAuth();
  if (event === 'SIGNED_OUT') clearState();
  // TOKEN_REFRESHED — do nothing
});
```

## 4. Logout flow

```
User clicks logout
  ↓
supabase.auth.signOut()
  ↓
clearAuthStorage()   ← targeted: only sb-*-auth-token + code-verifier
  ↓
onAuthStateChange fires SIGNED_OUT
  ↓
AuthContext clears user/profile/modules/loading
  ↓
navigate('/')
```

Never `localStorage.clear()`. It nukes React Query cache and user preferences.

## 5. Registration → approval flow

```
┌──────────────────────────────────────────────────────────────┐
│ STEP 1 · User signup (your-app.example.com → Register tab)         │
│   submits: name + email + password                            │
└──────────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 2 · Supabase creates auth.users row                      │
│   email verification email sent                               │
│   raw_user_meta_data.role is IGNORED by handle_new_user       │
└──────────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 3 · handle_new_user() trigger fires                      │
│   INSERT public.users:                                        │
│     role = 'supervisor'   ← HARDCODED, no metadata override   │
│     is_approved = FALSE   ← blocks login                      │
│     is_active = TRUE                                          │
│     person_id = NULL                                          │
└──────────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 4 · User clicks email verification link                  │
│   auth.users.email_confirmed_at set                           │
│   user still cannot log in (is_approved = FALSE)              │
└──────────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 5 · Admin approves via /peoplemanagement → Pending tab   │
│   UserApprovalDialog calls approve_user_and_link_person():    │
│     · person_id  ← linked or newly-created people row          │
│     · role        ← admin selects (supervisor/coordinator/…)   │
│     · is_approved = TRUE                                      │
│     · approved_by + approved_at recorded                      │
└──────────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 6 · User logs in successfully                            │
└──────────────────────────────────────────────────────────────┘
```

**Why the trigger hardcodes role**: `raw_user_meta_data` is client-controllable. Any signup payload could pass `role: 'super_admin'`. Hardcoding to `'supervisor'` means even a malicious signup gets a low-privilege placeholder; admin assigns the real role on approval. Decision: [decisions.md — handle_new_user role](./decisions.md#hardcode-handle_new_user-default-role-2026-04-26).

For the admin-side end-to-end SOP, see [../../02-security/USER_APPROVAL_WORKFLOW.md](../../02-security/USER_APPROVAL_WORKFLOW.md).

## 6. Password reset flow

User clicks the recovery link in their email → lands on `/auth/reset-password?token=…&type=recovery` → token state dispatcher renders validating / invalid / form → on submit, `supabase.auth.updateUser({ password })` + `signOut` + redirect to `/login`.

Full sequence + error paths + seatbelt status: [AUTH_PASSWORD_RESET.md](./AUTH_PASSWORD_RESET.md).

## 7. Email verification flow

User clicks the verification link in their signup confirmation email → lands on `/auth/verify?token=…&type=signup` (or with hash-fragment errors / a transient session) → URL-resolution dispatcher renders loading / success / error / expired → on success, auto-redirect to `/auth/verified` after 2 s.

Full sequence + URL-resolution priorities + Supabase quirks + seatbelt status: [AUTH_EMAIL_VERIFICATION.md](./AUTH_EMAIL_VERIFICATION.md).

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) · [AUTH_DATABASE.md](./AUTH_DATABASE.md) · [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) · [AUTH_PASSWORD_RESET.md](./AUTH_PASSWORD_RESET.md) · [AUTH_EMAIL_VERIFICATION.md](./AUTH_EMAIL_VERIFICATION.md) · [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md) · [decisions.md](./decisions.md) · [lessons.md](./lessons.md)
- [../../02-security/USER_APPROVAL_WORKFLOW.md](../../02-security/USER_APPROVAL_WORKFLOW.md)
