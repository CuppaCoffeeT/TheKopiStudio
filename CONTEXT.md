# Prospect Profiler — Routing (Read First)

Entry router for agents + humans. **Load on demand — route, don't bulk-load.** Open only the one doc your task needs, then follow that doc's own links down. Always-loaded files (`CLAUDE.md`, every `CONTEXT.md`) cost tokens on every turn, so they route — they don't carry detail. Full model: [docs/ONBOARDING.md](docs/ONBOARDING.md).

## Task → read first

| Task | Read first | Skill |
|------|-----------|-------|
| Write or edit code | src/CONTEXT.md | — |
| Understand feature/system | docs/CONTEXT.md | — |
| Database migration | supabase/CONTEXT.md | — |
| Write documentation | docs/CONTEXT.md | — |
| Review doc health | docs/CONTEXT.md | /check-docs |
| Plan a new feature | docs/05-implementation/CONTEXT.md | — |
| Write a PRD | docs/06-operations/MODULE_CREATION_SOP.md | /prd-write |
| Build a module from a PRD (orchestrated) | docs/06-operations/MODULE_CREATION_SOP.md | /prd-execute |
| Scaffold a new module skeleton | docs/06-operations/MODULE_CREATION_SOP.md | /create-module |
| Delete a module | docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md | /delete-module |
| Audit a module (DoD + a11y + mobile) | docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md | /check-module |
| Audit codebase vs the refactor standard | docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md | /check-repo |
| Build / migrate a list-table page | docs/01-system-architecture/canonical-page-patterns/CANONICAL_LIST_TABLE_PATTERN.md | — |
| Git workflow | — | /git-sync |
| System health | — | /health-check |
| Code quality scan | — | /code-hygiene |
| Audit CONTEXT.md files | docs/CONTEXT_MAP.md | /context-check |
| Audit context architecture | docs/99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md | /context-audit |

## 📚 Related
- [CLAUDE.md](CLAUDE.md) — project identity · Hard Rules · Naming (entry, always loaded)
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — how code + docs are organised (full)
- [docs/CONTEXT_MAP.md](docs/CONTEXT_MAP.md) — full routing tree
