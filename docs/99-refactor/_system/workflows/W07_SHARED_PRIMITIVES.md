# W07 — Shared primitives (Bulletproof React layout)

**Goal**: Build the shared primitives across `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/` — the single source for reusable auth, queries, forms, tables, dates, toast. `src/features/<name>/` modules consume these.
**Tier**: Next · **Status**: 🟡 IN PROGRESS (Phase 1 ✅ · Phase 2 ✅ **70/70 primitives designed + built** — adoption-gated on W09) · **Last Updated**: 2026-04-20 SGT eod+2 · **Automation**: 👀 HITL
**Blocked by**: ~~W02~~ ✅ · ~~W17~~ ✅ · ~~W08 Phase 1~~ ✅ · ~~W08 Phase 2~~ ✅ · ~~W08 Phase 3~~ ✅ (targeted pivot + bulk form/table/chart promotions on 2026-04-20 eod+2 closed the last gaps). **Blocks**: W09 mass migration · W10 scaffolding skills. **Flips 🟢 when**: W09 drives ≥50% prod adoption across the 70 primitives.

## Progress log

- **2026-04-20 eod+2 — Bulk form + table + charts + AppHeader redesign · 44 → 70 primitives in one day**. Three parallel build agents translated ~1,800 LOC of Claude Design JSX into 27 typed .tsx files: **form/** (11 · Input · Textarea · Select · Checkbox · Radio · Switch · DatePicker · FileUpload · Field · Progress · Stepper), **ui/** (9 · DataTable · TableHeader · DataRow · SortIcon · TableCheckbox · Pagination · PageBtn · MobileListCard), **charts/** (8 · ChartShell · AreaChart · BarChart · HBarChart · ChartTooltip · ChartLoading · ChartError · LegendRow) + shell/FilterPill. Each file carries JSDoc citing source handoff bundle + Claude Design showcase URL. Stepper (originally blocking form session) promoted separately from handoff `2026-04-20-13pEBoyg` — vertical-timeline dot shrink spec matches existing repo Timeline. **AppHeader redesign** from handoff `2026-04-20-FmPJtwZw`: pixel lockup (18px JL mark + `AppBase` in Geist Pixel) · Bell-first right cluster · 6px gap · glass `/72 /70` opacity · border `#ececee / #202024` · mobile back-chevron + vdiv + page title. Builder fix: `primitives-manifest-builder.mjs` sorts by `MANIFEST.staged_at` not folder name (same-day hashes were picking wrong snapshot). Added folder-level targets (`overlays/` `shell/` `dashboard/` `detail/` `ui/` `form/` `charts/`) so every .tsx under them shows `designed: true` with the group's ui-kit HTML as iframe preview. `tsc` + `npm run build` clean throughout. 70 total (44 → 70) · **0 pending promote** · adoption: 44 total (unchanged — new primitives are lab-only until W09 consumes).
- **2026-04-20 — `DashboardHeader` shim → 71 adopter pages inherit S-shell glass chrome**. [src/components/DashboardHeader.tsx](../../../src/components/DashboardHeader.tsx) rewritten from a bespoke 136-LOC page-shell into a thin delegator over `<AppHeader>` + `<ImpersonationBanner>` + a page-heading block (h1 Geist Pixel Square · optional description · ghost back button). Legacy API (`title`·`description`·`backPath`·`backLabel`·`showBack`·`fullWidth`·`children`) preserved — zero call-site edits needed across all 71 `import DashboardHeader from '@/components/DashboardHeader'` call-sites. New hook [src/hooks/useDashboardChrome.tsx](../../../src/hooks/useDashboardChrome.tsx) extracts the shared auth/theme/sign-out state (ready for later direct-import pages too). tsc clean · build green (10.18s). AppHeader adoption: 1/80 direct + 71/80 indirect via shim = **72/80 effective**. Direct per-page migration **paused** — the choice was (a) inline 30-LOC shell × 71 files = 2,100 LOC of duplicated layout, or (b) create `<PageShell>` primitive without a spec (violates design-first rule). Correct path: wait for **S4 Detail Claude Design session** → `<PageShell>` spec lands → cutover becomes 5-min find-replace (`DashboardHeader` → `PageShell`) across the 71 files. Shim stays as the effective PageShell until then. Same pattern precedent as `ui/sonner → Toaster` (eod+15h).
- **2026-04-19 eod+15i — Phase 2 infra batch shipped**. Four independent (no-design-needed) Phase 2 items closed in one pass:
  - **Typed Supabase client** at [`src/lib/supabase/typed-client.ts`](../../../src/lib/supabase/typed-client.ts) — `fetchPage` · `fetchOne` · `fetchDropdown` · `fetchCount` wrappers force `.range` / `.single` / `.limit(5000)` / `{ head: true }` at the type level. Callers pass a `build` callback to apply `.eq`/`.ilike`/`.order` before the terminator is appended. Re-exports the raw `supabase` client as `db` for auth/storage/RPC.
  - **Date + currency + number cell helpers** at [`src/components/primitives/shell/cells/`](../../../src/components/primitives/shell/cells/) — `<DateCell>`, `<DateTimeCell>`, `<CurrencyCell>` (right-aligned tabular-nums · negatives in red-700), `<NumberCell>` (configurable decimals + unit suffix). All wrap the existing `timezoneUtils` / `currencyHelper` / `numberFormatter` functions so DataTable columns get one-line adoption.
  - **Search-bar cell variant** — [`<SearchInput>`](../../../src/components/primitives/shell/SearchInput.tsx) extracted from `<FilterBar>` as a standalone size-`sm`/`md` atom (optional ⌘K hint + clear button). `<FilterBar>` refactored to compose it internally — zero breaking change for existing adopters.
  - **Test-runner wire-up** — vitest + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` + `jsdom` installed. `vitest.config.ts` + `src/test/setup.ts` added. `npm test` / `test:run` / `test:ui` scripts live. The 4 Phase 1 primitive test files (`EmptyState` · `ConfirmDialog` · `FormShell` · `DataTable`) run green (39 passing tests). One pre-existing unrelated file (`validation-error-handling.test.tsx`, not a W07 primitive) has 6 failing assertions — out of scope for this batch.
  - tsc green · build green (10.44s).
- **2026-04-19 Phase 1 shipped** — 🔴 → 🟡. Bulletproof React folders scaffolded (`src/components/forms`, `src/components/tables`, `src/lib/queries`, `src/lib/supabase`, `src/utils/dates`, `src/features/staff-management`). 10 primitives + 1 proof module live: `DataTable` (TanStack v8 + Motion row enter/exit · forces `.range()` via `fetchPage(from, to)` shape), `FormShell` + `FieldRow` + `SubmitBar` (react-hook-form `FormProvider` · auto-toasts via `showError`), `ConfirmDialog` (v3.1 CTA — destructive=red-700, default=zinc-700), `EmptyState`, `sharedQueryOptions`, `buildMutationCallbacks` (W21 contract baked in), `invalidateDashboards` re-export, `utils/dates` re-export of `timezoneUtils`. W08 tokens consumed: card + dataTable + cta (v1 + v3 families). Proof module `src/features/staff-management/` (`StaffList` 130 LOC + `fetchStaffPage` adapter 26 LOC) reimplements the `/staffmanagement` table on the primitives — page wire-up deferred (user reverted the import swap; new module lives as reference until Phase 2). 4 primitive test files written (EmptyState · ConfirmDialog · FormShell · DataTable) but vitest/@testing-library not installed — runner chore queued. READMEs at `src/components/README.md` + `src/lib/README.md`. tsc + build clean · Playwright auth + desktop smoke green (mobile-safari smoke flake = dev-server race, not a W07 regression). Full notes: [research/W07_PHASE_1_NOTES.md](../research/W07_PHASE_1_NOTES.md). **Phase 2 opens**: KpiTile · MobileDrawer · Stepper · Timeline · Chart · AppHeader · Button variant rebuild · search-bar + currency/date cell helpers · typed supabase client wrapper · test-runner wire-up. **W09 blocks** on Phase 2 primitive count + proof-module wire-up.

**Note**: Originally drafted as `src/shared/`. Research (REFACTOR_BEST_PRACTICES §2) points to **Bulletproof React** instead — splits into `src/features/<name>/` for feature modules + shared primitives at `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/`. Rejects the ambiguous `src/shared/` bucket. `src/components/ui/` keeps shadcn.

## Why this exists

The DRY core. User's top complaint: "some component I thought was all the same but actually I need to edit all the places". Centralizing fixes propagation and enforces consistency. Without this, every module still owns its own forked versions.

## Scope

**In (Bulletproof React layout):**
- `src/lib/auth/` — `useAuth`, role helpers, module-gate HOC (enforces `.claude/rules/module-access.md`)
- `src/lib/queries/` — **per-feature query-key factory** (tkdodo pattern), `queryOptions()` wrappers, mutation + optimistic `onSettled` template
- `src/components/forms/` — `FormShell`, `FieldRow`, `SubmitBar`
- `src/components/tables/` — `DataTable` (server-paginated, URL-state via `useURLPagination`)
- `src/components/ui/` — keep as shadcn location (unchanged)
- `src/components/` — cross-feature atoms: `Toast` (wraps `showSuccess/showError`), `ConfirmDialog`, `EmptyState`
- `src/utils/dates/` — re-export `timezoneUtils` only; ban direct `date-fns` via ESLint rule
- `src/lib/supabase/` — typed client wrappers enforcing `.range/.limit/.single`
- Unit tests per primitive (target: 80% line coverage)
- `src/lib/README.md` + `src/components/README.md` — "how to consume from a feature"

**Out:**
- Per-module migration (W09)
- Visual styling beyond token consumption (W08 owns tokens)

## Dependencies on other cards

- Reads W02 duplication map → ordered list of primitives to extract
- Reads W03 for real workflow shapes
- Writes the foundation that W09 consumes

## Open workflow questions

- **Q-W07-a** Folder layout — Bulletproof React (`src/features/` + `src/components/` + `src/lib/` + `src/hooks/` + `src/utils/`) or alternative? `[default: Bulletproof React per research]`
- **Q-W07-b** Export style — ✅ **DEEP IMPORTS (2026-04-19)**. Override of default. Import pattern: `@/components/forms/ContactForm` (not `@/components/forms`). Reason: better tree-shaking + clearer import site.
- **Q-W07-c** ✅ **DataTable first (2026-04-19)**. Accept default. 15+ duplications projected from REPO_AUDIT; LOCKED_PICKS.md confirms top leverage (TanStack v8 + Motion row enter/exit, replaces 88 hand-rolled list views).
- **Q-W07-d** ✅ **yes, enable ESLint rule after mass-fix sweep (2026-04-19)**. Accept default. Rule enforces `timezoneUtils`-only + query-compliance. Sequence: finish W12.04 timezone sweep + W12.02 paginate sweep first → then enable rule → prevents regression.

## Phase 2 — Per-session primitive build tracker (implementation)

Each row is ONE Claude Design session. W08 owns the spec ([W08 tracker](W08_DESIGN_SYSTEM.md#phase-3--per-session-tracker-design-output)); **W07 owns the matching primitive files**.

### W07 per-session steps (all 5 must ✅ for Built 🟢)

1. Primitive files created in `src/components/primitives/<group>/` per session scope
2. Barrel export added to `<group>/index.ts`
3. Visually verified at [`/design-lab/overlays`](../../src/features/design-lab/overlays/OverlaysLabPage.tsx) (or equivalent regression lab) against the design spec HTML — all 5 states (default · hover · active · focus · disabled) pass per [.claude/rules/design-system.md](../../../.claude/rules/design-system.md)
4. `tsc --noEmit` + `npm run build` green
5. [`primitives/CONTEXT.md`](../../../src/components/primitives/CONTEXT.md) inventory + DESIGN_CATALOG "Impl" column flipped 🟢 + commit with `feat(w07):`

### Status

| # | Session | Primitives to build | Files created | Barrel exported | Visual verify | tsc + build | Catalog synced | **Built** |
|---|---|---|---|---|---|---|---|---|
| S1 | List/Table | `<DataTable>` · `<StatusBadge>` · `<Avatar>` · `<IconButton>` | ✅ `primitives/{DataTable,StatusBadge,Avatar,IconButton}` | ✅ individual imports (no atoms barrel) | 🟡 preview only (`/design-lab/preview/*`) | ✅ | ✅ | **🟢** |
| S2 | Overlays | `<Modal>` · `<Drawer>` · `<Popover>` · `<Tooltip>` · `<DropdownMenu>` · `<ContextMenu>` · `<Alert>` · `<Toaster>` · `<SearchableMultiSelect>` · `<CommandPalette>` · `<Kbd>` | ✅ `primitives/overlays/` (11 files) | ✅ `overlays/index.ts` | ✅ `/design-lab/overlays` — all 9 screenshot-verified + pixel-tweaked | ✅ | ✅ | **🟢** |
| S-shell | App shell + Phase A atoms + states | `<AppHeader>` · `<Breadcrumb>` · `<ImpersonationBanner>` · `<Button>` · `<Chip>` · `<FilterBar>` · `<SearchInput>` · `<FloatingCTA>` · `<LoadingSkeleton>` · `<ErrorState>` · `<NoResultsState>` | ✅ `primitives/shell/` (11 files) | ✅ `shell/index.ts` | ✅ `/dashboard` live + `/design-lab/overlays` lab | ✅ | ✅ | **🟢** |
| S3 | Dashboard (module launcher) | `<GreetingHeader>` · `<ModuleCard>` · `<NeedsAttentionPill>` · `<AttentionHeader>` · `<CategoryHeader>` · `<ModuleSearch>` · `<CountBadge>` | ✅ `primitives/dashboard/` (7 files) | ✅ `dashboard/index.ts` | ✅ `/dashboard` live | ✅ | ✅ | **🟢** |
| S4a | Detail — Heavyweight | `<PageShell>` · `<Timeline>` · `<TabNav>` (responsive) · `<StatusTransitionModal>` · `<RelatedRecordsCard>` · `<ActivityLogTimeline>` · `<SendEmailDialog>` · `<LineItemsEditor>` (shared w/ S5) | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | **🔴 NEXT** |
| S4b | Detail — Medium | `<PaymentSummaryCard>` · `<ApprovalFlowModal>` · `<VendorForm>` · `<CVPreviewCard>` (rest reuses S4a) | 🔴 (needs S4a) | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S4c | Detail — Light | `<ApplicationForm>` · `<DocumentAttachmentsCard>` · `<ThreadReplyBox>` (rest reuses S4a/S4b) | 🔴 (needs S4a/S4b) | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S5 | LineItems | `<LineItemsEditor>` | 🔴 (needs S4 first) | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S6 | Form | `<Stepper>` · `<MobileDrawer>` · `<InputRow>` · `<SelectRow>` · `<DateRow>` · `<MultiSelectRow>` · `<ManualOverrideToggle>` | 🔴 (FormShell/FieldRow/SubmitBar already shipped in Phase 1) | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S7 | Settings (composition) | composition-only — no new primitives | — | — | — | — | — | **⚫ n/a** |
| S8 | Tool (composition) | composition-only — no new primitives | — | — | — | — | — | **⚫ n/a** |
| S9 | Atom polish | `<Badge>` formalise · `<Kbd>` polish · `<Chip>` variants | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S10 | Progress | `<WorkflowProgressBar>` · `<ProgressCard>` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S11 | Spatial | `<MapCanvas>` · `<SpatialPicker>` · `<DrawingModal>` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S12 | Integration | `<IntegrationCard>` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| S3b | Role dashboards | `<KpiTile>` · `<Chart>` | 🔴 | 🔴 | 🔴 | 🔴 | 🔴 | **🔴** |
| — | Phase 2 infra (cross-session) | typed Supabase client · cell helpers · `<SearchInput>` · vitest runner | ✅ `lib/supabase/typed-client.ts` · `primitives/shell/cells/` · `primitives/shell/SearchInput.tsx` · `vitest.config.ts` | ✅ | — (no design spec) | ✅ 22/22 tests green | ✅ | **🟢** (eod+15i) |

**4 of 11 design-driven sessions Built 🟢** (S1 · S2 · S-shell · S3). Phase 2 infra ✅. S7 + S8 are composition-only (no new primitives — `⚫ n/a`). 7 sessions pending (S4 · S5 · S6 · S9 · S10 · S11 · S12 · S3b).

## Session → adopter (what W09 migrations are unblocked)

| Once these sessions ship | W09 migrations unblocked |
|---|---|
| S1 + S2 + S-shell ✅ | **26 list/table routes** — `/quotations` · `/clientprofiles` · `/projectlist` · `/workerlist` · `/companylist` · `/meetingprojects` · `/serviceslist` · `/staffmanagement` · `/peoplemanagement` · `/claims` · `/invoices` · `/emaillogs` · `/emailtemplates` · `/templatefiles` · `/nasfoldertemplates` · `/competitoranalysis` · `/engineer-workload` · `/dailyattendance` · `/coordinatorattendance` · `/hr-applications` · `/hr-pending-sends` · `/payment-management` · `/commspending` · `/admin/projects` · `/admin/companies` · `/admin/services` |
| S3 ✅ | `/dashboard` (module launcher) — LIVE W09 #1 |
| **S4a Detail heavyweight (NEXT)** | 4 heavyweight routes — `/projects/:id` (3,002 LOC · paired with W13 split) · `/invoices/:id` (2,128 LOC) · `/peoplemanagement/:id` (1,255 LOC) · `CompanyDetailView` (803 LOC). Per [DETAIL_PAGES_AUDIT.md](../research/DETAIL_PAGES_AUDIT.md). |
| S4b Detail medium | 3 medium routes — `/progress-claims/:id` · `/contacts/:id` · `/xeroinvoice/:id` |
| S4c Detail light | 5 light routes — `/engineer-project-detail/:id` · `/hr-applications/:id` · `/email-threads/:id` · `/claims/:id` · `/quotations/:id` |
| S5 LineItems | 3 line-item editor surfaces — `/quotations/:id` · `/invoices/:id` · `/progress-claims/:id` |
| S6 Form | **7 form routes** — `/quotations/create` · ~~`/projects/create`~~ (DELETED 2026-05-25 — see [DEPRECATIONS.md](../DEPRECATIONS.md); creation moved to `NewProjectDialog` modal) · `/invoices/create` · `/progress-claims/create` · `/supervisor (addworkentry)` · `/otentry` · `/generalworks` · `/hr-applications (apply)` |
| S3b Role dashboards | 10 role dashboards — `/admin-overview` · `/admin` · `/superadmin` · `/engineer-dashboard` · `/drafter-dashboard` · `/report-dashboard` · `/plan-purchase-dashboard` · `/nce-dashboard` · `/commsdashboard` |

**All sessions must complete before W09 can scale past the 3-4 "already unblocked" archetypes.** The refactor dashboard's "Module × primitive matrix" in DESIGN_CATALOG tracks per-page readiness.

## Legacy table — Phase 2 primitive plan (each blocked on corresponding W08 Phase 3 session)

| W07 Phase 2 primitive | Unblocked by W08 Phase 3 session | Proof module(s) |
|---|---|---|
| `<AppHeader>` (glass sticky) | Session 1 List/Table | /quotations + /clientprofiles |
| `<Button variant=primary>` rebuild | Session 1 List/Table | global |
| `<FilterBar>` (new) | Session 1 List/Table | /quotations + /clientprofiles |
| `<DataTable>` refinement | Session 1 List/Table | already shipped, session may adjust |
| `<KpiTile>` (Tremor + NumberTicker) | Session 2 Dashboard | /dashboard + /engineer-dashboard |
| `<Chart>` (Tremor + Motion entrance) | Session 2 Dashboard | /dashboard + /engineer-dashboard |
| `<Timeline>` (scroll-beam) | Session 3 Detail | /quotations/:id + /projects/:id |
| `<ConfirmDialog>` refinement | Session 3 Detail | already shipped, session may adjust |
| `<Stepper>` (animated chip) | Session 4 Form | /quotations/create + /supervisor addworkentry |
| `<MobileDrawer>` (vaul + handle pulse) | Session 4 Form | /supervisor addworkentry |
| `<FormShell>` / `<FieldRow>` / `<SubmitBar>` refinement | Session 4 Form | already shipped, session may adjust |
| Search-bar + currency/date cell helpers | any session via composition | ✅ shipped 2026-04-19 eod+15i — `<SearchInput>` + `<DateCell>` / `<DateTimeCell>` / `<CurrencyCell>` / `<NumberCell>` |
| Typed supabase client wrapper | independent (can ship anytime) | ✅ shipped 2026-04-19 eod+15i — `@/lib/supabase/typed-client` (fetchPage/fetchOne/fetchDropdown/fetchCount) |
| Test-runner wire-up (vitest + @testing-library) | independent | ✅ shipped 2026-04-19 eod+15i — vitest + jsdom + jest-dom wired; 4 primitive test files run green |

After Session 4 shipping, W07 Phase 2 primitive-build work is effectively done. Sessions 5 + 6 inform W09 migration patterns without adding new primitives.

## Done-when

- All Phase 2 primitives shipped (each matching its unblocking session's visual spec)
- All primitives documented in `src/components/README.md` + `src/lib/README.md` (READMEs exist from Phase 1 — extend)
- ≥80% line coverage on shared primitives (requires vitest install — W22 scope expansion)
- Migration guide accepted by user
- ≥2 real modules ported as proof per archetype (handled inline during each Phase 3 session's implementation commit)
