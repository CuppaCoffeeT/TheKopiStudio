# W13 — ProjectDetailPage split

**Goal**: Split the 3,200-line `ProjectDetailPage` handling 5 workflows into `src/features/project-<workflow>/` folders with a thin page shell.
**Tier**: Later · **Status**: 🔴 PLANNED · **Automation**: 👀 HITL
**Blocked by**: W04 (seatbelt for the 5 workflows), W07 (primitives), W08 (optional — tokens) · **Blocks**: W09 general migration (acts as the "high-risk proof" before the per-module loop)

## Why this exists

Single biggest refactor target per REPO_AUDIT. 3,200 lines + 5 workflows in one component:
- Untestable in isolation — one mount runs all 5
- Every state change re-renders everything
- Every bug cascades across workflows
- Any future module following this shape will rot the same way

Splitting first de-risks W09: the process used here becomes the recipe the rest of W09 follows.

## Scope

**In:**
- Identify and name the 5 workflows (REPO_AUDIT references the file — first step is audit-within-audit to list them)
- One feature folder per workflow: `src/features/project-<workflow>/` with colocated `components/ hooks/ api/ types/` per Bulletproof React
- Shell at `src/pages/ProjectDetailPage.tsx` — route wrapper + tab/router to feature modules, ≤150 lines
- Feature flag `VITE_FF_PROJECTDETAIL_V2` — toggles old vs new for 7-day soak
- W04 Playwright coverage on each of the 5 workflows before split PR merges
- Archive old file to `archive/projectdetailpage-pre-split` branch
- Document the split recipe at `src/features/project-<workflow>/MIGRATION_RECIPE.md` — feeds W10 skill scaffolding

**Out:**
- Redesigning any workflow logic — straight mechanical split first
- Changing URLs or routes
- Changing DB schemas
- Visual reskin — W08 tokens apply in a follow-up PR (one risk at a time)

## Dependencies on other cards

- W04 must cover the 5 workflows in P0
- W07 primitives consumed by the feature folders (forms, tables, toasts)
- W08 tokens deferred — reskin PR after split lands

## Open workflow questions

- **Q-W13-a** ✅ **split first, reskin after (2026-04-19, default accepted)**.
- **Q-W13-b** ✅ **7 days prod soak, zero bug reports (2026-04-19, default accepted)**.
- **Q-W13-c** ✅ **lowest-risk workflow first (2026-04-19, default accepted)**.
- **Q-W13-d** ✅ **yes — canonical flow for `/create-module` skill (2026-04-19, default accepted)**.

## Done-when

- 5 folders exist under `src/features/project-*/`
- `ProjectDetailPage.tsx` ≤ 150 lines (shell only)
- W04 tests green on all 5 workflows
- Flag removed after 7-day soak
- Old file archived
- `MIGRATION_RECIPE.md` written and linked from W10
- Sets DAG flag: **`pdp_split`**
