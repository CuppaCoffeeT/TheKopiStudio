# Design-Lab Handoff Catalog

> ⛔ **ARCHIVAL — the bundles indexed below are NOT in this repo.** `docs/99-refactor/_system/design/` does not exist here, so every path on this page is unresolvable. The catalog is kept as a record of which AppBase-era Claude Design session produced which primitive; several primitive JSDoc headers still cite these paths, and this page explains what they refer to.
>
> **The current visual source of truth is the 2a handoff**, which *is* in the repo:
> [`docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/`](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/) — `KOPI_2A_SPEC.md` (written spec) · `Kopi Studio Directions.dc.html` (the comp canvas) · `kopi-studio-brand-card.html` (brand authority) · `decisions.md` · `lessons.md`.
>
> Everything below the fold is **navy/gold- and AppBase-era** and describes fonts (Roboto, Geist Pixel), colours (zinc, red-700, slate-800) and components (`AppHeader`, `ModuleCard`, `ModuleSearch`, `CategoryHeader`) that no longer exist. Do not treat any of it as current.

**Created**: 2026-04-22 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🔴 Deprecated
**Priority**: ⚪ Low

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## Historical — AppBase design-lab bundles (retired; directory removed from the repo)

Handoff bundles from AppBase-era Claude Design sessions. They were the visual source of truth at the time; primitives built then cite a spec file here in their JSDoc header.

## Where they lived

```
docs/99-refactor/_system/design/          ← NO LONGER PRESENT
├── session-01-list-table/
├── session-02-overlays/
├── session-03-dashboard/
├── session-shell-app-header/
├── session-04a-detail/
└── handoffs/2026-04-20-*/project/preview/*.html
```

Previews were plain HTML — opened via `file://` path. `.jsx` specs were colocated at `export/appbase/project/*.jsx`.

## Session → primitives map

| Session | Primitives unblocked | Key files |
|---|---|---|
| **S1 List/Table** | `DataTable` · `DataRow` · `TableHeader` · `Pagination` · `MobileListCard` · `StatusTabs` · `ListPageFrame` | `session-01-list-table/export/appbase/project/DataTable Archetype.html` + `datatable/DataTable.jsx` |
| **S2 Overlays** | `Modal` · `Popover` · `Drawer` · `DropdownMenu` · `Tooltip` · `SearchableMultiSelect` · `CommandPalette` | `session-02-overlays/.../Overlay System.html` + `overlays/*.jsx` |
| **S-shell** | `AppHeader` · `ImpersonationBanner` · `PageTitle` · `PageDescription` + list atoms | `session-shell-app-header/.../Session Shell.html` + `shell/*.jsx` |
| **S3 Dashboard** | `GreetingHeader` · `ModuleCard` · `CategoryHeader` · `AttentionHeader` · `NeedsAttentionPill` · `ModuleSearch` · `CountBadge` · `KpiTile` · `NumberTicker` | `session-03-dashboard/.../Dashboard Density.html` + `dashboard/*.jsx` |
| **S4a Detail** | `DetailPageFrame` · `PageShell` · `TabNav` · `Timeline` · `ActivityLogTimeline` · `RelatedRecordsCard` · `SendEmailDialog` · `StatusTransitionModal` · `DestructiveConfirmDialog` · `LineItemsEditor` | `session-04a-detail/.../` |

## Preview catalog by topic

Browseable at `docs/99-refactor/_system/design/handoffs/2026-04-20-*/project/preview/`.

### Type (4)

| File | Shows |
|---|---|
| `type-families.html` | Roboto · Geist Mono · Geist Pixel Square · Geist Pixel Grid side-by-side |
| `type-headings.html` | h1–h6 size + line-height scale |
| `type-body.html` | Paragraph · label · caption at production sizes |
| `type-pixel.html` | Square-vs-Grid at 48px cutoff (the lock rule) |

### Colors (4)

| File | Shows |
|---|---|
| `color-zinc.html` | Radix zinc 1–12 full scale |
| `color-red.html` | Radix red 1–12 + brand red-700 usage |
| `color-semantic.html` | Primary slate-800 · destructive red-700 · ring · link tokens |
| `color-status.html` | 6-tone status palette (draft/sent/accepted/rejected/expired/revised) |

### Spacing (4)

| File | Shows |
|---|---|
| `spacing-scale.html` | 8 / 12 / 16 / 20 / 24 / 32 / 48px scale |
| `spacing-radii.html` | 1rem card · 0.5rem button · pill / modal radii |
| `spacing-shadows.html` | Card rest · card hover · focus ring · elevation |
| `spacing-motion.html` | 80 / 180 / 400ms durations + easing curves |

### Components (18)

| File | Shows |
|---|---|
| `component-header.html` | `AppHeader` — breadcrumb · user menu · impersonation slot · theme toggle |
| `component-buttons.html` | Primary · ghost · destructive · outline · disabled across 5 states |
| `component-inputs.html` | Text / email / password / search · placeholder · error · disabled |
| `component-cards.html` | Card header / title / description / content / footer |
| `component-badges.html` | Badge tones + count-red ≥10 + outline |
| `component-datarow.html` | Table row · hover · selected · mobile-stack |
| `component-kpi.html` | KpiTile metric + delta + sparkline + icon |
| `component-module-tile.html` | Dashboard launcher tile (default + compact) |
| `component-stepper.html` | Stepper chips pending / active / done |
| `component-tabnav.html` | Sticky underline tabs with icon + label + count |
| `component-timeline-beam.html` | Scroll-linked beam rail |
| `component-activity-log.html` | Activity feed · avatar · action · timestamp · comment |
| `component-pageshell.html` | Detail hero · title · recordId chip · status pill · meta · actions · tabs |
| `component-line-items.html` | Inline line-item add / edit / delete table |
| `component-send-email.html` | Email compose modal |
| `component-status-modal.html` | Status transition confirmation |
| `component-destructive.html` | Delete / archive "are you sure?" modal |
| `component-related-records.html` | Related data card |

## Visual verification today

The old 5-check protocol keyed off `.claude/rules/design-system.md`, which no longer exists, and off session HTML that is no longer in the repo. **Verify against the 2a handoff instead:**

1. Open [`Kopi Studio Directions.dc.html`](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/) (option 2a) or [`kopi-studio-brand-card.html`](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/) via `file://`.
2. Read the written spec for the surface: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md).
3. `npm run dev` + open the live page side-by-side.
4. Exercise all 5 states (default / hover / active / focus-visible / disabled).
5. Record any deviation in the handoff [decisions.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md) — that file is where the "comp says X, we shipped Y, because Z" record lives.

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — the current visual authority
- [PRIMITIVES.md](./PRIMITIVES.md) — current inventory (and what was deleted)
- [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) — components named on this page that no longer exist
- [DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md) — session + primitive adoption matrix
