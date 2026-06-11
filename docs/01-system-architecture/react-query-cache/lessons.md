# Lessons — React Query Cache

**Created**: 2026-04-20 SGT
**Last Updated**: 2026-04-20 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md) · Sibling: [decisions.md](./decisions.md)

## Overview
Append-only log of things that went wrong and what to do instead. Read before starting work. Append when discovering a non-obvious failure.
To mark a lesson as no longer applicable: prepend `~~[SUPERSEDED YYYY-MM-DD]~~` to the title line and add a note referencing what replaced it.

---

## 2026-04-19 — Dec-2025 "100% migrated" claim was false
**What happened**: Doc declared 34/34 entities migrated to centralized factory on 2025-11-30. 2026-04-16 audit found 33+ files with hardcoded `queryKey` literals and 49+ inline `useMutation` calls in components.
**Root cause**: Migration scope was declared against `src/hooks/*` only; `src/components/**` and `src/pages/**` were never audited. No lint `error` blocked new hardcoded keys from landing after the claim.
**Fix**: W21 4-part reconciliation (W21-1 hardcoded-keys sweep, W21-2 `invalidateDashboards` wiring, W21-3 component→hook extraction, W21-4 ESLint `error` + this correction). Never again declare migration complete without a full-codebase grep and an enforced lint rule. See [ENFORCEMENT.md](./ENFORCEMENT.md).

## 2026-04-20 — Cross-module mutation invalidation gap (W09 trigger)
**What happened**: User adds a Client Contact from Project Detail → presses Back → opens the Client Contacts module → searches → not found until hard refresh.
**Root cause**: The mutation invalidated only the parent-scoped key (`queryKeys.projects.clientContacts(projectId)`) and forgot the global entity root (`queryKeys.clientContacts.all`) and dashboard counts. Dev didn't see the bug because re-mounting the list page during testing triggered a refetch; only a real Back-button navigation (keeps component in cache) surfaced the stale data.
**Fix**: Every mutation's `onSuccess` must invalidate **all roots the entity appears in** — parent-scoped + global entity root + dashboards. Use `invalidateEntity.<name>(qc)` + `invalidateDashboards(qc)` so adding new dashboards later doesn't miss call sites. Covered by W09 per-module migration; [INVALIDATION.md](./INVALIDATION.md) now names the rule explicitly.
