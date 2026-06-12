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
way since they pin 2026. Orchestrator signed off this deviation during the
wave-1 adversarial verification (PRD execution log, 2026-06-11/12).

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

## 2026-06-11 — P3: soft delete everywhere; every read filters is_deleted

The legacy app hard-deleted rows; the port makes every destructive UI action
write `is_deleted = true` (+ `updated_by`) and EVERY read filter
`.eq('is_deleted', false)` — PRD soft-delete semantics, applied across all
five tables. Child rows of a soft-deleted client keep `is_deleted = false`
and are orphan-hidden by the client filter (the dashboard's child selects
enforce that with `clients!inner` + `.eq('clients.is_deleted', false)`);
deleting a policy DOES cascade `is_deleted = true` to its projections, which
have no client filter to hide behind. Soft-delete updates chain
`.select('id')` so an RLS-blocked 0-row match throws instead of
phantom-succeeding. The single exception is `replaceProjections` (next
entry).

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

## 2026-06-11 — P3: recompute owns the derived client columns

`recomputeClientBalance` writes `clients.total_bank_balance` +
`last_review_date` from the latest non-deleted history row ordered
`date DESC, created_at DESC, id DESC` (same-day entries resolve by insertion
recency, id as the stable tiebreak); zero rows reset to `0` / `null`. It runs
after EVERY bank mutation and after the create-client initial-history seed
(corrected legacy bugs 2+3). REVISED in the P3 fix round: the derived write
DOES stamp `updated_by` with the acting user (initially it carried no stamp
because the history row already does) — so the client row's audit trail names
whoever triggered the recompute.

## 2026-06-11 — P3: client reads return rows; child reads return models

`clientsService` reads resolve raw `ClientRow`s because pages need `user_id`
for the manager/super_admin read-only-affordance check (mapping to `CrmClient`
would drop it); pages map via `clientFromRow`. Child services
(policies/interactions/bank) resolve mapped models — ownership is decided at
the client level, and the modals consume model shapes directly. Dashboard
child selects guard the orphan-hiding rule with `clients!inner` +
`.eq('clients.is_deleted', false)` so children of a soft-deleted client never
count toward stats.

## 2026-06-11 — P3: dashboard "Annual premium" is the annualised formula

The legacy dashboard card raw-summed `parseFloat(premium)` with no frequency
multiplier and no ILP inclusion percent — a mislabel ("annual premium" over
mixed monthly/quarterly figures). The port computes the tile through
`summariseClient.totalAnnualPremium` (Monthly ×12 / Quarterly ×4 /
Semi-Annual ×2; ILP premiums scaled by `ilpPremiumInclusionPercent / 100`) so
the dashboard agrees with the golden-locked report math. DOCUMENTED
DIVERGENCE from legacy output, sanctioned in the PRD (resolved question:
"dashboard uses correct annualised premium"); the dashboard E2E pins it — a
$200 Monthly policy asserts a $2,400 tile, not $200.

## 2026-06-12 — P4: list follow-up badge derives from next_review_date only

The clients LIST fetch returns bare client rows — no interactions. The legacy
ClientCard resolved its badge from the earliest future interaction follow-up,
falling back to `next_review_date`; replicating that on the list would need
either an N+1 interactions query per row or an unbounded join, both rejected.
The list column therefore badges `next_review_date` alone (the recurring
review cadence — present on effectively every client), while the DETAIL page,
which already fetches the client's interactions, uses the full
`resolveClientFollowUp` source chain. Consequence: a client whose earliest
future interaction follow-up lands before their next review may show a calmer
tone on the list than on their detail header — acceptable for v1; revisit only
if reviewers want a `follow_up` rollup column on `clients`. Both surfaces
render through `components/FollowUpBadge.tsx` (tones: overdue → red, ≤7 days →
amber, else blue, per lib/followUps thresholds).

## 2026-06-12 — P4: Communication style card — neutral empty state + local DISC palette

The OverviewTab card reads `public.results` through the crm-owned
`listLinkedResultsByClient` (bounded `.limit(10)`, newest first, on the
`crmClients.detail(id)` sub-key family) — never through profiler imports.
Legacy results RLS prunes the rows server-side, so a client with NO visible
linked results renders one NEUTRAL caption, 'No visible profiling results',
deliberately NOT distinguishing "never converted" from "linked but
RLS-hidden" (advisor's client linked to an anon-owned result; super_admin
sees clients but the legacy results policy is manager-only until cutover) —
the PRD's neutral-empty-state rule, mirroring the not-found ambiguity the
client page already ships. DISC chip colours (D #C0392B, I #D4680A,
S #1A7A40, C #1A5F8A) are LOCAL constants duplicating the profiler palette
hexes by design: cross-feature imports are a dependency-cruiser error, and
the card's contract is DISC/MBTI letters + a link to
`/profiler-results/:id` — playbook content stays profiler-owned. Letters
keep zinc text over tinted backgrounds (AA in both modes); unexpected
letters fall back to a toneless zinc pill rather than throwing.
