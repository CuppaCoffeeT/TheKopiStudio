# Authentication — Email Verification Flow

**Status**: 🟢 Production · **Last Updated**: 2026-04-27 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

End-to-end sequence for the Supabase email-verification confirmation surface at `/auth/verify`. Pre-auth surface — no `useAuth` context, no module gate, no `DashboardHeader`. The page is a **status surface, not a form**: it parses the URL, resolves a final state, and on success auto-redirects to `/auth/verified`.

Implementation: [src/features/auth/](../../../src/features/auth/) (W09 #24 · 2026-04-27 — feature folder + primitives, archetype = `tool` fallback).

---

## 1. Verification email request (out of scope here)

A new user signs up on `/login` → Supabase creates an `auth.users` row → emits a verification email containing a magic link to `/auth/verify?token=…&type=signup`. The signup itself is documented in [AUTH_FLOWS.md §5 Registration → approval flow](./AUTH_FLOWS.md#5-registration--approval-flow); this guide picks up at the moment the user clicks the link.

## 2. Land on `/auth/verify`

```
React Router renders <EmailVerification /> (src/features/auth/pages/EmailVerification.tsx)
  ↓
useEmailVerification() → { status: 'loading' | 'success' | 'error' | 'expired', message }
  ↓ status dispatch
  ├─ loading → <EmailVerificationLoadingState>  (PageTitle + LoadingSpinner)
  ├─ success → <EmailVerificationSuccessState>  (CheckCircle + PageTitle + info Alert + auto-redirect)
  ├─ error   → <EmailVerificationErrorState variant="error">    (XCircle + PageTitle + error Alert + Back / Retry)
  └─ expired → <EmailVerificationErrorState variant="expired">  (AlertTriangle + warning Alert + Back / Retry)
```

The hook runs once on mount inside a `useEffect` and uses a closure-captured `cancelled` flag so an unmount mid-`getSession()` (or mid-redirect-timeout) doesn't `setState` after teardown.

## 3. URL resolution priorities

`useEmailVerification.ts` evaluates four signal sources in order — **first match wins, no fall-through**:

| Priority | Signal | Outcome |
|---|---|---|
| 1 | `supabase.auth.getSession()` returns a session | Treat as success → `auth.signOut()` (so an unapproved user can't bypass admin approval) → strip URL via `replaceState` → 2 s timer → `navigate('/auth/verified', { replace: true })` |
| 2 | `#error_code=otp_expired` OR `#error=access_denied` in the hash | Treat as success — see [lessons.md — `otp_expired` actually means success](./lessons.md#supabase-otp_expired--access_denied-on-auth-verify-actually-means-success-2026-04-27). Same redirect-with-strip flow as priority 1 |
| 2b | Any other hash error | Render `error` state. Decode `hashErrorDescription` for the message |
| 3 | `?error=…` with description containing `expired` | Render `expired` state with a "Verification Link Expired" warning Alert |
| 3b | Other `?error=…` | Render generic `error` state with the description as the message |
| 4 | `?token=…&type=signup` with no errors | Treat as success → redirect (the page does NOT validate the token authenticity — that already happened upstream when Supabase consumed it on the GET that landed us here) |
| Default | No token, no errors | Render `error` state ("Invalid verification link.") |

## 4. State surfaces

Three components share the centered-card `<AuthShell>` layout (a feature-local primitive at [src/features/auth/components/AuthShell.tsx](../../../src/features/auth/components/AuthShell.tsx) — per the [pre-auth-pages decision](./decisions.md#pre-auth-pages-migrate-under-w09-archetype--tool--feature-local-authshell-2026-04-27) the second-caller promotion threshold has been comfortably crossed; lift to `primitives/shell/` is queued via `/design-prompt`).

- **Loading**: PageTitle "Verifying your email…" + LoadingSpinner. No buttons, no Alert.
- **Success**: CheckCircle + PageTitle "Email Verified Successfully!" + info Alert ("What's next? Your account is now pending approval…"). No buttons — the user only sees this for ≤ 2 s before the redirect fires.
- **Error / Expired**: state-specific lucide icon + PageTitle + paragraph echoing `message` from the hook + Alert (variant=`error` for `error`, `warning` for `expired`) + two Buttons:
  - **Back to Sign Up** → `navigate('/login')` (primary)
  - **Try Again** → `window.location.reload()` (ghost) — full reload so the verify hook re-runs against the current URL

## 5. The 2-second redirect timer

On every success path, the hook calls `setTimeout(navigate, 2000)` and stashes the timer ID in a closure variable. The cleanup function clears it if the component unmounts before the timer fires. Two consequences:

- Users see the success surface long enough to read it (and to un-confuse anyone who clicked the link in a previewer that immediately consumed the token — they land here with priority 2's Supabase quirk in flight).
- Strict-mode double-mount in dev re-runs the effect; the cleanup-and-rebuild keeps the redirect from firing twice.

`window.history.replaceState` runs *before* the timer is scheduled, so the URL has already been cleaned of the token / hash by the time `/auth/verified` mounts. Back-button never re-replays a stale token.

## Hard rules specific to this flow

- **No `useAuth` access** — the page renders before AuthContext has a profile loaded; reading `useAuth().user` would race the priority-1 session probe.
- **`auth.signOut()` is mandatory** on the priority-1 path, even though it feels backwards. Supabase's first GET on the verification link consumes the token AND establishes a session — leaving that session intact would let the (still-unapproved) user log in to dashboards before admin clears the `is_approved` flag. SignOut + redirect to `/auth/verified` is the only correct sequence.
- **Treat `otp_expired` / `access_denied` as success, not failure** — see [lessons.md](./lessons.md). Tightening this surfaces "verification failed" to users who actually verified.
- **`AuthShell` replaces `DashboardHeader`** — same pattern as `/auth/reset-password`. With this migration, AuthShell now has ≥3 callers; promotion to `primitives/shell/` is queued.
- **`console.error` only** — no breadcrumb `console.log` (compliance #4). Legacy page had five `console.log` statements stripped during W09 #24.
- **Two `<Alert>` calls per Error/Expired surface, not three** — the visible Alert is variant-keyed via a `VARIANTS` config map (introduced in W09 #24 simplify pass). Resist the urge to inline icon-and-Alert pairs back into the JSX; the map keeps `variant` ↔ `iconClass` ↔ `alertVariant` ↔ copy invariants in one place.

## Seatbelt

| Workflow | Spec | Status |
|---|---|---|
| WF-0598 — no-token error state + Back to Sign Up nav | [tests/workflows/auth/email-verification.spec.ts](../../../tests/workflows/auth/email-verification.spec.ts) | 🟢 |
| WF-0599 — expired-link warning + Try Again button enabled | [tests/workflows/auth/email-verification.spec.ts](../../../tests/workflows/auth/email-verification.spec.ts) | 🟢 |
| WF-0600 — Supabase `otp_expired` success-quirk + auto-redirect | [tests/workflows/auth/email-verification.spec.ts](../../../tests/workflows/auth/email-verification.spec.ts) | 🟢 |
| WF-0601 — token+signup happy-path + auto-redirect | [tests/workflows/auth/email-verification.spec.ts](../../../tests/workflows/auth/email-verification.spec.ts) | 🟢 |

**Not yet captured**: priority-1 active-session paths (WF-EV-01 / WF-EV-03 in MIGRATION_PLAN.md) — require a real Supabase session, deferred until a non-admin test-user exists.

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [AUTH_FLOWS.md](./AUTH_FLOWS.md) — login · session · refresh · logout · registration
- [AUTH_PASSWORD_RESET.md](./AUTH_PASSWORD_RESET.md) — sibling pre-auth flow (same archetype + AuthShell)
- [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) — `useAuth` · `ProtectedRoute` (not used by this flow)
- [decisions.md](./decisions.md) · [lessons.md](./lessons.md)
- [src/features/auth/CONTEXT.md](../../../src/features/auth/CONTEXT.md) — feature-folder router
- [docs/99-refactor/_system/design/pages/auth-verify/MIGRATION_PLAN.md](../../99-refactor/_system/design/pages/auth-verify/MIGRATION_PLAN.md) — W09 #24 plan
