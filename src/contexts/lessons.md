# Lessons — `src/contexts/`

Last Updated: 2026-05-25

## 2026-05-25 — Stale JWT `app_metadata.role` survives role changes mid-session
**What happened**: Safety Coordinator (halim, iPad) hit `new row violates row-level security policy for table "daily_attendance"` two days after we assigned him the role. DB-side everything checked out: `rls_capabilities` contained `('field_or_above','Safety Coordinator')`, `is_field_or_above()` returned `true` when simulated with his uid + correct `app_metadata.role`.
**Root cause**: he last signed in 2026-05-21; we updated `raw_app_meta_data.role` to `"Safety Coordinator"` on 2026-05-23. Supabase access tokens snapshot `app_metadata` at issue time and only rehydrate on `refreshSession()`. The iPad's persisted session kept reusing the pre-change JWT, so `auth.jwt()->'app_metadata'->>'role'` was `null` and every capability-gated write failed. The bug class is generic — applies to every user whose role changes between sign-ins.
**Fix**: `AuthContext.checkAuth` now decodes the access token, compares its `app_metadata.role` against the DB `users.role` (returned by `get_user_profile`), and calls `supabase.auth.refreshSession()` on mismatch. One-shot per cold start; subsequent queries automatically use the refreshed token. No need to ask users to log out + back in.
