# Authentication — Password Reset Flow

**Status**: 🟢 Production · **Last Updated**: 2026-04-27 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

End-to-end sequence for the recovery-token-driven password-reset flow at `/auth/reset-password`. Pre-auth surface — no `useAuth` context, no module gate, no `DashboardHeader`.

Implementation: [src/features/auth/](../../../src/features/auth/) (W09 #20 · 2026-04-27 — feature folder + primitives, archetype = `tool` fallback).

---

## 1. Recovery email request (out of scope here)

User clicks "Forgot password" on `/login` → `<ForgotPasswordModal>` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`. Supabase sends a recovery email containing a magic link to `/auth/reset-password?token=…&type=recovery`.

That step lives on the legacy `Login.tsx` workspace and migrates with WF-`Login`.

## 2. Land on `/auth/reset-password`

```
React Router renders <PasswordReset /> (src/features/auth/pages/PasswordReset.tsx)
  ↓
usePasswordResetToken() → 'validating' | 'valid' | 'invalid'
  ↓ token state dispatch
  ├─ validating → <PasswordResetValidatingState>  (LoadingSpinner)
  ├─ invalid    → <PasswordResetInvalidState>     (icon + copy + Back to Login)
  └─ valid      → <PasswordResetForm>             (RHF + zod)
```

`usePasswordResetToken` does three things in parallel:

1. **Synchronous URL check (both shapes)** — `?token=…&type=recovery` (PKCE flow, query string) OR `#access_token=…&type=recovery` (implicit flow, hash fragment). Either is acceptable; missing both → `'invalid'`. Don't read only `useSearchParams` — it ignores the hash, and Supabase implicit-flow puts everything there.
2. **Deterministic session establishment** — when both hash tokens are present, call `supabase.auth.setSession({ access_token, refresh_token })` explicitly *before* `getSession()`. Don't rely on `detectSessionInUrl: true` to have run by the time the hook polls — it's non-deterministic, especially on mobile-safari, and caused 1-in-3 flake of the WF-0603 spec until this was added. PKCE-shape (`?token=…`) skips this step because Supabase exchanges the token server-side at the verify endpoint, so the session already exists when the page loads.
3. **Supabase session probe** — `supabase.auth.getSession()`. Confirms the session exists and the user is set; if missing → `'invalid'`.
4. **`onAuthStateChange` listener** — flips to `'valid'` on the asynchronous `PASSWORD_RECOVERY` event, falls back to `'invalid'` on `SIGNED_OUT`.

The hook cancels its in-flight effect via a closure-captured flag so an unmount mid-validation doesn't `setState` after teardown.

### Login.tsx auto-redirect guard

`Login.tsx` auto-navigates to `/dashboard` whenever `useAuth().user` becomes set. Because Supabase fires `SIGNED_IN` alongside `PASSWORD_RECOVERY`, AuthContext picks up the recovery session and `user` becomes truthy mid-flow. If the recovery callback ever lands on `/` or `/login` instead of `/auth/reset-password` (implicit flow with hash fragment, or a misconfigured email template), Login.tsx would dump the user onto `/dashboard` and the reset form would never render. Login.tsx's redirect effect therefore bails out and re-navigates to `/auth/reset-password` (preserving query+hash) when `type=recovery` is present in either side of the URL. See [lessons.md — recovery link instantly logs user in](./lessons.md#recovery-link-instantly-logs-the-user-in-to-dashboard--logintsx-auto-redirect-races-password_recovery-2026-04-27).

## 3. Submit the form (token state = valid)

```
PasswordResetForm: handleSubmit(values)
  ↓
zod validates: password ≥ 6 chars · confirmPassword === password
  ↓
usePasswordResetSubmit().submit(password)
  ↓
1. supabase.auth.updateUser({ password })
   if error → showError(error.message), keep form state
  ↓
2. showSuccess('Password updated successfully! Redirecting to login...')
  ↓
3. setTimeout 2000ms (REDIRECT_DELAY_MS):
   await supabase.auth.signOut()
   navigate('/login', { replace: true })
```

**Why explicit `signOut()` after `updateUser`**: the recovery session is still authenticated. Without `signOut`, the next `getSession()` resolves and the route guard redirects the freshly-reset user to `/dashboard` instead of `/login`. The 2s delay lets the success toast read as confirmation rather than disappear into the navigation.

## 4. Cleanup of the recovery token

Supabase invalidates the recovery token on `updateUser` success. No app-side cleanup; the URL retains the `?token=…` query string but it's inert after step 3. Re-visiting the same URL after a successful reset lands on the `'invalid'` state because no session is established for the consumed token.

## 5. Observable error paths

| Scenario | State | Surface |
|---|---|---|
| URL has no `token` query param | `'invalid'` | `PasswordResetInvalidState` |
| `type` ≠ `'recovery'` | `'invalid'` | same |
| Supabase `getSession()` returns error | `'invalid'` | same + `showError('Invalid or expired password reset link')` |
| `getSession()` returns no user | `'invalid'` | same + same toast |
| `auth.updateUser` returns error (e.g. password rejected by policy) | form stays | `showError(error.message)` · `submitting` resets to false |
| Unexpected throw inside submit | form stays | `showError('An unexpected error occurred while resetting your password')` |

## Hard rules specific to this flow

- **No `useAuth` access** — the page renders before AuthContext has a profile loaded; reading `useAuth().user` would race the recovery session probe.
- **`AuthShell` replaces `DashboardHeader`** — pre-auth pages have no module path, no breadcrumb. `AuthShell` is feature-local until a second auth page composes the same centered-card layout, then promote to `primitives/shell/`.
- **`console.error` only** — no breadcrumb `console.log` (compliance #4). The legacy page had four `console.log` statements stripped during W09 #20.
- **Password policy enforced server-side** — Supabase `auth.updateUser` rejects weak passwords per project Auth settings; the local zod schema only enforces `≥ 6 chars` to short-circuit the network round-trip on obvious fails.

## Seatbelt

[WF-0597 — invalid-link state](../../99-refactor/_system/ledgers/WORKFLOW_LEDGER.md) · spec [tests/workflows/auth/reset-password-invalid-link.spec.ts](../../../tests/workflows/auth/reset-password-invalid-link.spec.ts).

Full happy-path (token valid → submit → redirect) is **not yet captured** — requires a real Supabase recovery token from the email pipeline, deferred until a Gmail-MCP runner can seed the magic link deterministically.

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [AUTH_FLOWS.md](./AUTH_FLOWS.md) — login · session · refresh · logout · registration
- [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) — `useAuth` · `ProtectedRoute` (not used by this flow)
- [decisions.md](./decisions.md) · [lessons.md](./lessons.md)
- [src/features/auth/CONTEXT.md](../../../src/features/auth/CONTEXT.md) — feature-folder router
- [docs/99-refactor/_system/design/pages/auth-reset-password/MIGRATION_PLAN.md](../../99-refactor/_system/design/pages/auth-reset-password/MIGRATION_PLAN.md) — W09 #20 plan
