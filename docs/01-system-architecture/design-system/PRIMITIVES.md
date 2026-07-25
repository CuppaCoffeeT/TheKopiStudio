# Primitives — Inventory Router

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

**144 primitives across 8 groups** (shell/43 · form/22 · overlays/24 · detail/21 · dashboard/10 · charts/8 · ui/12 · atoms/4, filesystem count 2026-05-30). Authoritative runtime inventory: [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md). This page routes by purpose + lists the high-level groups.

## Before building anything

1. Grep [primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) + [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md) — a version probably exists
2. If missing, follow the Create-a-new-primitive protocol in [.claude/rules/universal-components-protocols.md](../../../.claude/rules/universal-components-protocols.md)
3. Check the Need → Import matrix in [.claude/rules/universal-components.md](../../../.claude/rules/universal-components.md) for the expected mapping

## Groups

| Group | Count | Import pattern | What's inside |
|---|---|---|---|
| **root atoms** | 4 | deep import | `Avatar` · `IconButton` · `IconGlyph` · `StatusBadge` |
| **[shell/](../../../src/components/primitives/shell/)** | 17 | `@/components/primitives/shell` | `AppHeader` · `Button` · `Card` · `Badge` · `Breadcrumb` · `Chip` · `FilterBar` · `FilterDropdown` · `FilterPill` · `FloatingCTA` · `ImpersonationBanner` · `LoadingSkeleton` · `LoadingSpinner` · `ErrorState` · `NoResultsState` · `PageTitle` · `PageDescription` · `SearchInput` + cells (`DateCell` · `DateTimeCell` · `CurrencyCell` · `NumberCell`) |
| **[overlays/](../../../src/components/primitives/overlays/)** | 11 | `@/components/primitives/overlays` | `Alert` · `CommandPalette` · `ContextMenu` · `Drawer` · `DropdownMenu` · `Kbd` · `Modal` · `Popover` · `SearchableMultiSelect` · `Toaster` · `Tooltip` |
| **[dashboard/](../../../src/components/primitives/dashboard/)** | 8 | `@/components/primitives/dashboard` | `AttentionHeader` · `CDWProgressTimeline` · `CountBadge` · `GreetingHeader` · `KpiIndexCard` · `KpiTile` · `NeedsAttentionPill` · `NumberTicker` — `ModuleCard` / `CategoryHeader` / `ModuleSearch` were **deleted 2026-07-25**, see [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) |
| **[detail/](../../../src/components/primitives/detail/)** | 10 | `@/components/primitives/detail` | `ActivityLogTimeline` · `DestructiveConfirmDialog` · `DetailPageFrame` · `LineItemsEditor` · `PageShell` · `RelatedRecordsCard` · `SendEmailDialog` · `StatusTransitionModal` · `TabNav` · `Timeline` |
| **[form/](../../../src/components/primitives/form/)** | 11 | `@/components/primitives/form` | `Input` · `Textarea` · `Select` · `Checkbox` · `Radio` · `Switch` · `DatePicker` · `FileUpload` · `Field` · `Progress` · `Stepper` |
| **[ui/](../../../src/components/primitives/ui/)** | 10 | `@/components/primitives/ui` | `DataTable` · `DataRow` · `TableHeader` · `SortIcon` · `TableCheckbox` · `Pagination` · `PageBtn` · `MobileListCard` · `StatusTabs` · `ListPageFrame` |
| **[charts/](../../../src/components/primitives/charts/)** | 8 | `@/components/primitives/charts` | `ChartShell` · `AreaChart` · `BarChart` · `HBarChart` · `ChartTooltip` · `ChartLoading` · `ChartError` · `LegendRow` |

## Page composition (the big wrappers)

| Archetype | Wrap with | Inside it |
|---|---|---|
| List page | `ListPageFrame` (ui/) | `AppHeader` · title · description · `FilterBar` · `DataTable` + `Pagination` |
| Detail page | `DetailPageFrame` (detail/) | `AppHeader` · `PageShell` (hero) · `TabNav` · sideRail · mobileActionBar |
| Dashboard | `AppHeader` + bespoke layout | `GreetingHeader` · `KpiIndexCard` row (2a Overview) or `KpiTile` grid + `ChartShell` (role dashboards) |
| Form | `AppHeader` + `Field`-wrapped inputs | `Input` · `Select` · `Checkbox` · `DatePicker` · `Stepper` (multi-step) · `Button` |

## Sub-component rules

- **Deep import atoms** (`Avatar`, `IconButton`, `IconGlyph`, `StatusBadge`) — no barrel; import from the file directly.
- **Every other primitive** — import from the group barrel: `import { Card, Button } from '@/components/primitives/shell'`.
- **Never** `@/components/ui/**` in new feature code (see [.claude/rules/universal-components.md](../../../.claude/rules/universal-components.md) + sanctioned exceptions in [-protocols.md](../../../.claude/rules/universal-components-protocols.md)).

## Adoption state

Live matrix: [DESIGN_CATALOG_PRIMITIVES.md](../../99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md) — Design · Impl · Adopted per row. Full catalog router: [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md).

## Need → Import matrix

~50-row "I need X → import Y" lookup: [.claude/rules/universal-components.md](../../../.claude/rules/universal-components.md). Always auto-loaded when editing primitives or pages.

## 📚 Related

- [ARCHETYPES.md](./ARCHETYPES.md) — which primitives compose which page shape
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — authoritative inventory
- [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md) — design · impl · adopted matrix
- [.claude/rules/universal-components.md](../../../.claude/rules/universal-components.md) — Need → Import matrix
- [.claude/rules/universal-components-protocols.md](../../../.claude/rules/universal-components-protocols.md) — create + edit protocols
