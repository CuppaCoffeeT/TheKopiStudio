# Profiler Module — Wizard, Results, Account Settings, Manage Accounts

**Created**: 2026-06-11 20:00:00 SGT
**Last Updated**: 2026-06-12 16:30:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The deployed Prospect Profiler (vanilla-JS hash SPA) rebuilt as AppBase feature modules. The legacy app keeps serving production from the same database until cutover, so everything here reads/writes `public.results` **byte-compatibly** — the ONE schema change since is REPORTS_LINK's additive nullable `results.client_id` (uuid → `public.clients`, `ON DELETE SET NULL`; the legacy app never writes it); RLS untouched. Four surfaces:

| Route | Archetype | Code | Access |
|---|---|---|---|
| `/profiler` | TOOL (public) | `profiler/pages/ProfilerWizardPage.tsx` | everyone incl. anonymous |
| `/profiler-results` (+`/:id`) | LIST + DETAIL | `profiler/pages/Results{List,Detail}Page.tsx` | advisor/manager/super_admin |
| `/account-settings` | SETTINGS | `account-settings/pages/AccountSettingsPage.tsx` | all signed-in roles |
| `/manage-accounts` | LIST | `manage-accounts/pages/ManageAccountsPage.tsx` | manager/super_admin (advisor deny row) |

`/profiler` sits OUTSIDE the DashboardLayout group (sibling of `/login`, no ProtectedRoute, own Suspense). Wizard + results share one domain folder `src/features/profiler/` (module rows ≠ folders). Registration migration: `20260611_174434` (adds `modules_path_key` UNIQUE, 4 module rows, role grants).

## 🧙 Wizard flow

Legacy `profiler.js go()` port: screen 0 intake (advisor/prospect names default "Advisor"/"Prospect", age range, meeting '1'–'4' default '1', occupation) → screens 1–2 question batches (Next gated until all 4 answered) → screens 3–7 five optional observation groups ("Generate Profile →") → result report. Progress reads "Step n of 7"; auto-save fires at generation.

PRD-sanctioned additions vs legacy: sessionStorage draft (`profiler-wizard-draft`, restores mid-flow on refresh; cleared on generate/exit) and a duplicate-save guard (input signature over intake + answers + TRUE-ticked ids, notes excluded — identical regenerate skips the insert).

### Scoring parity guarantee

`lib/scoring.ts` is an EXACT port of legacy `calcPf` + `occNudge` (profiler.js:117–142), **golden-master locked against all 8 live `public.results` rows** (`lib/__tests__/scoring.test.ts`, fixtures in `lib/__fixtures__/legacy-results.ts`): replaying each row's `raw_answers` + TRUE `nv_observations` + occupation reproduces stored `score_d/i/s/c`, `disc_primary/secondary`, `mbti`. Load-bearing quirks preserved: occNudge trailing-space tokens, `'care'` over-matching "career"/"childcare", unescaped dot in `self.employ`, stackable buckets; DISC ties D > I > S > C (encoded explicitly); MBTI ties `>=` favouring E/S/T/J. Weights: answer DISC +2 / MBTI pole +1, observation DISC +1. Question copy, option order, and observation ids are FROZEN — `oi` indexes and NvItem ids are persisted in saved rows (see `lib/decisions.md`, question-set freeze).

### Save payload contract (legacy byte-compat)

`hooks/savePayload.ts` builds the frozen legacy insert shape (unit-tested): `user_id` (uuid or NULL), `advisor_name`, `prospect_name`, `age_range`/`occupation`/`meeting` (text '1'–'4'; blank → NULL), `disc_primary/secondary`, `score_d/i/s/c`, `mbti`, `questions_answered`, `observations_count` (TRUE only), `raw_answers` (8 × `{d, mb:{k,v}, oi}`), `nv_observations` (object **including FALSE** ticked-then-unticked entries), `notes`.

Two save paths (`hooks/useSaveResult.ts`), dictated by the untouched legacy RLS:
- **Authenticated**: insert with `user_id` + `.select().single()` → success toast + list invalidation.
- **Anonymous**: `user_id` NULL, **fire-and-forget** `.insert()` with NO `.select()` (anon can insert but cannot SELECT back). Never sends a `user_id` unless authenticated.

Exports: PDF = `window.print()` + `lib/print.css` (A4/12mm, `.rph` header — fixes the legacy action-buttons-print bug). CSV = `lib/export.ts`, frozen legacy columns with RFC-4180 quoting (fixes comma corruption).

## 📜 Results list + detail (reconstruction)

List: ListPageFrame, server-side sanitized `.or()` ilike search (prospect/advisor/mbti/disc_primary) + `.range()` pagination, URL-synced page/search, NULL-owner rows badged "unclaimed"; RLS scopes rows.

Detail: `StoredResultReport` rebuilds the FULL report from the stored row by reusing the wizard's section components. `storedReportModel.ts` replays `calcProfile(raw_answers, TRUE nv ids, occupation)` for the DISC bars and **recomputed MBTI dimension strengths** — fixing the legacy app's fake "3" strength on saved results. Stored scalars (disc_primary/secondary/mbti) always win the headline; rows without replayable `raw_answers` degrade to scalar-only (stored score bars, MBTI card swapped for an info Alert). Notes edit + delete on OWN rows only (Modal / DestructiveConfirmDialog); foreign and NULL-owner rows show "Read-only — saved by another advisor or anonymously" (RLS silently matches 0 rows; the service promotes that to an explicit error). 7 of 8 legacy rows have `user_id` NULL — nobody can edit them until the cutover backfill.

## 🔁 Convert to client (REPORTS_LINK_PRD P4)

**Own rows only**: Convert joins the isOwn action group in `ResultDetailActions` (desktop hero + sticky mobile bar) — the legacy `results` UPDATE policy is `auth.uid() = user_id`, so managers/anonymous get no affordance and RLS blocks them regardless. Flow (`api/convertService.ts` — profiler-OWNED writes to `public.clients`, sanctioned own-feature api on shared tables; importing crm services would be a drift error): INSERT client (prospect_name→name, occupation, SG-today `created_date`, `user_id`/`created_by` stamped) → UPDATE `results.client_id` → navigate `/clients/:id`. **Provenance**: client notes start "Converted from profiler result <id8> · Age range … · DISC P/S · MBTI M", then the result's notes (converted clients have no DOB — age_range is a band; report age math defaults to 40 until DOB is filled).

**Non-atomic with keyed retry (v1, sanctioned)**: no transaction/RPC. A failed step 2 leaves an orphan client BY DESIGN — `ConvertLinkError` carries the created client id; `useConvertResult` keeps it in page-level hook state (survives modal close/reopen) and the next attempt calls `relinkResultToClient` with the kept id — no duplicate clients; an RLS 0-row no-op is promoted to an explicit error. The toast explains the orphan and that retry won't duplicate; `ConvertResultModal` stays open while converting (ESC/outside-click blocked). Success invalidates profilerResults + crmClients/crmDashboard via the SHARED queryKeys factory (not a cross-feature import). Converted rows (`client_id` set) swap Convert for **View client**; the crm-side Communication style card links back to the playbook — letters only, content stays profiler-owned (neutral empty state documented crm-side).

## 👤 Account surfaces

**Account Settings**: Profile tab (read-only email/role/member-since/legacy-username + editable name/phone via `users_update`); Security tab (email change with confirmation-link flow + password change, both via `supabase.auth.updateUser` — never bare `users.email` writes); sign-out card. Username displays from legacy `profiles` (never edited).

**Manage Accounts**: direct `users` select (NEVER `get_all_users()` — super_admin-gated, managers would silently get 0 rows), All/Pending tabs with alert badge, per-row role SelectMenu + Approve. ALL role/approval mutations POST to the **role-sync** edge function with the caller's JWT — direct `users.role` UPDATEs match 0 rows / raise 42501 by design (`protect_user_privileges` trigger). Role-sync errors (incl. the last-super-admin 400 guard) surface verbatim. Self row is read-only ("This is you").

### role-sync v2 mirror

Promotions via Manage Accounts must keep legacy manager visibility working: the legacy results read-all policy goes through `get_my_role()`, which reads **`profiles.role`**. role-sync v2 therefore mirrors role changes into `public.profiles.role` (`advisor`/`manager` as-is; `super_admin` → `'manager'` — the legacy CHECK only allows advisor|manager). The mirror is non-fatal (`profiles_mirror: "failed"` in the 200 body; `users` stays canonical). Contract: CRM_DATA_SPINE.md; rationale: `supabase/functions/decisions.md`.

## 🔐 Permissions matrix (as built)

| Action | anonymous | advisor | manager | super_admin |
|---|---|---|---|---|
| Run wizard + see result | ✅ | ✅ | ✅ | ✅ |
| Save result | ✅ NULL owner, fire-and-forget | ✅ user_id=self | ✅ | ✅ |
| `/profiler-results` list | ❌ redirect /login | ✅ own only | ✅ all rows incl. NULL-owner | ⚠️ **own only until cutover** — the legacy policy passes only literal `profiles.role='manager'`; super_admin sees all only when mirrored 'manager' (E2E-verified) |
| Detail / notes / delete | ❌ | ✅ own; others hidden by RLS | ✅ read all; edit/delete NONE but own | same as manager when mirrored, else own-only |
| Convert result → client | ❌ | ✅ own results only | ❌ no affordance (+ RLS) | ❌ same |
| `/account-settings` | ❌ | ✅ self | ✅ self | ✅ self |
| `/manage-accounts` | ❌ | ❌ no grant → redirect /dashboard | ✅ approve/promote/demote via role-sync | ✅ |
| Direct `users.role` UPDATE | ❌ | ❌ | ❌ | ❌ cross-row (role-sync only) |

## 🧪 E2E matrix (tests/workflows/profiler/, all @p0)

Profiler specs across chromium-desktop + mobile-safari (latest full-suite run incl. crm + reports: **86 passed / 1 deliberate skip**): `wizard-anonymous` (full flow, save intercepted, exports) · `results-advisor` (real save → list → stored report → notes → RLS-scoped search → delete) · `results-manager` (sees ≥8 legacy rows; NULL-owner and foreign rows read-only) · `results-superadmin` (own-only until cutover) · `account-settings` · `manage-accounts` (advisor redirect negative, self-row read-only, role round-trip via role-sync) · `load-a11y` (axe wcag2aa zero critical/serious). Convert E2E lives in `tests/workflows/reports/`: `portfolio-convert` (round-trip: save → convert → comm-style card + provenance → View client → cleanup) + `access-a11y` (ConvertResultModal axe). The skip is the role round-trip on mobile-safari — DB-mutating round-trips run on ONE project to avoid racing the shared e2e row. Unit: vitest (scoring golden-master + tie/quirk corpora, CSV format, save-payload parity).

## ⚖️ Accepted divergences from legacy

1. **Exit clears answers behind a confirm modal**: legacy Back-from-screen-1 silently kept answers; the port shows "Exit profiling?" and discards answers/observations (intake kept) — required by draft persistence; `lib/decisions.md`.
2. **Login CTA timing**: the logged-out "keep your results" CTA renders only after the anonymous save succeeded; on error it is withheld and `showError` surfaces (legacy rendered it unconditionally and swallowed errors).
3. **Hero separator fix**: legacy printed a stray "·" between occupation and age when occupation was blank; the port emits the separator only when both exist.
4. Also fixed (PRD "legacy bugs", not divergences): fake MBTI strengths on saved results (now recomputed), CSV comma corruption (quoted), action buttons printing, detail clobbering wizard state, silent save failures.

## 📚 Related Documentation

- [PROFILER_MODULE_PRD.md](../../05-implementation/completed/PROFILER_MODULE_PRD.md) — build plan + execution log
- [REPORTS_LINK_PRD.md](../../05-implementation/active/REPORTS_LINK_PRD.md) — convert-to-client bridge + reports
- [CRM_DATA_SPINE.md](../../01-system-architecture/CRM_DATA_SPINE.md) — role-sync contract, users hardening
- `src/features/profiler/lib/decisions.md` · `supabase/functions/decisions.md` — decision log
- Feature CONTEXT.md ×3 under `src/features/{profiler,account-settings,manage-accounts}/`
