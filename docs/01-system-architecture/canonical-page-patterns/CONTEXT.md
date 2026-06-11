# Canonical Page Patterns — Archetype Specs

**Last Updated**: 2026-05-31 SGT
**Status**: 🟢 Production

The six canonical "build/migrate a page" patterns, grouped here so a single archetype lookup is one folder away. Read the matching pattern before building or migrating a page; it is the source of truth for that archetype's primitive composition, folder shape, and compliance gates.

## Scope

**Belongs**: per-archetype canonical page patterns + the Bulletproof-React feature-folder shape.\
**Doesn't**: cross-cutting system design (→ parent `../CONTEXT.md`); design tokens/primitives (→ `../DESIGN_SYSTEM.md` + `src/components/primitives/CONTEXT.md`).

## Navigation

| Pattern | Use when |
|---------|----------|
| `CANONICAL_LIST_TABLE_PATTERN.md` | Building or migrating a list/table page |
| `CANONICAL_DETAIL_PAGE_PATTERN.md` | Building or migrating a detail page |
| `CANONICAL_FORM_PAGE_PATTERN.md` | Building or migrating a create/edit form |
| `CANONICAL_DASHBOARD_PAGE_PATTERN.md` | Building or migrating a dashboard |
| `CANONICAL_SETTINGS_PAGE_PATTERN.md` | Building or migrating a settings/admin page |
| `CANONICAL_FEATURE_FOLDER.md` | Structuring a feature folder (Bulletproof-React) |

## 📚 Related

- [../CONTEXT.md](../CONTEXT.md) — system-architecture folder index
- [../APPLICATION_ARCHITECTURE.md](../APPLICATION_ARCHITECTURE.md) — app structure, providers, routing
- [../../DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md) — master doc index
