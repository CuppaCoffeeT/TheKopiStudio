# Feature Specifications

> Last updated: 2026-07-27

How production features work today. Permanent reference (Layer 3) — updated when features change. Router only.

## What belongs / doesn't

Specs of **current behavior** (UI, data model, workflow) by domain. NOT: build plans → `docs/05-implementation/` · architecture → `docs/01-system-architecture/` · external APIs → `docs/04-integrations/`.

## Navigation

This app ships **four** feature folders under `src/features/`. Every row below was path-verified 2026-07-27.

| Doc | Domain | Code in |
|---|---|---|
| [profiler/PROFILER_MODULE.md](./profiler/PROFILER_MODULE.md) | Profiler wizard (public) · results list + detail · convert-to-client · Account Settings · Manage Accounts | `src/features/profiler/`, `src/features/account-settings/`, `src/features/manage-accounts/` |
| [crm/CRM_MODULE.md](./crm/CRM_MODULE.md) | CRM dashboard · clients · policies · interactions · bank history · client + portfolio reports · the `/dashboard` Overview | `src/features/crm/` |
| [autonomous-agent/](./autonomous-agent/CONTEXT.md) | Agent ecosystem + Mac-Mini agent state | outside `src/` — `.claude/agents/`, `scripts/` |

**AppBase-template leftovers** — kept for reference, not describing this app's shipped surface:

| Doc | Note |
|---|---|
| `CLIENT_PROFILES_MODULE.md` | 2026-04-26 template-era client-profiles module — predates the CRM merge; superseded by `crm/CRM_MODULE.md` |
| `SPATIAL_FEATURES_COORDINATE_SYSTEM.md` | 2025 PostGIS / OneMap notes — no spatial feature ships in this app |

The old JLCode-portal domains (claiming · NAS · OT calculation · payslip · quotations · purchase orders · NCE · material requests · work-entry · …) were **never merged into this repo** and neither their doc folders nor their `src/features/` folders exist. A reference to any of them is template drift — delete it.

## Before working here

- "How it works today" stays · "how to build/change it" → `docs/05-implementation/`
- Every authed feature page renders on the light Kopi Studio palette inside the `AppSidebar` rail — read [.claude/rules/light-theme.md](../../.claude/rules/light-theme.md) before describing any UI.
- Naming + headers: `.claude/rules/documentation.md`
