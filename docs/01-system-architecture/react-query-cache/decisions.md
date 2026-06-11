# Decisions — React Query Cache

**Created**: 2026-04-20 SGT
**Last Updated**: 2026-04-20 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md) · Sibling: [lessons.md](./lessons.md)

## Overview
Append-only log of significant decisions for the React Query cache standard. Read before starting work. Append after making a decision worth preserving.
To mark a decision as no longer applicable: prepend `~~[SUPERSEDED YYYY-MM-DD]~~` to the title line and add a note referencing what replaced it.

---

## 2026-04-19 — ESLint `error` on hardcoded `queryKey` literals
**Decision**: `queryKey: ['string', ...]` literal in `useQuery` / `useMutation` / `invalidateQueries` / `removeQueries` is a CI-blocking error.
**Why**: Warning-only allowed regressions — Dec-2025 "100% migrated" claim silently broke because new hardcoded keys slipped in. Lint `error` closes the loop.
**Impact**: See [eslint.config.js](../../../eslint.config.js) and [ENFORCEMENT.md](./ENFORCEMENT.md). PRs with violations cannot merge.

## 2026-04-19 — `useMutation` banned in `src/components/**`
**Decision**: All `useMutation` must live in `src/hooks/use<Entity>.ts` or a feature hooks folder (`src/features/<name>/hooks/`, `src/components/<area>/hooks/`). Lint `error` in CI.
**Why**: Hooks enforce the `onSuccess → invalidate` fan-out by convention. Component inlines invite forgetting — that's how Dec-2025 claimed completion while 49+ component mutations still existed.
**Impact**: W21-3 extracted the first 11; W07/W09 fold the rest into shared primitives + per-module migration.

## 2026-04-19 — Canonical invalidation helpers: `invalidateEntity.<name>(qc)` + `invalidateDashboards(qc)`
**Decision**: Mutations use these helpers rather than hand-rolled `queryClient.invalidateQueries({ queryKey: ... })`.
**Why**: Ad-hoc keys miss dashboards. Helpers bundle the full fan-out (every role dashboard + count root + entity root) so adding new dashboards later doesn't require touching every call site.
**Impact**: See [`src/utils/queryKeys.ts`](../../../src/utils/queryKeys.ts) for definitions. All new mutations use them; W21-2 wired the first 17 hooks.

## 2026-04-20 — Promote standard to workspace folder
**Decision**: Split the flat `react-query-cache/CONTEXT.md` (38k chars, 2.5× over the 15k reference-doc ceiling) into a folder workspace at `docs/01-system-architecture/react-query-cache/` with CONTEXT + FACTORY + INVALIDATION + USAGE + MIGRATION + ENFORCEMENT sub-guides and sibling `decisions.md` / `lessons.md`.
**Why**: Single file was unscannable; sub-topics naturally split; accumulating decisions/lessons needed a home per DECISIONS_LESSONS_PATTERN. Archived the Dec-2025 migration log into `_archive/` so it stays searchable but doesn't bloat the live standard.
**Impact**: Old flat path replaced by a 1-line pointer stub preserving 38 inbound links. [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md) points at the new `CONTEXT.md`. Pattern documented by [`.claude/commands/align-module-docs.md`](../../../.claude/commands/align-module-docs.md) for reuse during W09.
