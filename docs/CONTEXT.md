# Documentation

> Last updated: 2026-07-27

~166 Markdown docs in 8 numbered categories — the project's knowledge base. Router only.

Many Layer-3 docs here are inherited AppBase-template reference material describing systems this app never shipped. Each category `CONTEXT.md` marks its own template-era rows; when one disagrees with the code, **the code wins** — fix the doc.

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
| Feature behavior | `src/features/` — 4 feature folders (`crm/` · `profiler/` · `account-settings/` · `manage-accounts/`) · `src/pages/` (3 unauthed shells: `Login` · `NotFound` · `RouteError`) |
| Shell + navigation | `src/components/primitives/shell/AppSidebar.tsx` (the 200px rail — the primary nav) · `AppHeaderMobileBar.tsx` (< lg) · `src/components/shared/app-shell/DashboardLayout.tsx` |
| Colour, type, surfaces | `src/index.css` (single `:root`, light-pinned) — spec at `docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md` |
| Schema, RLS, migrations | `supabase/migrations/` |
| Code patterns, conventions | `.claude/rules/` |

## Before working here

- Naming: `SCREAMING_SNAKE_CASE.md` · Header: Created, Last Updated, Status, Priority
- Register new docs in `DOCUMENTATION_INDEX.md` + add bidirectional links
- Standards: `.claude/rules/documentation.md`
- **Deleted names**: check [99-refactor/_system/DEPRECATIONS.md](./99-refactor/_system/DEPRECATIONS.md) before citing any component or hook — the 2026-07-25 redesign deleted the top masthead and the module-launcher primitives.

## Related

- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) — full index
- [CONTEXT_MAP.md](./CONTEXT_MAP.md) — CONTEXT.md coverage map
- [ONBOARDING.md](./ONBOARDING.md) — new-contributor entry point
- [99-meta/TOKEN_BUDGET.md](./99-meta/TOKEN_BUDGET.md) — file-size budgets
- [99-refactor/_system/DEPRECATIONS.md](./99-refactor/_system/DEPRECATIONS.md) — what was deleted, and what replaced it
