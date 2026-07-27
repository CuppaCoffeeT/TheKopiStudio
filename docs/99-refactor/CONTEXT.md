# 99-refactor — CONTEXT

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-07-27 SGT
**Status**: 🟡 Transitional — the W## program is largely delivered; the `_system/` design catalogs are now used mainly as **history + inventory**
**Priority**: 🟡 High

## Purpose

Home of the **AppBase_REFACTOR** system — the 2026 Q2 in-place refactor of this repo. System scaffolded per JLCode `/create-system` pattern.

## What's here

| File | Purpose |
|---|---|
| [_system/SYSTEM_OVERVIEW.md](_system/SYSTEM_OVERVIEW.md) | Top-level index — vision, DAG, Lane map, backlog (W01–W21), X1–X12 decisions, dependency graph |
| [_system/EXECUTION_PLAN.md](_system/EXECUTION_PLAN.md) | **How we actually do it** — 5 phases, per-card lifecycle, 5-week calendar, weekly rhythm, risk register, definition of done |
| [_system/SYSTEM_STATE.md](_system/SYSTEM_STATE.md) | Rolling dashboard — what's active, blocked, next action |
| [_system/RAW_REQUIREMENTS.md](_system/RAW_REQUIREMENTS.md) | Intake verbatim — user's brain dump + 8 intake answers |
| [_system/workflows/](_system/workflows/) | One card per sub-workflow (W01–W21) |
| [_system/DEPRECATIONS.md](_system/DEPRECATIONS.md) | **Everything deleted from the codebase, and what replaced it. Check here before citing any component or hook name.** |
| [_system/DESIGN_CATALOG.md](_system/DESIGN_CATALOG.md) | Router into the design catalogs (`_PRIMITIVES` · `_MATRIX`) — deleted rows are struck through, not removed |
| [_system/LOCKED_PICKS.md](_system/LOCKED_PICKS.md) | Locked visual decisions + which primitive owns which token |
| [_system/CODEBASE_DEEP_RESEARCH_2026-05-29.md](_system/CODEBASE_DEEP_RESEARCH_2026-05-29.md) · [_system/REMEDIATION_MASTER_PLAN_2026-05-29.md](_system/REMEDIATION_MASTER_PLAN_2026-05-29.md) | Evidence base — the repo audit that drove the remediation plan (there is no `_system/research/` folder) |

Program state: see [SYSTEM_STATE.md](_system/SYSTEM_STATE.md) → [SYSTEM_OVERVIEW.md](_system/SYSTEM_OVERVIEW.md) for current W## status.

## When to read what

| Task | Start here |
|---|---|
| Plan next refactor step | [SYSTEM_STATE.md](_system/SYSTEM_STATE.md) → pick top 🔴 Now |
| Build a W## card | `/prd-write` → `/prd-execute` (the old `/create-workflow` command was retired; it no longer exists) |
| Check a name still exists before using it | [DEPRECATIONS.md](_system/DEPRECATIONS.md) |
| Understand "why are we refactoring" | [RAW_REQUIREMENTS.md](_system/RAW_REQUIREMENTS.md) |
| Decide an open X## | [SYSTEM_OVERVIEW.md#cross-cutting-open-decisions](_system/SYSTEM_OVERVIEW.md) |

## Hard rules inside this folder

- **Markdown is canonical** — there is no in-app refactor dashboard; the W11 `/refactor-status` route was never shipped and is not in `src/App.tsx`
- **No executable code here** — cards describe; code lives in `src/`
- **Update `SYSTEM_STATE.md` recent changes** after every meaningful card move
- **Everything dated before 2026-07-25 describes a retired visual era** (zinc dark, then navy/gold). Component names in those entries may no longer exist — cross-check [DEPRECATIONS.md](_system/DEPRECATIONS.md). Do not rewrite dated history; add era markers instead.

## Related

- Root [CLAUDE.md](../../CLAUDE.md) — repo hard rules
- [docs/CONTEXT.md](../CONTEXT.md) — parent router
- [CORE_PRINCIPLES.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md) — tenets this system follows
