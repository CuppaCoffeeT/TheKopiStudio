# 99-refactor — CONTEXT

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-16 SGT
**Status**: 🔵 Planning
**Priority**: 🔴 Critical

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
| [_system/research/](_system/research/) | Evidence base (repo audit + refactor best practices) |

Program state: see [SYSTEM_STATE.md](_system/SYSTEM_STATE.md) → [SYSTEM_OVERVIEW.md](_system/SYSTEM_OVERVIEW.md) for current W## status.

## When to read what

| Task | Start here |
|---|---|
| Plan next refactor step | [SYSTEM_STATE.md](_system/SYSTEM_STATE.md) → pick top 🔴 Now |
| Build a W## card | `/create-workflow` on the card, which executes 0_INTAKE → 5_DEPLOY |
| Understand "why are we refactoring" | [RAW_REQUIREMENTS.md](_system/RAW_REQUIREMENTS.md) |
| Decide an open X## | [SYSTEM_OVERVIEW.md#cross-cutting-open-decisions](_system/SYSTEM_OVERVIEW.md) |

## Hard rules inside this folder

- **Markdown is canonical** — the `/refactor-status` page (W11) reads, never writes
- **No executable code here** — cards describe; code lives in `src/`
- **Update `SYSTEM_STATE.md` recent changes** after every meaningful card move

## Related

- Root [CLAUDE.md](../../CLAUDE.md) — repo hard rules
- [docs/CONTEXT.md](../CONTEXT.md) — parent router
- [CORE_PRINCIPLES.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md) — tenets this system follows
