# Meta Documentation
> Last updated: 2026-07-27

Standards, methodologies, and meta-documentation about how the documentation system itself works.

## What belongs here

- Documentation organization standards
- Context methodology and architecture standards
- Meta-documentation about the docs system

## What does NOT belong here

- Feature documentation → `docs/03-features/`
- Operations SOPs → `docs/06-operations/`

## Navigation

| File | Covers |
|------|--------|
| `DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md` | Doc organization standards and templates |
| `INTERPRETABLE_CONTEXT_METHODOLOGY.md` | Context methodology for AI-readable docs |
| `TOKEN_BUDGET.md` | Per-file size ceilings for `.md` files (CLAUDE.md, CONTEXT.md, guides, refs) |
| `WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md` | MWP workspace and agent architecture standard |

## Before working here

- Context map: [`../CONTEXT_MAP.md`](../CONTEXT_MAP.md)
- Master index: [`../DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md)
- Doc rules: `.claude/rules/documentation.md`
- `WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md` supersedes `DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md` on folder layout — when they disagree, the STANDARD wins
