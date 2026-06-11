# Authentication — Lessons

**Last Updated**: 2026-04-27 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md) · Sibling: [decisions.md](./decisions.md)

Bugs we hit + the failure mode behind them. Append-only; newest first.

---

## Supabase JS `detectSessionInUrl` is non-deterministic on mobile-safari — call `setSession()` explicitly (2026-04-27)

**What happened**: After fixing the recovery-link routing (Login.tsx guard + dual-shape URL parsing), the WF-0603 happy-path spec passed reliably on chromium-desktop but flaked ~1-in-3 on mobile-safari with a snapshot showing the **Invalid Reset Link** surface — for a brand-new, valid recovery link that had been minted seconds earlier via the admin API.

**Root cause**: `usePasswordResetToken` called `supabase.auth.getSession()` immediately after detecting the recovery markers, expecting Supabase JS's `detectSessionInUrl: true` to have already consumed the URL hash and created a session. On mobile-safari (slower JIT, slower hash-parse), the SDK frequently hadn't finished the async hash-exchange before the hook polled. `getSession()` returned no user → state flipped to `'invalid'` → form never rendered. Polling `getSession()` with retries reduced but didn't eliminate the flake — sometimes the SDK simply doesn't fire the listener within any reasonable window if the page mounts mid-hash-parse.

**Fix**: when both `access_token` and `refresh_token` are present in the URL hash, [usePasswordResetToken.ts](../../../src/features/auth/hooks/usePasswordResetToken.ts) now calls `supabase.auth.setSession({ access_token, refresh_token })` itself before calling `getSession()`. This is the deterministic API — it returns a Promise that resolves only after the session is actually established. After that, `getSession()` returns the user reliably on every render. WF-0603 went from 1-in-3 flaky → 10/10 green across 5 runs × 2 projects.

**What to remember**:
- `detectSessionInUrl: true` is a *background* convenience, not a guarantee. If your code depends on the session existing within the same tick as the URL parse, call `setSession` explicitly.
- This is NOT the same trap as the original 2025 bug (which used `setSession({ access_token, refresh_token })` for `?access_token=…&refresh_token=…` query params that never existed). The valid pattern: detect both hash tokens are present → call setSession to establish, → then getSession to read. The query-string `?token=…&type=recovery` PKCE shape still uses getSession alone — Supabase exchanges that token server-side as part of the verify endpoint, so the session already exists by the time the page loads.
- Mobile-safari is the canary — anything timing-sensitive in auth code MUST be tested on it.

---

## Supabase silently strips `redirectTo` paths missing from the URL allow-list (2026-04-27)

**What happened**: `ForgotPasswordModal` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/auth/reset-password })`. The actual email link was `https://your-project-ref.supabase.co/auth/v1/verify?token=…&type=recovery&redirect_to=https://your-app.example.com/` — the `/auth/reset-password` path was stripped, leaving root.

**Root cause**: Supabase's `redirectTo` parameter only honored when the full URL is registered under **Authentication → URL Configuration → Redirect URLs**. Anything not in the allow-list silently falls back to the project's **Site URL** — no error, no warning, the API call returns success. We never added the per-page recovery URL to the allow-list, so Supabase stripped the path.

**Fix**: in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, add:
- `https://your-app.example.com/auth/reset-password`
- `https://your-app.example.com/auth/verify`
- `https://your-app.example.com/auth/verified`
- `http://localhost:8080/auth/reset-password` (and `verify`/`verified`) for local testing

**What to remember**: `resetPasswordForEmail`'s `{ redirectTo }` is a hint, not a contract. Validate every redirect URL is in the allow-list when you ship a new auth flow. The defensive Login.tsx guard (re-route on `type=recovery`) stays as belt-and-suspenders, but doesn't replace fixing the email URL at the source — verification + signup flows have the same exposure.

---

## Recovery link "instantly logs the user in to /dashboard" — Login.tsx auto-redirect races PASSWORD_RECOVERY (2026-04-27)

**What happened**: clicking the password-reset email link landed the user on `/dashboard`, fully signed in, instead of on `/auth/reset-password` to type a new password. Reproduced same-day after the W09 #20 migration shipped.

**Root cause**: Supabase fires `SIGNED_IN` alongside `PASSWORD_RECOVERY` when the recovery link is clicked — the recovery flow establishes a transient session, which the SDK reports as a normal sign-in. AuthContext's handler treats `SIGNED_IN` as "load full profile + modules", which sets `useAuth().user`. If the recovery callback lands on `/` or `/login` (Supabase implicit-flow with hash fragment, OR an email template that strips the `redirectTo` path), [Login.tsx:30-35](../../../src/pages/Login.tsx#L30-L35) sees `user` set and immediately `navigate('/dashboard')`. The PasswordReset page never gets a chance to render.

**Fix (2-part defensive)**:
1. [Login.tsx:30-46](../../../src/pages/Login.tsx#L30-L46) — auto-redirect to `/dashboard` skipped when URL contains `type=recovery` (query OR hash). Reroutes to `/auth/reset-password` preserving query+hash so the SDK can still pick up the session.
2. [usePasswordResetToken.ts](../../../src/features/auth/hooks/usePasswordResetToken.ts) — `readRecoveryMarkers` helper accepts BOTH `?token=…&type=recovery` (PKCE) AND `#access_token=…&type=recovery` (implicit). Either marker counts as "recovery flow in progress".

**What to remember**:
- Supabase's `SIGNED_IN` event fires for any new session — including transient recovery sessions. Auto-redirects gated on `useAuth().user` MUST exclude recovery URLs OR check the current pathname before navigating.
- `useSearchParams` only sees the query string. Recovery URLs in implicit flow put everything in the hash fragment — read both.
- Don't rely on the Supabase project's redirect URL configuration to enforce flow safety. Treat the `redirectTo` as a hint, not a guarantee.

---

## Supabase `otp_expired` / `access_denied` on `/auth/verify` actually means success (2026-04-27)

**What happened**: `/auth/verify` (`EmailVerification.tsx`) received URL hashes like `#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired` even though the email-verification token had **just** been consumed correctly. A naïve "treat any error as failure" handler showed users a "Verification Failed" surface immediately after they had successfully verified.

**Root cause**: Supabase's email-verification token is single-use. The first GET on the link consumes the token and creates a transient session. Some email clients (and some browser configurations) replay the link a second time — link-preview fetchers, anti-phishing scanners, "open in new tab" → revisit. The replay arrives with the token already consumed, so Supabase returns `otp_expired` / `access_denied`. The verification itself is fine; only the replay is rejected.

**Fix**: in [useEmailVerification.ts](../../../src/features/auth/hooks/useEmailVerification.ts), priority 2 treats `error_code=otp_expired` AND `error=access_denied` as **success** (redirect to `/auth/verified`). Priority 1 (active session) handles the parallel case where the first GET already created a session and we just need to sign out + redirect. Don't tighten this: showing a verified user a "failed" surface is far worse than the rare false positive of treating a genuinely-expired link as verified (the user lands on `/auth/verified` then can't actually log in until admin approval, so no privilege is granted).

**What to remember**: Supabase Auth treats single-use tokens defensively. When an email-verification flow looks like it's failing for users who *should* be verified, check whether the token is being re-fetched (link previewer, second tab) — the replay is the bug, not your handler.

---

## Password-reset URL contract is `?token=…&type=recovery`, not `?access_token=…&refresh_token=…` (2026-04-27)

**What happened**: the original `PasswordReset.tsx` (commit `0400e60d` Jul 2025) read `searchParams.get('access_token')` + `searchParams.get('refresh_token')` then called `supabase.auth.setSession({ access_token, refresh_token })`. Recovery links never arrived in that shape — Supabase's hosted email template emits `?token=<recovery>&type=recovery`. Every reset attempt landed on the invalid-link surface.

**Root cause**: confused two Supabase Auth flows. `setSession({ access_token, refresh_token })` is the magic-link-with-tokens-in-URL pattern (deprecated). The recovery flow puts a single `token` in the URL and Supabase exchanges it for a transient session server-side; the client just calls `getSession()` to pick up that session and listens for the `PASSWORD_RECOVERY` event.

**Fix**: read `token` (singular) + `type === 'recovery'`, call `supabase.auth.getSession()` (no args), subscribe to `onAuthStateChange` for the `PASSWORD_RECOVERY` event. Codified in [usePasswordResetToken.ts](../../../src/features/auth/hooks/usePasswordResetToken.ts) (W09 #20). Don't reintroduce `setSession({ access_token, refresh_token })` — if Supabase ever re-adds tokens-in-URL for recovery, document the version and the trigger before changing the hook.

---

## Dashboard and People-module pending counts diverged (2026-04-26)

**Symptom**: `/admin` showed 5 pending users; `/peoplemanagement → Pending` showed 0.

**Root cause**: two RPCs returning different supersets. `get_pending_users()` (admin) had no `is_active` filter. `get_unapproved_users_with_metadata()` (People module + dashboard badge) filters `is_active = TRUE`. Five rows had `is_approved = FALSE AND is_active = FALSE` — pre-2025 stale registrations + one legacy `super_admin` self-elevation attempt via `raw_user_meta_data.role`.

**Fix**: Hardened `handle_new_user` to ignore metadata role (see [decisions.md](./decisions.md#hardcode-handle_new_user-default-role-2026-04-26)). Stale rows still surface in admin UI; alignment of the two RPCs is a separate decision.

**What to remember**: when two UIs that "should" agree don't, look for two different RPCs/queries — not for a stale cache.

---

## TOKEN_REFRESHED handler caused random mid-session logouts (2025-11-29)

**Symptom**: users logged out mid-session without acting, ~hourly · console: `getSession call timed out after 10 seconds`.

**Root cause**: `onAuthStateChange` was calling `checkAuth()` on **both** `SIGNED_IN` and `TOKEN_REFRESHED`. `checkAuth` wrapped `getSession()` in a 10-second timeout. Supabase fires `TOKEN_REFRESHED` automatically every ~hour. Under any combination of slow network + Supabase load, the 10s timeout tripped, was treated as "no session," and signed the user out.

**Fix**: only handle `SIGNED_IN`; ignore `TOKEN_REFRESHED` entirely. Removed the `withTimeout` wrapper too — Supabase's own timeouts are the right ones.

**What to remember**: don't re-validate auth state on background events. The SDK already manages token lifecycle. Any "safety" layer you wrap around it becomes a new failure mode.

---

## Login redirect stuck after logout (2025-11-29)

**Symptom**: after logout, re-login showed success toast, console showed "Redirecting to dashboard," user stayed on `/login`. A page refresh fixed it.

**Root cause**: `signInWithPassword()` resolves *after* the `SIGNED_IN` event has already fired. Login.tsx's inline `navigate('/dashboard')` ran while AuthContext's `checkAuth()` was mid-flight — `<ProtectedRoute>` saw `loading: true, user: null` and bounced back to `/login`.

**Fix**: Login.tsx `useAuth()` and navigates inside `useEffect(() => …, [authLoading, user])`. No inline navigation after `signInWithPassword`.

**What to remember**: Supabase auth events are *not* sequenced after the API call's promise. If you act on the result before AuthContext has caught up, you race AuthContext.

---

## "Loading…" stuck after back-button (2025-01-28)

**Symptom**: back button after >1 minute idle showed "No data found" briefly, then real data.

**Root cause**: queries used `enabled: !loading && !!user`. When token refresh ran, AuthContext set `loading = true`, queries flipped to *disabled* (not loading). React Query reports `isLoading = false` for disabled queries — so the page rendered the empty state.

**Fix**: removed `enabled: !loading && !!user` from `CompanyList`, `GeneralWorks`, `AdminDashboard`. Queries now run independently; React Query handles 401 retries on token-stale windows.

**What to remember**: don't gate React Query `enabled` on auth loading state. The two systems run on different timelines and the coupling produces phantom empty states.

---

## AuthContext rewrite — complexity was the bug (2025-11-29)

**Symptom**: months of "fixes" (timeouts, recursive-call guards, failsafe timers, role-metadata sync delays) kept introducing new symptoms. User feedback: *"i feel like we keep debugging then you keep adding codes but never remove any deprecated code and now we can figure out what is the bug anymore."*

**Root cause**: each fix added a safeguard around Supabase. Each safeguard had its own failure mode. The 380-line AuthContext was a stack of patches, not an architecture.

**Fix**: complete rewrite. 130 lines. No `withTimeout`. No `isCheckingAuth.current` guard. No failsafe `setTimeout`. No role-metadata sync. Login.tsx validates; AuthContext syncs. Trust the SDK.

**What to remember**: when fixes keep generating fixes, the code is fighting the framework. Delete the safeguards before adding more. Decision: [decisions.md](./decisions.md#trust-the-supabase-sdk--no-timeouts-guards-or-failsafes-around-it-2025-11-29).

---

## React Query cache corruption from provider order (2025-11-21)

**Symptom**: data flickered, empty shells appeared in query results, blank renders after login.

**Root cause**: `<QueryClientProvider>` was above `<AuthProvider>`. AuthProvider state updates re-rendered the QueryClient subtree mid-query, corrupting in-flight results.

**Fix**: swap the order — `<AuthProvider>` wraps `<QueryClientProvider>`. Component-level `useAuth()` hook removed in favour of single Provider; 60+ imports updated.

**What to remember**: provider order is a contract, not an aesthetic choice. State that drives cross-cutting re-renders must sit above the cache it can disrupt.

---

## Mutation finally-blocks prevent infinite loading (2025-01-28)

**Symptom**: form save would error in a non-critical follow-up step (refetch, secondary write); form stuck "Saving…" forever because the loading flag was set inside `try` and never reset.

**Root cause**: `setIsLoading(false)` placed in the success path (or in `catch`). A throw before that line — or a throw in a non-critical follow-up — left the spinner spinning.

**Fix**: every loading-flag mutation resets state in `finally`. Non-critical follow-ups wrapped in their own `try/catch` so they can't propagate up.

**What to remember**: anywhere a flag flips to `true` before async work, the reset belongs in `finally` — period.

---

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [decisions.md](./decisions.md) · [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md)
