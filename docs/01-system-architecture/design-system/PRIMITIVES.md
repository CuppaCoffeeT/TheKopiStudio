# Primitives — Inventory Router

**Created**: 2026-04-22 SGT
**Last Updated**: 2026-10-28 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

**84 top-level primitive files across 7 groups** (filesystem count 2026-10-28: shell/33 · ui/15 · overlays/13 · form/11 · detail/5 · dashboard/5 · root atoms/2, counting one row per top-level `.tsx` and excluding `index.ts` / `CONTEXT.md` / nested sub-folders / `tools/`). Nested folders add `shell/cells` (DateCell only) and `detail/dossier`. Machine-generated inventory: [PRIMITIVES_MANIFEST.json](../../99-refactor/_system/PRIMITIVES_MANIFEST.json).

> **The manifest was last regenerated 2026-05-30** ([src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) was recounted 2026-10-28) and still lists names that the 2026-07-25 Kopi migration deleted. Where they disagree with the table below, the table below was checked against the filesystem. Deletion record: [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md).

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

## Deleted 2026-10-28 — zero importers (knip)

`charts/*` (whole group) · `Avatar` · `dashboard/{AttentionHeader · CDWProgressTimeline · CountBadge · KpiIndexCard · NeedsAttentionPill}` · every `detail/*` except `DestructiveConfirmDialog` · `DetailPageFrame` · `PageShell` · `PageShellStatusPill` · `TabNav` · `dossier/*` (and the `detail/` barrel) · `form/{EmailComposeForm · FileUpload · Label · RadioGroup · RichTextEditor · Select · StarredMultiSelect · Stepper · TimePicker*}` · `overlays/{Collapsible · ContextMenu · DialogCompat · Drawer · RecipientPickerDialog · wizard/*}` · `shell/{AIInboxRail · AttachmentChip · DrawingStatusBar · EmailCategoryBadge · EmailSidebar · ExpandableDataTable · FilterCard · FilterDropdown · FilterPill · LinkedEntityPill · MarkdownProse · SanitizedHtmlProse · ScrollArea · TruncatedText · cells/{CurrencyCell · DateTimeCell · NumberCell}}` · `ui/{EditableListCard · EmailThreadRow}` (and the `ui/` barrel). Re-create one only when a real consumer needs it. Record: [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md).

## Groups

| Group | Files | Import pattern | What's inside (barrel exports) |
|---|---|---|---|
| **root atoms** | 2 | deep import, no barrel | `IconButton` · `StatusBadge` |
| **[shell/](../../../src/components/primitives/shell/)** | 33 | `@/components/primitives/shell` | **Chrome**: `AppSidebar` (+ `SIDEBAR_OFFSET_CLASS`) · `AppSidebarNav` · `AppNavDrawer` · `AppHeaderMobileBar` · `AppHeaderLogo` · `AppHeaderUserMenu` · `AppHeaderShell` · `Wordmark` · `ImpersonationBanner` · `NotificationsBell` · `ViewAsSelector` · `Breadcrumb` · `SEO`. **Atoms**: `Badge` · `Button` · `Card` · `Chip`. **List chrome**: `FilterBar` · `SearchInput` · `FloatingCTA` · `cells/DateCell`. **States**: `LoadingSkeleton` · `LoadingSpinner` · `ErrorState` · `NoResultsState` · `PageTitle` · `PageDescription`. **Not barrel-exported** (internal splits): `AppSidebarFooter` · `ErrorStateHero` |
| **[overlays/](../../../src/components/primitives/overlays/)** | 13 | `@/components/primitives/overlays` | `Alert` · `ChoiceCards` · `CommandPalette` · `DropdownMenu` · `Kbd` · `Modal` · `Popover` · `SearchableMultiSelect` · `SelectMenu` · `Tabs` · `Toaster` · `Tooltip` · surface constants `GLASS_SURFACE` / `GLASS_BACKDROP` · [RECIPES.md](../../../src/components/primitives/overlays/RECIPES.md) |
| **[dashboard/](../../../src/components/primitives/dashboard/)** | 5 | `@/components/primitives/dashboard` | `KpiTile` (+ `KpiDeltaBadge`, deep import) · `NumberTicker` · `GreetingHeader` · `DailyQuoteCard` |
| **[detail/](../../../src/components/primitives/detail/)** | 5 + `dossier/` | **deep import** (`…/detail/DetailPageFrame`) — no barrel | `DetailPageFrame` · `PageShell` (+ `PageShellHero`) · `PageShellStatusPill` · `TabNav` · `DestructiveConfirmDialog` · **`dossier/{DossierPanel · DossierStatGrid · DossierRampBar · DossierKeyValueList · DossierLoadingPanel}`** |
| **[form/](../../../src/components/primitives/form/)** | 11 | `@/components/primitives/form` | `Input` · `Textarea` · `Checkbox` · `Radio` · `Switch` · `DatePicker` · `Field` · `Progress` (single-select: `overlays/SelectMenu`) |
| **[ui/](../../../src/components/primitives/ui/)** | 15 | **deep import** (`…/ui/ListPageFrame`) — no barrel | `ListPageFrame` · `DataTable` · `DataRow` · `TableHeader` · `SortIcon` · `TableCheckbox` · `Pagination` · `PageBtn` · `MobileListCard` · `StatusTabs` · internal splits: `ListPageHeader` · `ListPageTable` · `DataTableRows` · `DataTableStates` · `DataRowCells` |

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
| Dashboard (Overview) | bespoke, no frame | `GreetingHeader` dateline + serif greeting · hairline · serif section head + brown CTA · hairline feed table |
| Dashboard (role) | `shell/AppHeaderShell` | `KpiTile` (+ `NumberTicker`) · charts: none live (`charts/*` deleted 2026-10-28) |
| Form | `shell/AppHeaderShell` + `Field`-wrapped inputs | `Input` · `SelectMenu` · `Checkbox` · `DatePicker` · `Button` |
| Tool / Settings | `shell/AppHeaderShell` | `TabNav` · `Card`-grouped `Field` sections · `DataTable` for results |

## Import rules

- **Deep-import atoms** (`IconButton`, `StatusBadge`) and everything in `detail/` and `ui/` — neither has a barrel.
- **Every other primitive** — import from the group barrel: `import { Card, Button } from '@/components/primitives/shell'`.
- **Never** `@/components/ui/**` in new feature code. Rulebook: [UNIVERSAL_COMPONENTS.md](../../99-refactor/_system/UNIVERSAL_COMPONENTS.md).
- **Never rebuild what exists.** Grep [primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) + [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md) first, then check [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) that the name you found still exists.

## Adoption state

Live matrix: [DESIGN_CATALOG_PRIMITIVES.md](../../99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md) — Design · Impl · Adopted per row; deleted rows are struck through, not removed. Module × primitive matrix: [DESIGN_CATALOG_MATRIX.md](../../99-refactor/_system/DESIGN_CATALOG_MATRIX.md). Router: [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md).

Unadopted-but-alive: none — the former list (`AttentionHeader` · `NeedsAttentionPill` · `CountBadge` · `CDWProgressTimeline`) was deleted 2026-10-28.

## 📚 Related

- [ARCHETYPES.md](./ARCHETYPES.md) — which primitives compose which page shape
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — runtime inventory (recounted 2026-10-28)
- [src/components/primitives/COMPOSITION.md](../../../src/components/primitives/COMPOSITION.md) — page composition + create/edit protocols
- [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) — what was deleted and when
- [UNIVERSAL_COMPONENTS.md](../../99-refactor/_system/UNIVERSAL_COMPONENTS.md) — use · edit · create rulebook
- [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — the 11 hard rules
