# Canonical Feature Folder

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-05-31 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The **one canonical internal shape** for every folder under `src/features/` (51 feature folders). When you create a feature or touch its structure, conform to this shape — no variations.

**Read this first** if your task is: "scaffold a new feature", "where does this file go?", or "split a monolith feature".

Router-style doc — links to the SOP + real examples. Does not duplicate code.

## The Canonical Shape

```
src/features/<feature>/
  api/          ← Supabase calls: <entity>Service / *Queries (.range()/.limit()/.single())
  hooks/        ← React Query hooks: use<Entity>List, use<Entity>Detail, mutations
  lib/          ← pure logic: schemas (zod), mappers, formatters, constants, columns/rows
  components/    ← feature-local UI (used by THIS feature only)
  pages/         ← route entry components (one per route)
  types.ts       ← flat file of feature types (NOT a types/ dir) — where the feature exports types
  index.ts       ← public barrel — the only cross-feature import surface — where the feature has a public surface
  CONTEXT.md     ← Layer-2 routing doc for the feature
```

Not every feature has all 8 entries. `types.ts` appears only where the feature exports its own types (26 of 51 features); `index.ts` appears where the feature has a cross-feature public surface (48 of 51). `api/` appears where the feature owns data. `hooks/`/`lib/`/`components/` appear as needed.

| Folder/file | Holds | Rule |
|-------------|-------|------|
| `api/` | data-access functions | every `.select()` has `.range()`/`.limit()`/`.single()` (query-compliance) |
| `hooks/` | React Query `useQuery`/`useMutation` wrappers | `queryKeys` factory; mutations invalidate keys (react-query) |
| `lib/` | pure, side-effect-free logic + zod schemas + column/row builders | no React render, no Supabase |
| `components/` | feature-local presentation | compose primitives; **not** imported by other features |
| `pages/` | route components | one archetype each (LIST/DETAIL/DASHBOARD/FORM/SETTINGS/TOOL) |
| `types.ts` | TS types/interfaces | **flat file**, not a `types/` directory |
| `index.ts` | barrel of the feature's public API | other features import only from here |
| `CONTEXT.md` | routing + scope for the feature | one per feature |

`api/` is present where the feature owns data; a pure-UI or aggregator feature may omit it. `hooks/`, `lib/`, `components/` appear as needed but never under different names. Reference: `src/features/quotations/` has the full operational shape (`api/ components/ hooks/ lib/ pages/ index.ts CONTEXT.md`) — note it has **no** `types.ts` (its types live alongside the code), confirming `types.ts`/`index.ts` are present only where the feature exports types / has a public surface, not in every feature.

> **Enforced by `no-stray-domain-components`** (dependency-cruiser, severity `error`) — `src/components/` may hold only `primitives/`, `ui/`, `shared/`; new cross-feature surfaces go to `src/components/shared/<domain>/`, never a new top-level `src/components/<domain>/`.

## The under-200-LOC decomposition rule

Every component file stays **under 200 LOC**. When one grows past it:
- Extract per-section / per-tab / per-panel children into `components/`.
- Move pure logic (validation, mapping, formatting, column/row builders) into `lib/`.
- Move data access into `api/` + `hooks/`.
- A `pages/` component should be thin: load data via a hook, render the archetype frame, delegate bodies to `components/`.

This is the same rule enforced by the W09 migration decomposition step.

## Sub-folder features (large domains)

A large domain may nest canonical-shaped sub-folders. `src/features/fieldops/` is the reference: it has the top-level shape (`api/ components/ hooks/ lib/ CONTEXT.md`) **plus** seven sub-folders that each repeat the shape:

```
src/features/fieldops/
  work-entry/  trial-trench/  general-works/  ot/  drafts/  review/  coordinator-review/
        └─ each: api/ components/ hooks/ lib/ pages/ …
```

These seven were merged from formerly-separate feature folders. Sub-folders share the parent's `index.ts` barrel and `CONTEXT.md` router. Use this only when 5+ related surfaces would otherwise crowd one `components/` folder.

## Rules

- Cross-feature imports go through `index.ts` only — never deep-import another feature's `components/` or `lib/` (dependency-cruiser `no-cross-feature-imports`).
- A surface used by **2+ features** is promoted to `src/components/shared/<domain>/`, not duplicated. See [src/components/shared/CONTEXT.md](../../../src/components/shared/CONTEXT.md).
- A generic, design-spec'd, everywhere-reusable component goes to `src/components/primitives/`, not `shared/`.
- New feature scaffolding follows [MODULE_CREATION_SOP.md](../../06-operations/MODULE_CREATION_SOP.md) step by step.

## 📚 Related Documentation

- [MODULE_CREATION_SOP.md](../../06-operations/MODULE_CREATION_SOP.md) — how to scaffold a new feature folder
- [CANONICAL_LIST_TABLE_PATTERN.md](./CANONICAL_LIST_TABLE_PATTERN.md) · [CANONICAL_DETAIL_PAGE_PATTERN.md](./CANONICAL_DETAIL_PAGE_PATTERN.md) · [CANONICAL_FORM_PAGE_PATTERN.md](./CANONICAL_FORM_PAGE_PATTERN.md) · [CANONICAL_DASHBOARD_PAGE_PATTERN.md](./CANONICAL_DASHBOARD_PAGE_PATTERN.md) · [CANONICAL_SETTINGS_PAGE_PATTERN.md](./CANONICAL_SETTINGS_PAGE_PATTERN.md) — the archetypes a `pages/` component can be
- [src/components/shared/CONTEXT.md](../../../src/components/shared/CONTEXT.md) — the ≥2-feature promotion lane
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — primitive inventory
- [.claude/rules/react-query.md](../../../.claude/rules/react-query.md) — `queryKeys` + invalidation pattern
- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md)
