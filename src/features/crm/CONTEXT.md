# CRM — Feature Memory

Insurance CRM rebuild (IN BUILD — P1 scaffold only): client book + policies + interactions + bank history + dashboard. One folder, two module rows `/crm` + `/clients` (`lib/decisions.md`). PRD: `docs/05-implementation/active/CRM_MODULE_PRD.md` (port map + finance rules — read before extending).

## Map (P1 state)

- `pages/` — `CrmDashboardPage` (AppHeaderShell + 4 KpiTiles on typed EMPTY_STATS; P3 wires stats) · `ClientsListPage` (ListPageFrame, URL search/pagination, empty book states; P3 wires data) · `ClientDetailPage` (DetailPageFrame, not-found body; P4 adds tabs)
- `types.ts` — DB row re-exports for the 5 CRM tables (append model types below)
- `lib/` — `decisions.md` · `finance.ts` (exact finance.js port; refYear injectable, `currentRefYear()` = app clock) · `financeReport.ts` (caller-inline report math: bank@0.5% to 65, future CI/ECI ×1.06^yrs, 10×/5×/1.5× gaps, RA assessment, premium split) · `followUps.ts` (badge logic, refDate injectable) · `mapping.ts` (row↔model; client ''→null, policy ''→0, never writes total_bank_balance/last_review_date) · `__fixtures__/finance-golden-vectors.json` (115 vectors, byte-copy of backups/) · `__tests__/` (golden replay + followUps corpus + mapping round-trips)
- `api/` `hooks/` `components/` — empty until P3/P4

## Hard constraints

- Keys: `queryKeys.crmClients` + `queryKeys.crmDashboard` only.
- Soft delete everywhere: writes set `is_deleted=true`; EVERY read filters `.eq('is_deleted', false)`.
- Bank-history mutations recompute `clients.total_bank_balance` + `last_review_date` from latest non-deleted row; client edit never writes either.
- Dashboard premium = annualised formula (frequency × ILP percent), NOT the legacy raw sum — documented divergence.
- `lib/finance.ts` must replay 115 golden vectors float-exact (refYear injectable, pinned 2026 in tests).
- Shared files append-only while parallel build runs (index.ts/types.ts/this file).

## Map — P3 additions (data layer)

- `api/` — `clientsService` (sanitized server-side search + pagination; create seeds the initial bank-history row THEN recomputes; `buildClientUpdate` strips the derived columns; soft delete) · `policiesService` (list embeds age-sorted projections; `replaceProjections` HARD-deletes then inserts de-duped-keep-last — UNIQUE(policy_id, age) forbids soft-deleted leftovers; policy soft-delete cascades to projections) · `interactionsService` · `bankService` (every mutation ends in `recomputeClientBalance`: latest non-deleted row by date/created_at/id DESC → both derived columns, 0/null when none) · `dashboardService` (3 bounded selects ≤5000, children inner-join `clients.is_deleted`; premium via `summariseClient`)
- `hooks/` — `useClientsList` (list keys + keepPreviousData) · `useClientDetail` (detail(id) + policies/interactions/bank-history sub-keys) · `use{Client,Policy,Interaction,Bank}Mutations` (userId from `useAuth`; child mutations invalidate `detail(id)` + `crmDashboard.all`, client mutations also `lists()`) · `useDashboardStats`
- `api/__tests__/` — mocked supabase-chain unit tests (`supabaseMock.ts` builder recorder): recompute ordering, update strip, projections replace keep-last, soft-delete filter on every read
- Client reads return raw `ClientRow`s (pages map via `clientFromRow`; `user_id` drives the read-only-affordance check); child reads return models.

## 📚 Related

`lib/decisions.md` · PRD above · sibling pattern: `src/features/profiler/`
