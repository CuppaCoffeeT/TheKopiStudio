# Operations & Maintenance
> Last updated: 2026-07-27

SOPs, migration governance, code hygiene, E2E runbooks, and operational procedures for running the app.

## What belongs here

- Migration governance and reconstruction history
- Code hygiene strategies and maintenance procedures
- Module creation + compliance SOPs
- E2E test-runner runbooks
- Troubleshooting guides for operational issues

## What does NOT belong here

- Feature specifications → `docs/03-features/`
- Implementation plans → `docs/05-implementation/active/`
- Security policies → `docs/02-security/`

## Navigation

| File/Folder | Covers |
|-------------|--------|
| `migrations/MIGRATION_GOVERNANCE_FRAMEWORK.md` | Migration review and approval process |
| `migrations/MIGRATION_SYSTEM_RECONSTRUCTION.md` | History of migration system rebuild |
| `CODE_HYGIENE_STRATEGY.md` | Code quality maintenance strategy |
| `MODULE_CREATION_SOP.md` | Step-by-step guide for creating new modules |
| `MODULE_COMPLIANCE_CHECKLIST.md` | The Definition-of-Done gates `/check-module` audits against |
| `PARALLEL_E2E_TESTING.md` | Running the Playwright suite across N parallel workers |
| `MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md` | The nightly Mac-Mini E2E + self-heal pipeline |
| `REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md` | React Query debugging |
| `ROOT_CLEANUP_AND_FILE_STANDARDS.md` | Project root file organization |

`business/SCOPE.md`, `business/JL_WORKFLOW_OVERVIEW.md` and `AI_QUOTATION_DATA_WIPE_2026-04-23.md` were AppBase-template / JLCode-portal docs and are **not present in this repo** — do not link them. There is no `business/` folder here.

## Before working here

- Migration execution: `supabase/CONTEXT.md` (MCP only, never CLI)
- Module system: `docs/01-system-architecture/MODULE_SYSTEM.md`
- Code hygiene rules: `.claude/rules/code-hygiene.md`
- Product context needed? Start with root [CONTEXT.md](../../CONTEXT.md) and [docs/ONBOARDING.md](../ONBOARDING.md)
