# Profiler Module — Wizard, Results, Account Settings, Manage Accounts — PRD

**Created:** 2026-06-11 · **Last Updated:** 2026-06-11 · **Status:** 🟡 In Progress (P0-P5 ✅; P6 E2E next) · **Priority:** P0 (the app's flagship surface)
**Work type**: module (four surfaces: public profiling wizard · saved results LIST+DETAIL · Account Settings · Manage Accounts)

🤖 Build via: `/prd-execute docs/05-implementation/active/PROFILER_MODULE_PRD.md`
✅ Completion gate: 9-gate module DoD (per-surface notes below) green → PRD moves to completed/

## 📊 Progress / State

| Phase | Status | Notes |
|---|---|---|
| P0 — E2E harness repair + test accounts | ✅ | Harness donor-free; 3 e2e accounts live (confirmed/approved/promoted, JWT + profiles mirror for manager) |
| P1 — Scaffold + module registration + routes + queryKeys | ✅ | Migration 20260611_174434 applied; grants verified per role via get_user_modules |
| P2 — lib port: content, scoring, export + golden-master tests | ✅ | vitest 28/28 — all 8 live rows reproduce exactly; quirk corpus green |
| P3 — Public wizard (TOOL) | ✅ | Full flow + report + playbook; saves anon/auth; draft persistence; vitest 40/40 |
| P4 — Results list + detail | ✅ | ListPageFrame + reconstruction via scoring replay; RLS-aware mutations |
| P5 — Account Settings + Manage Accounts (+ role-sync v2 profiles mirror) | ✅ | role-sync v3 deployed with profiles mirror; smoke 200/401 |
| P6 — @p0 E2E matrix + load/a11y, iterate to green | ⬜ | |
| P7 — Docs + completeness + close-out | ⬜ | |

Current phase: P6 E2E · Blockers: none

## 📋 Definition

**What**: Rebuild the deployed Prospect Profiler (vanilla-JS hash SPA) as AppBase feature modules in this repo: the DISC×MBTI profiling wizard (public, anonymous-friendly), saved-results history with full report + communication playbook, plus the app's account surfaces (Account Settings, Manage Accounts). The legacy app keeps serving production from the same DB until cutover — the new app must read/write `public.results` byte-compatibly.

**Why**: This is the core product. The CRM module (next PRD) hangs off the same shell; Manage Accounts unblocks approval of new signups (foundation defaults `is_approved=false`).

**Target users**: advisor (runs profiles, sees own results), manager (sees all results, manages accounts), super_admin (everything), anonymous visitor (runs wizard; results saved without owner — live behavior preserved by explicit user decision).

**Success criteria**: wizard produces scores identical to legacy `calcPf`/`occNudge` (golden-master verified against all 8 live rows + a tie-break/occupation corpus); anonymous + authenticated saves land in `public.results` in the legacy shape; results list/detail reconstruct reports faithfully (incl. recomputed MBTI strengths); role/approval changes flow through role-sync and keep legacy manager visibility working; 9-gate DoD + per-role @p0 matrix green.

**Scope cut (NOT in v1)**: no results-table schema/RLS changes (cutover work); no prospect→client conversion (Phase 4 PRD); no offline/service worker; no PWA manifest polish (carry-over decision logged at cutover); CSV column order/headers unchanged (only comma-escaping fixed).

## 🔎 Research findings (verified 2026-06-11 — prd-execute inherits, does NOT re-research)

### Source port map (file-verified: `"/Users/tenshi/Documents/Projects/Prospect profiler/public/"`)
- **data.js (292 lines)**: `QS` = exactly 8 questions `{ph:'open'|'discover', tip, ask, opts:[4×{t, d:'D'|'I'|'S'|'C', mb:{k:'EI'|'SN'|'TF'|'JP', v:pole}}]}` — each question's 4 options cover D/I/S/C exactly once; MBTI pole availability is asymmetric BY DESIGN (E 6×, I 2×, S 4×, N 5×, T 6×, F 7×, J 4×, P 4×). `NVG` = 5 groups, 53 items `{id (a1-a10,b1-b9,c1-c9,d1-d9,e1-e16), t, d}` — DISC only, no MBTI. `PR` = 4 profile blocks keyed D/I/S/C: `{nm, em, col (D #C0392B, I #D4680A, S #1A7A40, C #1A5F8A), sg, op, mb, tr[5], dos[5], dnts[4], st, wf, fu, msgs}`; `msgs` = 5 categories in key order engage/appt/followup/objections/close with 5/5/5/6/5 items = 26 statements ×4 profiles. Strings hold HTML entities/unicode escapes — convert to literal unicode in TS; diff-check all 104 statements after conversion.
- **Scoring (profiler.js:117-142)** — replicate EXACTLY, then lock with tests: `occNudge` first (7 stackable regex buckets over lowercased occupation; quirks preserved: trailing-space tokens `'it '/'md '/'gm '/'vp '/'pr '/'hr '`, `'care'` matches "career", `self.employ` unescaped dot); then each non-null answer: DISC +2, MBTI pole +1; each ticked observation: DISC +1. Primary/secondary = sort desc with IMPLICIT tie order D>I>S>C (object insertion + stable sort) — encode explicitly. MBTI = `(E>=I?'E':'I')+(S>=N?'S':'N')+(T>=F?'T':'F')+(J>=P?'J':'P')` — ties favor E/S/T/J. Returns `{dc, mb, pri, sec, mbs, nvCount (ticked TRUE only), qCount, occUsed}`.
- **Wizard flow**: screens 0 (intake: advisor/prospect names default "Advisor"/"Prospect" when blank; age ranges '20-25','26-30','31-35','36-40','41-45','46+'; meeting '1' Opening/'2' Presentation/'3' Closing/'4' Servicing, defaults '1'; occupation free text) → 1-2 (questions 0-3, 4-7; Next disabled until all 4 answered) → 3-7 (5 NV groups; zero validation; last button "Generate Profile →") → R (result; auto-save fires). Progress = `round(n/7*100)`, "Step n of 7".
- **Result sections (in order)**: print header (.rph: names/date en-SG/meeting label) → hero (gradient `PR[pri].col`, badges, MBTI line, Advisor Quick Read) → PDF/CSV actions → login CTA (logged-out) → notes button → opening line card → DISC score card (optional "Occupation factored in" chip; heading "{qCount} questions + {nvCount} observations"; bars RELATIVE to max — winner always 100%, label "{pts} pts") → MBTI dims E/I,S/N,T/F,J/P (winner `sa>=sb`, bar `win/tot`, zero-state "No signals yet") → traits chips → Do/Avoid grid → conversation style + red watch-for box → follow-up style → playbook (5 categories, tap-to-copy statements).
- **Exports**: PDF = `window.print()` + A4/12mm print CSS (port; fix legacy bug where action buttons print). CSV columns (keep order/headers; FIX comma-escaping by quoting all text fields): Date, Advisor, Prospect, Age, Occupation, Meeting, DISC primary/secondary, MBTI, score D/I/S/C, questions, observations, notes.
- **Save payload** (preserve exactly): `{user_id (uuid|null), advisor_name, prospect_name, age_range, occupation, meeting (text '1'-'4'), disc_primary, disc_secondary, score_d/i/s/c, mbti, questions_answered, observations_count, raw_answers (array of 8 {d, mb:{k,v}, oi}), nv_observations (object id→bool incl. FALSE entries), notes}`.
- **Legacy bugs fixed by the port (do NOT replicate)**: result-detail clobbering live wizard state; fake MBTI strength on saved results (recompute from raw_answers + occupation via the ported scoring fn instead); silent save failures (use showSuccess/showError); CSV comma corruption; XSS interpolation (JSX); duplicate `doLogout`.

### Live DB dynamics (MCP-verified; legacy app shares the table until cutover)
- `results`: 21 cols; `user_id` NULLABLE FK→`profiles(id)` CASCADE; disc CHECKs; `updated_at` trigger EXISTS (notes editing safe). All 9 policies PERMISSIVE to PUBLIC. **Anonymous INSERT works** ('Anyone can insert results' WITH CHECK true + anon table grants) **but anon cannot SELECT back** → anon insert must be fire-and-forget (no `.insert().select()`, no return=representation). Advisor reads own via `auth.uid()=user_id`; manager read-all via legacy `get_my_role()` which reads **`profiles.role`** (both current users 'manager' there; compat trigger gives new signups profiles rows, role 'advisor').
- **7 of 8 legacy rows have user_id NULL** — visible only to managers; NO RLS path can update/delete them (notes editing on those rows: hide/disable with explanation; backfill at cutover).
- **super_admin has NO read-all on results** under the legacy policy (only literal 'manager' passes). sky's `profiles.role` = 'manager' so sky is fine. Manage Accounts promotions via role-sync DON'T touch profiles → newly-promoted managers would lack results visibility until cutover ⇒ **role-sync v2 (P5)**: when the new role is 'manager' or 'advisor', mirror it into `profiles.role`; for 'super_admin' mirror 'manager' (CHECK constraint allows only advisor|manager). Additive function redeploy (standing approval covers it); update CRM_DATA_SPINE.md contract.
- Golden-master vectors: all 8 live rows have full `raw_answers` (8×{d,mb:{k,v},oi}) + `nv_observations` (booleans — count TRUE only) + stored scores/mbti/occupation. Keane row (`883d2eca…`, scores D0 I9 S18 C3, ISFJ, occupation 'Childcare teacher') documented in full in the research output. Replay: scoring(raw_answers, nv_observations TRUE-set, occupation) must reproduce stored score_d/i/s/c, disc_primary/secondary, mbti for all 8 rows.

### Wiring (verified against live DB + base code)
- **4 module rows** (one migration): `/profiler` (TOOL, public route), `/profiler-results` (LIST+DETAIL; `/:id` shares modulePath), `/account-settings` (SETTINGS), `/manage-accounts` (LIST; granted manager+super_admin only; others granted advisor+manager+super_admin). Lucide `icon_name` NOT NULL; **live `modules` has NO UNIQUE on path — the documented `ON CONFLICT (path)` FAILS (42P10)**: migration must `ALTER TABLE public.modules ADD CONSTRAINT modules_path_key UNIQUE (path)` first (additive, 1 row). `role_modules` grants only to live roles advisor/manager/super_admin (granting doc-example roles FK-fails). Byte-identity modules.path ↔ App.tsx route ↔ modulePath.
- **Public wizard route** goes OUTSIDE the DashboardLayout group (sibling of `/login`) with NO ProtectedRoute — sanctioned (base ships public routes; no gate forbids it). Tile still appears for logged-in users (Home.tsx renders from `useAuth().modules`). Lazy route needs its own Suspense. AuthProvider is global; `useAuth()` is safe on the public page (conditionally show Save state/Login CTA).
- **ONE domain folder `src/features/profiler/`** for wizard + results (module rows ≠ folders); separate folders `src/features/account-settings/`, `src/features/manage-accounts/`. `src/features/` doesn't exist yet — create per create-module.md skeleton (`api/ components/ hooks/ pages/ lib/ types.ts index.ts CONTEXT.md`; flat types.ts; no `src/components/<domain>/`). Routing style: React.lazy (the base's own convention; SOP's "direct import" line is stale — log in decisions.md).
- **Manage Accounts data**: do NOT use `get_all_users()` (super_admin-gated → managers silently get 0 rows). Query `supabase.from('users').select('*', {count:'exact'}).eq('is_deleted', false).range(...)` (users_select allows it). ALL role/approval mutations POST to role-sync (direct UPDATEs match 0 rows / raise 42501 by design). Approval UX: new signups land unapproved — list shows pending badge + Approve action.
- **Account Settings data**: `get_user_profile()` RPC (no phone) + direct users select for phone; self name/phone via users_update; email/password via `supabase.auth.updateUser` (never bare users.email writes). Username lives in legacy `profiles` — display-only here; do not edit profiles from the new app (old-app semantics frozen).
- **queryKeys**: registry currently has users/people/modules/notifications only — add `profilerResults` (and `users` list usage for manage-accounts already exists) via `createQueryKeys`; ESLint forbids ad-hoc keys.

### UI building blocks (verified in `src/components/primitives/`)
136 primitives; the ones this PRD needs exist: **wizard/** (`WizardShell`, `WizardStepperHeader`, `WizardFooter`, `WizardMobileDrawer`), form `Stepper`/`Progress`/`Field`/`Input`/`Textarea`/`RadioGroup`/`Checkbox`, overlays `Modal`/`SelectMenu`/`Tabs`, ui `ListPageFrame` (note: primaryAction renders 2 DOM nodes — desktop + mobile FloatingCTA; tests filter visible), detail `DetailPageFrame`/`TabNav`/`DestructiveConfirmDialog`, shell `AppHeaderShell`/`Card`/`Chip`/`SearchInput`/`StatusBadge`, dashboard `KpiTile`. **No copy-to-clipboard primitive** — build tap-to-copy via `IconButton` + `navigator.clipboard` + `showSuccess` inside the feature (promote later if reused). SETTINGS pages use `TabNav` (NOT StatusTabs).

### E2E infra gaps (must fix in P0 — first module with E2E)
`tests/workflows/` missing (testDir target); `tests/global-teardown.ts` missing though playwright.config references it; `tests/global-setup.ts` seeds DONOR fixtures (companies/quotations/claims — tables that don't exist here) and must be replaced with a no-op/profiler-appropriate seed; `src/pages/Login.tsx` lacks the `login-email-input`/`login-password-input`/`login-submit-btn` testids its POM targets; `tests/fixtures/roleAuth.ts` AUTH_ROLES are donor roles (admin/coordinator/supervisor/storeman) → re-point to advisor/manager/super_admin with creds from `.env.secrets` (`TEST_<ROLE>_EMAIL/PASSWORD`). Test accounts: create via anon signup (live behavior) then SQL-approve/promote via MCP (plus-addressed emails). a11y dep is `axe-playwright` (injectAxe/checkA11y), no example spec exists — author the first.

## 🧩 Module Spec

- **Archetypes**: wizard = TOOL (WizardShell composition, public); results list = LIST (ListPageFrame + useURLPagination + 350ms debounced search on prospect/DISC/MBTI/advisor); result detail = DETAIL (DetailPageFrame); account-settings = SETTINGS (AppHeaderShell + TabNav); manage-accounts = LIST.
- **Routes** (App.tsx): public `/profiler` (own Suspense); protected `/profiler-results`, `/profiler-results/:id`, `/account-settings`, `/manage-accounts` inside DashboardLayout each wrapped in ProtectedRoute with byte-matching modulePath.
- **Data model**: NO new tables. `results` read/write in legacy shape (see Save payload). Reads: list = own results (advisor) ∪ all (manager via legacy policy) with advisor name join NOT possible server-side for NULL rows — show `advisor_name` text column (already stored). Detail = single row + client-side recompute for bars/strengths.
- **RLS**: untouched this PRD (legacy policies govern). Documented consequences: anon fire-and-forget saves; NULL-owner rows read-only.
- **Mobile**: dvh + 44px targets + fullscreen-dialog forms per base rules; wizard is touch-first (@mobile tag).

## 🔐 Permissions Matrix (drives per-role @p0 negatives)

| Action | anonymous | advisor | manager | super_admin |
|---|---|---|---|---|
| Run wizard + see result | ✅ | ✅ | ✅ | ✅ |
| Save result | ✅ (user_id NULL, fire-and-forget) | ✅ (user_id=self) | ✅ | ✅ |
| /profiler-results list | ❌ (redirect /login) | ✅ own only | ✅ all rows | ⚠️ own only until cutover (legacy policy; sky passes via profiles.role='manager') |
| Result detail/notes/delete | ❌ | ✅ own (NULL-owner rows: read-only for managers, hidden for advisors) | ✅ read all; edit/delete NONE but own | same as manager |
| /account-settings | ❌ | ✅ self | ✅ self | ✅ self |
| /manage-accounts | ❌ | ❌ (no module grant → redirect /dashboard) | ✅ approve/promote/demote via role-sync | ✅ |
| Direct users.role UPDATE | ❌ | ❌ 42501/0 rows | ❌ | ❌ cross-row (role-sync only) |

## 🚦 Phases

### P0 — E2E harness repair + test accounts (prereq for P6; parallel-safe with P1/P2)
Replace donor global-setup seeding with a profiler-safe setup (verify auth users exist; no donor tables); add `tests/global-teardown.ts`; add the 3 login testids to `src/pages/Login.tsx`; re-point `roleAuth.ts`/`testUsers.ts` to advisor/manager/super_admin; create 3 plus-addressed test accounts (anon signup + MCP SQL approve/promote + JWT backfill + profiles.role mirror for the manager test account); document creds expectations in `.env.secrets.example` (never commit real values).
**Verify**: `npm run test:e2e` boots and auth.setup produces 3 storageStates; tsc/lint clean.

### P1 — Scaffold + registration + routes + queryKeys (serialize: schema migration)
`src/features/{profiler,account-settings,manage-accounts}` skeletons; registration migration (UNIQUE(path) constraint + 4 module rows + role_modules grants per matrix; orchestrator applies via MCP); App.tsx routes (public + protected, lazy); queryKeys additions; stub pages rendering archetype frames.
**Verify**: tiles appear per role (SQL: get_user_modules for each test user); routes render; tsc/build/drift/loc green; modules.path byte-match grep.

### P2 — lib port + golden-master tests (parallel-safe with P0/P1; blocks P3/P4)
`lib/content.ts` (QS/NVG/PR as typed constants, entities→unicode, 104-statement diff-check vs source), `lib/scoring.ts` (calcPf+occNudge exact, explicit D>I>S>C and E/S/T/J tie-breaks), `lib/export.ts` (CSV builder with quoting; column parity), `lib/print.css` (A4 12mm, .rph header, hide chrome). Vitest: replay all 8 live rows (vectors in `lib/__fixtures__/legacy-results.ts` from the research/backup data) asserting scores/pri/sec/mbti; tie-break corpus; occupation quirk corpus ("IT manager" stacks, "career" hits 'care', "it" alone doesn't match, etc.); CSV golden file.
**Verify**: vitest green; no `src/` imports from features yet violated.

### P3 — Public wizard (TOOL) — after P2
`pages/ProfilerWizardPage.tsx` + components (IntakeForm, QuestionScreen, ObservationScreen, ResultReport composed of sub-components ≤200 LOC each): full flow per port map incl. progress, validation, back-to-home semantics, sessionStorage draft persistence (NEW — refresh no longer loses progress; clear on generate), result sections in legacy order, tap-to-copy, notes modal, PDF (window.print + print.css), CSV download, save: authenticated → insert with user_id + `.select().single()` + showSuccess; anon → fire-and-forget insert + "Log in to keep your results" CTA; duplicate-save guard (disable after success until inputs change).
**Verify**: gates + manual route check; unit test save-payload builder (shape parity vs legacy fixture).

### P4 — Results list + detail — after P2 (parallel-safe with P3 except shared feature barrel — serialize merges)
`ResultsListPage` (ListPageFrame, columns date/prospect/advisor/DISC/MBTI/meeting, debounced search, useURLPagination, empty state, per-row view); `ResultDetailPage` (DetailPageFrame; rebuild report from row WITHOUT touching wizard state; MBTI strengths recomputed via scoring replay — flag "recomputed" if occupation absent; notes edit (own rows only; disable+tooltip on NULL-owner/non-own rows), delete own with DestructiveConfirmDialog; print/CSV).
**Verify**: gates; hooks use queryKeys + invalidate .all+.detail.

### P5 — Account Settings + Manage Accounts + role-sync v2 — after P1
Account Settings (TabNav: Profile name/phone; Security email/password via auth.updateUser with confirmation states; read-only role/joined/username). Manage Accounts (users list via direct select with pending-approval tab/badges; Approve + role SelectMenu actions calling role-sync via `hooks/useRoleSync.ts` with caller JWT; optimistic UI + invalidation; self-row guarded "This is you"; surface role-sync error messages verbatim incl. last-super-admin 400). **role-sync v2**: add profiles.role mirror (advisor/manager as-is; super_admin→'manager'), update `supabase/functions/role-sync/index.ts` + redeploy (orchestrator, standing approval) + CRM_DATA_SPINE.md contract + functions/decisions.md entry.
**Verify**: gates; SQL: promote test-advisor→manager via function then check users.role + profiles.role + JWT app_metadata; demote restores.

### P6 — Comprehensive E2E — after P0 + P3 + P4 + P5
`tests/workflows/profiler/`: wizard-anonymous (run + save + no history access), wizard-advisor (save lands with user_id; appears in own list), results-advisor (own-only; cannot see others — negative), results-manager (sees all incl. NULL-owner; cannot edit others — negative), result-detail (reconstruction matches stored scores; notes edit; delete own), account-settings (name/phone update; password change mocked-safe), manage-accounts (advisor blocked at route — negative; manager approves pending user; promote/demote round-trip via role-sync), all tagged @p0 (+@mobile on wizard); load+a11y spec per page (injectAxe/checkA11y wcag2aa, zero critical/serious). Run per role via storageStates; iterate to green.

### P7 — Docs + completeness + close-out
Feature CONTEXT.md ×3 (≤1,600c); `docs/03-features/profiler/PROFILER_MODULE.md` (≤12,000c); DOCUMENTATION_INDEX rows; decisions.md entries (lazy-routing choice, anon-save preservation, role-sync v2, tie-break encoding); adversarial completeness critic; PRD close-out per prd-execute Stage 6.

## 🎯 Definition of Done — 9-gate module DoD
Gates 1-8b standard (tsc 0 · lint ≤15 warn · 5 primitive greps 0 · build · @p0 green · docs · decisions entry · drift 0 + structure)· Gate 9 arch greps + 9.8: RLS untouched this PRD — get_advisors no NEW findings; modules.path byte-match check; query-compliance (every select bounded); 9.5 URL-state on the two LIST pages. Golden-master suite green is an ADDITIONAL hard gate (scoring parity).

## ❓ Open Questions / Risks
**Resolved decisions**: wizard public + anonymous saves preserved (user; live behavior); managers read-all stays legacy-policy-based until cutover; role-sync v2 mirrors profiles.role (research risk mitigation); MBTI strengths recomputed not faked; CSV format frozen except escaping; results schema/RLS untouched.
1. **Anon spoofed user_id** (legacy WITH CHECK true lets anon insert rows with any user_id): new app never sends user_id unless authenticated; tightening the policy is cutover work — logged for the cutover PRD.
2. **Notes on NULL-owner legacy rows** un-editable by design until cutover backfill — UI explains this.
3. **Test-account creation touches the live auth pool** (3 plus-addressed users, approved + clearly named `+e2e-`) — acceptable under standing approval; cleaned at cutover.
4. **Question-set freeze**: QS order/option indexes are persisted in raw_answers — any future copy edit needs a versioning decision (logged in decisions.md as a constraint).
5. **Concurrent edits** old-app/new-app on the same row: last-write-wins (acceptable, single-team usage; updated_at trigger maintains audit).

## 🗒️ Execution Log

| Date | Phase | Result |
|---|---|---|
| 2026-06-11 | P3-P5 | Wave-2 workflow (5 authors + adversarial verify, 0 remaining blockers; minor-fix agent applied wildcard/testid/delete-detection/contrast fixes). Wizard faithful to port map with sessionStorage drafts + duplicate-save guard; results list (server-side ilike search, URL pagination) + detail (report reconstruction via scoring replay — honest MBTI strengths); Account Settings (RPC + self-update, auth.updateUser for email/password); Manage Accounts (direct users query, role-sync mutations, pending-approval tab). role-sync v2 (profiles.role mirror, super_admin→manager) deployed as version 3. content.ts split into content/* (LOC); wizard page slimmed via useWizardController. LOC baseline honestly re-set to 38 pre-existing template files (was bogus 0). Gates: tsc 0 · lint 0 err · build · drift 0 · vitest 40/40 · loc:check green. |
| 2026-06-11 | P0-P2 | Wave-1 workflow (4 authors + adversarial verify, 0 remaining blockers). P0: global-setup donor-free, teardown added, Login testids, role model advisor/manager/super_admin, 3 plus-addressed e2e accounts provisioned (confirmed+approved via MCP; manager mirrored in profiles.role; superadmin NOT mirrored per matrix). P1: 3 feature skeletons, registration migration applied (UNIQUE(path) added, 4 modules, grants incl. advisor deny on /manage-accounts), lazy routes (public /profiler with own Suspense), profilerResults queryKeys. P2: content.ts (8Q/53obs/104 statements, entity→unicode verified), scoring.ts exact port (explicit D>I>S>C + E/S/T/J ties, occNudge quirks preserved), export.ts (CSV quoted), print.css, golden-master vitest 28/28. Gates: tsc 0 · lint 0 err · build · drift 0 · vitest green. |
