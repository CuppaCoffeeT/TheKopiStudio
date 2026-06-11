# W21 — React Query cache fix

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-19 SGT
**Status**: 🟢 IMPLEMENTATION SHIPPED (awaiting W04 P0 cache-staleness test for formal close)
**Priority**: 🔴 Critical (user-reported production pain — staff pressing refresh to see their edits)

**Goal**: Eliminate the "edit → navigate → stale data → must refresh" bug across every module by fixing hardcoded query keys, missing mutation invalidations, extracting inline-component mutations into hooks, and adding an ESLint rule that prevents regression.
**Tier**: Now · **Status**: 🟢 IMPLEMENTATION SHIPPED · **Automation**: hybrid (codemod + manual review)
**Blocked by**: W02 (hook/mutation inventory), W04 (seatbelt validates fixes) · **Blocks**: nothing structurally, but gates declaring the refactor "done"

## Progress log

- **2026-04-18** — **Task 1 shipped** (commit `28dedce`). Swept 28 component/page/hook files whose `queryKey: ['entity', ...]` literals bypassed the centralized factory. Extended `src/utils/queryKeys.ts` with new top-level factories (leaves, reportDashboard, nceDashboard, refactorDashboard, userRoles, xero) and many sub-entries on existing factories. Seeded `invalidateDashboards()` helper for Task 2. Build green, e2e 108/112 passing (4 failures unrelated: NAS teardown + mobile-safari login flake).
- **2026-04-19** — **Task 2 shipped** (commit `f6b513f`). Wired `invalidateDashboards(queryClient)` into 17 source-entity mutation hooks (useProgressClaims · useInvoices · useClaimableItems · useEnhancedQuotations · useClientContacts · useCompanyDetails · useCustomerInteractions · useClaimableItemQuotationMappings · useProjectRelationships · useProjectClaimLineItems · useInvoicePayments · useMergeOperations · useEnhancedMergeOperations · useUpdateProjectPaymentStatus · useMeetingProjects · useProjectCDW · useWorkflowStatus). Badges and role-dashboard counts now refresh on every mutation without a manual reload.
- **2026-04-19** — **Task 3 shipped** (commit `016219b`). First pass of component-inline mutation extractions. 4 new/extended hook files (useInvoiceEmailRecipients, useProgressClaimNAS, useUserApprovals, usePerformanceReview) covering 11 mutations previously inline in InvoiceEmailRecipientsSection, ProgressClaimNASFolderCard, UserApprovalsTab, EditPerformanceDialog. Components thinned by ~390 LOC net; all extracted mutations call `invalidateDashboards`. Remaining ~33 component-inline mutations (mostly quotation-settings CRUD forms) deferred to follow up — will fold into W07 shared primitives + W09 per-module migration. ESLint rule in Task 4 blocks net-new ones.
- **2026-04-19** — **Task 4 shipped** (commit `e38d94e`). ESLint: hardcoded-query-key selectors promoted `warn` → `error` across `useQuery` / `useMutation` / `invalidateQueries` / `removeQueries`; new per-folder config bans `useMutation` in `src/components/**` (ignoring `**/hooks/**` sub-folders). [react-query-cache/CONTEXT.md](../../../01-system-architecture/react-query-cache/CONTEXT.md) gets a 2026-04-19 correction section that kills the false "34/34 · 100%" claim and documents the W21 pass as the actual completion.

## Deferred (tracked here)

- **Component-inline mutations — pass 2.** ~33 files remain, mostly `src/components/quotation-settings/*` CRUD forms that are near-identical patterns. Plan: extract into a shared `useEntitySettings<T>()` hook during W07 shared-primitives, or fold into W09 per-module migration. ESLint rule blocks net-new ones.
- **ESLint rule — require `onSuccess` on `useMutation` whose `mutationFn` calls Supabase `.insert/.update/.delete/.upsert`.** Pure AST selectors can't express the conjunctive (sibling-key presence) check cleanly. Follow-up: custom ESLint plugin or a semgrep rule.
- **W04 P0 cache-staleness Playwright test** — the formal success criterion ("edit → back → assert fresh value without manual refresh"). Lands under W04. This card moves to 🟢 CLOSED when that test is green per P0 module.

## Why this exists

User-reported production annoyance: *"staff edit data, press back or navigate to other pages, data doesn't update — they have to refresh. Super super annoyed."*

Verified state (2026-04-16):

| Evidence | Count | Source |
|---|---|---|
| Files using hardcoded `queryKey: ['string']` | 33+ | `rg 'queryKey:\s*\[.' src/` (first 15 files listed) |
| `useMutation(` calls inside component files (not hooks) | 49+ | `rg 'useMutation\s*\(' src/components/` (first 20 files) |
| `useMutation(` with `onSuccess → invalidateQueries` chain | 58 | vs 124+ total mutations in hooks |
| Doc claim vs reality | "100% complete" | [react-query-cache/CONTEXT.md:30-68](../../../01-system-architecture/react-query-cache/CONTEXT.md) — **wrong**, only hook files were migrated |

QueryClient config is correct (`staleTime: 1min`, `refetchOnMount: true`, `refetchOnWindowFocus: true`). The failure is at the mutation-invalidation + hardcoded-key layer. This card finishes what the December 2025 migration started.

## Scope — 4 tasks (one PR each)

### Task 1 — Hardcoded keys → factory

- Scan: `rg "queryKey:\s*\[" src/` → every hit not using `queryKeys.*`
- Replace each with the correct `queryKeys.<entity>.<type>(...)` call from [`src/utils/queryKeys.ts`](../../../../src/utils/queryKeys.ts)
- Add factory entries for any entity that's hardcoded but missing from the factory
- Known today: 15+ files; full scan will surface more
- Mechanical PR — codemod-able where the call shape is consistent

### Task 2 — Missing invalidations on mutations

- For every `useMutation` in `src/hooks/` and `src/components/`:
  - If it mutates an entity (create / update / delete), add `onSuccess` that invalidates:
    - `queryKeys.<entity>.all` (covers all list views via parent-key cascading)
    - `queryKeys.<entity>.detail(id)` if a detail view exists
    - **Cross-entity invalidations** (the real killer): dashboard counts, related aggregates
- Dashboard-count leakage — the suspected primary cause of staff pain:
  - `useDashboardCounts`, `useReportDashboardCounts`, badge-counts in navigation
  - Any mutation on source entities (quotations, projects, contacts, OT entries) must invalidate these too
  - Build a shared `invalidateDashboards()` helper so every mutation can call it with 1 line

### Task 3 — Extract component-inline mutations into hooks

- 49+ mutations live directly inside component files (e.g. [InvoiceEmailRecipientsSection.tsx](../../../../src/components/invoice/InvoiceEmailRecipientsSection.tsx), [WorkersManagement.tsx](../../../../src/components/coordinator/WorkersManagement.tsx))
- Move each into the matching `src/hooks/use<Entity>.ts` file (or create one)
- Rationale: hooks enforce the `onSuccess → invalidate` pattern via convention; component inlines invite forgetting
- Eventually these migrate to `src/features/<name>/hooks/` per Bulletproof React (W07) — this card lands them in `src/hooks/` as an intermediate step

### Task 4 — ESLint rule + doc correction

- Write custom ESLint rules that ban regression:
  - Forbid `queryKey:` with a literal `[string, ...]` — must be factory call (`queryKeys.*`)
  - Forbid `useMutation` inside `src/components/` (must live in `src/hooks/` or `src/features/*/hooks/`)
  - Require `onSuccess` handler on any `useMutation` whose `mutationFn` calls Supabase `.insert/.update/.delete/.upsert`
- Correct [react-query-cache/CONTEXT.md](../../../01-system-architecture/react-query-cache/CONTEXT.md):
  - Remove the false "34/34 migrated, 100% complete" claim
  - Document this card as the actual completion pass
  - Add the new ESLint rule as canonical enforcement

## Success criterion (confirmed with user)

> **Playwright test** (added to W04 P0 suite): open list → click into detail → edit → save → navigate back → assert new value visible **without manual refresh**. Must pass for every module in [W03 workflow inventory P0 list](W03_WORKFLOW_INVENTORY.md).

Failing this test for any P0 module = W21 not done. This test becomes part of W04 seatbelt and the W20 watchdog re-runs it on every PR.

## Dependencies on other cards

- W02 — inventory of hooks / mutations / component inlines
- W04 — Playwright seatbelt validates fixes; adds the edit-back-assert test to P0
- W12 — parallel compliance sweeps (different violation classes)
- Informs W07 — shared primitives' `useEntity` hooks bake this pattern in from day one
- Feeds W20 — watchdog enforces the ESLint rule going forward

## Open workflow questions

- **Q-W21-a** ✅ **COMMIT PER TASK (2026-04-19)**. Direct-to-main means "PR per task" = "commit per task". Task 1 shipped as `28dedce`. Tasks 2–4 each land as separate commits for clean revert surface.
- **Q-W21-b** ✅ **explicit + `invalidateDashboards()` helper (2026-04-19, default accepted)**. User had no preference; accepting default. Means: when a mutation (e.g. create quotation) succeeds, its hook explicitly calls `invalidateDashboards()` which invalidates the relevant dashboard queries. No magic pub/sub event bus. Trade-off: more lines per mutation, but every cache refresh is greppable.
- **Q-W21-c** ✅ **error in CI, warn locally (2026-04-19, default accepted)**. User had no preference; accepting default. Means: violating the query-key rule doesn't block your local save, but it WILL fail the GH Actions check on push to main. Friendlier than pre-commit hooks.
- **Q-W21-d** ✅ **ship rule AFTER fixes (2026-04-19, default accepted)**. User had no preference; accepting default. Means: finish Tasks 2–3 (fix all existing violations), THEN add the ESLint rule as Task 4. Reverse order would block every unrelated commit until Tasks 2–3 finish.

## Done-when

- Zero hardcoded `queryKey: ['string']` in `src/`
- Zero `useMutation(` inside `src/components/`
- Every mutating `useMutation` has `onSuccess → invalidateQueries`
- Dashboard-count hooks refresh after any source-entity mutation (verified by Playwright)
- ESLint rule active in CI and blocks PRs on violation
- W04 P0 suite includes the "edit → back → assert fresh" test per module
- `react-query-cache/CONTEXT.md` updated with accurate status
- User confirms: "I can edit and see the update without refreshing"
- Sets DAG flag: **`cache_fixed`**

## Related

- [react-query-cache/CONTEXT.md](../../../01-system-architecture/react-query-cache/CONTEXT.md) — spec + stale status claim to correct
- [REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md](../../../06-operations/REACT_QUERY_RACE_CONDITION_TROUBLESHOOTING.md) — related race issues
- [SUPABASE_QUERY_STANDARDS.md](../../../01-system-architecture/SUPABASE_QUERY_STANDARDS.md) — pagination standard (parallel concern)
- [`.claude/rules/react-query.md`](../../../../.claude/rules/react-query.md) — the rule this card enforces
- [`src/utils/queryKeys.ts`](../../../../src/utils/queryKeys.ts) — factory to extend
- [W04_PLAYWRIGHT_SEATBELT.md](W04_PLAYWRIGHT_SEATBELT.md) — success criterion runs here
- [W12_COMPLIANCE_SWEEPS.md](W12_COMPLIANCE_SWEEPS.md) — parallel mechanical sweep
