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

## 2026-06-12 — Reports: math-purity rule for report components

REPORTS_LINK_PRD DoD rule, grep-enforced: `components/report/*` do DISPLAY
FORMATTING ONLY (`Math.round`/`toFixed`/`toLocaleString`/string templates).
Every number derived from client/policy fields comes from the
`lib/financeReport` barrel (+ Bands/Economics/Portfolio/Sections splits),
where each function is oracle-locked against an expression copied VERBATIM
from the legacy JSX with file:line cited in the test. Preserved literals live
in lib too: death Cost@65 uses ×1.025^y GENERAL inflation (do NOT "fix" to
the 6% medical rate), CI/ECI use ×1.06 with the 150000/30000 bases. The sole
sanctioned inline arithmetic is legacy-cited YEAR-COUNT math (the
`yearsTo55 = Math.max(0, 55 − currentAge)` clamp in ClientReportPage /
ReportCpfProjection — CPFProjection.jsx:8; a year count, not money math).

## 2026-06-12 — Reports: WCAG band-tone divergence (old → new hex)

The legacy HealthSnapshot band trio doubled as the card's TEXT color on the
tinted backgrounds (#d1fae5 / #fef3c7 / #fee2e2) and fails axe WCAG 2 AA
there — amber-500 sat at ~2.1:1. DELIBERATE COLOR-ONLY DIVERGENCE:
- Good:   #059669 (emerald-600) → **#047857** (emerald-700, 4.83:1 on #d1fae5)
- Review: #f59e0b (amber-500)  → **#92400e** (amber-800, 6.37:1 on #fef3c7)
- Action: #dc2626 (red-600)    → **#b91c1c** (red-700, 5.30:1 on #fee2e2)
Band THRESHOLDS, comparison logic and labels (incl. the premiums card's
SPECIAL 'Underinsured'/'Review cost' states) stay oracle-locked verbatim in
`financeReportBands.ts`. The retirement-economics callouts darken the same
way (legacy tones were ~3.4–3.95:1). Pinned by the reports axe E2E.

## 2026-06-12 — Reports: portfolio premium totals are ANNUALISED (documented divergence)

Legacy Reports.jsx/CrmApp `totalPremium` RAW-summed `premium` per stored
frequency yet labeled the row "annual" — the same mislabel as the dashboard
tile (P3 entry). `summarisePortfolio` (`financeReportPortfolio.ts`) reuses
`summariseClient` (frequency multipliers; ILP scaled by inclusion percent) so
the portfolio table, dashboard KPI and client report agree; averages keep the
legacy 0-when-empty guards. The page renders an "(annualised)" footnote
(`report-portfolio-annualised-note`), and the per-client policy LINES still
show the RAW "X/frequency" amount exactly like legacy. PRD-resolved;
asserted by the portfolio E2E.

## 2026-06-12 — Reports: legacy-HTML-only extras DROPPED (reversible scope cut)

Per the merge-plan default the new report pages do NOT port: Priority Action
Items, the Medisave AWL boxes, the Universal Life section, and the portfolio
report's per-client interaction tables. PDF export stays `window.print()` —
no PDF library. PRD-resolved ("Scope cut", open question closed); reversible
later by porting the corresponding legacy JSX blocks into new
`components/report/*` sections backed by lib functions + oracle tests.

## 2026-07-14 — Client "profile completeness" is DERIVED client-side, no DB column

**Decision**: dashboard/client-list "profile completeness" is computed in the
client (% of non-null values over 9 raw `ClientRow` fields), and the
"Profiled" badge is derived by linking `results.client_id` to the client —
no `completeness` column or DB view is added.
**Why**: the value is pure presentation over data already fetched; a stored
column would need triggers/backfill to stay consistent, and the 9-field
definition is still likely to change with the CRM redesign.
**Impact**: zero migrations; definition changes are a one-file TS edit; any
future server-side sort/filter on completeness would require promoting the
formula to a DB view at that point.

## 2026-07-14 — Dashboard home page lives in features/crm, not pages/

**Decision**: the new dashboard home (`DashboardHomePage.tsx`) sits at
`src/features/crm/pages/`, not `src/pages/`.
**Why**: dep-cruiser rule `no-pages-to-features` forbids `pages/` importing
from `features/`; the page composes CRM feature hooks/components, so it must
live inside the feature folder.
**Impact**: route registration lazy-imports from `features/crm/pages/`; any
future cross-feature dashboard widgets must be promoted to primitives/hooks
rather than imported across features.

## 2026-07-25 — Kopi 2a: `ModalSection tone="amber"` keeps its name, paints brown

**Decision**: the `ModalSection` warning fieldset (`components/modals/shared.tsx`)
now paints the Kopi attention tone (`--status-revised-bg/-border/-fg`) but the
prop union member stays literally `'amber'`.
**Why**: the palette migration was visual-only — renaming the union member is a
caller-facing API change, and the sole caller (`PolicyHospitalSection`) plus any
future one would have to move in lockstep. The old `text-amber-500` measured
1.99:1 on cream and `bg-amber-950/20` was a dark-era wash.
**Impact**: the value name no longer describes the hue — the interface comment
says so explicitly. Rename it only as a deliberate API change, not as a
"consistency" cleanup.

## 2026-07-25 — Kopi 2a: report greys → `--fg-dim`, band tones untouched

**Decision**: every `text-gray-500/600` and `border-gray-200/300` in
`components/report/*` moved to `--fg-dim` / `--border-soft`. The band-tone trio
(`#047857`/`#92400e`/`#b91c1c`), its tinted backgrounds and the CPF/RA panel
hexes were NOT migrated.
**Why**: the greys were cool zinc-era neutrals that clash with the warm ground
and mostly failed AA (gray-500 = 4.48:1 on card cream); `--fg-dim` (#5D4F3F)
measures 6.5-7.1:1 across the three band tints and 7.34 on card. The band trio
is the oracle-locked, axe-pinned WCAG divergence recorded in the 2026-06-12
entry above — recolouring it would break `financeReportBands` tests.
**Impact**: report type is warm and AA-clean; the legacy semantic band palette
remains a deliberate, tested island inside the Kopi system.

## 2026-07-25 — Kopi 2a: report/print surface fully migrated (band tones included)

**Decision**: `report-print.css`, `financeReportBands.ts` and the remaining
inline accent hexes in `components/report/*` now carry the Kopi Studio palette.
Band trio → `#4A6A4E` on `#D9E8E0` (4.78) · `#7D5F3D` on `#F0E2CF` (4.61) ·
`#AB4925` on `#FAE0D6` (4.50). The hero's navy→blue gradient became a flat
`#8B6A47` with `#FAF6EE` type (4.58); the six `report-grad-card` fills became a
flat warm ramp closed by a `#D9CCC0` hairline; table headers and the "primary"
callout took the reports-only grey `#E8E6E0`; `--success` took the reports-only
green box `#D9E8E0`.
**Why**: the previous entry deferred the band trio to avoid breaking
`financeReportExtension.test.ts`, but that test's oracle pins band LOGIC and
LABELS — the tone/bg pair is a presentation constant the oracle comment already
flagged as a deliberate divergence. Updating the constant in both places keeps
the oracle meaningful and leaves no legacy-palette island in a printed
artifact the client actually receives.
**Impact**: 140 tests still pass. Print values stay LITERAL hexes, never
`var(--…)`, so a future app re-theme cannot leak into the printed artifact —
same decoupling as `features/profiler/lib/print.css`.
**Supersedes**: 2026-07-25 — Kopi 2a: report greys → `--fg-dim`, band tones untouched

## 2026-07-25 — Report accent type never uses raw sage/terracotta

**Decision**: report accent numerals use `#4A6A4E` (positive), `#AB4925`
(negative), `#806241` (neutral brown, white/cream backings only) and `#5D4F3F`
(on tinted rows). Ramp step `#A58868` is deliberately unused as a card fill.
**Why**: every accent in the report is live text under 18px on one of five
backings, so a single value per hue has to clear 4.5:1 on all of them. Raw sage
`#5A7A5E` tops out at 4.51 and raw terracotta `#D97551` at 2.95; even
`--sage-text` `#526F56` fails on the tints (4.38-4.43). `#A58868` measures 3.96
against the ink it would carry.
**Impact**: `opacity` was removed from `.report-hero-sub`, `.report-stat
.label/.note` and `.report-grad-card .label/.note` — dimming cream to 75% over
brown drops it to ~3.3:1. Hierarchy is carried by size and weight instead.
