# Planning — Decisions

**Last Updated**: 2026-07-28 SGT

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
