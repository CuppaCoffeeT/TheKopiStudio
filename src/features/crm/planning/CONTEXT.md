# Planning — CRM Sub-Workspace Memory

Three customer-scoped advisory tools ported from the advisor's own HTML prototypes: **Tax calculator** (04), **SRS planner** (05), **Legacy Map** (06). Routes are sub-routes of a customer — `/clients/:id/tax-calculator` · `/srs` · `/legacy-planner` — sharing modulePath `/clients` (the `/clients/:id/report` precedent), so they need **no module rows**.

Launched from `../components/detail/CustomerToolLauncher`, never from the nav rail: under the customer-centred IA a tool always acts on a specific customer.

**Lives INSIDE `features/crm/` on purpose.** These are customer surfaces: they read the customer record, share its modulePath, and are sub-routes of it. `.dependency-cruiser` enforces that feature workspaces are islands, and a sibling `features/planning/` importing `crm`'s types, mapping and `useClientDetail` was exactly the violation that rule exists to catch. The dependency direction is the boundary — see `decisions.md`.

## Map

- `lib/singaporeTax.ts` — the YA 2025/26 band ladder + auto reliefs. **Shared**: the SRS tool prices withdrawals with it, so the two tools can never quote different tax for the same income.
- `lib/taxReliefs.ts` — the 19-relief CATALOGUE (declarative; adding a relief is one entry)
- `lib/taxAssessment.ts` — `assessTax`, the single entry point the tax page calls
- `lib/srs.ts` — statutory constants + `taxOnSlice` + `projectContributions` (paying in) + the milestone rows
- `lib/srsSchedules.ts` — drawdown SHAPES: `equalWithdrawals` (level annuity) · `customWithdrawals` (3 legs) · `deferBalance` · `annualTaxFreeCeiling`
- `lib/srsWithdrawals.ts` — drawdown PRICING: `planWithdrawals` (taking out)
- `lib/srsJourney.ts` — `buildJourney`: both ends netted into the lifetime tax benefit
- `hooks/useSrsPlanner.ts` — the tool's sixteen form fields and the four-stage derivation
- `lib/legacy.ts` — estate model: asset types, nominations, totals, projection
- `lib/legacyIsa.ts` — Intestate Succession Act 1967 s.7 ladder
- `lib/useLegacyPlan.ts` — Legacy Map state + referential integrity on delete
- `lib/customerSeed.ts` — the CRM→tool boundary guard (`seedAge` / `seedAmount`)
- `lib/legacyPlanSchema.ts` — total parser for the stored JSONB + `SCHEMA_VERSION`
- `lib/useLegacyPlan.ts` — editing state, referential integrity, dirty tracking
- `api/legacyPlansService.ts` + `hooks/useLegacyPlanStore.ts` — load / upsert
- `lib/format.ts` — whole-dollar money + percent (pure; kept out of the component file)
- `components/PlanningToolFrame.tsx` — loads the customer, breadcrumb, loading/error/not-found
- `components/PlanningAtoms.tsx` — `ToolPanel` · `ToolStatGrid` · `SummaryRow` · `ToolSelect` · `ToolNote`

## Constraints

- **Every lib file is PURE and takes an injected reference age/year** — no `Date.now()`. An assessment attached to a report must render identically a year later.
- **SRS: no fixed 63 or 72 anywhere.** The penalty-free age is the customer's own (62/63/64, locked in by their FIRST contribution) and the 10-year window is counted from their FIRST WITHDRAWAL — so a deferred start moves the close with it. Use `forcedPayoutAge(startAge)`; `SRS_DEFAULT_WITHDRAWAL_AGE` is for seeding only, never arithmetic. See `decisions.md`.
- **Faithful port, not "improved" maths.** Where the reference rounds or caps, so do we. A corrected figure that disagrees with the advisor's own spreadsheet is worse than a faithfully ported one. Record any deviation here.
- **Seed at the boundary, never in shared math.** `ageFromDOB` is golden-locked by the CRM report oracle; nonsense inputs are clamped in `customerSeed.ts`. See `lessons.md` — a future DOB shipped a −60 age into the tax calculator.
- **`ToolSelect`, never the native `Select`** — `no-restricted-imports` bans it app-wide.
- **Tax + SRS are NOT persisted** — conversation aids, and they say so on the page. The **Legacy Map IS** (`public.legacy_plans`, one JSONB doc per customer).
- **Legacy Map: no re-seed effect, ever.** The editor mounts only after the stored plan settles and seeds from a `useState` initialiser. `ClientFormModal` shipped the opposite (an `[open, client]` effect that re-fired on a background refetch and clobbered in-flight edits) — see `ClientDetailPage`'s note.
- **Saving is gated on customer ownership.** `legacy_plans_insert` only checks `auth.uid() = user_id`, so a manager saving against another advisor's customer would create a row the owning advisor could never read. The page hides Save when `isOwn` is false.
- **`parseLegacyPlan` is total.** Stored JSONB is untyped and can be old; nothing it returns may throw, and a partly-readable doc yields its readable part.

## 📚 Related

- [../CONTEXT.md](../CONTEXT.md) — the customer record these tools hang off
- `../lib/customerToolCards.ts` — chain (01–03) vs planning (04–06)
