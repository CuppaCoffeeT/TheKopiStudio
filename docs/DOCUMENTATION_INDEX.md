# Documentation Index

**Created:** 2026-06-11 · **Last Updated:** 2026-06-12 · **Status:** 🟢 Active

Master registry of project documentation. Register every new doc here (rule: `.claude/rules/documentation.md`).
Layer-3 reference docs shipped with the AppBase template (01/02/03/04/06/99 categories) are indexed by their per-category `CONTEXT.md` routers; this index tracks **project-specific** additions.

## 01 — System Architecture (project-specific)

| Doc | Purpose |
|---|---|
| [CRM_DATA_SPINE.md](01-system-architecture/CRM_DATA_SPINE.md) | 5 CRM tables · RLS Pattern D · capabilities · users hardening · role-sync contract · import runbook |

## 03 — Features (project-specific)

| Doc | Purpose |
|---|---|
| [profiler/PROFILER_MODULE.md](03-features/profiler/PROFILER_MODULE.md) | Profiler module as-built: wizard + results + convert-to-client (own-rows-only, keyed retry, provenance) + Account Settings + Manage Accounts · scoring parity · legacy save contract · permissions matrix · E2E matrix |
| [crm/CRM_MODULE.md](03-features/crm/CRM_MODULE.md) | CRM module as-built: dashboard + clients + policies + interactions + bank history + reports (client 13-section + portfolio, math-purity rule, annualised + WCAG band-tone divergences) + communication-style card · 4 corrected legacy bugs · finance golden-vector parity · permissions · E2E summary |

## 05 — Implementation (Layer 4: active → completed)

**Active: 2**

| Doc | Status | Purpose |
|---|---|---|
| [active/KOPI_STUDIO_REDESIGN_PRD.md](05-implementation/active/KOPI_STUDIO_REDESIGN_PRD.md) | 🔵 Planning | Direction 2a "Kopi House": cream/brown light palette + Instrument Serif, sidebar shell, dashboard/list/detail rebuild, "The Kopi Studio" rebrand |
| [active/DATA_SPINE_PRD.md](05-implementation/active/DATA_SPINE_PRD.md) | 🟡 In Progress (P4 import blocked on user key) | CRM schema + RLS Pattern D + role-sync edge fn + cross-project data import |
| [MERGE_PLAN_2026-06-11.md](05-implementation/MERGE_PLAN_2026-06-11.md) | 📋 Reference | Master plan: merge Prospect Profiler + Insurance CRM onto AppBase |

**Completed: 4**

| Doc | Completed | Purpose |
|---|---|---|
| [completed/INSURANCE_CRM_REDESIGN_PRD.md](05-implementation/completed/INSURANCE_CRM_REDESIGN_PRD.md) | 🟢 2026-07-14 | Navy/gold/serif restyle + card dashboard home + "Insurance CRM" rebrand |
| [completed/REPORTS_LINK_PRD.md](05-implementation/completed/REPORTS_LINK_PRD.md) | 🟢 2026-06-12 | Client + portfolio reports, prospect→client link |
| [completed/CRM_MODULE_PRD.md](05-implementation/completed/CRM_MODULE_PRD.md) | 🟢 2026-06-12 | CRM module: clients/policies/interactions/bank + dashboard + finance math port |
| [completed/PROFILER_MODULE_PRD.md](05-implementation/completed/PROFILER_MODULE_PRD.md) | 🟢 2026-06-11 | Profiler wizard (public) + results + Account Settings + Manage Accounts modules |
