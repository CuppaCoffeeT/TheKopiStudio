# CRM Module — Clients, Policies, Interactions, Bank History, Dashboard — PRD

**Created:** 2026-06-11 · **Last Updated:** 2026-06-11 · **Status:** 🟢 Complete · **Priority:** P0
**Work type**: module (one domain folder `src/features/crm/`; two module rows `/crm` + `/clients`)

🤖 Build via: `/prd-execute docs/05-implementation/active/CRM_MODULE_PRD.md`
✅ Completion gate: 9-gate module DoD + finance golden-vector parity green → PRD moves to completed/

## 📊 Progress / State

| Phase | Status | Notes |
|---|---|---|
| P1 — Scaffold + registration migration + routes + queryKeys | ✅ | Migration 20260611_201717 applied; grants verified |
| P2 — lib port: finance.ts (+ ref date), followUps.ts + golden-vector tests | ✅ | 115/115 vectors float-exact; 148 lib tests |
| P3 — api/ + hooks: corrected data layer | ✅ | All 4 legacy bugs fixed + unit-pinned; 185 tests green |
| P4 — UI: dashboard, clients list, client detail, 4 form modals | ✅ | 3 authors + adversarial verify, 0 blockers; minors fixed |
| P5 — @p0 E2E matrix + load/a11y | ✅ | 66 passed / 2 flaky-on-retry / 1 deliberate skip |
| P6 — Docs + completeness + close-out | ✅ | CRM_MODULE.md + CONTEXT final; adversarial pass clean |

Current phase: COMPLETE · Blockers: none (CRM data import remains separately blocked on the user key — module works with empty tables)

## 📋 Definition

**What**: Rebuild the Insurance CRM React app as the `crm` feature module: client book management (clients, policies incl. ILP/hospitalization detail, interactions with follow-up reminders, bank-balance history) plus the CRM dashboard. Reports (per-client financial report, portfolio report) are the NEXT PRD — but the finance math ports HERE with golden-vector parity so reports build on tested ground.

**Why**: Second half of the product merge. The data spine (5 tables, Pattern D RLS) is live and empty; the legacy book imports independently (Data Spine P4, user-blocked).

**Target users**: advisor (own book CRUD), manager/super_admin (read-everything via `view_all_clients`, write nothing of others').

**Success criteria**: full CRUD parity with the legacy React CRM (field-for-field per the port map) with the four KNOWN data-layer bugs fixed; finance.ts reproduces all 115 golden vectors; dashboard uses the correct annualised formula; 9-gate DoD + per-role @p0 green.

**Scope cut (NOT in v1)**: client/portfolio REPORT pages (next PRD); prospect→client conversion (next PRD); CSV/import UI (migration handles data); legacy localStorage importer (dropped — superseded by the migration script); Universal Life policy type (legacy-HTML-only; logged as cutover question).

## 🔎 Research findings (verified 2026-06-11 — prd-execute inherits, does NOT re-research)

### Live state
5 CRM tables live + EMPTY in `mymzcbalyqqgdmzsfmam` (migration 20260611_164841): AppBase columns (`created_by/updated_by/is_deleted/updated_at` + triggers), `user_id NOT NULL → public.users(id)`, UNIQUE(policy_id, age) on projections, Pattern D RLS ({table}_select owner OR `view_all_clients`; insert/update/delete owner-only). In-repo precedent: `src/features/profiler/` (services with sanitize+pagination, queryKeys, hooks, ListPageFrame/DetailPageFrame pages, E2E with role storageStates).

### UI port map (file-verified: `"/Users/tenshi/Documents/Projects/Insurance CRM/src"`)
- **Dashboard stats (CrmApp.jsx:135-150)**: total clients = count; active policies = status==='Active' count; **"annual premium" card is mislabeled legacy math** — raw `parseFloat(premium)` sum, NO frequency multiplier/ILP percent. The CORRECT formula exists in `finance.js summariseClient`: `annualisePremium` (Monthly×12, Quarterly×4, Semi-Annual×2, else ×1), ILP scaled by `ilpPremiumInclusionPercent/100`. **Port decision: dashboard uses the correct annualised totalAnnualPremium (documented divergence)**. Upcoming follow-ups = ALL future `interaction.followUp` (no window; strict > now) — keep parity, count via SQL date comparison.
- **ClientFormModal**: fields/defaults per port map (name/email/phone required; riskProfile [Conservative,Moderate,Aggressive] default Moderate; reviewFrequency [Quarterly,Semi-Annual,Annual] default Annual; "Client since" blank→today; financial: totalBankBalance, cpfOA/SA/MA). ADD auto-creates initial bank history when totalBankBalance>0 ({date: created_date, balance, notes:'Initial client onboarding'}).
- **PolicyFormModal**: types [Life Insurance, Critical Illness, Early Critical Illness, Disability Income, Whole Life, Term Life, Investment-Linked Policy, Hospitalization]; provider/policyNumber/startDate required; type→Hospitalization FORCES premium='0'+coverageAmount='0' (not restored on switch-away; hidden section state retained and persisted). Non-hosp: premium+frequency; coverage fieldset (death benefit required; tpdSameAsDeath one-shot copy, NOT reactive; CI+ciNotes; ECI+eciNotes); hasCashValue→currentCashValue + dynamic projection rows (age+value, filter incomplete rows on submit); isInvestmentLinked→currentAccountValue/investmentAllocation/illustrated 55+65/ilpPremiumInclusionPercent [0,30,50,100] default 0. Hosp (amber fieldset): hospitalType [Private, Public - Class A, Public - Class B1, Public - Class B2/C]; integratedShieldCPF/Cash; riderCash.
- **InteractionFormModal**: date required (default today), type [Meeting, Phone Call, Email, Follow-up, Policy Review], notes REQUIRED, followUp optional (''→null — schema `date` cast fails on '').
- **Follow-up badge (ClientCard.jsx:4-12,31-38)**: source = earliest FUTURE interaction followUp, else next_review_date; tones: overdue (date < today) red / due ≤7 days amber / upcoming blue. Replicate exactly in `lib/followUps.ts` (pure, ref-date injectable).
- **BankAccountFormModal**: date (default today), balance required, notes required.

### Data layer contract (useClients.js read fully vs new schema)
- **Field maps**: full camelCase↔snake_case tables in the research output; coercion rules differ by entity — client numerics `''→null`, policy numerics `''→0` (`?? 0`), interaction notes keep `''`, followUp `''→null`. `clientToRow` deliberately OMITS `last_review_date` (derived; only bank mutations write it) — preserve.
- **Bugs → REQUIRED corrected behavior** (each gets a unit test):
  1. updateClient wrote total_bank_balance directly → **new: client edit does NOT write total_bank_balance/last_review_date at all** (display derives from history; the field appears only on ADD where it seeds the initial history row).
  2. add/updateBankBalance set total = touched record → **new: after ANY bank-history mutation, recompute clients.total_bank_balance + last_review_date from the latest non-deleted history row (ORDER BY date DESC, created_at DESC, id DESC)**; zero rows → total 0, last_review_date null.
  3. deleteBankBalance never recomputed → covered by (2); rows addressed BY ID, never array index.
  4. Projections delete-then-reinsert with unchecked errors → **new: transactional-ish replace with error surfacing**: delete .select('id') then insert (UNIQUE(policy_id,age) de-dups defensively keeping last), every error thrown to the mutation; projections sorted by age on read.
- **New-schema duties**: inject `user_id` from session on every insert; stamp `created_by` on insert / `updated_by` on update; **soft delete** — destructive UI actions set `is_deleted=true`; EVERY read filters `.eq('is_deleted', false)`; bank recompute considers only non-deleted rows. (Child rows of a soft-deleted client are orphan-hidden by the client filter — children keep is_deleted=false; deleting a policy soft-deletes its projections too.)

### Finance math (finance.js read fully; **115 golden vectors generated by EXECUTING the legacy module** → `backups/finance-golden-vectors.json`, with per-vector function+args mapping)
- Exports: MEDICAL_INFLATION_RATE 0.06, AVERAGE_CRITICAL_ILLNESS_COST 150000, AVERAGE_EARLY_CI_COST 30000, BHS_2026 79000, RETIREMENT_SUMS 2023-2027 (ERS 3×→4× BRS at 2025), ageFromDOB (null→40; **TIME-DEPENDENT: new Date().getFullYear()**), annualisePremium, formatCoverage ($X.XM/$XK tiers), projectCPFTo55 (OA 2.5% closed-form; per-year MA×1.04→clip 79000→overflow to SA→SA×1.04 — **operation order matters for float-exact parity**; initial MA>BHS not clipped when yearsTo55=0), retirementSumsFor (cohort=birth+55; >2027 extrapolated 2.5%/yr Math.round; null/old → 2026-row fallback assuming "now"=2026), summariseClient (ILP-scaled totalAnnualPremium; ratios 0 when income≤0).
- **PORT RULE**: `lib/finance.ts` is a semantically-identical port with ONE deliberate change: every time-dependent function takes an injectable reference date/year (`refYear`) with the app passing a single `clockUtil` value; golden tests pin refYear=2026 to replay vectors float-exact (preserve operation order; no closed-form refactors).
- Legacy inconsistencies to PRESERVE (vector parity; reports PRD consumes them): adequacy 5× vs gap-math 10× death multiple; HealthSnapshot premium split ignores ilpPremiumInclusionPercent while summariseClient applies it. Caller-inline math (bank@0.5% to 65, future CI cost ×1.06^years, gap multiples 10/5/1.5) is ALSO vectored — port those as named fns in finance.ts now so the reports PRD reuses them.

## 🧩 Module Spec
- **Folder**: `src/features/crm/` (single domain: api/ components/ hooks/ pages/ lib/ types.ts index.ts CONTEXT.md).
- **Module rows + routes**: `/crm` (DASHBOARD archetype — AppHeaderShell + KpiTile grid, icon LayoutGrid? use Lucide 'Briefcase', category 'general', sort 30) and `/clients` (LIST, icon 'Contact', sort 40); routes `/crm`, `/clients`, `/clients/:id` (modulePath '/clients') inside DashboardLayout + ProtectedRoute; grants advisor/manager/super_admin (registration migration mirrors 20260611_174434 pattern; UNIQUE(path) already exists).
- **Pages**: CrmDashboardPage (4 KpiTiles + quick links); ClientsListPage (ListPageFrame: name/email/phone/risk/next-review/follow-up badge columns, server-side ilike search name/email, URL pagination, primaryAction Add Client); ClientDetailPage (DetailPageFrame, tabs: Overview(profile+financials), Policies, Interactions, Bank history; per-tab lists with add/edit/delete; follow-up badge in header meta).
- **Modals (FORM archetype)**: ClientFormModal, PolicyFormModal (conditional sections per port map), InteractionFormModal, BankBalanceModal — controlled forms mirroring profiler's in-repo pattern; react-hook-form+zod only if profiler used it (it did not — controlled state; mirror the sibling).
- **Read-only enforcement**: manager/super_admin viewing another advisor's client: ALL mutation affordances hidden (+ ReadOnlyHint like profiler detail); RLS enforces server-side.
- **queryKeys**: `crmClients` (all/lists/list/details/detail), `crmDashboard` (stats). Child data fetched per client detail (policies/interactions/bank by client_id, bounded, is_deleted filtered) — keys nested under detail(id) sub-keys.

## 🔐 Permissions Matrix (drives per-role @p0 negatives)
| Action | advisor (own) | advisor (other's) | manager | super_admin | anonymous |
|---|---|---|---|---|---|
| /crm + /clients access | ✅ | — | ✅ | ✅ | ❌ → /login |
| See client rows | ✅ own | ❌ (RLS) | ✅ all | ✅ all | ❌ |
| Create/edit/delete clients+children | ✅ | ❌ | ❌ others' (UI hidden + RLS) | ❌ others' | ❌ |
| Dashboard stats scope | own book | — | all books | all books | ❌ |

## 🚦 Phases
**P1 Scaffold+registration** (serialize migration): feature skeleton, migration `_register_crm_modules.sql` (2 rows + grants), routes, queryKeys. Verify: tiles per role via get_user_modules; gates.
**P2 lib port** (parallel-safe with P1): `lib/finance.ts` (+refYear injection; includes the caller-inline fns), `lib/followUps.ts`, `lib/mapping.ts` (row↔model per contract incl. per-entity coercion rules), fixtures from `backups/finance-golden-vectors.json` → vitest replay (float-exact, refYear=2026) + followUps corpus + mapping round-trip tests. Verify: vitest green.
**P3 api/+hooks** (after P1+P2): clientsService/policiesService/interactionsService/bankService with corrected behaviors (bugs 1-4), soft-delete+filters, user_id/created_by/updated_by stamping, bounded queries, sanitize; hooks with queryKeys+invalidation (detail mutations invalidate detail(id)+lists). Unit-test the recompute + replace semantics against a mocked client (or integration-style via test project? NO — unit with mocked supabase chain like profiler's savePayload tests). Verify: gates+vitest.
**P4 UI** (after P3; 3 parallel authors: dashboard+list / detail+tabs / 4 modals): per Module Spec + port map. Verify: gates, adversarial parity lens per author.
**P5 E2E** (after P4): `tests/workflows/crm/`: clients-advisor (create client w/ initial balance → detail → add policy w/ projections+ILP → add interaction w/ follow-up → badge asserts → bank update → recompute assert via UI → edit client (total NOT editable) → delete child rows → soft-delete client → list empty; full cleanup by deletion), clients-manager (sees advisor-created fixture? create via advisor in setup then read-only asserts + negative edits; cleanup), dashboard (stats math vs created fixtures incl. Monthly-premium annualisation ×12 and ILP percent), anonymous redirect, load+a11y all pages. Same live-DB hygiene as profiler (e2e accounts only; everything cleaned).
**P6 Docs+close-out**: CONTEXT.md, docs/03-features/crm/CRM_MODULE.md, index, decisions entries (annualised-dashboard divergence, soft-delete semantics, refYear injection, preserved legacy inconsistencies), adversarial completeness pass, PRD → completed/.

## 🎯 Definition of Done
9-gate module DoD (as profiler: tsc 0 · lint ≤15 · primitive greps 0 · build · @p0 green · docs · decisions · drift 0 + structure · arch greps + 9.8 no NEW advisor findings) + **finance golden-vector suite green (115 vectors float-exact)** + corrected-behavior unit tests (bank recompute, projection replace, soft-delete filters).

## ❓ Open Questions / Risks
**Resolved**: dashboard uses correct annualised premium (legacy mislabel fixed; logged); follow-up count stays all-future (parity); soft-delete everywhere; Universal Life type dropped (legacy-HTML-only; cutover question); manager read-only (user decision).
1. Hospitalization cash portions in affordability/premium totals — legacy excludes from premium sums (forced premium=0); KEEP for v1; reports PRD revisits.
2. Empty-book UX: dashboard/list ship before the data import lands — NoResultsState with "Add your first client" (+ note the import will populate).
3. Float-exact parity may break if TS number formatting differs — tests use exact equality first, fall back to relative epsilon 1e-12 ONLY with a logged justification.
4. `ageFromDOB` vectors assume year 2026 — tests pin refYear; the app passes real clock (documented annual-constants update process deferred to cutover doc).

## 🗒️ Execution Log
| Date | Phase | Result |
|---|---|---|
| 2026-06-12 | P4-P6 | P4: dashboard (annualised KPIs), list (badges, server search), detail (4 tabs, read-only mode), 4 field-parity modals — 0 blockers after fix rounds. P5: E2E 66 passed incl. the drift-bug regression assert (older bank edit leaves derived total at latest-by-date); 2 cross-spec flakes pass on retry under full parallelism (noted); a11y one-test-per-surface scope: Interactions/Bank tabs + 3 modals unscanned (accepted at sign-off). P6: docs final, adversarial pass clean, decisions ledger reconciled. Gate scorecard: tsc 0 · lint 0 · build · drift 0 · loc 38≤38 · vitest 185/185 (115 vectors) · @p0 green. PRD → completed/. |
| 2026-06-11/12 | P1-P3 | Wave-1 workflow + post-limit re-verification (adversarial, 0 blockers). P1: crm skeleton, migration 20260611_201717 applied (2 modules, grants), routes, queryKeys. P2: finance.ts + financeReport.ts (LOC split, one-way import) with refYear injection — ALL 115 golden vectors replay float-exact (strict equality); followUps + mapping ported with legacy coercion asymmetries. ORCHESTRATOR SIGN-OFF on documented deviation: retirementSumsFor fallback uses refYear's row when in-table (legacy hardcoded 2026) — byte-identical at refYear 2026, strictly better 2027+; logged in lib/decisions.md. P3: corrected data layer (updateClient strips derived cols; every bank mutation recomputes latest-by-(date,created_at,id); by-id addressing; projections replace de-dup keep-last with error surfacing; soft-delete filters everywhere; user/audit stamping incl. recompute updated_by after fix round). Gates: tsc 0 · lint 0 err · build · drift 0 · loc 38≤38 · vitest 185/185. |
