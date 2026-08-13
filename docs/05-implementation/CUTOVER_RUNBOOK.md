# Cutover Runbook — Prospect Profiler (merged app)

**Created:** 2026-06-12 · **Status:** 🟡 Awaiting user decisions · **Priority:** P0 (final phase)

The merged app is fully built and green on `main` (4 PRDs completed — see [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)). This runbook lists what remains, split by who acts. Nothing below is destructive until §4, which requires explicit per-step approval.

## 1. User-blocked prerequisites
- [ ] **CRM data import key** — old CRM Supabase dashboard (`uivdgousiyfeyrebloaz`) → Settings → API → `service_role`; put `SOURCE_SUPABASE_SERVICE_ROLE_KEY=<key>` in `"/Users/tenshi/Documents/Projects/Insurance CRM/.env.migration"`. Then the runbook in [CRM_DATA_SPINE.md](../01-system-architecture/CRM_DATA_SPINE.md) executes: `node scripts/export-crm.mjs` → `node scripts/import-crm.mjs` → orchestrated SQL apply + verification (row parity, recomputed totals).
- [x] **Production identity** — RESOLVED 2026-08-13 (verified against the live account, not planned): custom domain **`www.thekopistudio.com`**, served by Vercel project **`thekopistudio`**; the apex `thekopistudio.com` 308s to www. The old `prospect-profiler-app.vercel.app` host now 404s and that Vercel project no longer exists. `src/main.tsx` pinned the dead host until 2026-08-13, so Vercel Analytics had been silently off in production.

## 2. Deploy (additive — needs the §1 domain decision)
- [x] Vercel project (CLI authed) with env vars `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — live, deploying from `main` of `CuppaCoffeeT/TheKopiStudio`.
- [ ] **STILL OPEN — Supabase Dashboard → Auth → URL Configuration**: Site URL `https://www.thekopistudio.com`, and redirect URLs covering `https://www.thekopistudio.com/login`, `https://www.thekopistudio.com/reset-password` (+ the apex and `http://localhost:8080/**` for local work). Needed by the signup-confirmation and password-recovery emails that `/signup` + `/forgot-password` now send — password login works without it, so this fails silently. Could not be verified from here: the management token in `.mcp.json` 403s on `/v1/projects/*/config/auth`.
- [ ] Smoke: login as skytwech@gmail.com, run a wizard profile, open a client report, print.

## 3. Verification window (both apps live, shared DB — already the steady state)
- Old profiler keeps working (compat trigger + untouched legacy tables/policies — verified throughout).
- New app serves all 8 modules. Old CRM (`uivdgousiyfeyrebloaz`) stays read-only-by-convention until its data is imported (§1).

## 4. Destructive steps — EACH requires explicit approval (never automatic)
- [ ] Backfill `results.user_id` for the 7 anonymous legacy rows (optional: map by advisor_name) and tighten `results` RLS (replace `Anyone can insert results` WITH CHECK true → `user_id IS NULL OR auth.uid() = user_id`; replace `get_my_role()` policies with capability-based incl. super_admin; drop the spoof-link window on client_id).
- [ ] Remove the compat `handle_new_user` profiles-insert; drop `public.profiles` after a final export; repoint `results.user_id` FK → `public.users(id)`.
- [ ] Take old Vercel deployments offline (Prospect-Profiler, insurance-crm) / add redirects; freeze both old GitHub repos.
- [ ] Rotate the plaintext `sbp_…` token in `"Insurance CRM/.mcp.json"`; revoke unused anon grants (UPDATE/DELETE/TRUNCATE) on legacy tables; `SET search_path` on `get_my_role`/`update_updated_at`; enable leaked-password protection (advisor WARN).
- [ ] Delete the 3 `+e2e-` test accounts (or keep for CI). Pause/delete project `uivdgousiyfeyrebloaz` after §1 verification.
- [ ] Rename repo `prospect-profiler-app` → `prospect-profiler` (old repo freed after freeze) if desired.

## Annual maintenance note
`crm/lib/finance.ts` constants (BHS, BRS/FRS/ERS table, CPF LIFE baseline) are frozen 2026 values — review yearly; golden vectors pin refYear=2026.
