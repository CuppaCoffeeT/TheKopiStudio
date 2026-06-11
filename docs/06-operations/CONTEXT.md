# Operations & Maintenance
> Last updated: 2026-04-23

Business processes, SOPs, migration governance, code hygiene, and operational procedures for running the portal.

## What belongs here

- Business workflow documentation and SOPs
- Migration governance and reconstruction history
- Code hygiene strategies and maintenance procedures
- Module creation SOPs
- Troubleshooting guides for operational issues

## What does NOT belong here

- Feature specifications → `docs/03-features/`
- Implementation plans → `docs/05-implementation/active/`
- Security policies → `docs/02-security/`

## Navigation

| File/Folder | Covers |
|-------------|--------|
| `business/SCOPE.md` | Business scope and project overview — start here if new |
| `business/JL_WORKFLOW_OVERVIEW.md` | End-to-end Your Company workflow |
| `migrations/MIGRATION_GOVERNANCE_FRAMEWORK.md` | Migration review and approval process |
| `migrations/MIGRATION_SYSTEM_RECONSTRUCTION.md` | History of migration system rebuild |
| `CODE_HYGIENE_STRATEGY.md` | Code quality maintenance strategy |
| `MODULE_CREATION_SOP.md` | Step-by-step guide for creating new modules |
| `REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md` | React Query debugging |
| `ROOT_CLEANUP_AND_FILE_STANDARDS.md` | Project root file organization |
| `AI_QUOTATION_DATA_WIPE_2026-04-23.md` | One-off audit: purge of Aigent rows + `quotations.notes_for_ai` reset |

## Before working here

- Migration execution: `supabase/CONTEXT.md` (MCP only, never CLI)
- Module system: `docs/01-system-architecture/MODULE_SYSTEM.md`
- Code hygiene rules: `.claude/rules/code-hygiene.md`
- Business context needed? Start with `business/SCOPE.md`
