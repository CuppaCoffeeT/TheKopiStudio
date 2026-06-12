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

## Map — P4 additions (dashboard + clients list)

- `pages/CrmDashboardPage.tsx` — live `useDashboardStats` wiring: kpi-tile
  skeletons while loading, ErrorState + retry on failure, 4 KpiTiles
  (annual premium = annualised divergence, `$` prefix), empty-book CTA card
  ("Add your first client" → /clients) vs clients quick-link card. The
  portfolio-report quick action is the NEXT PRD — deliberately absent.
- `pages/ClientsListPage.tsx` — live `useClientsList` wiring: 350 ms debounced
  server-side search, URL pagination, rows mapped via `clientFromRow`,
  columns name/email/phone/risk (Chip)/next review (DateCell)/follow-up
  (FollowUpBadge on `next_review_date` ONLY — decisions.md P4), MobileListCard
  body, row click → `/clients/:id`, Add client → `ClientFormModal`
  (`components/modals/ClientFormModal`, props `open`/`onOpenChange`, create
  mode) — built by the modals author.
- `components/FollowUpBadge.tsx` — dumb date→pill presenter over
  `lib/followUps.followUpBadge` (overdue/danger · urgent/warning ·
  upcoming/info on the Badge primitive; legacy detail string as text, label as
  tooltip; refDate injectable, defaults Singapore now).

## Map — P4 additions (client detail)

- `pages/ClientDetailPage.tsx` — DETAIL archetype: DetailPageFrame + TabNav
  (Overview · Policies · Interactions · Bank history, counts from the child
  queries), header meta = risk + review frequency + `FollowUpBadge` on
  `resolveClientFollowUp` (earliest future interaction follow-up, else next
  review), actions Edit client (`ClientFormModal` edit mode, self-contained
  mutation) + tier-1 `DestructiveConfirmDialog` → `useSoftDeleteClient`
  (navigates back on success). Loading / error / not-found per profiler
  precedent; READ-ONLY when `client.user_id !== auth user.id` — every
  mutation affordance hidden, `ClientDetailActions` shows the profiler-style
  ReadOnlyHint instead. Testids `clients-detail-*`.
- `components/detail/` — `OverviewTab` (profile facts + financial card;
  `total_bank_balance` displayed as DERIVED, editable only via Bank history) ·
  `PoliciesTab` (status/ILP/Hospitalization badges, premium w/ frequency,
  `formatCoverage` summary; modal owns create/update, tab owns soft-delete) ·
  `InteractionsTab` (date-DESC, type badge + follow-up chip toned by
  `followUpBadge`) · `BankHistoryTab` (date-ASC, header shows the derived
  current total) · shared `ListSection` (header + loading/error/empty + `<ul>`
  shell) · `RowActions` (per-row Edit/Delete, 44px touch on mobile) ·
  `ClientDetailActions` (hero + mobile action bar pair).

## Map — P4 additions (form modals)

- `components/modals/` — the four FORM modals (controlled string-state forms, profiler NotesModal pattern; intra-feature imports — NOT in the barrel):
  - `ClientFormModal {open,onOpenChange,client?}` · `PolicyFormModal {open,onOpenChange,clientId,policy?}` · `InteractionFormModal {open,onOpenChange,clientId,interaction?}` · `BankBalanceModal {open,onOpenChange,clientId,record?}` — optional model present = EDIT mode; forms re-seed on every open (cancelled edits never leak); submit validates inline then calls the P3 mutation hooks (toasts + invalidation live there); success closes the modal.
  - Helpers: `shared.tsx` (TextField/SelectField/DateField/ModalSection) · `dateStrings.ts` ('YYYY-MM-DD' ↔ DatePicker Date via timezoneUtils; `todayDateString()` defaults) · `client/ClientFormSections.tsx` · `policy/` (policyFormModel = option lists + EMPTY_POLICY + validation + projection-row mapping; core/coverage/cash-value/ILP/hospital sections).
  - Parity rules encoded: "Client since" editable in BOTH modes (blank→today on add only); total-bank-balance is ADD-only (edit shows "Balance is managed in Bank history"); Hospitalization type one-way forces premium/coverage '0' + amber section; tpdSameAsDeath one-shot copy (not reactive, uncheck keeps value); hidden-section SCALAR state retained and persisted, but projections save as [] while "Has cash value" is unchecked (legacy submit-payload gate); incomplete projection rows dropped on save.
- testids: `crm-client-*` / `crm-policy-*` / `crm-interaction-*` / `crm-bank-*`; modal surfaces `crm-{entity}-form-modal`; select options expose `{selectTestId}-opt-{kebab(value)}`; projection rows are index-suffixed (`crm-policy-projection-age-input-0` …).
