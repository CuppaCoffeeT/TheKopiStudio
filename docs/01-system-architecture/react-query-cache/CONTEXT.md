# React Query Cache — Workspace

**Last Updated**: 2026-04-20 SGT

Mandatory standard for React Query cache management: centralized query key factories, comprehensive invalidation, ESLint enforcement. Prevents stale-data bugs after CRUD operations.

## Navigation

| File | Purpose |
|------|---------|
| [FACTORY.md](./FACTORY.md) | Architecture principles + `queryKeys` factory pattern (`src/utils/queryKeys.ts`) |
| [INVALIDATION.md](./INVALIDATION.md) | When/what to invalidate · cross-module bubble rule · `invalidateEntity` / `invalidateDashboards` helpers |
| [INVALIDATION_CONFIG.md](./INVALIDATION_CONFIG.md) | Global QueryClient defaults + per-query `staleTime` tuning |
| [USAGE.md](./USAGE.md) | Query/mutation/component patterns + best practices |
| [USAGE_TESTING.md](./USAGE_TESTING.md) | Verification checklist + codebase examples |
| [MIGRATION.md](./MIGRATION.md) | Per-entity migration checklist + implementation checklist |
| [MIGRATION_TROUBLESHOOTING.md](./MIGRATION_TROUBLESHOOTING.md) | Stale data · request-storm · TypeScript-error recipes |
| [ENFORCEMENT.md](./ENFORCEMENT.md) | W21 correction (Apr 2026) · typed Supabase wrapper · ESLint rules (`error` in CI) |
| [decisions.md](./decisions.md) | Settled decisions — follow these |
| [lessons.md](./lessons.md) | Past failures — check before repeating |
| [_archive/](./_archive/) | Historical migration log (Dec 2025) · future-enhancements wishlist |

## Before working here

- **New code**: use `queryKeys.<entity>.<type>(...)` from [src/utils/queryKeys.ts](../../../src/utils/queryKeys.ts). Hardcoded literals are a lint `error`.
- **Mutations**: live in `src/hooks/use<Entity>.ts` (or feature hooks folder) — **never** inline in `src/components/**`. Lint `error`.
- **Invalidation fan-out**: every `onSuccess` invalidates scoped + global + dashboards. Prefer `invalidateEntity.<name>(qc)` + `invalidateDashboards(qc)` over ad-hoc keys.
- **Cross-module bubble**: adding an entity from a parent view (e.g. client contact from Project Detail) MUST invalidate the global entity root, not just the parent-scoped key. Otherwise the entity's own list serves stale cache.

## Decisions & Lessons

**Read these BEFORE starting work in this workspace.**
- [decisions.md](./decisions.md) — Settled decisions. Follow these, don't re-litigate.
- [lessons.md](./lessons.md) — Past failures. Check if your current approach has been tried and failed before.

## 📚 Related Documentation
- [docs/01-system-architecture/SUPABASE_QUERY_STANDARDS.md](../SUPABASE_QUERY_STANDARDS.md) — query shape (`.range()`, `.limit()`, `.single()`)
- [docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md](../../99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md) — W21 reconciliation card
- [.claude/rules/react-query.md](../../../.claude/rules/react-query.md) — auto-loaded rule for code edits
- [eslint.config.js](../../../eslint.config.js) — enforcement rules
