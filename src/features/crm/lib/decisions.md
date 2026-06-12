# CRM — Decisions

## 2026-06-11 — One feature folder per DOMAIN, two module rows

`src/features/crm/` hosts BOTH the CRM dashboard (`/crm`) and the client book
surfaces (`/clients`, `/clients/:id` sharing modulePath `/clients`). Module
rows drive tiles + access control; folders follow the domain (same call as
profiler's wizard/results split): dashboard stats, client CRUD, policies,
interactions and bank history all share `lib/finance.ts`, `lib/followUps.ts`,
the row↔model mapping and the 5-table types — splitting into two feature
folders would force cross-feature imports of `lib/` internals through
barrels. Registration migration upserts the two rows ON CONFLICT (path)
(UNIQUE(path) added by 20260611_174434) and grants advisor/manager/
super_admin; routes live in the DashboardLayout group as lazy chunks per the
base convention.

## 2026-06-11 — P2: refYear injection replaces every legacy clock call

`finance.js` read the clock once (`ageFromDOB`: `new Date().getFullYear()`).
The port makes every time-dependent entry point take an explicit `refYear`
(`ageFromDOB(dob, refYear)`, `retirementSumsFor(dob, refYear)`,
`assessRetirementReadiness(input, refYear)`). The app passes
`currentRefYear()` (Singapore calendar year via `timezoneUtils`); the golden
tests pin `refYear = 2026` — the vector capture year — so all 115 vectors
replay float-exact. Annual-constants refresh (BHS, RETIREMENT_SUMS) stays a
manual cutover-doc process.

## 2026-06-11 — P2: retirementSumsFor fallback row

Legacy hardcodes the 2026 row (`cohortYear: 2026, projected: false`) for null
dobs and pre-2023 cohorts — "now" was baked in as 2026. The port keeps that
row byte-identical at `refYear` 2026 (every vector replays) with ONE guarded
generalisation: when `refYear` is itself a published `RETIREMENT_SUMS` year
(2023–2027) the fallback uses `refYear`'s row, so the app doesn't silently
serve stale 2026 sums in 2027. Outside the published table the fallback
REMAINS the literal 2026 row — never extrapolated (matching legacy for any
future year). If strict legacy behavior (always-2026) is preferred, flatten
the `fallbackYear` ternary in `retirementSumsFor` — tests stay green either
way since they pin 2026.

## 2026-06-11 — P2: finance.ts / financeReport.ts split

The caller-inline formulas the legacy app duplicated inside report components
(bank @0.5% to 65, future CI/ECI cost ×1.06^years, 10×/5×/1.5× gap multiples,
RA assessment, protection/investment premium split) are ported as named
functions, but in `lib/financeReport.ts` rather than inside `finance.ts`: the
combined file breached the 200-LOC ratchet (288 lines). `finance.ts` is the
exact `finance.js` export surface; `financeReport.ts` holds the
report-component math plus ITS constants (which never lived in finance.js).
Import direction is strictly financeReport → finance; both are golden-locked
by the same vector suite.

## 2026-06-11 — P2: preserved legacy inconsistencies (do NOT "fix")

- `splitPremiums` (HealthSnapshot input) buckets by TYPE substring
  ('investment'/'ilp'/'endowment') and counts ILP premiums FULL — it ignores
  `ilpPremiumInclusionPercent` AND `isInvestmentLinked`, while
  `summariseClient.totalAnnualPremium` scales ILPs by the inclusion percent.
  Same client, two different premium figures — exactly like legacy.
- Death-cover gap math uses 10× income (`analyseCoverageGaps`) while the
  HealthSnapshot adequacy check uses 5× — both preserved.
- `assessRetirementReadiness.cpfLifeMonthlyPayout` is the RAW
  `(projectedRA / frs) × 1780` value: the legacy JSX rounds at render time and
  the captured vectors store the unrounded number; display rounding is the
  UI's job.
- `ageFromDOB` is a plain year difference (no month/day adjustment); null →
  40. `projectCPFTo55` keeps the per-year MA grow → clip → overflow → SA grow
  operation order (float-exactness depends on it) and does NOT clip an
  initial MA above BHS when `yearsTo55 === 0`.

## 2026-06-11 — P2: clientToRow writes neither total_bank_balance nor last_review_date

Corrected legacy bug 1: client ADD/EDIT payloads never touch
`total_bank_balance` / `last_review_date`. The ADD flow reads the form's
`totalBankBalance` to seed the initial bank-history row and the P3
bank-recompute owns both columns from then on. `CrmClient` still carries both
fields read-only for display.

## 2026-06-11 — P2: followUps keeps legacy UTC-midnight comparison semantics

'YYYY-MM-DD' strings parse via `new Date(str)` (UTC midnight) and compare
against the injected `refDate` INSTANT: day counts use
`Math.ceil(diff / 86400000)`, so "today" badges as urgent "0 days" while the
future-follow-up selector (`>=`) only matches today's date until the UTC
midnight instant passes — after that the badge source falls back to
`next_review_date`, exactly like the legacy ClientCard. Tones keep the legacy
names (`overdue`/`urgent`/`upcoming`) for the red/amber/blue badge mapping.

## 2026-06-11 — P3: replaceProjections HARD-deletes (the one exception to soft-delete)

`UNIQUE(policy_id, age)` makes soft-delete impossible for the
replace-projections flow: a soft-deleted age-65 row would collide with the
re-inserted age-65 row. `replaceProjections` therefore hard-deletes ALL rows
for the policy (deliberately ignoring `is_deleted`, clearing leftovers), then
inserts the incoming set de-duped by age keeping the LAST entry (the user's
later form row wins) and sorted by age. The delete chains `.select('id')` so
RLS no-ops are observable, and every error throws into the mutation
(corrected legacy bug 4). User-initiated policy deletion stays a soft delete
and cascades `is_deleted = true` to the policy's projections.

## 2026-06-11 — P3: recompute owns the derived client columns; no audit stamp

`recomputeClientBalance` writes `clients.total_bank_balance` +
`last_review_date` from the latest non-deleted history row ordered
`date DESC, created_at DESC, id DESC` (same-day entries resolve by insertion
recency, id as the stable tiebreak); zero rows reset to `0` / `null`. The
recompute is a derived-data write, so it does NOT stamp `updated_by` — the
triggering mutation already carries the audit stamp on the history row. It
runs after EVERY bank mutation and after the create-client initial-history
seed (corrected legacy bugs 2+3).

## 2026-06-11 — P3: client reads return rows; child reads return models

`clientsService` reads resolve raw `ClientRow`s because pages need `user_id`
for the manager/super_admin read-only-affordance check (mapping to `CrmClient`
would drop it); pages map via `clientFromRow`. Child services
(policies/interactions/bank) resolve mapped models — ownership is decided at
the client level, and the modals consume model shapes directly. Dashboard
child selects guard the orphan-hiding rule with `clients!inner` +
`.eq('clients.is_deleted', false)` so children of a soft-deleted client never
count toward stats.
