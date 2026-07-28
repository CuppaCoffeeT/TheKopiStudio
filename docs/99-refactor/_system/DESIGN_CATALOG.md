# AppBase_REFACTOR — Design Catalog

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT — S3 Dashboard rows: `ModuleCard` / `CategoryHeader` / `ModuleSearch` marked RETIRED (deleted with the launcher grid, see [DEPRECATIONS.md](DEPRECATIONS.md)). Earlier, 2026-04-28 SGT — split into 3 files to clear 6.9× budget overflow: this router (state · adoption · approval · composition · roll-up) + [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md) (per-primitive Design · Impl · Adopted inventory · sections A–N) + [DESIGN_CATALOG_MATRIX.md](DESIGN_CATALOG_MATRIX.md) (module × primitive matrix). Historical day-by-day W09 entries moved to [RECENT_CHANGES.md](RECENT_CHANGES.md).
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

Router for the AppBase design catalog. Tracks the design-system roll-out state — which Claude Design sessions shipped, which W09 modules adopted them, what's locked, what's queued.

**Why this exists**: we stopped thinking in "6 archetypes" and started thinking in "~115 primitives × 22 modules". The archetype sessions produce groups of primitives; this doc is where their progress lives after each session.

## 📚 Related

- [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md) — **per-primitive inventory** (sections A–N) · Design · Impl · Adopted columns
- [DESIGN_CATALOG_MATRIX.md](DESIGN_CATALOG_MATRIX.md) — **module × primitive matrix** + per-module component tallies · `●` = consumes group · `✓` = migrated (replaces the removed `research/COMPONENT_MAP.md`; there is no `_system/research/` folder)
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — primitives folder router (by code group)
- [CLAUDE_DESIGN_GAME_PLAN.md](CLAUDE_DESIGN_GAME_PLAN.md) — session-by-session plan consuming this catalog
- [LOCKED_PICKS.md](LOCKED_PICKS.md) — W17 visual-language picks
- [workflows/W07_SHARED_PRIMITIVES.md](workflows/W07_SHARED_PRIMITIVES.md) — implementation home
- [workflows/W08_DESIGN_SYSTEM.md](workflows/W08_DESIGN_SYSTEM.md) — token foundation + archetype sessions
- [workflows/W09_MODULE_MIGRATIONS.md](workflows/W09_MODULE_MIGRATIONS.md) — adopter (per-module migration)
- [RECENT_CHANGES.md](RECENT_CHANGES.md) — append-only log of refactor changes (was the inline Last Updated paragraph)

---

## Status legend

- **Design**: 🔴 no spec · 🟡 designed in Claude Design (handoff staged) · 🟢 spec locked
- **Impl**: 🔴 not built · 🟡 partial · 🟢 built & tsc+build clean
- **Adopted**: `M/N` modules using it (live, not prototype)

---

## 🎯 Design system — current state (2026-04-19 eod+15f)

### Sessions

| Session | Designed | Built | Adopted | Gate status |
|---|---|---|---|---|
| **S1 List/Table** | 🟢 | 🟢 `DataTable` · `StatusBadge` · `Avatar` · `IconButton` | production adopters — see DESIGN_CATALOG_PRIMITIVES.md Adopted column | ✅ LOCKED |
| **S2 Overlays** | 🟢 | 🟢 9 primitives (Modal · Drawer · Popover · Tooltip · DropdownMenu · ContextMenu · Alert · Toaster · SearchableMultiSelect) + Kbd atom | **Toaster root-mounted in `App.tsx` (all toasts now glass-styled) · `AppSidebarFooter` / `AppHeaderUserMenu` / `ViewAsSelector` consume Popover + DropdownMenu (was `AppHeader`/`ImpersonationSelector`, both retired 2026-07-25) · W09 migrates legacy shadcn callers per page** | 🟢 spec re-verified 2026-04-19 |
| **S-shell** (App Header + Phase A atoms + states) | 🟢 | 🟢 10 live (Breadcrumb · ImpersonationBanner · Button · Chip · FilterBar · **SearchInput** · FloatingCTA · LoadingSkeleton · ErrorState · NoResultsState) + 4 cells (DateCell · DateTimeCell · CurrencyCell · NumberCell) · ⚠️ **RETIRED 2026-07-25**: ~~AppHeader~~ · ~~AppHeaderDesktopBar~~ · ~~DashboardHeader shim~~ (masthead deleted, Kopi 2a P3 — see [DEPRECATIONS.md](./DEPRECATIONS.md)); replaced by `AppSidebar` + `AppSidebarFooter` + `AppHeaderMobileBar` + `AppHeaderShell` | cells available for any DataTable adopter | 🟢 live (shell rebuilt 2026-07-25) |
| **S3 Dashboard** (was module launcher) | 🟢 | 🟢 6 live (GreetingHeader · NeedsAttentionPill · AttentionHeader · CountBadge · **KpiTile** · **NumberTicker**) + **KpiIndexCard** (Kopi 2a) · ⚠️ 3 **RETIRED 2026-07-25**: ~~ModuleCard~~ · ~~CategoryHeader~~ · ~~ModuleSearch~~ (files deleted with the launcher grid — see [DEPRECATIONS.md](./DEPRECATIONS.md)) | `/dashboard` — 2a Overview: GreetingHeader masthead + KpiIndexCard row + feed table | 🟢 live (rebuilt 2026-07-25) |
| **S4a Detail — Heavyweight** (9 primitives) | 🟢 | 🟢 9 primitives — PageShell · TabNav · Timeline · StatusTransitionModal · RelatedRecordsCard · ActivityLogTimeline · SendEmailDialog · LineItemsEditor · DestructiveConfirmDialog | `4/5 full` — CompanyDetail (W09 #2) · PersonDetail (W09 #18 · 2026-04-26) · InvoiceDetail (W09 · 2026-04-27) · **ProjectDetail (W09 #28 · 2026-05-27 · P1–P11 closed)**; QuotationDetail P2 header-lift only (W09 #10, body pending P3) | 🟢 live (4 adopters) |
| **S4b Detail — Medium** (3 pages) | 🔴 | 🔴 | — | queued after S4a W09 |
| **S4c Detail — Light** (5 pages) | 🔴 | 🔴 | — | queued after S4b |
| **S5 LineItems** (merged into S4a LineItemsEditor) | 🟢 | 🟢 | `0/3` — Invoice · Quotation · ProgressClaim queued | 🟡 built, pre-adopt |
| **S6 Form** · **S7 Settings** · **S8 Tool** · **S9 Atom polish** · **S10 Progress** · **S11 Spatial** · **S12 Integration** | 🔴 | 🔴 | — | queued |

### W09 migration adoption

Live adopters as of 2026-04-28. Full per-page primitive consumption + day-of-migration commit details live in [RECENT_CHANGES.md](RECENT_CHANGES.md). Trimmed view here:

| Page | Status |
|---|---|
| `/meetingprojects` | 🟢 LIVE (W09 #26 · 2026-04-28) |
| `/dashboard` | 🟢 LIVE (W09 #1 · 2026-04-19) |
| `/companylist/:id` (CompanyDetail) | 🟢 LIVE (W09 #2 v2.1 · 2026-04-27) |
| `/companylist` (CompanyList) | 🟢 LIVE (W09 #3) |
| `/generalworks` (GeneralWorks list) | 🟢 LIVE (W09 #4 · re-close 2026-04-28) |
| `/quotations` (QuotationList) | 🟢 LIVE (W09 #5 · parallel) |
| `/payment-management` (shell + 3 tabs) | 🟢 LIVE · re-pass to 100% primitive (W09 #5 re-pass · 2026-04-28) — **partial axe gate** |
| `/quotations/:id` (QuotationDetail) | 🟢 LIVE · P3 BODY DECOMPOSED (W09 quotation-detail-body · 2026-04-27) |
| `/projectlist` | 🟢 LIVE (W09 #11 · 2026-04-21) |
| `/peoplemanagement` | 🟢 LIVE (W09 #12 + #12.5 + #12b · 2026-04-21) |
| `/productsservices` | 🟢 LIVE (W09 #13 · 2026-04-23) |
| `/invoices/create` (InvoiceCreate) | 🟢 LIVE (W09 #15 · 2026-04-24 · re-frame 2026-04-27) |
| `/invoices/:id` (InvoiceDetail) | 🟢 LIVE (W09 InvoiceDetail · 2026-04-27) |
| `/admin-overview` | 🟢 LIVE (W09 admin-overview · 2026-05-23) — ExpandableDataTable + **DrawingStatusBar NEW** + **CDWProgressTimeline NEW** + AppHeader chrome + 15 primitives total |
| `/xero-settings/invoice/:id` (XeroInvoicePage) | 🟢 LIVE (W09 #25 · 2026-04-28) |
| `/xero-settings` (5 tabs) | 🟢 LIVE (W09 #14 · 2026-04-23) |
| `/emailinbox` (single-route 3-pane) | 🟢 LIVE (W09 #15 · 2026-04-23) — **14 net-new primitives** |
| `/quotationsettings` (5 tabs) | 🟢 LIVE (W09 #16 · 2026-04-26) |
| `/quotations/create` | 🟡 WRAPPER-ONLY (W09 #17 · 2026-04-26) |
| `/clientprofiles` (ClientProfilesList) | 🟢 LIVE (W09 #18 · 2026-04-26) |
| `/clientprofiles/:id` (ContactDetail) | 🟢 LIVE (W09 #19 v3 · 2026-04-26) |
| `/auth/reset-password` | 🟢 LIVE (W09 #20 · 2026-04-27) |
| `/auth/verified` | 🟢 LIVE (W09 #23 · 2026-04-27) |
| `/auth/verify` (EmailVerification) | 🟢 LIVE (W09 #24 · 2026-04-27) |
| `/claims/create` | 🟢 LIVE (W09 #21 · 2026-04-27) |
| `/comms` (CommsDashboard) | 🟢 LIVE (W09 #25 · 2026-04-27) |
| `/comms/pending` | 🟢 LIVE (W09 #26 · 2026-04-27) |
| `/claims/:id` (ClaimsProjectDetail) | 🟡 P1 SHELL (W09 #27 · 2026-04-27) |
| `/claims/:projectId/pc/:claimId` (ProgressClaimDetail) | 🟢 LIVE (W09 #22 P2 · 2026-04-28) |
| `/serviceslist` | 🟢 LIVE (W09 full · 2026-05-23) — ListPageFrame + StatusTabs + FilterDropdown + Modal + SearchableMultiSelect + DataTable + MobileListCard + 18 primitives total |
| `/workerlist` | 🟢 LIVE (W09 full · 2026-05-23) — ListPageFrame + 21 primitives |
| `/leaves` | 🟢 LIVE (W09 full · 2026-05-23) — ListPageFrame + FilterDropdown + Modal + DataTable + Radio + Badge + MobileListCard |
| `/staffmanagement` | 🟢 LIVE (W09 full · 2026-05-23) — ListPageFrame + Modal + Field + RadioGroup + SearchableMultiSelect + 22 primitives total |
| `/supervisorreview` | 🟢 LIVE (W09 supervisorreview · 2026-05-23 · Phase 0-4 modal decomposition complete same day) — AppHeader + PageTitle + Tabs + Badge(count) + DataTable + Modal + Drawer + Stepper + Field + Input + Textarea + Select + Checkbox + Radio + Button + IconButton + Card · 3 edit modals fully primitive-composed with 16+ decomposed sub-components + 7 mobile sheets · Phase 6 (TrialTrenchTable 4-mode consolidation) deferred to W-future-CFE-TrialTrench |
| `/supervisor` | 🟡 IN-PROGRESS (W-supervisor-mode-W09 · 2026-05-23 → 2026-05-24 · Phase 0/1/5/6 closed · Phases 2/3/4 partial) — StatusTabs (+testId/data-state) + Card + Badge + Modal + Stepper + ChoiceCards + WizardShell + WizardMobileDrawer + Field + Input + Switch + Textarea + SearchableMultiSelect + ProjectSelect + FileUpload · 5/5 TT step files + 3/3 GW step files + 7 TT sheets + 3 GW sheets + 5 working-hours sub-files + 3 submissions sub-files · 26/27 seatbelt green (1 deferred) · Phase 2 modal wire + Phase 3.6 photo subtree decompose + Phase 3.8 AddWorkEntry rewrite + Phase 7 final sweep queued |
| `/emailaccount` (2 tabs) | 🟢 LIVE (W09 emailaccount re-migration · 2026-05-25) — AppHeader + PageTitle + PageDescription + ImpersonationBanner + NotificationsBell + ViewAsSelector + Tabs/TabsList/TabsTrigger/TabsContent + Card + Badge + Alert + LoadingSpinner + LoadingSkeleton + Button · EmailAgentStatusTab decomposed into 4 atoms (RunStatusBadge · LatestRunCard · ClassificationStatsCard · RunHistoryCard) · 3 legacy orphans deleted (`src/pages/EmailSettingsPage.tsx` · `src/components/email/{GmailAccountsTab,EmailAgentStatusTab}.tsx`) · 5/5 compliance greps zero |
| `/templatefiles` (Template Files Library) | 🟢 LIVE (W09 templatefile · 2026-05-25 · DataTable + URL pagination + SelectMenu refactor 2026-05-25) — AppHeaderShell + 5×KpiTile + SearchInput + SelectMenu + DataTable + Pagination + IconButton + Badge + Modal + Field + Input + Textarea + FileUpload + LoadingSpinner + Button + 15 primitives total · 7 specs (load + upload + edit + delete + download + search + filter-category) · server-side pagination 100/page · useURLPagination state · zero native `<select>` |
| `/engineer-dashboard` | 🟢 LIVE (W09 engineer-dashboard · 2026-05-25 · same-day ListPageFrame refactor) — **`ListPageFrame`** owns AppHeader + ImpersonationBanner + PageTitle + PageDescription + FilterBar + DataTable + integrated Pagination + mobile FloatingCTA; **DataTable** + **MobileListCard** + **CDWProgressTimeline** (+ `useCDWMeetingSteps` connector) + Card (kpiTiles slot) + Badge + Button + Input + Select + SearchableMultiSelect + Tooltip + LoadingSpinner · ListPageFrame primitive gained additive `clearFiltersTestId` prop · feature-folder shape `src/features/engineer-dashboard/` (pages/components/hooks/lib) · 4/5 compliance greps zero; grep 6b carries 3 cross-feature `@/components/meeting-projects/types` deferrals (pure constants — user-approved per NOTES.md) · 4 pre-existing WF specs + new `engineer-dashboard-load.spec.ts` (a11y + mobile) all green · 5 legacy files deleted (`src/pages/EngineerDashboard.tsx`, `src/pages/EngineerProjectDetailPage.tsx`, `src/components/engineer-dashboard/EngineerProjectList.tsx`, `src/hooks/useEngineerProjects.ts`, `src/hooks/useCurrentStaffEmploymentId.ts`) · `/engineer-dashboard/:id` route dropped — row click → `/projects/:id` (canonical detail page already renders the same engineer tabs) |
| `/nce-dashboard` | 🟢 LIVE (W09 nce-dashboard · 2026-05-25) — **`ListPageFrame`** root (forced **list** archetype despite `Dashboard.tsx` filename — user-directed: 100% direct primitive, real `<Pagination>` slot) · 4× **KpiTile** + **StatusTabs** + **DataTable** with `renderExpanded` inline panel + **NCEDetailPanel** rewritten on Card/Badge/Button/LoadingSpinner · **15 primitives total** · feature-folder shape `src/features/ncedashboard/` (pages/components/hooks/api/lib) · 5/5 compliance greps zero · pagination client-side over RPC-aggregated array (`fetchNCEDashboardProjects` fans 5 tables; server-pageable rewrite deferred) · 4 pre-existing WF specs migrated `data-active` → `aria-selected` + new `nce-dashboard-load.spec.ts` (axe wcag2aa) · all 5 specs × 2 projects green · 4 legacy files deleted (`src/pages/NCEDashboard.tsx`, `src/services/nceDashboardService.ts`, `src/hooks/useNCEDashboard.ts`, `src/components/nce-dashboard/*`) |
| `/plan-purchase-dashboard` | 🟢 LIVE (W09 plan-purchase-dashboard · 2026-05-25) — **`ListPageFrame`** root (dashboard archetype + paginated list table — user-directed: list table 100% direct primitive, no shims) · 4× **KpiTile** (clickable filter toggle) + **StatusTabs** (5 tabs) + **DataTable** with `renderExpanded` inline panel + integrated **Pagination** + **MobileListCard** + **Badge** + **DateCell** + **Button** + **LoadingSpinner** · feature-folder shape `src/features/plan-purchase-dashboard/` (pages/components/hooks/api/lib) · 4/5 compliance greps zero; grep 6b carries 3 cross-feature `@/components/project-management/{PlanPurchaseEditMode,PlanPurchaseViewMode,LinkPlanPurchaseDialog}` deferrals (cross-module heavyweight components — user-approved per NOTES.md, scheduled for future `/project-management` W09) · `useURLPagination` for `?search/?tab/?sort/?order/?page` · client-side pagination 100/page over RPC-aggregated array · 5 pre-existing WF specs preserved (testIds aligned) · 7 legacy files deleted (`src/pages/PlanPurchaseDashboard.tsx`, `src/services/planPurchaseDashboardService.ts`, `src/hooks/usePlanPurchaseDashboard.ts`, `src/components/plan-purchase-dashboard/*`) |
| `/engineer-workload` | 🟢 LIVE (W09 engineer-workload · 2026-05-25) — **`ListPageFrame`** root (LIST archetype — projects table dominant; engineer summary cards rendered as grid items inside `kpiTiles` slot) · **Card** + **Badge** + **Button** + **Modal** (+ `ModalPrimaryAction` / `ModalGhostAction` for AssignEngineerDialog) + **SearchableMultiSelect** (per-row picker + multi-engineer filter + bulk-assign picker) + **FilterDropdown** (status + engineer multi-select wrappers) + **FilterPill** (Unassigned-only toggle) + **DataTable** + **Pagination** + **DateTimeCell** + **AppHeader** + **PageTitle** + **PageDescription** · feature-folder shape `src/features/engineerworkload/` (pages/components/hooks/api/lib + barrel + CONTEXT.md + decisions.md + lessons.md) · 5/5 compliance greps zero (6a/6b/6c/6d/6e) · pre-existing testids preserved (`engineer-workload-search-input` · `engineer-workload-status-filter` · `engineer-workload-status-option-*` · `engineer-workload-unassigned-toggle`) · new `engineer-workload-load.spec.ts` (axe wcag2aa) green on chromium-desktop + mobile-safari · 6 legacy files deleted (`src/pages/EngineerWorkloadPage.tsx`, `src/hooks/useEngineerWorkload.ts`, `src/services/engineerWorkloadService.ts`, `src/components/engineer-workload/{EngineerWorkloadCards,AssignEngineerDialog,ProjectsTable}.tsx`) · `useDashboardCounts` rewired to import `useUnassignedProjectsCount` from feature barrel |
| `/report-dashboard` | 🟢 LIVE (W09 report-dashboard · 2026-05-25) — **`ListPageFrame`** root (LIST archetype — user-directed: list table 100% direct primitive, no shims) · 3× **KpiTile** (clickable filter toggle) + **StatusTabs** (4 tabs) + **DataTable** with `renderExpanded` inline panel + integrated **Pagination** + **MobileListCard** + **Modal** + **Field** + **Input** + **Textarea** + **Progress** + **FileUpload** + **SearchInput** + **Badge** + **DateCell** + **Button** + **LoadingSpinner** + **ErrorState** + **NoResultsState** · feature-folder shape `src/features/reportdashboard/` (pages/components/hooks/api/lib) · 5/5 compliance greps zero · `useURLPagination` for `?search/?status/?page` · client-side pagination 100/page over admin-scoped report list · invalidation routes through `invalidateEntity` + `invalidateDashboards` helpers · 11 legacy files deleted (`src/pages/ReportDashboard.tsx`, `src/components/report-dashboard/*` × 9, `src/hooks/{useAdminReports,useReportDetail}.ts`) · two cross-feature shareds eliminated by feature-local rebuild: `@/components/shared/DrawingListTable` → `ReportDrawingsTable` (primitive `DataTable` + `StatusTabs`); `@/components/project-management/NASFilePicker` → `ReportNasFilePicker` (primitive `Modal` + atoms) — note: trade-off lost inline file-expansion per drawing row (admin queue is status-review only, file CRUD lives in engineer/drafter flows) |
| `/performancereview` | 🟢 LIVE (W09 performancereview · 2026-05-25) — **TOOL archetype**, hybrid Statistics + Daily View tabs · AppHeader + PageTitle + PageDescription + ImpersonationBanner + NotificationsBell + ViewAsSelector + Tabs/TabsList/TabsTrigger/TabsContent + 4×KpiTile (stats summary) + 6×KpiTile (daily score tiles) + **DataTable** + **TableHeader** + **DataRow** + **Pagination** + **MobileListCard** (both ranking AND daily worker tables — no Card wrapper, primitive DataTable IS the surface; ranking: no pagination since top 10; daily: 100/page pagination per CANONICAL_LIST_TABLE_PATTERN) + Badge + Button + IconButton + ChartShell + BarChart + AreaChart + HBarChart + ChartLoading + Modal + ModalPrimaryAction + ModalGhostAction + SelectMenu + Field + Input + Textarea + DatePicker + Alert + LoadingSpinner — **Recharts removed entirely** (legacy stats tab had PieChart + BarChart + LineChart + ResponsiveContainer; all swapped to `primitives/charts`. Pie → HBarChart since no primitive pie chart exists) · feature-folder shape `src/features/performancereview/` (pages/components/hooks/lib/types) · 5/5 compliance greps zero · every file ≤200 LOC · column defs split into `lib/{rankingColumns,dailyTableColumns}.tsx` (projectColumns/projectRow pattern) · `useUpdatePerformanceRecord` mutation invalidates `performanceReview.all` + `dailyAttendance.all` + `workerOT.all` + `invalidateDashboards` · new `performancereview-load.spec.ts` (axe wcag2aa) + `tab-switch-daily.spec.ts` both green on chromium-desktop + mobile-safari · 8 legacy files deleted (`src/pages/PerformanceReviewPage.tsx`, `src/hooks/usePerformanceReview.ts`, `src/components/performance-review/*` × 6) · A11y fixes: `text-zinc-400` on light bg bumped to `text-zinc-600`, decorative dashes wrapped in `aria-hidden` · **User-corrected mid-close**: first draft wrapped tables in `<Card>` — corrected to primitive `DataTable` directly per `/projectlist` + `/supervisorreview` precedent |
| 60+ others | 🔴 queued |

### Approval state

**What's locked (✅ signed off)**:
- Font rule: Roboto body · Geist Mono labels/kbd · Geist Pixel Square h1 ≤ 48px · Geist Pixel Grid ≥ 140px
- CTA: slate-800 (`--cta-primary-bg`) · 10.7:1 AAA contrast
- Page composition: **superseded 2026-07-25** — `AppSidebar` rail (mounted by `DashboardLayout`) → page frame → `ImpersonationBanner` → content. Was: `<AppHeader>` → `<ImpersonationBanner>` → max-w content
- Brand assets: `public/images/` · referenced as `/images/<file>` in JSX
- Design-reuse: 11 rules in [DESIGN_REUSE_PRINCIPLES.md](DESIGN_REUSE_PRINCIPLES.md)
- **115 primitives built** (2026-04-28). Per-folder counts in [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md). Per-primitive Design · Impl · Adopted state in [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md).
- W07 Phase 2 infra: typed Supabase client (`@/lib/supabase/typed-client` — fetchPage/fetchOne/fetchDropdown/fetchCount enforces .range/.limit/.single) + vitest runner wired
- Overlays + list atoms re-verified 2026-04-19 against the refreshed Claude Design handoff
- Toaster root-mounted in `App.tsx` → every `showSuccess`/`showError` now uses the primitive
- `ui/sonner` is a shim that re-exports the primitive → 100+ legacy callers auto-benefit

**What's NOT approved yet (🔴)**:
- S4b Medium detail pages · S4c Light detail pages (queued after S4a W09)
- S6–S12 (queued, not kicked)
- S4a Heavyweight Detail primitives — **4 of 5 W09 migrations adopted** (CompanyDetail · PersonDetail · InvoiceDetail · **ProjectDetail 2026-05-27**). Remaining: QuotationDetail (P3 in flight).

### Discipline

- [`.claude/rules/light-theme.md`](../../../.claude/rules/light-theme.md) — auto-loads on any `src/**` or `src/index.css` edit. The enforceable surface / palette / type contract for the Kopi Studio light brand. (Replaces the old `design-system.md` rule, which no longer exists.)
- [`.claude/rules/ui-components.md`](../../../.claude/rules/ui-components.md) — use `primitives/` over raw shadcn; Portal in dialogs.
- [DEPRECATIONS.md](DEPRECATIONS.md) — check a name still exists before importing it.
- [DESIGN_REUSE_PRINCIPLES.md](DESIGN_REUSE_PRINCIPLES.md) — 11 hard rules. Reuse first. Slot pattern for legacy. Feedback on every interactive element.
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — primitive index with import paths. First stop for any new work.

---

## Primitive inventory

→ Moved to **[DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md)** (sections A–N · 115 primitives across 12 design-intent groups · 2026-04-28).

---

## Module × primitive matrix

→ Moved to **[DESIGN_CATALOG_MATRIX.md](DESIGN_CATALOG_MATRIX.md)** (per-module consumption of primitive groups · archetype clusters · migration status).

---

## Page composition pattern — CURRENT (Kopi Studio 2a, 2026-07-25)

The horizontal masthead is gone. **Chrome is mounted once, by the layout — never by the page**:

```
DashboardLayout  (src/components/shared/app-shell/DashboardLayout.tsx)
├── GlobalCommandPalette             ⌘K — module routing
├── AppSidebar                       fixed 200px rail, >= lg only
│   ├── Wordmark                     "The Kopi Studio" (Instrument Serif)
│   ├── nav items                    one per granted module, from useAuth().modules
│   └── AppSidebarFooter             bell · ViewAs · account · sign-out
└── content pane (lg:pl-[200px])
    └── the routed page              ListPageFrame | DetailPageFrame | AppHeaderShell
        └── ImpersonationBanner      rendered by the frame, only while impersonating
        └── [breadcrumb | kicker] → H1 → description → hairline
        └── content sections
```

Below `lg` the rail is hidden and `AppHeaderMobileBar` carries navigation + account. Breadcrumb is **content**, not chrome — a quiet inline line above the H1, rendered only when a page passes one.

**/dashboard**: no inner page title — the `GreetingHeader` dateline + serif greeting IS the hero. Since the customer-centred IA (2026-07-28) it is followed by the `StartProfilerBand` launcher, the four-up `QueueStatStrip`, and three `CustomerQueueSection` bands (gone quiet · unfinished · reviews due). The rail leads with **Overview + Customers**; every other granted module sits under a hairline "More" heading, because tools are launched from a customer record (`CustomerToolLauncher`), not from navigation.

> Superseded: before 2026-07-28 the hero was followed by two `KpiIndexCard`s and a hairline "Latest additions" feed. That feed's four modules were deleted with it; the `KpiIndexCard` primitive remains available.

**view-as-user placement**: `AppSidebarFooter` at ≥ lg, folded into the account dropdown of `AppHeaderMobileBar` below it. Never duplicated on individual pages.

### Historical — page composition as locked 2026-04-19 (masthead era, retired 2026-07-25)

> Kept verbatim as the record of the structure the S-shell session locked. `AppHeader` and `DashboardHeader` no longer exist — see [DEPRECATIONS.md](./DEPRECATIONS.md).

```
<AppHeader>                           ← Session Shell primitive (shell/AppHeader.tsx)
  - breadcrumb (Workspace / <section> / <page>)
  - ⌘K launcher · notification bell · view-as-user (super_admin) · theme · user menu
  - 56h desktop / 52h mobile, glass + backdrop-blur

<ImpersonationBanner>                 ← only when actively impersonating
  - red-50 strip, pulsing dot, ⌘⇧I exit hint

<page content container max-w-*>      ← page-specific

  <GreetingHeader> or <Page Title>   ← page-specific hero (optional)
    - /dashboard: GreetingHeader (Geist Pixel Square "Good X, Name.")
    - inner pages: Just H1 in Geist Pixel Square OR skipped

  <content sections...>
</page content container>
```

**view-as-user placement (then)**: lived in the AppHeader user-menu (super_admin only). `/dashboard` intentionally hid it (`showViewAs=false`) — impersonation happened via a separate entry point, not from the header.

**Font rule (locked)**:
| Use | Token | Family |
|---|---|---|
| Body / UI / prose | `--font-sans` | Roboto |
| Mono (labels · tabular-nums · kbd · sub-headers · code) | `--font-mono` | Geist Mono |
| h1 ≤ 48px (page headings incl. greeting) | `--font-pixel` | **Geist Pixel Square** crisp |
| Display ≥ 140px (404 hero, ErrorState code) | `--font-pixel-display` | **Geist Pixel Grid** |

## Roll-up

| Archetype | Routes | Adopted | Next session |
|---|---:|---|---|
| List/Table | 26 | 2 (preview + staff) | S2 Overlays unblocks, then mass migration after all sessions |
| Dashboard | 11 | 0 | S3 |
| Detail | 12 | 0 | S4 |
| Form | 8 | 0 | S6 |
| Settings | 7 | 0 | S7 |
| Tool | 6 | 0 | S8 |
| **Total** | **70** | **2** | 68 pages pending |

---

## Session → catalog rows mapping

| Session | Unblocks catalog rows (Design 🟢) |
|---|---|
| S1 List/Table ✅ (2026-04-19) | `<DataTable>`, `<StatusBadge>` tokens, `<AppHeader>` spec, `<Button>` primary-rebuild spec, `<FilterBar>` spec, `<FloatingCTA>` spec |
| S2 Overlays | All of Group C (8 primitives) + `<Alert>` + confirm Sonner wrapper spec |
| S3 Dashboard ✅ 2026-04-19 | `<GreetingHeader>`, `<NeedsAttentionPill>`, `<AttentionHeader>`, `<CountBadge>`, `<KpiTile>` (2026-04-21), `<NumberTicker>` (2026-04-21) at `src/components/primitives/dashboard/`; ~~`<ModuleCard>`~~, ~~`<CategoryHeader>`~~, ~~`<ModuleSearch>`~~ ⚠️ **RETIRED 2026-07-25** — deleted with the launcher grid, see [DEPRECATIONS.md](./DEPRECATIONS.md) |
| S4 Detail | `<PageShell>`, `<Timeline>`, refine `<ConfirmDialog>` |
| S5 LineItemsEditor | `<LineItemsEditor>` · edit-in-place + drag-reorder + in-built dropdowns |
| S6 Form | `<Stepper>`, `<MobileDrawer>`, refine Group E FieldRows (`<InputRow>`, `<SelectRow>`, `<DateRow>`, `<MultiSelectRow>`) |
| S7 Settings | composition-only (no new primitives) |
| S8 Tool | composition-only |
| S9 Atom polish | `<Badge>`, `<Kbd>`, `<Chip>` variants, `<Avatar>` formalise |
| S10 Progress | `<WorkflowProgressBar>`, `<ProgressCard>` |
| S11 Spatial | `<MapCanvas>`, `<SpatialPicker>`, `<DrawingModal>` |
| S12 Integration | `<IntegrationCard>` family (NAS · Xero · email · webhook) |
| S-shell | `<AppHeader>` full scope + Phase A atoms/states |

After S4, all shells + overlays + most atoms done → W09 mass migration can start in parallel with S5–S9.

---

## How to update this catalog

1. **After each Claude Design session finishes**: update affected primitive rows in **[DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md)** (Design 🟡→🟢 when spec locks).
2. **After each W07 implementation**: update Impl 🔴→🟡→🟢 in **[DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md)**.
3. **After each W09 module migration**: increment `Adopted` counter for every primitive that module now consumes (in **[DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md)**) AND flip the migration status in **[DESIGN_CATALOG_MATRIX.md](DESIGN_CATALOG_MATRIX.md)** AND add a row to the W09 adoption table above. Day-of details + commit notes go to **[RECENT_CHANGES.md](RECENT_CHANGES.md)** (append-only).
4. **Promotion of a new primitive mid-run**: append the row to the appropriate section (A–N) in **[DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md)** + register in [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) + log under the date in [src/components/primitives/CHANGELOG.md](../../../src/components/primitives/CHANGELOG.md).
**Truth: this catalog (router + 2 sub-files) is the source of truth. SYSTEM_STATE W08/W07/W09 rows reflect totals from here.**
