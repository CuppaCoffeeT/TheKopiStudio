# Reports + Prospect→Client Link — PRD

**Created:** 2026-06-12 · **Last Updated:** 2026-06-12 · **Status:** 🔵 Planning · **Priority:** P0 (final build phase before cutover)
**Work type**: feature (extends `src/features/crm/` + `src/features/profiler/`; one new module row `/crm-reports`)

🤖 Build via: `/prd-execute docs/05-implementation/active/REPORTS_LINK_PRD.md`
✅ Completion gate: gates below green → completed/

## 📊 Progress / State

| Phase | Status | Notes |
|---|---|---|
| P1 — client_id migration + financeReport extension + oracle tests | ⬜ | |
| P2 — Client financial report page (/clients/:id/report) | ⬜ | |
| P3 — Portfolio report (/crm-reports) + dashboard quick action | ⬜ | |
| P4 — Convert-to-client + DISC card | ⬜ | |
| P5 — E2E + a11y | ⬜ | |
| P6 — Docs + close-out | ⬜ | |

Current phase: 0 · Blockers: none

## 📋 Definition
**What**: The two printable reports (per-client financial report; portfolio report), and the prospect→client bridge (nullable `results.client_id`, own-rows-only Convert action, DISC communication card on client detail).
**Why**: Completes feature parity with the legacy CRM and makes the profiler→CRM funnel first-class.
**Success criteria**: report sections render the SAME numbers as legacy for identical inputs (lib fns vector/oracle-locked; no untested inline math); convert round-trip works under RLS; gates + per-role @p0 green.
**Scope cut**: legacy-HTML-only extras DROPPED (Priority Action Items, Medisave AWL boxes, Universal Life, portfolio per-client interactions — default per merge-plan open question, reversible); PDF stays window.print().

## 🔎 Research findings (verified 2026-06-12)

### Migration (additive-safe, live-verified)
`ALTER TABLE public.results ADD COLUMN client_id uuid NULL REFERENCES public.clients(id) ON DELETE SET NULL;` + `CREATE INDEX idx_results_client_id ON public.results(client_id);` Legacy app inserts name 18 explicit columns (never client_id); new app payload is typed-explicit → zero impact. After apply: regen types.ts; update profiler/types.ts header comment ("no schema changes" now stale). Note: CRM soft-delete means SET NULL never fires for soft-deleted clients — linked results keep client_id; the card direction (client→results) is unaffected; document.

### Report port map (legacy files read fully; ported lib = `crm/lib/finance.ts` + `financeReport.ts`, 115 vectors incl. 20 raAssessment + 15 gapAnalysis)
**ClientReportModal.jsx (571L) section order**: [1] hero (5 stats: policy count, formatCoverage(totalCoverage), totalAnnualInvestment (UN-scaled annualised — distinct from totalAnnualPremium), projected@65 = ΣilustratedValueAge65 + projectBankTo65, yearsToRetirement = max(0, 65−ageFromDOB)); [2] HealthSnapshot 4 benchmark cards — bands Good/Review/Action: premiums (<10%, SPECIAL: Good iff isAdequatelyCovered && ≤10, 'Underinsured' red if !isAdequatelyCovered, else 'Review cost'), invested premiums (20-30%, bands 20/14), coverage multiple (5-10x, bands 5/3.5), CPF FRS track (bands 100/70 via assessRetirementReadiness.cpfAchievementPct); **isAdequatelyCovered = coverageRatio≥5 && ciRatio≥5 && eciRatio≥1.5 — INLINE in legacy, must move to financeReport.ts**; premium split = splitPremiums (type-substring investment/ilp/endowment; IGNORES inclusionPercent — preserved inconsistency); [3] client profile facts; [4] coverage analysis table — Cost@65 col: death = income×10×1.025^y (**literal 1.025 GENERAL inflation — do NOT 'fix' to 6%**), CI = 150000×1.06^y + (income×5 − 150000), ECI same with 30000/×1.5 (**literals preserved; promote to lib + oracle tests**); [5] cash value table (per policy, projections list); [6] hospitalization cards (IS CPF+cash=total, rider, bold total); [7] ILP cards (+55/65 value cards when >0); [8] **CPF projection — PER-ACCOUNT table (4 rows to age 55), NOT year-by-year**: overflow Alert (BHS $79,000 + saBoost), 3 gradient cards, account table (OA 2.5%/SA 4%/MA 4% + purposes), RA assessment panel (cohort official-vs-projected line, BRS/FRS/ERS, projectedRA green/red, exactly one Alert success/warning/danger, CPF LIFE box Math.round(projectedRA/frs×1780)); [9] retirement projection @65: 3 gradient cards, bank history table, **economic block ALL INLINE in legacy — promote: invested-at-6% scenario, opportunity cost, 2.5% purchasing-power loss, emergency fund 0.75×income, excess-investable conditional, riskProfile.toLowerCase() copy** ; [10] policy portfolio grouped by type; [11] coverage gap alerts (gapAnalysis vectors); [12] interaction history table; [13] disclaimer. Print: legacy hides via Bootstrap modal DOM — **re-engineer as full PAGES with profiler-style print.css** (.rph-equivalent header, page-break-before on sections [4][8][9]).
**Portfolio (Reports.jsx + CrmApp builder)**: stat cards (clients/policies/active/coverage), financial summary table, per-client policy tables, printable. **Legacy totalPremium = RAW per-frequency sum labeled 'annual' — align with P3 decision: use annualised (documented divergence)**.
**postCoverageCIOOP/ECIOOP = max(0, futureCost − coverage)** — not in lib; add with tests.

### Link wiring (live-verified)
- Convert gated to **own rows only** (results UPDATE policy = auth.uid()=user_id; anon/foreign rows un-updatable). Action joins the isOwn group in ResultDetailActions (desktop + mobile bar). Flow: profiler-owned `api/convertService.ts` (no cross-feature imports — dependency-cruiser error rule; sanctioned per merge plan: own api hitting shared tables): INSERT clients (prospect_name→name; occupation→occupation; notes = provenance block "Converted from profiler result <id8> · Age range: X · DISC P/S · MBTI M" + result notes; user_id/created_by stamped; created_date today) → UPDATE results.client_id → navigate(`/clients/<id>`). **Non-atomic accepted for v1**: failed step 2 → toast explains orphan client + retry affordance (button stays, idempotent-ish: if a client was created, re-link rather than duplicate — keep the created id in component state). Already-converted results show 'View client' (navigate) instead of Convert.
- DISC card: crm-owned sub-query in useClientDetail (`from('results').select(...).eq('client_id', id).eq from RLS`, bounded .limit(10), order created_at desc) → "Communication style" card in OverviewTab (DISC pri/sec chips w/ profile colors, MBTI, quick-read line from profiler content? NO — cross-feature import banned; the card shows DISC/MBTI letters + link to /profiler-results/:id for the playbook). **Neutral empty state for linked-but-RLS-hidden** (advisor's client ↔ anon-owned result; super_admin sees clients but legacy results policy is manager-only — neutral copy 'No visible profiling results').
- `/crm-reports` module row (TOOL, icon 'FileChartColumn' — verify Lucide name exists, fallback 'FileText', category general, sort 50, grants advisor/manager/super_admin); `/clients/:id/report` shares '/clients' modulePath (sub-route precedent).

## 🔐 Permissions Matrix
| Action | advisor | manager | super_admin | anonymous |
|---|---|---|---|---|
| /clients/:id/report (own / other's) | ✅ / ❌(RLS hides client) | ✅ read-all | ✅ read-all | ❌ |
| /crm-reports | ✅ own book scope | ✅ all books | ✅ all books | ❌ |
| Convert result → client | ✅ own results only | ❌ (no affordance on foreign/anon) | ❌ same | ❌ |
| DISC card linked-result visibility | own results | all (legacy policy) | own only until cutover (neutral empty state) | — |

## 🚦 Phases
**P1** (serialize migration): client_id migration applied via MCP + types regen + comment fix; financeReport.ts additions: isAdequatelyCovered, healthBands (thresholds as named constants), coverageCostAt65{Death,CI,ECI} (exact legacy literals), postCoverageOOP, retirement economics (investedAt6Scenario, opportunityCost, purchasingPower2_5, emergencyFundTarget 0.75×, excessInvestable), heroTotals; tests use ORACLE EXPRESSIONS copied verbatim from legacy JSX as the expected-value source (file:line cited per test) + edge cases (income 0, dob null→40, yearsTo65 0).
**P2** (after P1; 2 parallel authors: sections 1-7 / sections 8-13): `/clients/:id/report` page + components/report/* (≤200 LOC each), print.css (A4, breaks before [4][8][9], hide chrome), Print/Back actions, read-all per RLS, loading/error/empty (no policies → sections conditionally absent per legacy conditions).
**P3** (parallel-safe with P2): `/crm-reports` module migration row + PortfolioReportPage (annualised totals divergence documented) + dashboard quick-action card linking to it.
**P4** (after P1): convertService + Convert/View-client action + retry semantics; DISC card (crm query + OverviewTab card + neutral states).
**P5**: E2E — report renders for a seeded client (advisor creates book incl. CPF + ILP + hosp + projections; assert KEY NUMBERS: hero projected@65, FRS %, gap rows vs lib-computed expectations), portfolio renders + annualised assert, convert round-trip (convert → client page opens → DISC card shows → 'View client' replaces Convert → cleanup deletes client AND unlinks/deletes result), manager read-all on report, anonymous redirects, axe on 3 new surfaces.
**P6**: docs (CRM_MODULE.md report section + PROFILER_MODULE.md convert section updates, index), decisions entries (dropped legacy extras, annualised portfolio divergence, non-atomic convert, neutral-empty-state rationale), completeness pass, close-out.

## 🎯 Definition of Done
tsc 0 · lint 0 err · build · drift 0 (no cross-feature imports — the convert flow is the hot spot) · loc 38≤38 · vitest green (existing 185 + new oracle tests) · @p0 green · a11y new surfaces · no NEW advisor findings · all inline legacy math promoted to lib with tests (grep the report components for arithmetic on client/policy fields — only formatting allowed inline).

## ❓ Open Questions / Risks
**Resolved**: legacy extras dropped; portfolio annualised; convert own-only + non-atomic-with-retry; DISC card letters-only (no cross-feature content import); literals 1.025/1.06 preserved.
1. Risk: spoof-link (anon insert can set client_id to any client) — render provenance defensively; policy tightening is cutover work (logged).
2. Risk: print fidelity differs from legacy modal-print — acceptance is "sections in order, numbers identical, sensible page breaks", not pixel parity.
3. Risk: converted clients lack date_of_birth (age_range is a band) → report age math uses ageFromDOB null→40 default until the advisor fills DOB; the report shows 'Not specified' per legacy.

## 🗒️ Execution Log
| Date | Phase | Result |
|---|---|---|
| | | |
