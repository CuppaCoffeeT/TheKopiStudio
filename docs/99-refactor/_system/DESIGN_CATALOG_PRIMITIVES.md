# DESIGN_CATALOG — Primitive inventory

**Created**: 2026-04-28 SGT (extracted from `DESIGN_CATALOG.md` to clear 6.9× budget overflow)
**Last Updated**: 2026-07-27 SGT — section A: `<AppHeader>` marked RETIRED (masthead deleted, Kopi Studio 2a P3); `PageTitle` / `PageDescription` / `ListPageFrame` rows re-pointed off the deleted `DashboardHeader` shim · 2026-07-25 SGT — section H: `ModuleCard` / `CategoryHeader` / `ModuleSearch` marked RETIRED (files deleted with the launcher grid, Kopi Studio 2a P4); `KpiIndexCard` row added
**Status**: 🟢 Production
**Priority**: 🔴 Critical

👉 Workspace router: [DESIGN_CATALOG.md](./DESIGN_CATALOG.md) · Sibling: [DESIGN_CATALOG_MATRIX.md](./DESIGN_CATALOG_MATRIX.md)

## 📋 Overview

Per-primitive Design · Impl · Adopted matrix, organised by **12 design-intent sections (A–N)**. Sister of `src/components/primitives/CONTEXT.md` (which organises by 8 code-group folders). Both are correct under their own scheme — this catalog includes cross-cutting groupings (atoms · states · motion · spatial) that don't map 1:1 to filesystem folders.

## Primitive inventory (105 primitives across 13 groups · 2026-04-26 — drift sweep added section M with 10 NET-NEW retrofits + 1 Badge status flip from section B; W23 #1 added section N · WhatsAppThreadPanel)

> **Counting note**: this catalog organizes by 12 design-intent sections (A–M); `src/components/primitives/CONTEXT.md` organizes by 8 code groups and reports **107** (file-by-file count of `.tsx` under `primitives/`). Both numbers are correct under their own scheme — the catalog's 12 sections include cross-cutting groupings (atoms · states · motion · spatial) that don't map 1:1 to filesystem folders.

### A. Shells (7) — page-level composition

> ⚠️ **The horizontal masthead was deleted 2026-07-25** (Kopi Studio 2a redesign, P3 — the 200px `AppSidebar` rail is the whole desktop chrome, and its footer owns account / bell / view-as / sign-out). `<AppHeader>` and `<AppHeaderDesktopBar>` went with it, as did the `DashboardHeader` shim that fanned the masthead out to ~71 pages: **those .tsx files no longer exist — do not import them.** The row below is kept struck-through as history; see [DEPRECATIONS.md](./DEPRECATIONS.md). Replacements: `shell/AppSidebar` + `shell/AppSidebarFooter` (≥ lg) · `shell/AppHeaderMobileBar` (< lg) · `shell/AppHeaderShell` (the page-shell wrapper that kept the name but renders no masthead).

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| ~~`<AppHeader>`~~ | ⚠️ **RETIRED 2026-07-25** — file deleted with the top masthead (Kopi 2a P3). Was: glass **sticky top-0** header — **segmented breadcrumb** (Workspace / Projects / Project #2154 · clickable, replaces back-button) · ⌘K launcher · notification bell · **view-as-user via `viewAsSlot` prop** · **user menu** (avatar + name → email · role · account · shortcuts · sign-out) · **impersonation banner** (auto-renders below when active) · theme-toggle props (`themeMode`/`onThemeChange`) retained but unwired since the 2026-07-14 permanent-dark lock · responsive 56h desktop / 52h mobile. Replaced by `AppSidebar` + `AppSidebarFooter` (≥ lg) and `AppHeaderMobileBar` (< lg); breadcrumb became page content inside `AppHeaderShell`. | S-shell ✅ | 🟢 | ⚫ deleted | 0 (was 72/80 effective — 1 direct + 71 indirect via the `DashboardHeader` shim, itself deleted the same day) |
| `<PageShell>` | Detail-page hero + tabs + optional side-rail | S4 Detail | 🔴 | 🔴 | 0/12 |
| `<DataTable>` | List/Table archetype · TanStack + Motion · server-paginated | S1 List/Table ✅ | 🟢 | 🟡 refine | 1/26 (/staffmanagement ref) |
| `<LineItemsEditor>` ← NEW | Editable in-place line items · drag reorder · in-built dropdowns · **borderless edit-in-line** (user pick) · reorganise + clear-lines actions | S5 LineItems | 🔴 | 🔴 | 0/3 (quotation · invoice · progress-claim detail) |
| `<KpiTile>` | Tremor card + NumberTicker · sparkline slot · delta badge (pos/neg/neutral) · icon · alert dot · compact variant | S3 Dashboard ✅ | 🟢 | 🟢 at `src/components/primitives/dashboard/KpiTile.tsx` (NumberTicker bundled at `dashboard/NumberTicker.tsx`) | 1/11 dashboards (crm /dashboard home ✅ 2026-07-14 · rest pending W09) |
| `<Chart>` | Tremor + Motion entrance · area/bar/line | S3 Dashboard | 🔴 | 🔴 | 0/11 |
| `<IntegrationCard>` ← NEW | Standard card for NAS folder · Xero · email-account · webhook — connected/disconnected state · last-sync timestamp · action row (Connect/Disconnect/Sync/View logs) | S12 Integration | 🔴 | 🔴 | 0/8 surfaces |
| `<InboxChip>` / `<SituationBar>` / `<InboxRailPanel>` ← **AIInboxRail family (2026-04-23)** | Domain-neutral AI / agent inbox surfaces: (a) rounded-rect trigger chip w/ count badge, (b) info-sentence bar + inline chip with scroll-aware floating clone when scrolled out of view, (c) expanded rail panel w/ clickable collapse-header + children slot. No Claude Design spec (promoted from feature code when pattern needed cross-page). Compliance: v4 tokens · 5 states · JSDoc exception documented in-file · shell barrel export. | ⚠ no spec | 🟢 | 🟢 at `src/components/primitives/shell/AIInboxRail.tsx` | 1/many (quotation detail — target: project · work-permit · any AI-agent-bearing record) |

### B. Atoms (10) — small reusable building blocks

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<Button>` variants | primary (slate-800) · destructive (red-700) · ghost · outline · icon · sm/md/lg sizes · :focus-visible red-700 ring | S-shell ✅ | 🟢 | 🟡 at `src/components/primitives/shell/Button.tsx` (existing shadcn `ui/button.tsx` stays; consumers gradually migrate) | 0/many |
| `<StatusBadge>` | 6 variants (draft · sent · accepted · rejected · expired · revised) | S1 ✅ tokens · atom promoted 2026-04-19 | 🟢 | 🟢 at `src/components/primitives/StatusBadge.tsx` | 0/14 (preview adopter only) |
| `<Avatar>` | Initial circle · deterministic colour hash · 4 sizes (xs/sm/md/lg) | S1 ✅ atom built | 🟢 | 🟢 at `src/components/primitives/Avatar.tsx` | 0/22 |
| `<IconButton>` | Ghost-bordered 32px/44px icon button · accessible focus ring | S1 ✅ atom built | 🟢 | 🟢 at `src/components/primitives/IconButton.tsx` | 0/22 |
| `<IconGlyph>` ← NEW | 15 named outline glyphs (doc/money/stack/check/clock/flag/users/ruler/warn/refresh/download/plus/arrow-right/bolt/calendar) · 16px default · strokeWidth 1.3 · currentColor | handoff 2026-04-20-nl73fwyg DashAtoms.jsx#L103 | 🟢 | 🟢 at `src/components/primitives/IconGlyph.tsx` | 0/many (KPI labels + meta strips) |
| `<Checkbox>` | Custom indeterminate-capable checkbox | S1 | 🟡 | 🔴 (shadcn default) | uses shadcn |
| `<Select>` | Combobox / dropdown base | S2 Overlays | 🔴 | 🔴 (shadcn default) | uses shadcn |
| `<Input>` | Search variant · tabular-nums variant | S1 | 🟡 | 🔴 (shadcn default) | uses shadcn |
| `<Chip>` | Filter toggle + tab variants · sm/md sizes · active slate-800 · optional count suffix in mono | S-shell ✅ | 🟢 | 🟡 at `src/components/primitives/shell/Chip.tsx` | 0/22 |
| `<Badge>` | Neutral status chip (shadcn already exists — restyle) | S9 polish | 🔴 | 🟡 (shadcn retrofit) | 0/14 |
| `<Kbd>` | Keyboard shortcut pill (⌘K style) | S2 Overlays | 🔴 | 🔴 | 0 |

### C. Overlays (9) — glass-layered, system-level

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<Toaster>` / `toast()` | Sonner wrapper · glass bg · variant border-left | S2 ✅ 2026-04-19 | 🟢 | 🟢 at `src/components/primitives/overlays/Toaster.tsx` · **root-mounted in [App.tsx](../../../src/App.tsx) 2026-04-19** · `ui/sonner` is a shim | **22/22 (ALL — single root mount)** |
| `<Alert>` | In-page banner · info/warning/error/success variants | S2 ✅ | 🟢 | 🟡 at `src/components/primitives/overlays/Alert.tsx` | 0/? |
| `<Modal>` | Dialog · glass backdrop · Geist Pixel h1 · destructive variant · 5 sizes (sm 340 · md 460 · lg 520 · xl 560 · xxl 800 added 2026-04-23 for /payslip W09) | S2 ✅ | 🟢 | 🟢 at `src/components/primitives/overlays/Modal.tsx` | EditPayslipModal (xxl) · AddWorkersModal (xl) · EmailTab resend confirm (lg) — /payslip W09 |
| `<Drawer>` | vaul bottom-sheet · handle pulse · glass backdrop | S2 ✅ (visual) · S6 Form (row spec) | 🟢 | 🟡 at `src/components/primitives/overlays/Drawer.tsx` | 0 |
| `<Popover>` | Glass surface · arrow · Portal'd | S2 ✅ | 🟢 | 🟡 at `src/components/primitives/overlays/Popover.tsx` | 0 |
| `<Tooltip>` | Inverted-contrast pill · optional Kbd chip | S2 ✅ | 🟢 | 🟡 at `src/components/primitives/overlays/Tooltip.tsx` | 0 |
| `<DropdownMenu>` | Glass surface · icon + label + Kbd shortcut · destructive items | S2 ✅ | 🟢 | 🟡 at `src/components/primitives/overlays/DropdownMenu.tsx` | 0 |
| `<ContextMenu>` | Right-click menus (same visual as DropdownMenu) | S2 ✅ | 🟢 | 🟡 at `src/components/primitives/overlays/ContextMenu.tsx` | 0 |
| `<SearchableMultiSelect>` ← NEW | THE universal picker · single/multi/search/addNew · auto-focus search on open (overrides Radix default) | S2 ✅ | 🟢 | 🟡 at `src/components/primitives/overlays/SearchableMultiSelect.tsx` | 0 (replaces 18 bespoke pickers) |
| `<CommandPalette>` ← NEW | ⌘K launcher · Radix Dialog + cmdk fuzzy engine · glass surface · uppercase-mono group headings · DropdownMenu-style rows · keyboard hint footer · `useCommandPaletteHotkey(toggle)` | Composed from S2 (Modal · SMS · DropdownMenu) + S-shell (Kbd · FilterBar ⌘K) — no new visual language | 🟢 | 🟢 at `src/components/primitives/overlays/CommandPalette.tsx` · 2026-04-19 | **1/1 (GlobalCommandPalette → every dashboard route)** |

### D. States (4) — placeholder surfaces

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<EmptyState>` | Icon + headline + CTA pattern | S1 ✅ | 🟢 | 🟢 shipped (W07 Phase 1) | 0/22 formally adopted |
| `<LoadingSkeleton>` | 5 variants (row · table-rows · kpi-tile · avatar-row · card) · shimmer via `animate-pulse` | S-shell ✅ | 🟢 | 🟡 at `src/components/primitives/shell/LoadingSkeleton.tsx` | 0 |
| `<LoadingSpinner>` | YOUR-TEAM JL-mark Lottie · 3 sizes (sm 24 · md 40 · lg 64) · 2.4s trace → fill → hold loop · optional label · `prefers-reduced-motion` safe | S-loading (lottie-animator skill, 2026-04-21) | 🟢 | 🟢 at `src/components/primitives/shell/LoadingSpinner.tsx` + `jl-spinner.lottie.json` | 2 (prod: ProtectedRoute · lab: HandoffsLabPage) |
| `<ErrorState>` | Baby-version of 404 page · Geist Pixel Grid ERR_CODE hero · mono path chip w/ red × · slate-800 Retry + outline Report · red-700 accent dot | S-shell ✅ (404-aesthetic tweak) | 🟢 | 🟡 at `src/components/primitives/shell/ErrorState.tsx` | 0 |
| `<NoResultsState>` | "No matches for `<query>`" · clear-search + reset-filters · active filter chips | S-shell ✅ | 🟢 | 🟡 at `src/components/primitives/shell/NoResultsState.tsx` | 1 (crm /dashboard home ✅ 2026-07-14) |

### E. Form (8) — react-hook-form shells

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<FormShell>` | Section headers + FormProvider | S6 Form | 🟡 | 🟢 shipped (W07 Phase 1) | 1/8 (staff-management) |
| `<FieldRow>` | Label left + input right · stacked mobile | S6 Form | 🟡 | 🟢 shipped | 1/8 |
| `<SubmitBar>` | Sticky bottom submit + cancel + status | S6 Form | 🟡 | 🟢 shipped | 1/8 |
| `<InputRow>` | FieldRow + text input | S6 Form | 🔴 | 🔴 | 0/8 |
| `<SelectRow>` | FieldRow + Select | S6 Form | 🔴 | 🔴 | 0/8 |
| `<DateRow>` | FieldRow + DatePicker (SGT-aware) | S6 Form | 🔴 | 🔴 | 0/8 |
| `<MultiSelectRow>` | FieldRow + multi-select (with chips) | S6 Form | 🔴 | 🔴 | 0/8 |
| `<ManualOverrideToggle>` ← NEW | "Ready to claim / force complete" override gate — slate-100 rest · red-700 when toggled · required reason field · audit-log tie-in (who + when + reason) | S6 Form | 🔴 | 🔴 | 0/5 tabs (plan-purchase · CDW · NCE · pay-cert · progress-claim) |

### F. Motion (5) — signature moments

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<Stepper>` | Animated chip stepper · spring + check-mark morph | S6 Form | 🔴 | 🔴 | 0 (supervisor flows) |
| `<Timeline>` | Scroll-beam (Aceternity-style) · signature detail page | S4 Detail | 🔴 | 🔴 | 0 (4 *StatusTimeline duplicates) |
| `<FloatingCTA>` ← NEW | Bottom-right pill · circular 48×48 mobile · label pill tablet+ · slate-800 bg · large shadow · active:scale-95 · keyboard-focusable | S-shell ✅ | 🟢 | 🟡 at `src/components/primitives/shell/FloatingCTA.tsx` | 0/26 mobile lists |
| `<WorkflowProgressBar>` ← NEW | Horizontal circular-step bar (CDW / meetingprojects pattern) — 6 steps · % complete · check/number states · responsive collapse on mobile | S10 Progress | 🔴 | 🔴 | 0/4 (projects/:id CDW · /meetingprojects · cable-detection · generic workflow) |
| `<ProgressCard>` ← NEW | Wraps `<WorkflowProgressBar>` with title + subtitle + percent + bar · used in dashboards + project-detail summary | S10 Progress | 🔴 | 🔴 | 0/6 |

### G. Spatial (3) — map + canvas tools (NEW)

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<MapCanvas>` ← NEW | Leaflet base wrapper · AppBase tile setup · marker + geojson API · dark-mode-aware tiles | S11 Spatial | 🔴 | 🔴 | 0/4 (plan-purchase · CDW · drafter · project-overview) |
| `<SpatialPicker>` ← NEW | Pin / region selector on `<MapCanvas>` · snap-to-parcel · bulk-select · keyboard nav | S11 Spatial | 🔴 | 🔴 | 0/3 (plan-purchase parts · CDW parts · location-pinning) |
| `<DrawingModal>` ← NEW | Drafter draw-on-plan canvas · tools (line · polygon · text · arrow) · layer stack · save to NAS · version history | S11 Spatial + S2 Overlays | 🔴 | 🔴 | 0/1 (projects/:id drafter tab) |

### H. Dashboard (7 designed · 3 RETIRED 2026-07-25) — was the /dashboard module launcher (S3 ✅ 2026-04-19)

> ⚠️ **The module-launcher grid was deleted 2026-07-25** (Kopi Studio 2a redesign, P4 — sidebar rail + ⌘K `CommandPalette` already route by module). `<ModuleCard>`, `<CategoryHeader>` and `<ModuleSearch>` went with it: **the .tsx files no longer exist — do not import them.** Rows kept struck-through as history; see [DEPRECATIONS.md](./DEPRECATIONS.md). The 2a Overview surface composes `GreetingHeader` + `KpiIndexCard` instead.

| Primitive | Purpose | Unblocked by session | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<GreetingHeader>` ← NEW | "good morning, Sky." (Instrument Serif, clamp 26-36px) + SGT date + role chip + view-as-user field (super_admin) + logout + `rightSlot` escape hatch. Replaces `DashboardGreeting.tsx`. | S3 ✅ | 🟢 | 🟢 at `src/components/primitives/dashboard/GreetingHeader.tsx` | **1 (crm /dashboard home ✅ 2026-07-14 · 2a masthead 2026-07-25)** |
| `<KpiIndexCard>` ← NEW 2026-07-25 | 2a "Overview" KPI tile — uppercase module label + Instrument Serif index numeral on one baseline, serif 32px figure with inline sans unit, 12.5px meta line. Flat card cream + hairline; hover shadow only when interactive. Deliberately NOT `KpiTile` (no icons/deltas/tickers/sparklines). Renders on a CARD ground — its `--fg-muted` label fails AA on the page cream. | Kopi 2a P4 | 🟢 | 🟢 at `src/components/primitives/dashboard/KpiIndexCard.tsx` | **1 (crm /dashboard home ✅ via `OverviewKpiRow`)** |
| ~~`<ModuleCard>`~~ | ⚠️ **RETIRED 2026-07-25** — file deleted with the launcher grid (Kopi 2a P4). Was: launcher tile · 2 sizes · icon + name + description + count + pin + star. Replaced by `KpiIndexCard` on the surface and ⌘K `CommandPalette` for module jump. | S3 ✅ | 🟢 | ⚫ deleted | 0 (was 2) |
| `<NeedsAttentionPill>` ← NEW | 44px tap-target pill · module icon + name + count badge + chevron · used in NeedsAttentionStrip. | S3 ✅ | 🟢 | 🟢 at `src/components/primitives/dashboard/NeedsAttentionPill.tsx` | 0 — unadopted since the launcher went (2026-07-25) |
| `<AttentionHeader>` ← NEW | "Needs your attention · N" label above pills. | S3 ✅ | 🟢 | 🟢 at `src/components/primitives/dashboard/AttentionHeader.tsx` | 0 — unadopted since the launcher went (2026-07-25) |
| ~~`<CategoryHeader>`~~ | ⚠️ **RETIRED 2026-07-25** — file deleted with the launcher grid (Kopi 2a P4). Was: uppercase group label above module sub-sections (Client Ops · Field Ops · Finance · Admin), collapsible. No replacement — the 2a Overview has no module categories. | S3 ✅ | 🟢 | ⚫ deleted | 0 (was 1) |
| ~~`<ModuleSearch>`~~ | ⚠️ **RETIRED 2026-07-25** — file deleted with the launcher grid (Kopi 2a P4). Was: search input w/ ⌘K hint filtering ModuleGrid. Replaced by `overlays/CommandPalette.tsx`. | S3 ✅ | 🟢 | ⚫ deleted | 0 (was 1) |
| `<CountBadge>` ← NEW | Pill badge for counts (compact + default sizes) · flips to the negative tone ≥ 10 or `urgent`. Paired with `NeedsAttentionPill`. | S3 ✅ | 🟢 | 🟢 at `src/components/primitives/dashboard/CountBadge.tsx` | 0 — unadopted since the launcher went (2026-07-25). Distinct from `src/components/ui/count-badge.tsx`, which has its own callers. |

### I. Form kit (12) — S6 FormPrimitives (NEW · 2026-04-20 eod+2 · `StarredMultiSelect` added 2026-05-25)

Promoted from Claude Design handoff `2026-04-20-nl73fwyg/FormPrimitives.html` + `13pEBoyg/component-stepper.html`. Live at `src/components/primitives/form/`. All adoption-pending — 0 prod adopters until W09 migrations consume.

| Primitive | Purpose | Design | Impl | Adopted |
|---|---|---|---|---|
| `<Input>` | Text/number w/ optional prefix/suffix + leading-icon slots · sizes md/lg · states rest/hover/focus/disabled/error/readonly | 🟢 | 🟢 at `form/Input.tsx` | 0/~40 form surfaces |
| `<Textarea>` | Auto-grow w/ optional char-counter · min 88px max 220px · md only | 🟢 | 🟢 at `form/Textarea.tsx` | 0/~15 |
| `<Select>` | Native-feel w/ chevron · same sizes as Input · opens panel in single-select mode | 🟢 | 🟢 at `form/Select.tsx` | 0/~30 |
| `<Checkbox>` | 20×20 · rest/hover/checked/focus/disabled/indeterminate · hidden native input + peer class for a11y | 🟢 | 🟢 at `form/Checkbox.tsx` | 0/many |
| `<Radio>` | 20×20 · same states minus indeterminate | 🟢 | 🟢 at `form/Radio.tsx` | 0/many |
| `<Switch>` | 36×20 track · CTA slate-800 when checked · hidden native input | 🟢 | 🟢 at `form/Switch.tsx` | 0/many |
| `<DatePicker>` | Singapore locale · single + range · month-year dropdowns · Today+Clear · from 2020 to 2030 default | 🟢 | 🟢 at `form/DatePicker.tsx` (392 LOC) | 0/many — **JUDGMENT CALL**: sliding range + internal `<select>` overlay for month/year (visual-verify before heavy use) |
| `<TimePicker>` ← NEW (2026-05-26) | HH:MM time-of-day picker · 2-col popover (Hr · Min · +AM/PM for 12h) · `step` granularity 1/5/15/30/60 · `Now` button uses SGT (UTC+8) rounded to step · `Clear` empties · keyboard ↑↓ steps focused col, ←→ moves col, Enter commits, Esc closes · absolute-positioned popover (no portal — iOS Safari touch rule) · 40h md / 48h lg · pairs visually with DatePicker inside a Field | 🟢 (handoff `2026-05-26-9eon4QqA`) | 🟢 at `form/TimePicker.tsx` | 2/many — `features/attendance/{lib/attendanceTableShared.tsx,components/AttendanceDateHeader.tsx,components/AttendanceWorkerRow.tsx}` (W09 attendance) |
| `<FileUpload>` | Dropzone + file list · idle/drag-over/uploading/success/error · controlled `files` + callbacks | 🟢 | 🟢 at `form/FileUpload.tsx` | 0/many |
| `<Field>` | Form shell: label + input slot + helper/error text + required `*` marker. Covers FormRow/FormField concept. | 🟢 | 🟢 at `form/Field.tsx` | 0/all form surfaces |
| `<Progress>` | Linear bar · determinate + indeterminate · 4 tones (neutral/active/success/error) · CDW/meetingprojects target | 🟢 | 🟢 at `form/Progress.tsx` | 0/many. `<WorkflowProgressBar>` + `<ProgressCard>` compositions ⚫ deferred. |
| `<Stepper>` | Horizontal chip-morph step indicator · 3 states (completed+check · current red-7+halo · upcoming zinc-outline 50%) · connector lines | 🟢 | 🟢 at `form/Stepper.tsx` | 0/~8 multi-step form routes |
| `<StarredMultiSelect>` ← NEW (2026-05-25) | Multi-select picker + selected-pill row above with star toggle to mark ONE option as "primary". Composes `<SearchableMultiSelect>` for the picker (with `hideSelectedPills`) and renders pill badges with star + remove-X. Used by `ui/client-contact-multi-select` to pick client contacts + flag Primary PIC. | 🟢 | 🟢 at `form/StarredMultiSelect.tsx` | 1/many — `ui/client-contact-multi-select` (W09 #12 close) |

### J. UI table layer (8 + FilterPill in shell) — S1b DataTable kit (NEW · 2026-04-20 eod+2)

Promoted from `2026-04-20-nl73fwyg/DataTablePrimitives.html`. Live at `src/components/primitives/ui/`. 0 prod adopters.

| Primitive | Purpose | Design | Impl | Adopted |
|---|---|---|---|---|
| `<DataTable>` | Composition primitive — header/body/pagination slots · density compact(44h)/cozy(56h) · states default/empty/loading/error/no-results/mobile | 🟢 | 🟢 at `ui/DataTable.tsx` | 0/88 list routes |
| `<TableHeader>` | default/sorted-asc/sorted-desc/sortable-hover · Geist Mono uppercase labels · aria-sort | 🟢 | 🟢 at `ui/TableHeader.tsx` | 0/88 |
| `<DataRow>` | default/hover/selected/focused/disabled · hover-bg zinc-200 (differs from page-bg zinc-100) | 🟢 | 🟢 at `ui/DataRow.tsx` | 0/88 |
| `<SortIcon>` | asc/desc/unsorted chevron | 🟢 | 🟢 at `ui/SortIcon.tsx` | 0/88 |
| `<TableCheckbox>` | 16×16 smaller variant of form Checkbox · select-all + row select | 🟢 | 🟢 at `ui/TableCheckbox.tsx` · **JUDGMENT CALL**: upgraded `<span>` → `<button role="checkbox">` for keyboard a11y | 0/88 |
| `<Pagination>` | First · Prev · page numbers · Next · Last · "1–100 of 487" Geist Mono label | 🟢 | 🟢 at `ui/Pagination.tsx` · **JUDGMENT CALL**: clamped sliding window (JSX spec was hard-coded `[1..5]`) | 0/88 |
| `<PageBtn>` | 32×32 square · default/active/hover/disabled | 🟢 | 🟢 at `ui/PageBtn.tsx` | 0/88 |
| `<MobileListCard>` | Mobile row replacement · title/subtitle/meta/right-slot · 44h min tap | 🟢 | 🟢 at `ui/MobileListCard.tsx` | 0/88 |
| `<EditableListCard>` ← NEW (2026-05-26) | Mobile inline-edit row primitive (peer of `<MobileListCard>`). Composition shell: header (index/title/subtitle/trailingBadge) + flex-wrap controls row + full-width footer. Primitive owns NO state — controls + footer are caller-rendered. `variant: 'flat' \| 'card'` — `'flat'` (default) = border-b divider for use inside `<DataTable mobileBody>` (matches MobileListCard rhythm); `'card'` = full border + radius-10 + p-3 for standalone use. All 5 states (default/hover/active/focus/disabled). Disabled blocks pointer events on whole card. | 🟢 (handoff `2026-05-26-9eon4QqA`) | 🟢 at `ui/EditableListCard.tsx` | 1/many — `features/attendance/components/AttendanceWorkerRow.tsx` (W09 attendance) |
| `<FilterPill>` | default/active/focus/with-count · lives in shell/ (cross-cutting) | 🟢 | 🟢 at `shell/FilterPill.tsx` | 0/many |
| `<StatusTabs>` ← NEW | Underlined segment tabs w/ count badges (All 487 · Drafts 24 · Sent 186) · default/warn/alert tones · a11y `role=tablist` | 🟢 (DataTable.jsx#L450) | 🟢 at `ui/StatusTabs.tsx` | 0/88 list pages |
| `<FilterDropdown>` ← NEW | Filter-popover trigger "Status · 2 selected ▾" · composes `<Popover>` · red count badge · isDate · calendar icon | 🟢 (ListAtoms.jsx#L220 PopoverButton) | 🟢 at `shell/FilterDropdown.tsx` | 0/88 |
| `<ListPageFrame>` | Lego-assembly list archetype. **Since 2026-07-25 (Kopi 2a P5)**: `AppHeaderMobileBar` (< lg only — the masthead is gone) + kicker + serif title-row with inline count, **search + CTA on the title row** + StatusTabs + FilterBar (filters only) + bare DataTable (no card wrapper) + Pagination + FloatingCTA | 🟢 (DataTable.jsx#L388 PageChrome) | 🟢 at `ui/ListPageFrame.tsx` | live on the CRM + profiler list pages |

### K. Charts (8) — S3b Chart family (NEW · 2026-04-20 eod+2)

Promoted from `2026-04-20-nl73fwyg/ChartPrimitives.html`. Live at `src/components/primitives/charts/`. 0 prod adopters.

| Primitive | Purpose | Design | Impl | Adopted |
|---|---|---|---|---|
| `<ChartShell>` | Header (title · subtitle · legend · tools) + 280h canvas + footer slot | 🟢 | 🟢 at `charts/ChartShell.tsx` | 0/~10 role dashboards |
| `<AreaChart>` | Stacked + single-series · 600ms path-draw via SVG keyframes | 🟢 | 🟢 at `charts/AreaChart.tsx` | 0/~6 |
| `<BarChart>` | Grouped + stacked · 200ms bar-stagger | 🟢 | 🟢 at `charts/BarChart.tsx` | 0/~6 |
| `<HBarChart>` | Horizontal variant · Avatar prefix per row (engineer workload) | 🟢 | 🟢 at `charts/HBarChart.tsx` | 0/~3 |
| `<ChartTooltip>` | Glass popover zinc-900/90 dark:zinc-950/85 · title + key-value rows Geist Mono · **JUDGMENT CALL**: opacity close not exact (bg-zinc-900/90 vs spec rgba(24,24,27,0.92)) | 🟢 | 🟢 at `charts/ChartTooltip.tsx` | 0/many |
| `<ChartLoading>` | Shimmer bars matching chart type · SVG gradient (only real hex preserved here) | 🟢 | 🟢 at `charts/ChartLoading.tsx` | 0/many |
| `<ChartError>` | 503-style inline message + Retry button w/ AlertCircle icon | 🟢 | 🟢 at `charts/ChartError.tsx` | 0/many |
| `<LegendRow>` | Color dot + label + optional value · horizontal wrap | 🟢 | 🟢 at `charts/LegendRow.tsx` | 0/many |

**Bonus (2026-04-20 eod+2 — ⛔ historical, the component was deleted 2026-07-25)**: AppHeader v2 shipped per handoff `FmPJtwZw` — pixel lockup (JL Logo + `AppBase` in Geist Pixel) · Bell-first right cluster · 6px gap · glass 72/70 opacity · mobile back-chevron. Patched in-place at `shell/AppHeader.tsx`. The identity lockup now lives in `shell/Wordmark.tsx` ("The Kopi Studio", Instrument Serif) inside the sidebar rail.

### L. Email Inbox (14) — S7 EmailInbox family (NEW · 2026-04-23)

Promoted from `2026-04-23-rNq9eFQw/component-email-inbox.html`. Live across `shell/` · `ui/` · `detail/` · `form/`. First adopter: `/emailinbox` (W09 #15). (The rollout plan `05-implementation/active/EMAIL_INBOX_PRIMITIVE_LIFT_PLAN.md` was an AppBase-template doc and is not in this repo; `/emailinbox` is not a route here either.)

| Primitive | Purpose | Group | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<EmailSidebar>` | 240px expanded / 52px rail: account slot · system labels · user labels · AI-category chips · sync footer | shell | 🟢 | 🟢 at `shell/EmailSidebar.tsx` | 1 (/emailinbox) |
| `<EmailCategoryBadge>` | 12-category tone-pair badge · `badge` static + `filter` toggle variants · dark-aware | shell | 🟢 | 🟢 at `shell/EmailCategoryBadge.tsx` | 1 |
| `<AttachmentChip>` | Downloadable file chip · filename + size + idle/loading/error state | shell | 🟢 | 🟢 at `shell/AttachmentChip.tsx` | 1 |
| `<LinkedEntityPill>` | Color-dot + label pill for cross-entity links ("Linked to project #2154") | shell | 🟢 | 🟢 at `shell/LinkedEntityPill.tsx` | 1 |
| `<SanitizedHtmlProse>` | DOMPurify-sanitized HTML renderer · CID image resolution · Gmail-style external-image prompt · prose tokens | shell | 🟢 | 🟢 at `shell/SanitizedHtmlProse.tsx` | 1 |
| `<EmailThreadRow>` | Thread list row · star · read-state · subject · message count · snippet · category badge slot · date · unread/selected left-strip accents | ui | 🟢 | 🟢 at `ui/EmailThreadRow.tsx` | 1 |
| `<EmailDetailHeader>` | Sticky glass compact bar · back · title · count · linked entities slot · star | detail | 🟢 | 🟢 at `detail/EmailDetailHeader.tsx` | 1 |
| `<EmailMessageCard>` | Expandable message card · TO/CC/BCC rows · body (via SanitizedHtmlProse) · attachments slot · Reply/ReplyAll/Forward actions | detail | 🟢 | 🟢 at `detail/EmailMessageCard.tsx` | 1 |
| `<AIPanel>` | Shared shell for AI annotations · accent: green / blue / amber · header + body + actions + footer slots | detail | 🟢 | 🟢 at `detail/AIPanel.tsx` (+ `AIPanelStatusPill` + `AIPanelActionButton`) | 1 (3 wrappers compose it) |
| `<AIClassificationPanel>` | Category badge + confidence + reply-needed + summary + reasoning + `[Correct · Wrong category · Notes]` actions | detail | 🟢 | 🟢 at `detail/AIClassificationPanel.tsx` | 1 |
| `<AIOverrideClassificationPanel>` | AI-picked vs Manual grid + reason textarea + Save/Clear + collapsible history trail | detail | 🟢 | 🟢 at `detail/AIOverrideClassificationPanel.tsx` | 1 |
| `<AIDraftReplyPanel>` | Subject + body preview + `[Approve · Edit inline · Decline-with-reason]` · 3 modes (view/editing/declining) | detail | 🟢 | 🟢 at `detail/AIDraftReplyPanel.tsx` | 1 |
| `<HistoryTrailList>` | From→to audit log list · collapsible · domain-agnostic (any override/status-change history) | detail | 🟢 | 🟢 at `detail/HistoryTrailList.tsx` | 1 |
| `<EmailComposeForm>` | From-account + To + CC/BCC toggle + Subject + Body · stateless controlled · Modal-desktop / Drawer-mobile agnostic (caller wraps) | form | 🟢 | 🟢 at `form/EmailComposeForm.tsx` | 1 |

### M. System retrofits (11) — registered via drift sweep · 2026-04-26

Earlier W09 sessions promoted these 11 primitives (mostly thin shadcn retrofits or compositional helpers) and barrel-exported them, but the catalog inventory was never updated. Today's sweep adds them. Section B already had a `<Badge>` row at line 127 — same primitive, status flipped here from "🔴 design pending" to "🟢 shipped at `shell/Badge.tsx`".

| Primitive | Purpose | Group | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<Badge>` (status flip) | Neutral status chip — shadcn retrofit promoted to primitive | shell | 🟡 (no dedicated spec; uses tokens from Section B) | 🟢 at `shell/Badge.tsx` | many (replaces `ui/badge` callsites) |
| `<Card>` | shadcn retrofit — slate borders + tokens · CardHeader/CardTitle/CardContent sub-exports | shell | 🟡 | 🟢 at `shell/Card.tsx` | many |
| `<PageDescription>` | Slot used by `ListPageFrame` + `AppHeaderShell` for the sub-title under PageTitle (was: + the deleted `DashboardHeader` shim) | shell | 🟡 | 🟢 at `shell/PageDescription.tsx` | indirect via ListPageFrame / AppHeaderShell |
| `<PageTitle>` | Instrument Serif hero title slot used by `ListPageFrame` + `AppHeaderShell` (was: Geist Pixel, + the deleted `DashboardHeader` shim) | shell | 🟡 | 🟢 at `shell/PageTitle.tsx` | indirect via ListPageFrame / AppHeaderShell |
| `<ScrollArea>` | shadcn ScrollArea retrofit · used by Drawer + DropdownMenu + tab content | shell | 🟡 | 🟢 at `shell/ScrollArea.tsx` | many (transitive) |
| `<Collapsible>` | Radix Collapsible retrofit · used by HistoryTrailList + AIPanel | overlays | 🟡 | 🟢 at `overlays/Collapsible.tsx` | indirect (HistoryTrailList) |
| `<DialogCompat>` | Radix Dialog primitives re-exported under primitives/ barrel — shim for transitional callsites mid-migration | overlays | 🟡 (compat shim) | 🟢 at `overlays/DialogCompat.tsx` | shim only — prefer `<Modal>` |
| `<SelectMenu>` | High-level Select wrapper composing Popover + Command list (used where SearchableMultiSelect is overkill) | overlays | 🟡 | 🟢 at `overlays/SelectMenu.tsx` | quotation-settings + people access |
| `<Tabs>` | Radix Tabs retrofit consumed by SETTINGS-archetype pages (xero-settings · quotation-settings · people Access) | overlays | 🟡 | 🟢 at `overlays/Tabs.tsx` | 3 (settings archetype pages) |
| `<Label>` | react-hook-form Label retrofit consumed by `<Field>` internally | form | 🟡 | 🟢 at `form/Label.tsx` | indirect via Field |
| `<RadioGroup>` | Radix RadioGroup retrofit · pairs with `<Radio>` from same group | form | 🟡 | 🟢 at `form/RadioGroup.tsx` | indirect |

**Why retrofits are 🟡 design**: each is a shadcn/Radix primitive re-skinned with v4 tokens — no Claude Design spec exists for them individually because their visual language is fully owned by parent compositions (Modal · Drawer · Field · ListPageFrame). If a future session needs to redesign one in isolation, run `/design-prompt` then update its row to 🟢.

### O. SOP knowledge-base additions (1) — sops module Phase 2–4 · 2026-06-01

| Primitive | Purpose | Group | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<MarkdownProse>` | Markdown-native twin of `<SanitizedHtmlProse>`. Renders trusted markdown (react-markdown + remark-gfm) with prose tokens, optional `resolveImageSrc` async callback for signed-URL image resolution, and print-safe styling via `sopPrint.css`. No DOMPurify pass (markdown input is DB-authored, not user HTML). No Claude Design spec — promoted when `features/sops/SopOverviewTab` needed a `<SanitizedHtmlProse>`-equivalent for markdown source-of-truth SOPs. | shell | ⚠ no spec | 🟢 at `shell/MarkdownProse.tsx` | **1** (`features/sops/components/detail/SopOverviewTab.tsx`) |

### N. WhatsApp surface (1) — W23 #1 · 2026-04-26

Promoted from `2026-04-26-LWwN0H4g/component-whatsapp-thread-panel.html`. Composed surface, not a new primitive shape — codifies the panel layout used by PersonDetail and (pending) QuotationWhatsAppTab.

| Primitive | Purpose | Group | Design | Impl | Adopted |
|---|---|---|---|---|---|
| `<WhatsAppThreadPanel>` | Single composed surface: header + count Badge + HITL toggle + bubble scroller (zinc inbound / slate outbound) + composer (To-line, Textarea + char counter, Send CTA) + failed-send inline banner with Resend. Variants `surface=card\|bare` · `compact`. Pure presentation — caller wires `messages` query + realtime subscription + send/HITL/resend mutations. | detail | 🟢 (handoff `2026-04-26-LWwN0H4g`) | 🟢 at `detail/WhatsAppThreadPanel.tsx` | **2** (PersonDetail · `features/people/components/PersonWhatsAppSection.tsx`) + (QuotationWhatsAppTab · `components/quotation/enhanced/QuotationWhatsAppTab.tsx` · W23 #1.1) |

---


## 📚 Related

- [DESIGN_CATALOG.md](./DESIGN_CATALOG.md) — router (sessions · W09 adoption · approval state)
- [DESIGN_CATALOG_MATRIX.md](./DESIGN_CATALOG_MATRIX.md) — module × primitive matrix
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — primitives folder router (by code group · ⚠️ last regenerated 2026-05-30, pre-Kopi)
- [DESIGN_REUSE_PRINCIPLES.md](./DESIGN_REUSE_PRINCIPLES.md) — 11 hard rules
