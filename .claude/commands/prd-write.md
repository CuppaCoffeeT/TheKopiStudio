(RUN THIS TO AUTHOR A FULL, RESEARCH-BACKED PRD FOR ANY SUBSTANTIAL WORK — ULTRACODE / EXECUTE-PRD-READY)
# Write PRD

Author ONE self-contained, **prd-execute-ready** PRD for any substantial work — not just modules. `/prd-execute` reads it as the single source of truth: what to do, why, in what order, where it stands. It runs under ultracode (fans out workflows), so the PRD must decompose work into **independently-verifiable, parallelism-friendly phases**.

**Research-first, then ask, THEN plan.** Spine: **classify → gather + ask → research the codebase (fan-out) → write phased PRD → register → hand off.** A plan not grounded in real code + the user's answers is a liability. **All research lives here** — `/prd-execute` inherits this PRD's findings and does NOT re-research.

## Step 0 — Classify the work type (pick one · first match wins)

Decides PRD shape, gates, reference template:

| Type | Tell | PRD shape / reference |
|---|---|---|
| **module** | new route + new tables + new service layer | Module template + [MODULE_CREATION_SOP.md](../../docs/06-operations/MODULE_CREATION_SOP.md) (`/create-module` scaffolds) |
| **feature** | extends ONE existing `src/features/<x>/` | Module template minus scaffold; respect existing shape; no new top-level folders |
| **refactor** | many files / structural / cleanup / migration | cleanup-PRD: phased "grep → classify → change → gate → commit" + SAFE PATTERN + hard invariants. Ref: [SRC_STRUCTURE_CLEANUP_PRD](../../docs/05-implementation/completed/SRC_STRUCTURE_CLEANUP_PRD.md), [DEAD_CODE_CLEANUP_PRD](../../docs/05-implementation/completed/DEAD_CODE_CLEANUP_PRD.md) |
| **bugfix** | one defect, full root-cause + regression | reproduce → root-cause → fix → regression-test → doc. Failing-test-first |
| **idea** | vague; scope unknown | run [/scope-first](./scope-first.md) inline (brain-dump → research → 2-3 options), settle on a type above, write that PRD |

Single existing-page rework → follow `MODULE_CREATION_SOP`, not a PRD. Pure per-module audit → `/check-module`.

## The /prd-execute contract (every PRD keeps these — load-bearing)

| Element | Purpose |
|---|---|
| **Progress table** (⬜→🟡→✅) at top | executor flips per phase; read first |
| **Phased plan** | each phase = independently-verifiable slice + own deliverables + gates |
| **DoD gates** | the work type's gates (8-gate module DoD or subset) |
| **Execution Log** | executor appends one dated row per phase |
| **Build-via pointer** | `/prd-execute <path>` |
| **Permissions Matrix** | RBAC-touching module/feature only — drives per-role negative E2E |
| **Research findings** | blast-radius + precedent + verified facts — what lets prd-execute fan out safely |

Per-phase agent prompts are NOT authored here — prd-execute writes its own. Your job: make each phase's **dependencies, scope, verification** explicit.

## Step 1 — Gather + ask up front

From **$ARGUMENTS**: **what + why** (problem in a paragraph), **target user/role**, **scope cut** (out of v1), **rough phases**, **precedent** to mirror.

Then **`AskUserQuestion`** the genuinely user-owned calls research can't settle — product behaviour, irreversible calls (delete vs archive, retention, notification channels), scope boundaries, "which are actually deprecated", timing. **Batch into one ask.** Make them informed (surface Step-2 candidates; you may interleave research then ask). Don't block: pick safest reversible default, log in **Open Questions**, proceed.

## Step 2 — Research the codebase (MANDATORY · fan-out workflow · ALL research happens here)

The step that makes the plan real. **Author + run a research `Workflow`** — as many parallel read-only readers as the work has facets. Cost is not a concern; correctness is. Remove every answerable unknown so prd-execute inherits a complete map:

| Reader | Returns |
|---|---|
| **Precedent** | closest existing module/feature/refactor — folder shape, `api/` pattern, hooks, page archetype, primitives, gates to mirror |
| **Blast radius** | every file the change touches + every consumer/importer (grep tree, barrels, dynamic imports, `App.tsx`, tests). For refactor/bugfix this IS the plan backbone |
| **Constraints** | applicable rule files + canonical guides (`.claude/rules/**`, `MODULE_CREATION_SOP`, `CANONICAL_*_PATTERN`, mobile-web, timezone, query-compliance, react-query, url-standards, module-access, rls-policy, `primitives/CONTEXT.md`, `TOKEN_BUDGET`) |
| **DB/RLS reality** (module/feature/bug) | `mcp__supabase__list_tables` + `execute_sql` — tables/columns/enums + capability names in `rls_capabilities` + live roles `SELECT name FROM public.roles` |

**Verify, never assert** — every path/table/symbol/route/role in the PRD is grep- or Supabase-MCP-checked. Route collisions → grep `App.tsx` + `modules`. Each reader returns a tight **digest**, not a dump. Synthesize digests + Step-1 answers → the plan.

## Step 3 — Write the PRD

Create `docs/05-implementation/active/<NAME>_PRD.md` (SCREAMING_SNAKE_CASE; `_PRD` module/feature, `_PRD`/`_PLAN` refactor/bugfix). Header: Created / Last Updated / Status 🔵 Planning / Priority. Product/architecture-level — link SOP + rules for mechanics; never inline SQL/queryKeys/primitive APIs (duplication = drift).

**Shared skeleton (all types):**
```markdown
# <Name> — PRD
**Created/Last Updated/Status: 🔵 Planning/Priority**
**Work type**: module | feature | refactor | bugfix
🤖 Build via: `/prd-execute docs/05-implementation/active/<NAME>_PRD.md`
✅ Completion gate: <work type's DoD> green → PRD moves to completed/

## 📊 Progress / State   ← executor flips ⬜→🟡→✅; read first
| Phase | Status | Notes |   (Current phase: 0 · Blockers: none)

## 📋 Definition
What · Why · Target user/role · Success criteria (gates + named checks)

## 🔎 Research findings   ← Step 2 output; the map prd-execute fans out from
affected files/consumers · closest precedent · verified tables/paths/roles · risks

## 🚦 Phases (smallest independently-verifiable slices, dependency-ordered)
each: goal · scope · SOP steps/rules touched · deliverables checklist · dependencies · parallel-safe (disjoint files) vs must-serialize (shared imports/schema)

## 🎯 Definition of Done — gates
module/feature: 8-gate DoD + per-role @p0. refactor: tsc 0 · drift 0 net-new · build · LOC ratchet · knip-trend + SAFE PATTERN + hard invariants. bugfix: failing test reproduces→passes + no @p0 regression

## ❓ Open Questions / Risks   (assumptions + user-owned calls + provisional defaults)

## 🗒️ Execution Log   (executor appends one dated row per phase)
```

**Per-type deltas:**
| Type | Add |
|---|---|
| **module** | Module Spec (archetype + root primitive + folder + routes + data model + RLS pattern A/B/C) · Permissions Matrix · Prior-art table · Test plan (@p0 per story + per-role negative + load/a11y) — the full template |
| **feature** | module minus scaffold/new-folder; name the exact existing `features/<x>/` files each phase edits (from blast radius); Permissions Matrix only if it adds gated actions |
| **refactor** | lead with SAFE PATTERN (per-file decision rule) + hard invariants (what must NOT regress); phases = one per cohesive slice; explicit OUT-OF-SCOPE. Mirror SRC_STRUCTURE_CLEANUP_PRD |
| **bugfix** | P1 reproduce (failing test first) · P2 root-cause (evidence) · P3 fix · P4 regression (@p0 + new test green) · P5 doc/lessons |

## Step 4 — Register + validate

Add a row under **05 — Implementation** in [DOCUMENTATION_INDEX.md](../../docs/DOCUMENTATION_INDEX.md) (active/ block; bump the count + `05-implementation/CONTEXT.md` active count). Run `/check-docs` — confirm listed, links resolve, counts correct.

## Step 5 — Hand off

Tell the user: `/prd-execute docs/05-implementation/active/<NAME>_PRD.md`. It **consumes this PRD's Research findings — it does not re-research** — then branches (or works in place per session), delegates each phase to subagents, verifies gates per phase, runs @p0, updates Progress + Execution Log, and on completion moves the PRD active/→completed/. **NEVER auto-launch — the user triggers it.**

## Rules

- **Research before asserting** — every path/table/route/symbol/role grep- or MCP-verified. Step-2 fan-out is mandatory. This PRD is the only research pass; prd-execute trusts it.
- **Ask what you can't derive** — user-owned calls get `AskUserQuestion` up front; the rest get a safe default + Open-Questions entry. Never stall.
- **Product/architecture-level** — link SOP + rules; don't inline SQL/queryKeys/primitive APIs.
- **Load-bearing**: Progress table · Execution Log · Build-via pointer · gates · Research findings. Permissions Matrix for RBAC module/feature. Omitting any breaks prd-execute.
- **One PRD per effort** — lives in active/; prd-execute moves it to completed/ when the DoD is green.
- **Never auto-launch the build.**
