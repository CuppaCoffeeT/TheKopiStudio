# CRM Module — Dashboard, Clients, Policies, Bank History, Reports

**Created**: 2026-06-12 14:00:00 SGT
**Last Updated**: 2026-06-12 16:30:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The legacy Insurance CRM rebuilt as the `src/features/crm/` AppBase module: client book CRUD (clients, policies incl. ILP/hospitalization/projections, interactions, bank history), the CRM dashboard, and the two printable reports (REPORTS_LINK_PRD). Finance math is golden-vector ported in `lib/finance.ts` + `lib/financeReport*.ts`. Data spine: 5 tables, Pattern D RLS (owner OR `view_all_clients` reads; owner-only writes), migration `20260611_164841`; module registrations `20260611_201717` (`/crm` + `/clients`) and `20260612_142107` (`/crm-reports`, TOOL, icon FileChartColumn), granted to all three roles.

| Route | Archetype | Code (`pages/`) | Access |
|---|---|---|---|
| `/crm` | DASHBOARD | `CrmDashboardPage.tsx` | advisor / manager / super_admin |
| `/clients` | LIST | `ClientsListPage.tsx` | same |
| `/clients/:id` | DETAIL (modulePath `/clients`) | `ClientDetailPage.tsx` | same |
| `/clients/:id/report` | sub-route (modulePath `/clients`) | `ClientReportPage.tsx` | owner; manager/super_admin read-all |
| `/crm-reports` | TOOL | `PortfolioReportPage.tsx` | advisor own book; manager/super_admin all |

One domain folder, three module rows (folders ≠ module rows). Dashboard: 4 KpiTiles (clients / active policies / annualised premium / upcoming follow-ups), empty-book CTA, quick actions to `/clients` + `/crm-reports`. List: server-side sanitized ilike search, URL pagination, follow-up badge column. Detail: 4-tab TabNav, per-tab add/edit/soft-delete via four FORM modals.

## 🐛 The four corrected legacy data-layer bugs

Each fix is pinned by mocked-supabase unit tests and the advisor E2E journey:

1. `updateClient` wrote `total_bank_balance`/review date from the form → client edits NEVER write the derived columns; the ADD form's balance only seeds the initial history row.
2. `add/updateBankBalance` copied the TOUCHED record's balance onto the client (wrong when backdated) → EVERY bank mutation ends in `recomputeClientBalance` (latest non-deleted row by `date DESC, created_at DESC, id DESC` → both derived columns; zero rows → `0`/`null`).
3. `deleteBankBalance` never recomputed; rows addressed by array index → delete recomputes via (2); rows BY ID.
4. Projections delete-then-reinsert with UNCHECKED errors → `replaceProjections`: hard-delete verified via `.select('id')`, de-duped by age keep-LAST (UNIQUE(policy_id, age)), every error THROWS.

On top: `user_id`/`created_by` stamped on insert, `updated_by` on update; **soft delete everywhere** — every read filters `is_deleted`, children of a soft-deleted client are orphan-hidden (`clients!inner`), policy deletion cascades to projections. Sole exception: `replaceProjections` hard-deletes (UNIQUE collision; `lib/decisions.md`).

## 🧮 Finance parity guarantee

`lib/finance.ts` is a semantically identical port of legacy `finance.js`, **golden-locked against 115 vectors captured by executing the legacy module** (replayed FLOAT-EXACT, no epsilon). Operation order is load-bearing (per-year MA grow → BHS clip → overflow to SA → SA grow) — do not refactor. The `lib/financeReport.ts` barrel (+ Bands/Economics/Portfolio/Sections splits, 200-LOC ratchet) holds every formula the legacy app wrote inline in report JSX (see Reports); imports strictly financeReport → finance.

**refYear injection** — the ONE deliberate change: every time-dependent function takes an explicit `refYear`/`refDate` instead of reading the clock. The app passes `currentRefYear()` (Singapore); golden tests pin 2026. Annual-constants refresh (BHS, RETIREMENT_SUMS) is a manual cutover process.

**Preserved legacy inconsistencies (do NOT "fix")**: `splitPremiums` counts ILP premiums FULL while `summariseClient` scales by inclusion percent; death-gap 10× income vs 5× adequacy check; raw (unrounded) `cpfLifeMonthlyPayout`; `ageFromDOB` plain year difference, null → 40; initial MA above BHS not clipped when `yearsTo55 === 0`. All in `lib/decisions.md`.

## 📄 Reports (REPORTS_LINK_PRD)

**Client report** (`/clients/:id/report`) renders the legacy ClientReportModal's 13 sections in order via `components/report/*`: [1] hero (`heroTotals`: policies, coverage, UN-scaled annualised investment, projected@65, years-to-65) · [2] health snapshot (4 benchmark cards; SPECIAL premiums card with 'Underinsured') · [3] client profile · [4] coverage analysis (Cost@65: death ×1.025^y **general**-inflation literal, CI/ECI ×1.06 — preserved) · [5] cash value · [6] hospitalization · [7] ILP · [8] CPF projection (per-ACCOUNT table to 55, BHS overflow alert, RA panel: exactly one alert + CPF LIFE payout) · [9] retirement projection + economics (invested-at-6%, opportunity cost, 2.5% purchasing power, 0.75× emergency fund, risk copy) · [10] policy portfolio · [11] coverage gaps · [12] interactions · [13] disclaimer. [5]–[8] conditionally absent per legacy conditions; loading/error/not-found precede the canvas.

**Portfolio report** (`/crm-reports`) ports Reports.jsx as a full page: stat cards, financial summary, per-client policy tables (RAW "X/frequency" lines, legacy parity), empty-book notice. Bounded selects (`portfolioService`, limit 5000, RLS-scoped, soft-delete filtered).

**Math-purity rule (DoD-enforced)**: report components do DISPLAY FORMATTING ONLY (`Math.round`/`toFixed`/`toLocaleString`); every client/policy number comes from `lib/financeReport*`, oracle-locked against expressions copied verbatim from legacy JSX (file:line cited). Sole inline arithmetic: legacy-cited year-count clamps (`yearsTo55 = max(0, 55 − age)`).

**Annualised divergence**: legacy portfolio `totalPremium` raw-summed per-frequency premiums yet labeled the row "annual"; `summarisePortfolio` reuses `summariseClient` annualisation so portfolio = dashboard tile = client report, with an "(annualised)" footnote on the page.

**WCAG band-tone divergence**: the legacy band trio #059669/#f59e0b/#dc2626 doubles as text color on the tinted cards and fails axe AA (amber ~2.1:1); darkened to #047857/#92400e/#b91c1c (emerald-700/amber-800/red-700 — 4.83/6.37/5.30:1). Band THRESHOLDS, logic and labels stay oracle-locked; the same palette governs the retirement-economics callouts.

**Print**: `lib/report-print.css` — `.report-canvas` light-locked on screen AND paper (dark-mode pairing deliberately waived; the preview IS the artifact), `.no-print` bars, breaks before [4]/[8]/[9]; PDF = `window.print()`.

## 🔗 Communication style card (prospect→client)

Client detail's Overview lists linked profiler results via the crm-owned `api/linkedResultsService` (`client_id` eq, newest-first, `.limit(10)`, `crmClients.detail(id)` sub-key — never a profiler import). Rows: DISC primary/secondary pills + MBTI + "View full playbook" link to `/profiler-results/:id`; DISC hexes are LOCAL duplicates of the profiler palette (cross-feature imports = drift error). Loading skeleton, ErrorState with retry; settled-empty renders ONE NEUTRAL state — "No visible profiling results" — deliberately not distinguishing "never converted" from "linked but RLS-hidden" (advisors own, managers all, super_admin own-only until cutover). `client_id` is `ON DELETE SET NULL` but CRM soft-delete never fires it — linked results keep pointing at soft-deleted clients.

## 🔔 Follow-up badge semantics

`lib/followUps.ts` ports ClientCard.jsx exactly, pure + clock-injectable ('YYYY-MM-DD' parses UTC-midnight vs the `refDate` instant; `Math.ceil` day counts). Tones: **overdue** red · **urgent** (≤7 days, incl. today) amber · **upcoming** blue — via `components/FollowUpBadge.tsx` + shared `followUpTone.ts`. Source chain differs by surface (decisions.md): **detail header** = full legacy chain (earliest future interaction follow-up, else `next_review_date`); **list column** = `next_review_date` ONLY (list fetch carries no interactions; N+1/unbounded join rejected) — the list can show a calmer tone than detail. **Dashboard count** keeps legacy parity: all strictly-future follow-ups, no window.

## 🔐 Permissions (as built)

Anonymous → `/login` on every CRM route. Advisors see and mutate ONLY their own book (RLS). Managers + super_admin read ALL books — dashboard, lists, detail and both reports — but have ZERO mutation affordances (ReadOnlyHint when `clients.user_id !== auth.user.id`); writes are owner-only by policy, there is no manager-edit path. RLS enforces it server-side regardless.

## 📝 Modal field parity + label divergences

All four FORM modals are controlled string-state forms (profiler pattern), re-seeded on every open, field-for-field parity to the legacy port map; option lists IDENTICAL. Kept behaviors: "Client since" blank → today on add; Hospitalization type one-way forces premium/coverage '0' + amber fieldset; `tpdSameAsDeath` one-shot copy; projections save `[]` while "Has cash value" is unchecked; incomplete projection rows dropped; coercions client ''→null / policy ''→0 / followUp ''→null. **Label-only divergences** (behavior identical; design-system restyle, currency "(S$)") — e.g. "CPF Medisave ($)"→"CPF MA (S$)", "IS Plan: CPF/Cash portion ($)"→"Integrated Shield — CPF/cash (S$)". Full label map: CRM_MODULE_PRD.md port map.

## 🧪 E2E summary (workflows crm + reports, @p0 @mobile)

Latest full-suite run (incl. profiler): **86 passed / 1 deliberate skip**. CRM specs: `clients-advisor` (full journey: create → bank recompute incl. backdated edits → policies → badge flips → KPI deltas → cleanup) · `clients-manager` (read-only foreign client; anon redirects) · `dashboard` · `load-a11y` (axe zero critical/serious). Reports specs (`tests/workflows/reports/`): `client-report` (seeded book renders LIB-EXACT numbers: hero projected@65, FRS %, gap rows; print stub) · `portfolio-convert` (annualised assert + per-client table + quick action; convert round-trip: save → convert → comm-style card + provenance → View client → cleanup) · `access-a11y` (manager read-all, anon redirects, axe on the three new surfaces incl. ConvertResultModal). Shared-DB hygiene: e2e accounts, per-run-unique 'E2E-' names, UI cleanup on every exit path, cross-worker book lock. Unit: vitest 424 across crm+profiler (golden vectors, oracle report/portfolio extensions, followUps/mapping corpora, mocked-chain service tests).

## ⚖️ Accepted deviations from legacy

1. **Annualised premiums** (dashboard tile AND portfolio report): legacy raw-summed `parseFloat(premium)` — a mislabel; both now use `summariseClient` annualisation. PRD-resolved.
2. **Edit-mode balance suppression**: the balance field appears on ADD only (seeds the history row); edits point to Bank history (legacy's editable field WAS the bug-1 path).
3. **retirementSumsFor fallback**: the port uses `refYear`'s row when published (2023–2027), else the literal legacy 2026 row — byte-identical at refYear 2026. Orchestrator-signed-off.
4. **List badge source**: `next_review_date` only on the list; full interaction chain on detail (see Follow-up badges).
5. **Report scope cut**: legacy-HTML-only extras dropped (Priority Action Items, Medisave AWL boxes, Universal Life, portfolio per-client interactions — reversible) + the WCAG band-tone darkening — see Reports; `lib/decisions.md`.

## 📚 Related Documentation

- [REPORTS_LINK_PRD.md](../../05-implementation/active/REPORTS_LINK_PRD.md) — reports + link plan, port map
- [CRM_MODULE_PRD.md](../../05-implementation/completed/CRM_MODULE_PRD.md) — module plan, port map, label map
- [CRM_DATA_SPINE.md](../../01-system-architecture/CRM_DATA_SPINE.md) — tables, RLS Pattern D, import runbook
- `src/features/crm/lib/decisions.md` · `src/features/crm/CONTEXT.md` · [profiler/PROFILER_MODULE.md](../profiler/PROFILER_MODULE.md)
