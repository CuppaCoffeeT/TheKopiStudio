# Documentation Index

**Created:** 2026-06-11 · **Last Updated:** 2026-08-18 · **Status:** 🟢 Active

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

## 06 — Operations (project-specific)

| Doc | Purpose |
|---|---|
| [CRM_FIGURE_PROVENANCE.md](06-operations/CRM_FIGURE_PROVENANCE.md) | Every CRM Dashboard + Portfolio Report figure traced to table → columns → filter → arithmetic, reconciled against prod 2026-08-18. Records the zero-percent-ILP premium blind spot ($12,936/yr) and why the math was disclosed rather than changed |

## 05 — Implementation (Layer 4: active → completed)

**Active: 1**

| Doc | Status | Purpose |
|---|---|---|
| [active/DATA_SPINE_PRD.md](05-implementation/active/DATA_SPINE_PRD.md) | 🟡 In Progress (P4 import blocked on user key) | CRM schema + RLS Pattern D + role-sync edge fn + cross-project data import |
| [MERGE_PLAN_2026-06-11.md](05-implementation/MERGE_PLAN_2026-06-11.md) | 📋 Reference | Master plan: merge Prospect Profiler + Insurance CRM onto AppBase |
| [CUTOVER_RUNBOOK.md](05-implementation/CUTOVER_RUNBOOK.md) | 🟡 Awaiting user decisions | Final-phase runbook: import key, domain/env cutover, destructive steps gated on per-step approval |

### Design handoffs (Layer 4 — brand + direction authority)

| Doc | Status | Purpose |
|---|---|---|
| [design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md](05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) | 🟢 **Live authority** | 2a "Kopi House" applied spec — palette, type scale, states, archetypes. The colour/type source of truth for `src/index.css` |
| [design-handoffs/2026-07-25-kopi-studio-2a/decisions.md](05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md) | 🟢 Live | Direction decisions + comp-vs-brand-card conflict resolutions |
| [design-handoffs/2026-07-21-visual-directions/1A_MASTHEAD_SPEC.md](05-implementation/design-handoffs/2026-07-21-visual-directions/1A_MASTHEAD_SPEC.md) | ⛔ Superseded 2026-07-25 | Navy/gold 1a Masthead direction — archaeology only, kept for history |

**Completed: 5**

| Doc | Completed | Purpose |
|---|---|---|
| [completed/KOPI_STUDIO_REDESIGN_PRD.md](05-implementation/completed/KOPI_STUDIO_REDESIGN_PRD.md) | 🟢 2026-07-27 | Direction 2a "Kopi House": cream/brown **light** palette + Instrument Serif, sidebar shell, dashboard/list/detail rebuild, "The Kopi Studio" rebrand |
| [completed/INSURANCE_CRM_REDESIGN_PRD.md](05-implementation/completed/INSURANCE_CRM_REDESIGN_PRD.md) | 🟢 2026-07-14 · ⛔ **visually superseded 2026-07-25** by the Kopi 2a PRD | Navy/gold/serif restyle + module-launcher dashboard home + "Insurance CRM" rebrand. Historical record — the navy/gold palette, the launcher grid and the "Insurance CRM" name are all retired |
| [completed/REPORTS_LINK_PRD.md](05-implementation/completed/REPORTS_LINK_PRD.md) | 🟢 2026-06-12 | Client + portfolio reports, prospect→client link |
| [completed/CRM_MODULE_PRD.md](05-implementation/completed/CRM_MODULE_PRD.md) | 🟢 2026-06-12 | CRM module: clients/policies/interactions/bank + dashboard + finance math port |
| [completed/PROFILER_MODULE_PRD.md](05-implementation/completed/PROFILER_MODULE_PRD.md) | 🟢 2026-06-11 | Profiler wizard (public) + results + Account Settings + Manage Accounts modules |
