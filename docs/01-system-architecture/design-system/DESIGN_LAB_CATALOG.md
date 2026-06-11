# Design-Lab Handoff Catalog

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

Handoff bundles from Claude Design sessions — the **visual source of truth**. Every primitive cites a spec file here in its JSDoc header. Open the HTML side-by-side with `npm run dev` to verify pixel parity.

## Where they live

```
docs/99-refactor/_system/design/
├── session-01-list-table/
├── session-02-overlays/
├── session-03-dashboard/
├── session-shell-app-header/
├── session-04a-detail/
└── handoffs/2026-04-20-*/project/preview/*.html
```

Previews are plain HTML — open via `file://` path. `.jsx` specs colocated at `export/appbase/project/*.jsx`.

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

## How to use for visual verification

Per [.claude/rules/design-system.md](../../../.claude/rules/design-system.md) 5-check protocol:

1. Find the spec file for your primitive (grep `session-*/export/`)
2. `open file:///<path>.html` in a second window
3. `npm run dev` + open the live page
4. Side-by-side, exercise all 5 states (default / hover / active / focus-visible / disabled)
5. Attach a `Visual verify:` line to the commit citing (a) spec file, (b) states exercised, (c) any deviation with reason

## 📚 Related

- [PRIMITIVES.md](./PRIMITIVES.md) — which primitive corresponds to which spec
- [.claude/rules/design-system.md](../../../.claude/rules/design-system.md) — visual-verify protocol
- [docs/99-refactor/_system/DESIGN_CATALOG.md](../../99-refactor/_system/DESIGN_CATALOG.md) — session + primitive adoption matrix
