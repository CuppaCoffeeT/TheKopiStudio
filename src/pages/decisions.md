# Pages (signed-out routes) — Decisions

**Last Updated**: 2026-08-13 SGT

Scope: the route components in `src/pages/` — `Login` · `Signup` · `ForgotPassword` ·
`ResetPassword` · `NotFound` · `RouteError`. Their shared chrome lives in
`src/components/shared/auth-shell/AuthShell.tsx`.

## 2026-08-13 — Self-serve sign-up and password reset are back, gated by admin approval

**Decision**: `/signup`, `/forgot-password` and `/reset-password` exist again as public
routes, cross-linked from `/login`. Sign-up is genuinely self-serve: anyone can create an
account, and the account is inert until (1) the address is confirmed and (2) an admin
approves it in `/manage-accounts`. `/login` now names the pending-approval state instead
of bouncing silently.

**Why**: the backend half of this flow had been live the whole time — the
`on_auth_user_created` trigger already mirrors every `auth.users` insert into
`public.users` with `role = 'advisor'`, `is_approved = false`, and `manage-accounts`
already ships an Approve action against exactly that flag. Auth settings agreed
(`disable_signup: false`, email provider on). Only the three screens were missing, so the
"no self-serve sign-up" line on `/login` described the UI, not the system.

**Supersedes**: 2026-08-05 — Copy de-duplication pass (design-director critique round),
in [`src/features/profiler/lib/decisions.md`](../features/profiler/lib/decisions.md),
which set the Login subline to "Accounts are provisioned by your administrator — there is
no self-serve sign-up". That sentence is now false and is gone.

**Impact**: `Login.tsx` (footer links, forgot link, pending-approval branch) ·
`Signup.tsx` · `ForgotPassword.tsx` · `ResetPassword.tsx` (new) ·
`shared/auth-shell/AuthShell.tsx` (new) · `App.tsx` (3 public routes) ·
`tests/workflows/auth/auth-public.spec.ts` (new).

**Left to the operator (not code)**: Supabase → Auth → URL Configuration must list
`https://<prod-host>/reset-password` and `https://<prod-host>/login` (plus the localhost
origin) as redirect URLs, or recovery/confirmation links silently fall back to the Site
URL. The project is also still on Supabase's built-in SMTP, which is rate-limited to a
couple of mails an hour — fine for a trickle of advisors, not for a launch.

## 2026-08-13 — The signed-out screens never branch on whether an email exists

**Decision**: `/signup` shows the same "check your inbox" panel whether or not the address
is already registered, and `/forgot-password` says "if an account exists for X" rather
than "sent". Neither screen reports "no such user".

**Why**: both forms are unauthenticated and public, so any difference in response turns
them into an oracle for testing which addresses hold accounts. Supabase deliberately
supports this — with confirmations on, a duplicate `signUp` returns a normal-looking user
whose `identities` array is empty — and the UI has to hold up its end. The code says so
at both call sites so a future "friendlier error" doesn't undo it.

**Impact**: `Signup.tsx`, `ForgotPassword.tsx`.
