# W12 — Compliance sweeps (query + RBAC + timezone)

**Goal**: Fix the mechanical (zero-behavior-change) subset of query-compliance violations to unblock G1. All behavior-changing sweeps spun out into sub-cards that land after W04 Playwright.
**Tier**: Now · **Status**: 🟢 CLOSED 2026-04-18 — **Sweep 1 LEGACY-FIX complete** (153 mechanical fixes, 51 files, tsc clean). Scope explicitly limited to "pure additive bounds, no behavior change". The remaining 413 violations (29 PAGINATE + 8 RBAC + 177 timezone + ~218 HITL dynamic builders) each spun into their own sub-card — all blocked by W04 (need Playwright seatbelt to change behavior safely). · **Automation**: hybrid (codemod + review)
**Blocked by**: nothing · **Blocks**: ~~W07~~ — Sweep 1 invariants are in place; further primitive work can proceed on top

### Scope re-framing (Option A — 2026-04-18)

Original plan treated all 566 violations (381 query + 8 RBAC + 177 timezone) as a single sweep set. Reality split them cleanly into two classes, and forcing both into one card created a G1 deadlock (W12 blocked on W04; W04 blocked on G1; G1 blocked on W12). The split below resolves it:

| Class | Scope | Why safe now vs later |
|---|---|---|
| **Mechanical / additive** (W12 this card) | 153 `.limit()` / `.single()` additions. Pure defensive bounds. | Zero behavior change — no test required. Add-only chain calls. |
| **Behavior-changing** (W12.02..W12.05) | 29 list-view pagination rewrites + 8 RBAC rewrites + 177 timezone migrations + ~218 HITL query builders | Each changes what users see or can do. Without Playwright seatbelt (W04) any regression ships silently. Must wait for W04. |

The DAG flag `sweeps_done` now means "mechanical sweep 1 done" — not "all violations fixed". The behavior-changing sub-cards have their own flags gated by G4 (pre-final-merge), not G1 (pre-S2).

## Corrected scope (2026-04-18 after exhaustive grep)

| Pass | Target | Status | Notes |
|---|---|---|---|
| **Sweep 1 pass #1** | 34 patches per research report | ✅ 19 applied, 15 under-specified | 2026-04-18 |
| **Sweep 1 pass #2** | Exhaustive grep for remaining unbounded `.select()` | ✅ 134 applied (119 LEGACY `.limit(10000)` + 15 manual incl. 1 `.limit(1)` existence check) | 2026-04-18 — caught Promise.all pitfall self-corrected |
| **Sweep 1b** — PAGINATE list views | 29 list-view pages/components flagged (see list below) | 🔴 pending | Needs server-side `range + count:'exact'` refactor, not just `.limit()`. Higher risk than mechanical sweep — needs W04 Playwright first |
| **Sweep 1c** — HITL dynamic query builders | ~218 remaining unbounded `.select()` in complex template-literal joins / dynamic builders | 🔴 pending | Non-obvious bounded/paginated end state; needs per-file HITL verdict |
| **Sweep 2** — RBAC (8 hardcoded role checks) | from REPO_AUDIT | 🔴 pending | Waits for W04 (changes behavior) |
| **Sweep 3** — Timezone (177 raw date-fns imports) | from REPO_AUDIT | 🔴 pending | Waits for W04 |

### Sweep 1b — PAGINATE candidates (29 list views)

Need proper `useURLPagination` + `.range(from, to)` + `{ count: 'exact' }` migration — matches the pattern in `PeopleManagement.tsx`. Flagged to [SERVER_SIDE_PAGINATION_MIGRATION.md](../../../05-implementation/active/SERVER_SIDE_PAGINATION_MIGRATION.md):

- `src/pages/CoordinatorDashboard.tsx:22,28,34`
- `src/pages/CompanyList.tsx:139,205`
- `src/pages/SuperAdminDashboard.tsx:98`
- `src/pages/InvoiceList.tsx:144`
- `src/components/coordinator/WorkersManagement.tsx:69,149`
- `src/components/coordinator/CompaniesManagement.tsx:72,103`
- `src/components/coordinator/ClarificationTable.tsx:52`
- `src/components/admin/ServicesManagement.tsx:58`
- `src/components/management/WorkerOTEntriesList.tsx:39`
- `src/components/management/ManagementTrialTrenchesTable.tsx:71,112`
- `src/components/management/ManagementGeneralWorksTable.tsx:72`
- `src/components/shared/ProjectsList.tsx:97`
- `src/components/drafter/GeneralWorksTable.tsx:60`
- `src/components/quotation-settings/JobTypeManagement.tsx:53,68`
- `src/components/supervisor/SupervisorWorkerOTTable.tsx:90`
- `src/components/supervisor/SupervisorWorkingHoursTable.tsx:82`
- `src/components/supervisor/SupervisorSubmissionsTable.tsx:30,50`
- `src/components/supervisor/SupervisorGeneralWorksTable.tsx:78`
- `src/components/coordinator/generalworks/GeneralWorksTable.tsx:73`

## Why this exists

REPO_AUDIT surfaced 3 systemic CLAUDE.md hard-rule violations. These are mechanical, codemod-friendly, and high-value — they encode the exact invariants W07 primitives will enforce. Fix now → W07 ships with zero backfill. Defer → W07 either breaks 220+ call sites on merge or carries perpetual compatibility code.

## Scope

**In — three sweeps, ship as three PRs:**

| # | Sweep | Targets | Rule | Tool |
|---|---|---|---|---|
| 1 | Query compliance | 34 `.select()` calls missing `.range/.limit/.single` | CLAUDE.md rule 4 | ast-grep codemod + manual review |
| 2 | RBAC | 8 hardcoded role-string checks | CLAUDE.md rule 2 (`.claude/rules/module-access.md`) | manual — rewrite each to `useAuth` module check |
| 3 | Timezone | 177 raw `date-fns` imports | CLAUDE.md rule 5 (`.claude/rules/timezone.md`) | ast-grep codemod + manual edge cases |

Reference file list from [research/REPO_AUDIT.md](../research/REPO_AUDIT.md) — top-10 offenders cited there.

**Out:**
- Adding new primitives (W07 owns that)
- Changing existing behavior — these are mechanical fixes only
- New tests — relies on W04 seatbelt; each PR passes a manual smoke before merge if W04 isn't ready

## Dependencies on other cards

- Parallel with W02, W06 (Lane B of S1 FOUNDATION in the DAG)
- Precedes W07 — primitives will enforce the invariants we're sweeping now
- ESLint rules (Q-W12-c) land with W07 to prevent regression

## Open workflow questions

- **Q-W12-a** ✅ One PR per sweep — clearer revert, reviewable.
- **Q-W12-b** ✅ **Split timing (user intuition, 2026-04-18)**: **Sweep 1 (query compliance) runs NOW** — pure mechanical `.range/.limit/.single` additions, no behavior change, safe without seatbelt. **Sweeps 2 + 3 (RBAC rewrite + timezone migration)** run **after W04 Playwright lands** — they change role checks + date handling, both can break business logic, need the smoke tests. This matches W04's Week-2 timing.
- **Q-W12-c** ✅ **Accept default (yes, draft ESLint rules here, ship enforcement with W07)**. Claude translation: the rules are 3 one-liners that ban `.select()` without `.range/.limit/.single`, ban hardcoded role strings, ban raw `date-fns` imports. Drafted in this sweep, activated in CI when W07 primitives land (otherwise CI fails on day-one against 200+ pre-existing violations).
- **Q-W12-d** ✅ W06 — keep sweeps focused on rule violations.

## Done-when

- **Query**: grep `\.select\(` across `src/` → every match has `.range/.limit/.single` in the chain
- **RBAC**: grep for hardcoded role strings (`'admin'`, `'manager'`, etc.) → zero matches outside `src/lib/auth/`
- **Timezone**: grep `from ['"]date-fns['"]` → zero matches outside `src/utils/dates/` re-export
- ESLint rules drafted + agreed (activated with W07)
- Sets DAG flag: **`sweeps_done`**
