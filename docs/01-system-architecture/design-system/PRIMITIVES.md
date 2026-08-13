# Primitives — Inventory Router

**Created**: 2026-04-22 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

**135 top-level primitive files across 8 groups** (filesystem count 2026-07-25: shell/40 · form/22 · overlays/18 · detail/18 · ui/17 · dashboard/9 · charts/8 · root atoms/3, counting one row per top-level `.tsx` and excluding `index.ts` / `CONTEXT.md` / nested sub-folders). Nested folders add `shell/cells`, `overlays/wizard`, `detail/dossier` and `detail/LineItemsEditor`. Machine-generated inventory: [PRIMITIVES_MANIFEST.json](../../99-refactor/_system/PRIMITIVES_MANIFEST.json).

> **The manifest and [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) were last regenerated 2026-05-30** and still list names that the 2026-07-25 Kopi migration deleted. Where they disagree with the table below, the table below was checked against the filesystem. Deletion record: [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md).

## Deleted 2026-07-25 — do not import, do not "restore"

Logged in [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) (P3 + P4 of the Kopi redesign):

| Name | Was | Replaced by |
|---|---|---|
| `shell/AppHeader` | the horizontal masthead | `shell/AppSidebar` (≥ lg) + `shell/AppHeaderMobileBar` (< lg) |
| `shell/AppHeaderDesktopBar` | the masthead's desktop row | `shell/AppSidebar` + `shell/AppSidebarFooter` |
| `dashboard/ModuleCard` | launcher tile | `dashboard/KpiIndexCard` for the surface; sidebar + ⌘K for navigation |
| `dashboard/CategoryHeader` | launcher category head | — (no categories on the 2a Overview) |
| `dashboard/ModuleSearch` | launcher search | `overlays/CommandPalette` (⌘K) |

**Do not grep for the `AppHeader` prefix** — four survivors carry it: `AppHeaderShell` · `AppHeaderMobileBar` · `AppHeaderLogo` · `AppHeaderUserMenu`. Grep the exact file names.

`AppHeaderShell` **kept its name** but no longer renders a masthead — it is the page-shell wrapper (page backdrop + impersonation banner + kicker/breadcrumb → H1 → description block closed by a hairline) for tool / dashboard / settings pages. `useDashboardChrome` was renamed `.tsx` → `.ts` in the same change and now returns connector prop *bags*, not JSX slots.

**Gone earlier, no dedicated deprecation entry** — older docs still name them: `IconGlyph` (root atom) and the `DashboardHeader` shim, whose job `AppHeaderShell` now does.

## Groups

| Group | Files | Import pattern | What's inside (barrel exports) |
|---|---|---|---|
| **root atoms** | 3 | deep import, no barrel | `Avatar` · `IconButton` · `StatusBadge` |
| **[shell/](../../../src/components/primitives/shell/)** | 40 | `@/components/primitives/shell` | **Chrome**: `AppSidebar` (+ `SIDEBAR_OFFSET_CLASS`) · `AppSidebarNav` · `AppNavDrawer` · `AppHeaderMobileBar` · `AppHeaderLogo` · `AppHeaderUserMenu` · `AppHeaderShell` · `Wordmark` · `ImpersonationBanner` · `NotificationsBell` · `ViewAsSelector` · `Breadcrumb` · `SEO`. **Atoms**: `Badge` · `Button` · `Card` · `Chip` · `TruncatedText` · `ScrollArea`. **List chrome**: `FilterBar` · `FilterCard` · `FilterDropdown` · `FilterPill` · `SearchInput` · `FloatingCTA` · `ExpandableDataTable` · `cells/{DateCell · DateTimeCell · CurrencyCell · NumberCell}`. **States**: `LoadingSkeleton` · `LoadingSpinner` · `ErrorState` · `NoResultsState` · `PageTitle` · `PageDescription`. **Prose**: `MarkdownProse` · `SanitizedHtmlProse`. **Email/AI**: `AIInboxRail` (`InboxChip` · `SituationBar` · `InboxRailPanel`) · `EmailSidebar` · `EmailCategoryBadge` · `AttachmentChip` · `LinkedEntityPill` · `DrawingStatusBar`. **Not barrel-exported** (internal splits): `AppSidebarFooter` · `ErrorStateHero` |
| **[overlays/](../../../src/components/primitives/overlays/)** | 18 + `wizard/` | `@/components/primitives/overlays` | `Alert` · `ChoiceCards` · `Collapsible` · `CommandPalette` (+ `useCommandPaletteHotkey`) · `ContextMenu` · `DialogCompat` · `Drawer` (`DrawerRoot` …) · `DropdownMenu` · `Kbd` · `Modal` · `Popover` · `RecipientPickerDialog` · `SearchableMultiSelect` · `SelectMenu` · `Tabs` · `Toaster` · `Tooltip` · `wizard/{WizardShell · WizardMobileDrawer · WizardStepperHeader · WizardFooter}` · surface constants `GLASS_SURFACE` / `GLASS_BACKDROP` · [RECIPES.md](../../../src/components/primitives/overlays/RECIPES.md) |
| **[dashboard/](../../../src/components/primitives/dashboard/)** | 9 | `@/components/primitives/dashboard` | `KpiIndexCard` · `KpiTile` (+ `KpiDeltaBadge`, deep import) · `NumberTicker` · `GreetingHeader` · `AttentionHeader` · `NeedsAttentionPill` · `CountBadge` · `CDWProgressTimeline` |
| **[detail/](../../../src/components/primitives/detail/)** | 18 + `dossier/` | **deep import** (`…/detail/DetailPageFrame`) — the barrel only re-exports the email/AI subset | `DetailPageFrame` · `PageShell` (+ `PageShellHero`) · `PageShellStatusPill` · `TabNav` · `Timeline` · `ActivityLogTimeline` · `HistoryTrailList` · `RelatedRecordsCard` · `LineItemsEditor/` · `SendEmailDialog` · `StatusTransitionModal` · `DestructiveConfirmDialog` · `QuotationReferencePanel` · `EmailDetailHeader` · `EmailMessageCard` · `AIPanel` · `AIClassificationPanel` · `AIOverrideClassificationPanel` · `AIDraftReplyPanel` · **`dossier/{DossierPanel · DossierStatGrid · DossierRampBar · DossierKeyValueList · DossierLoadingPanel}`** |
| **[form/](../../../src/components/primitives/form/)** | 22 | `@/components/primitives/form` | `Input` · `Textarea` · `Select` · `Checkbox` · `Radio` · `RadioGroup` · `Switch` · `DatePicker` · `TimePicker` · `FileUpload` · `Field` · `Label` · `Progress` · `RichTextEditor` · `Stepper` · `StarredMultiSelect` · `EmailComposeForm` |
| **[ui/](../../../src/components/primitives/ui/)** | 17 | `@/components/primitives/ui` | `ListPageFrame` · `DataTable` · `DataRow` · `TableHeader` · `SortIcon` · `TableCheckbox` · `Pagination` · `PageBtn` · `MobileListCard` · `EditableListCard` · `StatusTabs` · `EmailThreadRow` · internal splits (not barrel-exported): `ListPageHeader` · `ListPageTable` · `DataTableRows` · `DataTableStates` · `DataRowCells` |
| **[charts/](../../../src/components/primitives/charts/)** | 8 | `@/components/primitives/charts` | `ChartShell` · `AreaChart` · `BarChart` · `HBarChart` · `ChartTooltip` · `ChartLoading` · `ChartError` · `LegendRow` |

## The 2a shell, in one picture

```
DashboardLayout  (src/components/shared/app-shell/DashboardLayout.tsx)
├── GlobalCommandPalette        ⌘K — module routing
├── AppSidebar                  fixed 200px rail, ≥ lg only
│   ├── Wordmark                "The Kopi Studio" lockup (Instrument Serif 22px)
│   ├── AppSidebarNav           one item per granted module, from useAuth().modules
│   └── AppSidebarFooter        bell · ViewAs · account · sign-out
└── <div class="lg:pl-[200px] print:pl-0!">
    └── <Outlet/>               the routed page (ListPageFrame / DetailPageFrame / AppHeaderShell
                                / DashboardHomePage, which frames itself)
```

Below `lg` the rail is hidden and `AppHeaderMobileBar` carries page context + account, with
navigation on its menu button → `AppNavDrawer`, a left sheet rendering the same `AppSidebarNav`.
**The bar is homed per page, not by the layout** — the three archetype frames render it, and so
does `DashboardHomePage` (which composes no frame). A page that skips both ships with no mobile
navigation at all; that was live on `/dashboard` until 2026-08-13. The rail is `position: fixed`, so the content pane owns the offset via the exported `SIDEBAR_OFFSET_CLASS`. Both are excluded from print so `/clients/:id/report` keeps its full-bleed canvas.

**The rail ships on card cream (`--sidebar-background` == `--card`), never a dark rail.** That surface is load-bearing: idle items are `--fg-muted`, which clears AA on card cream (4.72) and fails on the page cream (4.12).

## Page composition

| Archetype | Wrap with | Inside it |
|---|---|---|
| List | `ui/ListPageFrame` | kicker · serif title + inline count · search + CTA **on the title row** · `StatusTabs` · `FilterBar` (filters only) · bare `DataTable` + `Pagination` · `FloatingCTA` (mobile) |
| Detail | `detail/DetailPageFrame` | inline breadcrumb · serif H1 + meta · `TabNav` · `PageShell` 1.4fr/1fr dossier grid · `dossier/*` panels |
| Dashboard (Overview) | bespoke, no frame | `GreetingHeader` dateline + serif greeting · hairline · `KpiIndexCard` ×2 · serif section head + brown CTA · hairline feed table |
| Dashboard (role) | `shell/AppHeaderShell` | `KpiTile` (+ `NumberTicker`) · `ChartShell` + chart family |
| Form | `shell/AppHeaderShell` + `Field`-wrapped inputs | `Input` · `Select` · `Checkbox` · `DatePicker` · `Stepper` · `Button` |
| Tool / Settings | `shell/AppHeaderShell` | `TabNav` · `Card`-grouped `Field` sections · `DataTable` for results |

## Import rules

- **Deep-import atoms** (`Avatar`, `IconButton`, `StatusBadge`) and everything in `detail/` **except** the email/AI subset — there is no full barrel for `detail/`.
- **Every other primitive** — import from the group barrel: `import { Card, Button } from '@/components/primitives/shell'`.
- **Never** `@/components/ui/**` in new feature code. Rulebook: [UNIVERSAL_COMPONENTS.md](../../99-refactor/_system/UNIVERSAL_COMPONENTS.md).
- **Never rebuild what exists.** Grep [primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) + [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md) first, then check [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) that the name you found still exists.

## Adoption state

Live matrix: [DESIGN_CATALOG_PRIMITIVES.md](../../99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md) — Design · Impl · Adopted per row; deleted rows are struck through, not removed. Module × primitive matrix: [DESIGN_CATALOG_MATRIX.md](../../99-refactor/_system/DESIGN_CATALOG_MATRIX.md). Router: [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md).

Unadopted-but-alive (kept deliberately, no current consumer): `AttentionHeader` · `NeedsAttentionPill` · `CountBadge` · `CDWProgressTimeline`.

## 📚 Related

- [ARCHETYPES.md](./ARCHETYPES.md) — which primitives compose which page shape
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — runtime inventory (⚠️ last regenerated 2026-05-30, pre-Kopi)
- [src/components/primitives/COMPOSITION.md](../../../src/components/primitives/COMPOSITION.md) — page composition + create/edit protocols
- [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) — what was deleted and when
- [UNIVERSAL_COMPONENTS.md](../../99-refactor/_system/UNIVERSAL_COMPONENTS.md) — use · edit · create rulebook
- [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — the 11 hard rules
