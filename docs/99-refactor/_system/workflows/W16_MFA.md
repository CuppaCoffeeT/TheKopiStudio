# W16 — MFA / Two-factor authentication

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-16 SGT
**Status**: 🔵 Planning
**Priority**: 🟡 High

**Goal**: Enable Supabase Auth built-in MFA (TOTP) with enrolment UI, required for admin + payroll-module users, opt-in for everyone else.
**Tier**: Next · **Status**: 🔴 PLANNED · **Automation**: 🤖 auto (Supabase handles crypto) + 👤 manual UX
**Blocked by**: W14 (uses agreed RLS pattern for enrolment records), W08 (uses tokens for UI) · **Blocks**: nothing

## Why this exists

Internal ops portal with payroll, salary, client data. Single-factor password = total access if leaked. Supabase Auth has MFA natively (TOTP — authenticator app compatible). No new provider needed. This card wires it up + the enrolment UX.

## Scope

**In:**
- Enable MFA at Supabase Auth project level
- Enrolment page — user scans QR code in authenticator app, verifies 6-digit code
- Login flow — after password, prompt for TOTP if user is enrolled
- Admin override — admin can reset a user's MFA (logs to `audit_mfa_resets`, emails user)
- Policy: MANDATORY for users with admin role or payroll-module access; opt-in for others
- Recovery codes — 8 single-use codes generated at enrolment
- Follows W14 RLS strategy for the `auth.mfa_factors` and `audit_mfa_resets` tables

**Out:**
- SMS MFA (Supabase doesn't do it natively; not recommended anyway)
- WebAuthn / hardware keys (later — wait until staff standardize on compatible devices)
- Mandatory for all day 1 (gradual rollout: admin+payroll first, review after 1 month)

## Dependencies on other cards

- W14 informs RLS on mfa-related tables
- W07 primitives — enrolment page uses shared form shell
- W08 tokens — enrolment page uses design system

## Open workflow questions

- **Q-W16-a** ✅ **TOTP only, WebAuthn later (2026-04-19, default accepted)**.
- **Q-W16-b** ✅ **mandatory admin + payroll, opt-in rest, 1-month review (2026-04-19, default accepted)**.
- **Q-W16-c** ✅ **NO recovery codes — admin override instead (2026-04-19, OVERRIDE)**. User: "no need, administrator will be able to override if they lost mfa." Recovery path = user contacts admin → admin clears MFA secret in `auth.users.mfa_factors` via Supabase → user re-enrolls. Audit via Q-W16-d. Simpler than per-user recovery code vaults; admin already exists.
- **Q-W16-d** ✅ **`audit_mfa_resets` table + email to affected user (2026-04-19, default accepted)**. Especially important given Q-W16-c — every admin override must leave a trail.

## Done-when

- MFA enrolable + usable for login
- Admin + payroll users required to enrol on next login
- Recovery codes tested (use one, verify it works once only)
- Admin reset flow documented + tested
- Sets DAG flag: **`mfa_live`** (gate G4)

## Related

- [W14_AUTH_RLS_AUDIT.md](W14_AUTH_RLS_AUDIT.md) — policy pattern used for MFA tables
- [authentication/CONTEXT.md](../../../01-system-architecture/authentication/CONTEXT.md) — current auth workspace (updates on W16 completion)
- Supabase Auth MFA docs (look up current URL at build time — changes often)
