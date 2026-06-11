# Documentation

~1,067 Markdown docs in 8 numbered categories — the project's knowledge base. Router only.

## What belongs / doesn't

Project docs in Markdown. NOT: app code → `src/` · migration SQL → `supabase/` · rules/commands → `.claude/`.

## Navigation

Layer 3 = permanent reference (updated when system changes). Layer 4 = temporary working plans (active → completed → archived).

| Category | Contains | Layer |
|----------|----------|-------|
| `01-system-architecture/` | Core systems: DB, modules, auth, timezone | 3 |
| `02-security/` | Security policies, auth flows, vuln analysis | 3 |
| `03-features/` | Feature specs — what features do + how they behave | 3 |
| `04-integrations/` | External services (email, file storage) | 3 |
| `05-implementation/` | Implementation plans — `active/` + `completed/` | 4 |
| `06-operations/` | Business processes, maintenance, SOPs | 3 |
| `99-meta/` | Standards + meta-documentation | 3 |
| `99-refactor/` | AppBase_REFACTOR system (2026 Q2) — backlog, cards | 4 |

## Cross-workspace routing

Docs hold the knowledge; implementations live elsewhere:

| Doc topic | Implementation in |
|-----------|-------------------|
| Architecture, design patterns | `src/features/<name>/`, `src/components/primitives/`, `src/utils/` |
| Feature behavior | `src/features/<name>/` (51 modules) · `src/pages/` (thin shells) |
| Schema, RLS, migrations | `supabase/migrations/` |
| Code patterns, conventions | `.claude/rules/` |

## Before working here

- Naming: `SCREAMING_SNAKE_CASE.md` · Header: Created, Last Updated, Status, Priority
- Register new docs in `DOCUMENTATION_INDEX.md` + add bidirectional links
- Standards: `.claude/rules/documentation.md`

## Related

- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) — full index
- [99-meta/TOKEN_BUDGET.md](./99-meta/TOKEN_BUDGET.md) — file-size budgets
