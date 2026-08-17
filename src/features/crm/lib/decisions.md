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

## 2026-07-25 — /dashboard Overview merges CRM + profiler through a crm-owned `results` read

**Decision**: the "Latest additions" feed (`hooks/useLatestAdditions.ts`) reads
clients via `clientsService.getClientsPaginated` AND saved profiles via a new
`linkedResultsService.listRecentResults`, then merges and re-sorts them into one
table. It does NOT import `features/profiler/api/resultsService`.
**Why**: the comp's MODULE column exists to distinguish CRM rows from Profiler
rows, so a clients-only feed would ship a constant column. But
`.dependency-cruiser.cjs` `no-cross-feature-imports` makes
`features/crm → features/profiler` an error. `linkedResultsService` already
carries the sanction for this exact shape ("an own-feature api hitting shared
tables"), so the new reader goes there.
**Impact**: each source is gated on `useAuth().modules` (`/clients`,
`/profiler-results`), so neither query fires for a viewer without the module and
the index numerals renumber themselves (one card is "01", never a gap).

## 2026-07-25 — The Overview dateline stat is upcoming follow-ups, not "reviews due this week"

**Decision**: the masthead kicker renders `<n> follow-ups upcoming` from
`useDashboardStats().upcomingFollowUps`, and drops the clause entirely when the
viewer holds no CRM module.
**Why**: the 2a comp's exemplar reads "4 reviews due this week", but nothing in
the schema stores a weekly review window — `clients.next_review_date` is a single
date and `interactions.follow_up` is the only live "something is due" figure the
app already computes. Inventing a week-scoped count would have meant a fourth
query for a figure no other surface uses, and hardcoding the comp's "4" would
have been fake data on an empty book.
**Impact**: the clause is real on day one and stays correct as the book fills.
If a genuine weekly-review count is ever needed, it belongs in
`dashboardService.getDashboardStats` next to the other three, not in the page.

## 2026-07-25 — DISC chip colours move from local literals to the `--disc-*` tokens
**Decision**: `CommunicationStyleRows`' `DISC_COLORS` map is replaced by `DISC_TOKENS` pointing at `--disc-d/i/s/c`, with the tint and border derived through `color-mix()` instead of appended hex alpha. The neutral fallback becomes `var(--fg-muted)`.
**Why**: The values were four raw literals inside a component built for the 2a dossier. They are the right values — the DISC hex freeze was re-affirmed, see the handoff `decisions.md` — but a 2a component should not carry the palette itself. `color-mix()` is what makes the token usable where `${col}1A` previously forced a literal.
**Impact**: Supersedes the "DISC chip colours … are LOCAL constants duplicating the profiler palette hexes by design" clause in the 2026-06 entry above. The *duplication* rationale still holds — `no-cross-feature-imports` is a dependency-cruiser error, so CRM still cannot import from profiler — but the duplication is now of a token NAME, not of four hexes. That entry's "letters keep zinc text" note is also stale twice over: the letters have been `text-foreground` since the navy era and are unaffected here.

## 2026-07-25 — The /dashboard Overview derives ONE set of held record modules; `/crm` is not in it
**Decision**: `useLatestAdditions` owns the single derivation (`hasClients` / `hasResults` / `hasSource`, over `/clients` + `/profiler-results`, whose path constants now live once in `lib/latestAdditions`). Every Overview surface reads it: both KPI cards, the `useDashboardStats` enable flag, the dateline's follow-ups clause, the feed section and the nothing-granted line. The Clients KPI card no longer falls back to `|| hasCrm`, and its tile always targets `/clients`.
**Why**: the card list and the empty-state test derived from different module sets, so a viewer granted `/crm` but not `/clients` got a populated Clients card sitting directly above copy reading "No record modules are granted to your account yet". Widening the feed to `/crm` instead would have been worse — the feed does not query the client book for a `/crm`-only viewer, so the card would have claimed N clients above a table saying "Your book is empty", and its rows would have linked into a route that viewer cannot open.
**Impact**: `/crm` grants aggregate figures on its own dashboard, not records here; a `/crm`-only viewer now gets the honest nothing-granted line. No effect on real grants — the registration migration hands `/crm` and `/clients` to the same roles, so the divergence was only reachable through a `user_modules` override.

## 2026-07-25 — Overview KPI states are per-card, not per-row
**Decision**: `components/OverviewKpiRow` renders each tile's own query state — `LoadingSkeleton variant="kpi-tile"` while in flight, and on failure an em-dash figure whose meta line carries one terracotta sentence plus a Retry action. An errored tile drops its `onClick`.
**Why**: the two cards read two different queries (`useDashboardStats` vs the feed's `/profiler-results` source), so a shared row-level state would blank a healthy profiler figure whenever the clients stats failed. `useLatestAdditions` therefore also exposes `resultsStatus` — the results source alone — beside the merged-feed flags. Dropping `onClick` is required, not cosmetic: `KpiIndexCard` becomes `role="button"` when it has one, and a nested Retry control inside it would swallow the click into a navigation.
**Impact**: per KOPI_2A_SPEC → "States → Error" the failure stays row-level and quiet — the tile keeps its hairline border and card cream, no panel fill. `ErrorState` (the giant serif 500 hero) is deliberately NOT used inside a KPI tile; it remains the page/section-level surface.

## 2026-07-27 — The report's negative accent moves to the deeper `#8F3D1F`

**Decision**: every sub-18px terracotta in the report drops from `#AB4925` to
`#8F3D1F` — the `bandFor` / `premiumCardStatus` error tone in
`financeReportBands.ts` (which is also the health card's border) and the two
`.report-row-loss` cells in `ReportRetirementEconomics.tsx`. The other four
accents (`#4A6A4E`, `#806241`, `#5D4F3F`, and `#AB4925` where it sits on white
or cream) are unchanged.
**Why**: `#AB4925` on the error tint `#FAE0D6` measures **4.4995**, not the
4.50 both entries above record — under WCAG's `≥ 4.5` gate, and axe fails it
`serious` on five report nodes at once (three 12px band labels, two 13px
opportunity-cost cells). `#8F3D1F` measures 5.85 there and is the app's
already-locked `--cta-destructive-bg-hover`, so it is the same hue one step
down rather than a new colour. Lightening `#FAE0D6` was rejected: that fill is
also `--status-rejected-bg`, `.report-callout--danger` and `.report-row-loss`,
and moving all of them to buy 0.001 is the larger blast radius.
**Impact**: `financeReportExtension.test.ts`'s oracle updated in step (same
reasoning as the entry above — the tone/bg pair is a presentation constant the
oracle already flags as a deliberate divergence); 140 tests still pass. Print
values stay LITERAL hexes. The app-side twin of this value is the new
`--negative-text-on-tint` token in `src/index.css`, which the report
deliberately does not read.
**Supersedes**: 2026-07-25 — Report accent type never uses raw sage/terracotta
(only the negative hex; the rule that raw `#D97551` never carries text stands)

## 2026-07-28 — Customer-centred IA: one journey ruleset, three surfaces

**Decision**: the app's information architecture moves from tool-as-navigation
to customer-as-subject (Claude Design handoff "Kopi Studio Directions", turns
3a/4a). The rail leads with **Overview + Customers**; `/dashboard` becomes an
ACTION QUEUE rather than a record inventory; the Prospect Profiler, the
customer information form and the client report are launched from the customer
record via `components/detail/CustomerToolLauncher`. One pure module —
`lib/customerJourney` — owns the three-step chain and the queue rule, and the
Overview queue, the Customers list checklist and the detail launcher ALL read
it. No surface re-derives "gone quiet" or step state locally.
**Why**: three surfaces answering "where is this customer up to?" with three
private rule sets is how a list row starts contradicting the page it opens. The
chain also had a hole worth closing: `/clients/:id/report` had NO entry point
anywhere in the app — the client report was reachable only by typing the URL.
**Impact**: `deriveJourney` / `deriveAttention` are pure with an injected
`refDate` (28 unit tests, green under SGT/UTC/US-Eastern). Day counts collapse
BOTH sides to the Singapore calendar date before subtracting, so "13 days until
the review" does not truncate to 12 depending on the hour the page is opened.
Four modules lost their only adopter with the old Overview and were deleted
rather than left orphaned (`useLatestAdditions`, `LatestAdditionsTable`,
`OverviewKpiRow`, `lib/latestAdditions`); the `KpiIndexCard` primitive survives.

## 2026-07-28 — Honest signals over comp fidelity in the journey chain

**Decision**: three places where the comp draws something the schema cannot
back, the app renders the weaker true claim instead. (1) The profiler step is
BINARY — the comp's "step 4 of 7 · resume" affordance is not rendered, because
`public.results` saves one row on completion and persists no partial run.
(2) The report step's `done` means *ready to generate*, not *issued* — there is
no issued flag; `locked` is the comp's real rule ("needs steps 01 and 02") and
renders NO action rather than a clickable lock. (3) The Customers list's "Last
contact" column reads "Never contacted" when no interaction exists, even though
the quiet CLOCK legitimately falls back to the added date.
**Why**: a queue is only worth having if every line on it is true. A resume
button that cannot resume, a report marked issued that was never sent, and a
"Today" under "Last contact" for someone never contacted each cost more trust
than the missing polish buys.
**Impact**: `JourneyStepState` has no partial state for `profiler`; the launcher
renders a reason line where a locked action would be. If partial-run persistence
is ever added to `results`, (1) is the entry to revisit — not the UI.

## 2026-07-28 — The rail demotes the tools instead of deleting them

**Decision**: the comp shows only Overview + Customers (+ a manager
destination). `AppSidebar` keeps every OTHER granted module reachable under a
hairline + muted "More" heading rather than dropping it from navigation.
**Why**: saved profiler results can exist with no customer attached — the public
`/profiler` wizard creates exactly that — so removing `/profiler-results` from
the rail would strand real records behind a URL. Demotion expresses the comp's
hierarchy claim without losing anything.
**Impact**: the two primary items are pulled from the SAME `useAuth().modules`
list, so a viewer who does not hold `/clients` simply does not see Customers —
no role strings (.claude/rules/module-access.md). The comp's manager-only
Reports destination is NOT built: it needs a cross-advisor roster surface that
does not exist yet, and `/crm-reports` (a book-wide financial summary) is a
different artifact, currently granted to advisors too.

## 2026-07-28 — CPF projection with future contributions is a NEW function, not a change

**Decision**: `lib/cpfContributions.ts` adds `projectCPFTo55WithFutureContributions`
alongside the golden `projectCPFTo55`, rather than extending it. The report calls
the new one unconditionally.
**Why**: `finance.ts` is golden-locked — `__tests__/finance.test.ts` replays 115
vectors FLOAT-EXACT and its per-year operation order is load-bearing. The two
functions also answer different questions ("what do today's balances grow to?"
vs "...and what if they keep earning?"). Critically, with NO income steps the
two agree to floating-point exactness — asserted across 8 shapes in
`__tests__/cpfContributions.test.ts` — which is what makes calling the new one
unconditionally safe: a customer with nothing filled in projects exactly as
before, so this cannot silently move numbers across the whole book.
**Impact**: closes a real modelling gap. Previously a 35-year-old and a
54-year-old with identical balances projected identically, because the twenty
years of contributions the younger one will actually make did not exist in the
model. `saBoostFromOverflow` is DERIVED by re-running the projection with an
infinite Medisave cap rather than reusing `totalOverflow` — the spill compounds
after it lands, so the two differ.

## 2026-07-28 — Three fixed income steps, not a child table

**Decision**: expected future income is nine flat columns on `clients`
(`future_income_step{1,2,3}` + start/end ages), not a `client_income_steps`
child table.
**Why**: it is what the reference CRM models and what advisors actually fill in
— earning years → wind-down → semi-retirement. A child table would be the
"correct" shape and would buy nothing: no query asks across customers, and the
whole set is read and written with the client row.
**Impact**: `lib/incomeSteps.ts` owns the adapter from those columns to a list,
so the flat storage is invisible above it. Revisit only if a fourth step is
ever asked for.

## 2026-07-30 — Advisor (owner) column on /clients is capability-gated + resolved per page

**Decision**: the Customers list shows an **Advisor** column only when the
viewer holds `view_all_clients` (`useAuth().hasCapability`, not a role string),
and the owner names are resolved by `useCustomerOwners` — a page-scoped lookup
over the distinct owner ids on screen — NOT by joining `users` into the list
query.
**Why**: for a solo advisor every row is their own, so the column is pure noise;
only manager/super_admin need "whose customer is this". Gating on the capability
(not `role === …`) obeys module-access.md. Resolving owners in a sibling lookup
keeps the golden `listClients` `select('*')` — which the RLS-scope E2E specs
assert against — completely untouched, exactly as `useCustomerSignals` already
does for profiled/last-contact. Column and cell are both driven by one
`showAdvisor` flag (`customerColumns` / `buildCustomerRow`) so they can never
fall out of step; `customerRowModel.test.ts` pins that invariant.
**Impact**: the viewer's own rows read "You". Adding the column cost no change to
the list query or its RLS. If an advisor should ever edit a foreign customer,
that is a separate RLS decision — this is read-only visibility only.

## 2026-08-17 — Overview tool shortcuts ask for the customer FIRST

**Decision**: `/dashboard` offers all six tools as a button row under the queue
figures (`ToolShortcutRow`). Pressing one opens `ToolCustomerPickerModal` and only
then navigates — to the byte-identical route `ClientDetailPage`'s launcher would
have used. The row model lives in `lib/dashboardToolShortcuts.ts`, SEPARATE from
`lib/customerToolCards.ts`.
**Why**: the customer-centred IA says a tool always acts on a customer, and the
planning routes enforce it — `PlanningToolFrame` reads `useParams().id` and has no
"no-customer" mode. Inverting the order (tool → customer) keeps that contract
while saving the advisor the list → record → launcher walk when they already know
which tool they want. The two models stay apart because `customerToolCards`
carries per-customer STATE (done/locked, the missing-info count) and gates 01→03;
a shortcut is pressed before any customer exists, so it can honour nothing but
MODULE access. Folding them together would mean deriving a journey for a customer
nobody has picked.
**Impact**: step 02 (Customer information) has no route of its own, so the shortcut
uses `/clients/:id?tool=info`; `ClientDetailPage` opens `ClientFormModal` and
strips the param (left in the URL, a refresh reopens a dismissed form). The picker
reads `getOwnClientOptions` — an explicit `user_id` filter, NOT `getClientsPaginated`,
whose RLS scope would hand a `view_all_clients` holder the whole firm's book. Same
boundary, same reason as the queue: see lessons.md 2026-08-13.
