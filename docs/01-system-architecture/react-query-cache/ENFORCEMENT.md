# Enforcement — ESLint · Typed Wrapper · W21 Correction

**Created**: 2026-04-19 SGT · **Last Updated**: 2026-04-20 SGT
**Status**: 🟢 Production · **Priority**: 🔴 Critical

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Regression is blocked at the linter level. Hardcoded `queryKey` literals and inline `useMutation` in component files are ESLint `error`s as of W21-4 (2026-04-19). The typed Supabase wrapper + Vitest runner (W07 Phase 2) add a second layer that enforces query compliance at the type level.

## ⚠️ 2026-04-19 — Correction

**The December 2025 "34/34 migrated · 100% complete" claim was wrong.** That pass only migrated `src/hooks/*` files; it did not touch `src/components/**` and `src/pages/**`. As of 2026-04-16 an audit found:

| Evidence | Count |
|---|---|
| Files using hardcoded `queryKey: ['string', ...]` literals | 33+ |
| `useMutation(` calls inside component files (not hooks) | 49+ |
| Mutations with `onSuccess → invalidateQueries` chain | 58 vs 124+ total |

The actual completion pass is being done by **[W21 React Query cache fix](../../../docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md)** in four sub-tasks:

| Sub-task | Commit | Status |
|---|---|---|
| **W21-1** hardcoded keys → factory (28 files) | `28dedce` | ✅ 2026-04-18 |
| **W21-2** wire `invalidateDashboards()` into entity mutations (17 hooks) | `f6b513f` | ✅ 2026-04-19 |
| **W21-3** extract component-inline mutations to hooks (first 4 extractions, 11 mutations) | `016219b` | ✅ 2026-04-19 |
| **W21-4** ESLint rule (`error` in CI) + this correction | `a8fd59f`+ | ✅ 2026-04-19 |

---

## 🚨 ESLint rules (as of W21-4)

See [eslint.config.js](../../../eslint.config.js). Both rules fire as **errors** in CI — PRs with violations cannot merge.

### Rule 1 — No hardcoded query keys

- `queryKey: ['string', ...]` literal in `useQuery` / `useMutation` / `invalidateQueries` / `removeQueries` → **error**.
- Must use `queryKeys.<entity>.<type>(...)` from [`src/utils/queryKeys.ts`](../../../src/utils/queryKeys.ts).

```javascript
// eslint.config.js (excerpt)
"no-restricted-syntax": [
  "error",
  {
    selector: "CallExpression[callee.name='useQuery'] Property[key.name='queryKey'] ArrayExpression > Literal:first-child",
    message: "Use queryKeys factory from @/utils/queryKeys. See docs/01-system-architecture/react-query-cache/FACTORY.md"
  },
  {
    selector: "CallExpression[callee.property.name='invalidateQueries'] Property[key.name='queryKey'] ArrayExpression > Literal:first-child",
    message: "Use queryKeys factory from @/utils/queryKeys for cache invalidations."
  }
]
```

### Rule 2 — No `useMutation` in components

- `useMutation(` inside `src/components/**` → **error**.
- Must live in `src/hooks/use<Entity>.ts` or a feature-scoped hooks folder (`src/features/<name>/hooks/` or `src/components/<area>/hooks/`).
- **Why**: hooks enforce the `onSuccess → invalidate` pattern via convention. Component inlines invite forgetting.

### Open items tracked in W21

- Remaining ~33 component files with inline mutations (mostly `src/components/quotation-settings/*` CRUD forms) — folding into W07 shared primitives + W09 per-module migration. The ESLint rule blocks new ones from landing.
- Third W21-4 rule *"require `onSuccess` on any `useMutation` whose `mutationFn` calls Supabase `.insert/.update/.delete/.upsert`"* — deferred. Pure AST selectors can't express the conjunctive check cleanly. A custom ESLint plugin or semgrep rule is the follow-up.

---

## 🧪 Typed Supabase wrapper + Vitest runner (W07 Phase 2, 2026-04-19)

Two infra primitives landed alongside these rules:

- **Typed Supabase wrapper** — [`src/lib/supabase/typed-client.ts`](../../../src/lib/supabase/typed-client.ts). Exposes `fetchPage` / `fetchOne` / `fetchDropdown` / `fetchCount` — each forces the enforced terminator (`.range`, `.single`, `.limit(5000)`, `{ head: true }`) at the type level so callers can't write a silently-truncated `.select('*')`. Use these wrappers inside feature `api/*.ts` modules to keep queries compliant by construction rather than by post-hoc ESLint sweep.
- **Vitest runner** — `npm test` / `npm run test:run` / `npm run test:ui`. Config at [`vitest.config.ts`](../../../vitest.config.ts) + setup at [`src/test/setup.ts`](../../../src/test/setup.ts). Covers unit tests colocated with primitives (`src/**/*.test.tsx`). Playwright still owns E2E at `tests/workflows/`. Use vitest tests to pin query-key factories + mutation-invalidation behaviour at the unit level — failures caught here surface before the full e2e run.

---

## 🚨 Code Review Requirements

**ALL pull requests with query/mutation changes MUST:**

1. ✅ Use `queryKeys` factory (no hardcoded keys)
2. ✅ Include comprehensive invalidation in mutations — scoped + `invalidateEntity.<name>(qc)` + `invalidateDashboards(qc)`
3. ✅ Place mutations in hook files, not components
4. ✅ Pass ESLint (`npm run lint`) and Vitest (`npm run test:run`) cleanly
5. ✅ Include manual testing checklist results (see [USAGE.md](./USAGE.md#🧪-testing-checklist))
6. ✅ No React Query console warnings

## 📚 Related
- [CONTEXT.md](./CONTEXT.md) — workspace router (start here)
- [FACTORY.md](./FACTORY.md) — the factory the lint rules require
- [INVALIDATION.md](./INVALIDATION.md) — fan-out patterns including cross-module bubble
- [USAGE.md](./USAGE.md) — mutation-in-hook patterns
- [MIGRATION.md](./MIGRATION.md) — per-entity migration checklist
- [decisions.md](./decisions.md) — enforcement decisions (ESLint error, mutations-in-hooks)
- [lessons.md](./lessons.md) — Dec-2025 false-completion lesson (origin of enforcement)
- [docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md](../../../docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md) — W21 reconciliation card
- [.claude/rules/react-query.md](../../../.claude/rules/react-query.md) — auto-loaded rule
