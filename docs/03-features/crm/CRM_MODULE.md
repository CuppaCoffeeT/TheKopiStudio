# CRM Module — Dashboard, Clients, Policies, Interactions, Bank History

**Created**: 2026-06-12 14:00:00 SGT
**Last Updated**: 2026-06-12 14:00:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The legacy Insurance CRM React app rebuilt as the `src/features/crm/` AppBase module: client book CRUD (clients, policies incl. ILP/hospitalization detail and cash-value projections, interactions with follow-up reminders, bank-balance history) plus the CRM dashboard. The finance math ported here with golden-vector parity; the report PAGES are the next PRD and consume `lib/finance.ts` + `lib/financeReport.ts`. Data spine: 5 tables, Pattern D RLS (owner OR `view_all_clients` reads; owner-only writes), migration `20260611_164841`; module registration `20260611_201717` (2 rows, advisor/manager/super_admin grants).

| Route | Archetype | Code | Access |
|---|---|---|---|
| `/crm` | DASHBOARD | `pages/CrmDashboardPage.tsx` | advisor / manager / super_admin |
| `/clients` | LIST | `pages/ClientsListPage.tsx` | advisor / manager / super_admin |
| `/clients/:id` | DETAIL (modulePath `/clients`) | `pages/ClientDetailPage.tsx` | advisor / manager / super_admin |

One domain folder, two module rows (folders ≠ module rows — profiler precedent). Dashboard: 4 KpiTiles (total clients / active policies / annualised premium / upcoming follow-ups) + empty-book CTA. List: server-side sanitized ilike search (name/email), URL pagination, follow-up badge column. Detail: TabNav (Overview · Policies · Interactions · Bank history) with per-tab add/edit/soft-delete via four FORM modals.

## 🐛 The four corrected legacy data-layer bugs

Each fix is pinned by mocked-supabase unit tests (`api/__tests__/`) and exercised end-to-end by `tests/workflows/crm/clients-advisor.spec.ts`.

| # | Legacy behavior | As built |
|---|---|---|
| 1 | `updateClient` wrote `total_bank_balance` (and review date) straight from the form — silently drifting from history | Client edits NEVER write `total_bank_balance`/`last_review_date` (`buildClientUpdate` strips them defensively; `clientToRow` never maps them). The ADD form's balance only seeds the initial history row (`notes: 'Initial client onboarding'`), then the recompute writes the derived columns |
| 2 | `add/updateBankBalance` copied the TOUCHED record's balance onto the client — wrong for backdated entries | EVERY bank mutation ends in `recomputeClientBalance`: latest non-deleted row by `date DESC, created_at DESC, id DESC` → writes both derived columns; zero rows → `0`/`null` |
| 3 | `deleteBankBalance` never recomputed (stale client total); rows addressed by array index | Delete recomputes via (2); all rows addressed BY ID |
| 4 | Projections delete-then-reinsert with UNCHECKED errors (silent data loss) | `replaceProjections`: hard-delete verified via `.select('id')`, incoming rows de-duped by age keep-LAST (UNIQUE(policy_id, age)), inserted sorted; every error THROWS into the mutation |

New-schema duties on top: `user_id` + `created_by` stamped on insert, `updated_by` on update (incl. the recompute's derived write); **soft delete everywhere** — destructive actions set `is_deleted = true`, every read filters it, children of a soft-deleted client are orphan-hidden (dashboard child selects use `clients!inner` + `.eq('clients.is_deleted', false)`), policy deletion cascades to its projections. Sole exception: `replaceProjections` hard-deletes (soft-deleted leftovers would collide with the UNIQUE constraint) — `lib/decisions.md`.

## 🧮 Finance parity guarantee

`lib/finance.ts` is a semantically identical port of legacy `finance.js`, **golden-locked against 115 vectors captured by executing the legacy module** (`lib/__fixtures__/finance-golden-vectors.json`, replayed FLOAT-EXACT — strict equality, no epsilon — in `lib/__tests__/finance.test.ts`). Operation order is load-bearing (per-year MA grow → BHS clip → overflow to SA → SA grow) and must not be refactored. `lib/financeReport.ts` holds the formulas the legacy app wrote inline in report components (bank @0.5% to 65, future CI/ECI ×1.06^years, 10×/5×/1.5× gap multiples, RA assessment, premium split), promoted to named functions for the reports PRD; import direction strictly financeReport → finance (split for the 200-LOC ratchet).

**refYear injection** — the ONE deliberate change: every time-dependent function takes an explicit `refYear`/`refDate` instead of reading the clock (`ageFromDOB`, `retirementSumsFor`, `assessRetirementReadiness`, `followUpBadge`…). The app passes `currentRefYear()`/Singapore now; the golden tests pin 2026 (the capture year). Annual-constants refresh (BHS, RETIREMENT_SUMS) stays a manual cutover-doc process.

**Preserved legacy inconsistencies (do NOT "fix")**: `splitPremiums` counts ILP premiums FULL while `summariseClient` scales them by inclusion percent; death-gap math 10× income vs 5× adequacy check; raw (unrounded) `cpfLifeMonthlyPayout`; `ageFromDOB` plain year difference, null → 40; initial MA above BHS not clipped when `yearsTo55 === 0`. All documented in `lib/decisions.md` (P2 entries).

## 🔔 Follow-up badge semantics

`lib/followUps.ts` ports ClientCard.jsx exactly, pure + clock-injectable: 'YYYY-MM-DD' parses at UTC midnight and compares against the full `refDate` instant; day counts use `Math.ceil(diff/86,400,000)`. Tones: **overdue** (date < today) red · **urgent** (≤7 days, incl. "today" = 0 days) amber · **upcoming** blue — rendered by `components/FollowUpBadge.tsx` over the Badge primitive (`data-tone` asserted in E2E); the tone map is shared with the InteractionsTab chip via `components/followUpTone.ts`.

Source-date chain differs by surface (decisions.md, P4): the **detail header** uses the full legacy chain — earliest FUTURE interaction follow-up, else `next_review_date` (`resolveClientFollowUp`); the **list column** badges `next_review_date` ONLY (the list fetch carries no interactions; an N+1 or unbounded join was rejected), so a client can show a calmer tone on the list than on their detail header. The **dashboard count** keeps legacy parity: ALL strictly-future follow-ups, no window.

## 🔐 Permissions matrix (as built)

| Action | anonymous | advisor (own) | advisor (other's) | manager | super_admin |
|---|---|---|---|---|---|
| `/crm` + `/clients` access | ❌ → /login | ✅ | — | ✅ | ✅ |
| See client rows | ❌ | ✅ own | ❌ (RLS) | ✅ all books | ✅ all books |
| Create/edit/delete clients + children | ❌ | ✅ | ❌ | ❌ — UI hides every mutation affordance (ReadOnlyHint) + RLS owner-only writes | same as manager |
| Dashboard stats scope | ❌ | own book | — | all books | all books |

Read-only mode is computed from `clients.user_id !== auth.user.id` (client reads return raw rows so `user_id` survives mapping); RLS enforces server-side regardless. There is no manager-edit path at all — writes are owner-only by policy.

## 📝 Modal field parity + label divergences

All four FORM modals are controlled string-state forms (profiler pattern; no react-hook-form), re-seeded on every open, with field-for-field parity to the legacy port map: option lists are IDENTICAL (risk profiles, review frequencies, 8 policy types, 4 statuses, frequencies, hospital types, ILP 0/30/50/100, interaction types). Parity behaviors kept: "Client since" blank → today on add; Hospitalization type one-way forces premium/coverage '0' (not restored on switch-away) + amber fieldset; `tpdSameAsDeath` one-shot copy (not reactive; uncheck keeps the value); hidden-section scalar state retained and persisted, but projections save `[]` while "Has cash value" is unchecked; incomplete projection rows dropped on save; interaction followUp '' → null; coercions client ''→null / policy ''→0.

**Label-only divergences** (fields/behavior identical; restyled to the design system — currency "(S$)"):

| Legacy | As built |
|---|---|
| "Next review date" | "Next review" |
| "CPF Medisave ($)" | "CPF MA (S$)" |
| "Follow-up date" | "Follow-up reminder" |
| "Current total bank balance ($)" (bank record) | "Balance (S$)" |
| "Same as death benefit (most common in Singapore)" | "Same as death benefit" |
| "Critical illness coverage ($)" / "Early CI coverage ($)" | "Critical illness (S$)" / "Early critical illness (S$)" (notes get labels "CI notes"/"ECI notes" instead of the "Special features" placeholder) |
| "This policy has cash value (e.g., Whole Life)" | "Has cash value" |
| "Projected cash value at future ages" | "Projected values by age" |
| "IS Plan: CPF/Cash portion ($)" | "Integrated Shield — CPF/cash (S$)" |
| "Rider premium, full cash ($)" | "Rider — cash (S$)" |
| "Include premium in affordability (%)" | "Premium inclusion for protection" |

## 🧪 E2E summary (tests/workflows/crm/, all @p0 @mobile)

13 tests × chromium-desktop + mobile-safari; full-suite run (incl. profiler): **66 passed / 2 flaky-passed-on-retry / 1 deliberate skip** (the skip is profiler's documented mobile role round-trip). Specs: `clients-advisor` (one step-structured journey: create with seed balance → derived-total recompute asserts incl. the backdated-edit case → policies with projections/ILP/hospitalization → follow-up badge flips blue→amber → dashboard KPI deltas incl. ×12 annualisation → rename → full UI soft-delete cleanup) · `clients-manager` (manager + super_admin fully read-only on a foreign client across every tab; anonymous /clients + /crm redirect) · `dashboard` (empty-book zero KPIs + CTA; manager all-books tiles settle; home module grid) · `load-a11y` (every surface + open ClientFormModal, axe WCAG 2.0 A/AA zero critical/serious). Live shared DB hygiene: e2e accounts only, per-run-unique 'E2E-' names, UI cleanup on every exit path, cross-worker advisor-book lock serialises KPI math. Unit: vitest 185/185 (115 golden vectors + followUps/mapping corpora + mocked-chain service tests).

## ⚖️ Accepted deviations from legacy

1. **Annualised dashboard premium**: the legacy "annual premium" card raw-summed `parseFloat(premium)` (no frequency multiplier, no ILP percent — a mislabel). The tile now uses `summariseClient.totalAnnualPremium` (Monthly ×12 etc., ILP scaled by inclusion percent), matching the report math. PRD-resolved; `lib/decisions.md`.
2. **Edit-mode balance suppression**: legacy rendered an editable "Total bank balance" in client EDIT (the bug-1 write path). The edit form replaces it with "Balance is managed in Bank history"; the field appears on ADD only (seeds the initial history row).
3. **retirementSumsFor fallback improvement**: legacy hardcoded the 2026 row for null/pre-2023 cohorts. The port uses `refYear`'s row when it is a published RETIREMENT_SUMS year (2023–2027), else the literal 2026 row — byte-identical at refYear 2026 (all vectors replay), strictly better 2027+. Orchestrator-signed-off; `lib/decisions.md`.
4. **List badge source** (consequence of the bounded list fetch): `next_review_date` only on the list; full interaction chain on detail (see Follow-up badge semantics).

## 📚 Related Documentation

- [CRM_MODULE_PRD.md](../../05-implementation/active/CRM_MODULE_PRD.md) — build plan, port map, execution log
- [CRM_DATA_SPINE.md](../../01-system-architecture/CRM_DATA_SPINE.md) — 5 tables, RLS Pattern D, import runbook
- `src/features/crm/lib/decisions.md` — decision log · `src/features/crm/CONTEXT.md` — feature memory
- Sibling precedent: [profiler/PROFILER_MODULE.md](../profiler/PROFILER_MODULE.md)
