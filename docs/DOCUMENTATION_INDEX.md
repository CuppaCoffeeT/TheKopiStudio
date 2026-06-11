# Documentation Index

**Created:** 2026-06-11 · **Last Updated:** 2026-06-11 · **Status:** 🟢 Active

Master registry of project documentation. Register every new doc here (rule: `.claude/rules/documentation.md`).
Layer-3 reference docs shipped with the AppBase template (01/02/03/04/06/99 categories) are indexed by their per-category `CONTEXT.md` routers; this index tracks **project-specific** additions.

## 01 — System Architecture (project-specific)

| Doc | Purpose |
|---|---|
| [CRM_DATA_SPINE.md](01-system-architecture/CRM_DATA_SPINE.md) | 5 CRM tables · RLS Pattern D · capabilities · users hardening · role-sync contract · import runbook |

## 03 — Features (project-specific)

| Doc | Purpose |
|---|---|
| [profiler/PROFILER_MODULE.md](03-features/profiler/PROFILER_MODULE.md) | Profiler module as-built: wizard + results + Account Settings + Manage Accounts · scoring parity · legacy save contract · permissions matrix · E2E matrix · accepted divergences |

## 05 — Implementation (Layer 4: active → completed)

**Active: 1**

| Doc | Status | Purpose |
|---|---|---|
| [active/DATA_SPINE_PRD.md](05-implementation/active/DATA_SPINE_PRD.md) | 🟡 In Progress (P4 import blocked on user key) | CRM schema + RLS Pattern D + role-sync edge fn + cross-project data import |
| [MERGE_PLAN_2026-06-11.md](05-implementation/MERGE_PLAN_2026-06-11.md) | 📋 Reference | Master plan: merge Prospect Profiler + Insurance CRM onto AppBase |

**Completed: 1**

| Doc | Completed | Purpose |
|---|---|---|
| [completed/PROFILER_MODULE_PRD.md](05-implementation/completed/PROFILER_MODULE_PRD.md) | 🟢 2026-06-11 | Profiler wizard (public) + results + Account Settings + Manage Accounts modules |
