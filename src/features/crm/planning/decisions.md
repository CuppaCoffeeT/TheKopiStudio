# Planning — Decisions

**Last Updated**: 2026-08-19 SGT

## 2026-07-28 — One `planning` folder, INSIDE crm, not three sibling features

**Decision**: the tax calculator, SRS planner and Legacy Map live in ONE folder,
`src/features/crm/planning/`, rather than three feature folders — and inside
`crm` rather than beside it.
**Why**: they share a real dependency, not just a theme — `lib/singaporeTax` is
consumed by both the tax tool and the SRS drawdown pricing, and all three share
`PlanningToolFrame` and the atoms. Three folders would have meant a fourth
shared folder between them.
**Why inside crm**: they read `CrmClient`, `clientFromRow` and
`useClientDetail`. A sibling `features/planning/` importing those tripped
`.dependency-cruiser`'s `no-cross-feature-imports` — ten violations, and the
rule was right: feature workspaces are islands, and the dependency direction IS
the boundary. Hoisting the customer record into `src/lib` to "share" it would
have been the wrong fix; the tools are customer surfaces, so they belong with
the customer.
**Impact**: if any tool grows its own domain (persistence, its own tables, a
report of its own), splitting it out later is a folder move PLUS hoisting
whatever it still needs from crm. Nothing here crosses tool boundaries except
the tax ladder, which would become shared lib.

## 2026-07-28 — Customer-scoped sub-routes, no module rows

**Decision**: the tools are `/clients/:id/<tool>` under `modulePath="/clients"`,
following the `/clients/:id/report` precedent, rather than standalone nav
destinations with their own `modules` rows.
**Why**: the customer-centred IA (2026-07-28) had just established that tools
are not places — they act on a customer. Scoping them to a customer also makes
them pre-fillable, which is the whole reason to open one from the record rather
than from a bookmark. As a side effect it needs no module-registration
migration, which mattered while the Supabase MCP was unauthorized.
**Impact**: an advisor who holds `/clients` holds all three tools; there is no
separate grant. If a blank-slate standalone calculator is ever wanted, it is an
additive module row plus an optional-`:id` route — nothing here blocks it.

## 2026-07-28 — The chain gates; the planning tools do not

**Decision**: `buildToolCards` (01–03) and `buildPlanningCards` (04–06) are
separate functions returning the same card shape, and the launcher renders them
as two groups under separate headings. `CustomerJourney` still counts THREE
steps.
**Why**: the chain is ordered and gated — the report is locked until the
profiler and the information are done. The planning tools are not sequenced at
all. Folding them into the journey would have been less code and a worse model:
the Customers list checklist counts the chain, and a customer is not "2 / 6
complete" because nobody has opened a calculator for them.
**Impact**: adding a fourth planning tool is one entry in `buildPlanningCards`
and touches no journey logic, no checklist, and no queue rule.

## 2026-07-28 — Faithful port over corrected maths

**Decision**: where the reference HTML tools round, cap or order operations a
particular way, the port does the same, and any deviation must be recorded here.
**Why**: these tools are checked against the advisor's own spreadsheets in front
of customers. A figure that is more defensible in theory but disagrees with what
they have always quoted costs more trust than it buys.
**Impact**: none of the three ports deviates from its reference so far. The one
deliberate ADDITION is input clamping at the seeding boundary (see lessons.md),
which changes no formula.

_(2026-08-13: still holds. The SRS rebuild below re-ported every formula from
the newer reference rather than reconciling the old one — same rule, applied to
a moved target. Its two UI deviations are recorded there; neither is a formula.)_

## 2026-08-13 — SRS: the withdrawal age is a customer PROPERTY, not a constant

**Decision**: `SRS_WITHDRAWAL_AGE = 63` is gone. The age is an input
(`SRS_STATUTORY_AGES` = 62 · 63 · 64), and `SRS_FORCED_PAYOUT_AGE = 72` is
replaced by `forcedPayoutAge(firstWithdrawalAge)`.
**Why**: the penalty-free age is locked in at the statutory retirement age that
applied on the customer's FIRST contribution, so two customers of the same age
can have different ones — and the 10-year window is counted from the first
WITHDRAWAL, not from that birthday. Both were hardcoded to the 63/72 pair, which
is right for exactly one cohort and silently wrong for the others. Deferring the
start is the tool's most under-used lever and it was unrepresentable.
**Impact**: every age in the drawdown is now relative to `startAge`. Anything
reading a fixed 63 or 72 is a bug. `SRS_DEFAULT_WITHDRAWAL_AGE` remains for
seeding only — never for arithmetic.

## 2026-08-13 — SRS: the level draw replaced the rising one

**Decision**: `equalWithdrawals` returns one LEVEL payment
(`PMT = PV·r·(1+r)^n / ((1+r)^n − 1)`) instead of `balance / years remaining`.
**Why**: both exhaust the account, but the old form produced a RISING series —
every year a different withdrawal, a different taxed portion, a different
answer. An advisor cannot commit a customer to that, and the reference changed
for the same reason. With zero growth the two agree exactly, which is why the
original tests did not catch the difference.
**Impact**: quoted per-year figures change for any non-zero drawdown growth.
Totals and the exhaustion property do not.

## 2026-08-13 — Two UI deviations from the SRS reference

**Decision**: the reference is a two-TAB tool (Contribution & Tax · Withdrawal
Planning) with a Calculate button per tab; the port stays a single scrolling
page of panels that recomputes live. The withdrawal age is a three-option
`ToolSelect`, not the reference's `min=62 max=70` number input.
**Why**: the tabs and buttons are artefacts of a hand-rolled HTML file with no
reactive layer — splitting the two halves across tabs hides the chain between
them, which is the tool's argument. And only three ages are legally reachable;
a number input that accepts 65–70 invites a figure no customer can have.
**Impact**: both are presentation-only. Every formula, constant and rounding
decision is ported verbatim — see the faithful-port rule above.

## 2026-07-28 — The Legacy Map editor mounts only after storage settles

**Decision**: `LegacyPlannerPage` splits into a loader and an editor. The loader
waits for `useStoredLegacyPlan` to settle and then mounts the editor with a
`key={customerId}`; the editor seeds from a `useState` initialiser and has NO
re-seed effect.
**Why**: the obvious shape — mount the editor immediately and sync the fetched
plan in with a `useEffect` — is precisely the bug `ClientFormModal` shipped,
where an `[open, client]` effect re-fired on a background refetch and silently
clobbered in-flight edits (caught by the clients-advisor E2E rename step). A
legacy map represents an hour of conversation; losing it to a refetch is worse
than one skeleton.
**Impact**: costs a loading state on open. The `key` also guarantees a stale
plan cannot survive navigation between two customers' maps.

## 2026-07-28 — A failed plan load refuses to open the editor

**Decision**: when `useStoredLegacyPlan` errors, the page shows an error with a
retry — it does NOT fall back to a freshly seeded plan.
**Why**: a seeded plan looks like a legitimately empty map. Editing and saving
from it would overwrite whatever is actually stored with a blank one. Refusing
to open is the safe failure; the data is still there.

## 2026-07-28 — Saving is gated on the CUSTOMER's owner, not on RLS alone

**Decision**: the Save button renders only when the signed-in user owns the
customer (`isOwn`, threaded down from `PlanningToolFrame`).
**Why**: `legacy_plans_insert` checks `auth.uid() = user_id`, which a manager
satisfies trivially — they would create a plan row owned by THEMSELVES against
another advisor's customer, and `legacy_plans_select` would then hide it from
the advisor who owns the customer. RLS is doing its job; the constraint we
actually want ("only the customer's advisor plans for them") is one the schema
does not express, so the UI expresses it.

## 2026-08-19 — SRS: accumulation runs to the PLANNED first withdrawal

**Decision**: `projectContributions` now takes `startAge` — the age the customer
plans to take their first withdrawal — and runs to it, instead of stopping at
the statutory age. `deferBalance` is deleted; the years between the two ages are
ordinary accumulation years. Contributions continue through them
(`age <= contributeUntilAge && age < startAge`), so `contributeUntilAge` may sit
above the statutory age.
**Why**: ported from `srs tool (5).html`, the advisor's own update to the
reference this tool was rebuilt from on 2026-08-13. Two things were wrong with
the split: the deferred years compounded at the DRAWDOWN rate rather than the
accumulation rate, and contributing through them was unrepresentable — even
though relief legally runs right up to the first withdrawal. Deferring is the
tool's most under-used lever and it was being under-priced.
**Impact**: quoted balances rise for any deferred plan (two effects: the higher
growth rate on those years, and any contributions now made in them).
`balanceAtWithdrawalAge` → `balanceAtFirstWithdrawal`; `SrsJourney.deferralGrowth`
is gone, `deferralYears` stays. The journey panel reports "years past the
earliest age" instead of a deferral-growth figure, since that growth is no
longer separable from the projection.
**Supersedes**: the deferral half of _2026-08-13 — SRS: the withdrawal age is a
customer PROPERTY, not a constant_. The rest of that entry stands: the age is
still an input, and `forcedPayoutAge(startAge)` still moves the window.

## 2026-08-19 — Two UI deviations from the v5 SRS reference

**Decision**: the "planned first withdrawal" field moves to the PAYING-IN panel
(matching the reference, which moved it to the Contribution tab), and the
contribution cut-off is clamped to `startAge - 1` only when the start age is at
or past the locked-in one — not on every keystroke as the reference does.
**Why**: the field ends accumulation, so it belongs with the inputs that drive
it. The narrowed clamp is because the reference's `parseInt(...) || srsAge`
re-clamps mid-typing: a half-typed "6" pushes the cut-off to 5 and the advisor
has to retype a field they never touched. Ignoring implausible values costs
nothing, because `projectContributions` refuses to contribute in or after the
withdrawal year regardless.
**Impact**: presentation only. No formula, constant or rounding decision
deviates — the faithful-port rule above still holds.
