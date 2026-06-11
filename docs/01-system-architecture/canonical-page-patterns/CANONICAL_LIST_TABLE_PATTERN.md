# Canonical List + Table Pattern

**Created**: 2026-05-24 SGT
**Last Updated**: 2026-05-27 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

Every list page in AppBase (Quotations, JLTT, Supervisor Review, General Works, OT, …) is composed from the **same primitive table layer** so consistency, accessibility, pagination, sort, selection, mobile fallback, and (new) **inline row-expand** all come from a single well-tested source.

This doc tells a new agent: **what to import**, **what to copy from a reference adopter**, and **what they may safely customize** when building or migrating a list page.

## 📚 Related Documentation
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md](../99-refactor/_system/UNIVERSAL_COMPONENTS.md) — Need → Import matrix
- [.claude/rules/universal-components.md](../../.claude/rules/universal-components.md) — auto-loaded Need → Import row
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)

## Primitive layer (`src/components/primitives/ui/`)

All table primitives live in **one folder**. Import as a barrel:

```ts
import {
  ListPageFrame,       // full archetype page (chrome + filter + table + pagination + mobile)
  DataTable,           // table shell (selection · sort · pagination slot · mobileBody · NEW: renderExpanded)
  Pagination,          // page nav + rows-per-page
  MobileListCard,      // <md row replacement (canonical mobile card)
  StatusTabs,          // All / Draft / Sent style tab strip
  FilterDropdown,      // filter popover trigger
  type DataTableRow,
  type DataTableVariant,
  type TableHeaderColumn,
  type DataRowCell,
} from '@/components/primitives/ui';
```

## Two reference adopters in the repo

| Want | Read | Why |
|---|---|---|
| Flat rows, no inline expand, click-thru to `/detail/:id` | `src/features/quotations/pages/QuotationList.tsx` + `src/features/quotations/lib/quotationColumns.ts` + `src/features/quotations/lib/quotationRow.tsx` | Canonical `ListPageFrame` usage. Copy this if your list has nothing to expand inline. |
| Inline row-expand on desktop, rich mobile card on phones | `src/features/trialtrench/components/cfe/JLTTDesktopView.tsx` + `src/features/trialtrench/lib/jlttColumns.ts` + `src/features/trialtrench/lib/jlttRow.tsx` | Uses `<DataTable renderExpanded>` for inline expand. Copy this for Supervisor Review / GW / OT. |

## File layout for a new feature

**Single-page feature** (one list surface on this data type):

```
src/features/<feature>/
├── lib/
│   ├── <feature>Columns.ts    ← buildColumns(sort, order): TableHeaderColumn[]
│   └── <feature>Row.tsx       ← buildCells(record): DataRowCell[]
└── pages/<Feature>List.tsx    ← composes ListPageFrame OR DataTable directly
```

**Multi-page feature** (same data type, multiple pages — e.g. trial trench
is rendered in JLTT / Coordinator Review / Supervisor Review / Supervisor
Mode home; General Works has at least 3 surfaces; Worker OT same):

```
src/features/<feature>/
├── lib/
│   ├── <feature>TableShared.tsx   ← shared cell + column factories + helpers
│   ├── <pageA>Columns.ts          ← thin: picks factories from Shared
│   ├── <pageA>Row.tsx             ← thin: picks factories + page-specific actions
│   ├── <pageB>Columns.ts
│   └── <pageB>Row.tsx
└── pages/<Feature>List.tsx
```

**MANDATORY when 2+ pages render the same data type.** Duplicating cell
visuals (status badge tones, project subtitle layout, supervisor name
extraction) across per-page files means editing 4 files when the design
changes ONE pill. The shared file lives at `features/<feature>/lib/` so
sibling features don't have to cross-import.

Keep each `lib/*` file under 200 LOC. Shared library may go to ~250 LOC
(it's a flat factory list, not orchestration). Decompose by extracting a
hook (e.g. `useFeatureListPageProps`) when state derivation grows.

### Shared-library exports

Author your `<feature>TableShared.tsx` with these export categories:

| Category | Examples | Purpose |
|---|---|---|
| **Cell factories** | `jlttCell(t) → DataRowCell` · `statusBadgeCell(t)` · `actionsCell(content, width)` | Each returns a `DataRowCell`. Per-page builders `.push()` them in order. |
| **Column factories** | `jlttColumn<K>(dirOf)` · `statusColumn<K>(dirOf)` · `actionsColumn(width)` | Each returns a `TableHeaderColumn`. Generic over the page's `SortKey` union. |
| **Helpers** | `projectSubtitle(t)` · `supervisorName(t)` · `statusBadgeMeta(status)` | Tiny pure functions used by both cells and mobile cards. |
| **Status maps** | `TRIAL_TRENCH_STATUS_BADGES: Record<string, { tone, label }>` | One source of truth for label + tone per workflow_status. |

Reference adopter: **`src/features/trialtrench/lib/trialTrenchTableShared.tsx`** —
228 LOC, used by 4 thin per-page builders (JLTT desktop · Coordinator
Review · Supervisor Review · Supervisor Mode home). Editing the status
badge tone or project eyebrow there now updates all four pages at once.

### Safety gotchas (learned the hard way)

1. **`(x ?? '').trim()` is a runtime bomb** when `x` can be a number. The
   `??` only branches on null/undefined, so `(7 ?? '')` returns the
   number `7` and `Number#trim` doesn't exist → page crashes mid-render.
   **Always use `String(x ?? '').trim()`** in helpers like `projectSubtitle`.
   The supervisor-home query returned `file_number` as a number — this
   exact bug bit us 2026-05-24.
2. **Always render `<Pagination>` unconditionally** in `DataTable.pagination`.
   The instinct to gate on `totalPages > 1` hides the control on small
   result sets and creates inconsistent UX vs JLTT (which has many
   pages). Canonical convention from `QuotationList` is unconditional.
3. **Always wire `mobileBody`**. `<DataTable>` hides desktop rows under
   `hidden md:block`. Without a `mobileBody` slot, the page is silently
   empty at <md viewports. The Playwright seatbelt (`canonical-list-
   table-seatbelt.spec.ts`) checks this on every adopter.

## Composition recipe

### A. Flat list (no expand, click row → navigate)

```tsx
<ListPageFrame
  title="Quotations"
  description="Manage quotations and track workflow."
  primaryAction={{ label: 'Create quotation', onClick: () => navigate('/quotations/create') }}
  tabs={statusTabs} activeTab={params.status} onTabChange={setters.setStatus}
  searchQuery={searchInput} onSearchChange={setSearchInput} searchPlaceholder="Search…"
  filters={<MyStatusFilter ... />}
  onClearFilters={hasActiveFilters ? clearAll : undefined}
  columns={buildColumns(sort, order)}
  rows={records.map(r => ({
    id: r.id,
    cells: buildCells(r),
    onClick: () => navigate(`/feature/${r.id}`),
    testId: 'feature-row',
  }))}
  variant={variant}
  mobileBody={records.map(r => <MobileListCard {...mapToCard(r)} onClick={...} />)}
  page={page} totalPages={totalPages} totalItems={totalItems}
  rowsPerPage={PAGE_SIZE} onPageChange={setPage}
/>
```

### B. Inline expand (row click toggles a panel beneath the row)

```tsx
const [expandedId, setExpandedId] = useState<string | null>(null);

<DataTable
  columns={buildColumns(sortBy, sortOrder)}
  rows={records.map(r => ({
    id: r.id,
    selected: selectedIds.has(r.id),
    expanded: expandedId === r.id,        // ← flip per-row
    cells: buildCells(r),
    onClick: () => setExpandedId(expandedId === r.id ? null : r.id),
  }))}
  renderExpanded={(row) => {              // ← caller-owned panel
    const record = records.find(r => r.id === row.id);
    return record ? <MyExpandedPanel record={record} onEdit={...} /> : null;
  }}
  selectable selectState={selectState}
  onSelectAllChange={...} onRowSelectedChange={...}
  onSort={onSort}
  pagination={<Pagination page={page} totalPages={totalPages} ... />}
  testId="feature-table-body"
/>
```

Wrap with `<UnifiedFiltersBar>` + `<JLTTTableActionBar>`-style chrome above if you're not using `ListPageFrame`.

## What you may safely adapt

| Want | How |
|---|---|
| Extra row action (Edit / Delete / Approve) | Append a cell with `content: <IconButton onClick={...}>…</IconButton>`, give it `width` so it doesn't grow. |
| Different column set / widths | Build your own `buildColumns()` — `TableHeaderColumn` accepts `key · label · sortable · sortDir · width · minWidth · grow · align`. |
| Different cell layout | Build your own `buildCells()` — `DataRowCell` accepts `content · width · minWidth · grow · wrap · mono · muted · align`. |
| Different expand body | `renderExpanded(row) => ReactNode` — full JSX freedom. Reuse your existing detail panel here. |
| No expand | Omit `renderExpanded` and `row.expanded`. |
| Different mobile card | Pass your own components into `mobileBody` (array of ReactNodes). `MobileListCard` is the canonical option but a feature-scoped rich card (e.g. `JLTTMobileCard`) is acceptable if the simple 4-slot card can't carry the data. |
| New CTA in header | `ListPageFrame.primaryAction={{ label, onClick, icon }}` — desktop renders inline button, mobile renders FloatingCTA. |
| Bespoke chrome (no `ListPageFrame`) | Compose `<DataTable>` + `<Pagination>` directly inside your own page shell. The JLTT desktop view does this so it can keep its custom `JLTTTableActionBar` between filters and table. |

## What you must NOT do

- ❌ Build a new table primitive in `features/` — extend `DataTable` instead.
- ❌ Use raw `<table>` / `@/components/ui/table` — both are pre-W09 legacy.
- ❌ Import the old `ExpandableDataTable` from `@/components/primitives/shell` for new code — `DataTable.renderExpanded` is the canonical replacement.
- ❌ Skip `<Pagination>` on mobile — server-side pagination is a hard rule; users must be able to navigate past page 1 at any viewport.
- ❌ Hard-code page size — accept it from the caller / URL state and pass `rowsPerPage`.

## Sort key safety (learned from JLTT 2026-05-24)

If a column's data lives on a **joined table** (e.g. `projects.project_name` joined into `trial_trenches`), Postgres cannot sort the parent query by that column. Either:
1. Don't mark the column `sortable`, OR
2. Alias the sort key in your data hook's switch to a column that DOES exist (e.g. `created_at`). See `src/hooks/useJLTTTrialTrenchData.ts` for the precedent.

Adopters that allow sort-by-join silently break when a user lands with a stale `?sort=join_col` URL.

## Shared vs per-feature — what lives where

Future GW and OT tables will share **most** building blocks with JLTT. Here's the split so agents know what to import vs what to build fresh.

### Shared — already in `src/components/primitives/`

| Building block | Path | Used by |
|---|---|---|
| Table chrome (`DataTable`, `ListPageFrame`, `Pagination`, `MobileListCard`, `StatusTabs`, `FilterDropdown`, `TableHeader`, `DataRow`) | `src/components/primitives/ui/` | every list page |
| Generic cells (`DateCell`, `DateTimeCell`, `CurrencyCell`, `NumberCell`) | `src/components/primitives/shell/` | every list page |
| Badge (status pills + count chips) | `src/components/primitives/shell/Badge.tsx` | every list page |
| FilterPill (advanced-filter trigger) | `src/components/primitives/shell/FilterPill.tsx` | every list page |

### Shared across trial-trench / GW / OT — currently at `features/trialtrench/components/cfe/cells/`

These cells were originally JLTT-only but the data shapes they render (`projects` join, `users.people` join, "updated 2h ago" relative time) repeat across every queue. They have already been generalised (ProjectCell accepts a structural `ProjectCellShape`, not the trial-trench type) but they still live under `features/trialtrench/` for historical reasons.

| Cell | Used outside JLTT today | Future home (when GW/OT migrate) |
|---|---|---|
| `ProjectCell` (file_no · project_no · client) | WorkerOT + GW tables | promote to `src/components/primitives/ui/cells/ProjectCell.tsx` |
| `PeopleCell` (supervisor + drafter avatars) | WorkerOT (supervisor + worker), GW (supervisor) | promote to `src/components/primitives/ui/cells/PeopleCell.tsx` |
| `UpdatedCell` (relative time + absolute date) | every queue | promote to `src/components/primitives/ui/cells/UpdatedCell.tsx` |
| `JLTTNumberPill` | JLTT only | stays in `features/trialtrench/` |
| `ServicesCell` (service chips + N overflow) | JLTT only | stays — services are trial-trench-specific |
| `StatusTimelineMini` | JLTT only | stays — drawing-workflow specific |
| `DaysInQueueChip` | JLTT drafter mode | stays |

**Recommended migration when wiring GW / OT**: promote the three shared cells listed above to `src/components/primitives/ui/cells/` and update imports across `features/trialtrench/`, `features/coordinatorreview/`, `features/supervisorreview/`, `features/workerot/`. Do it as a single dedicated commit — TS will surface every callsite. Don't do it preemptively — wait until the second adopter (GW or OT) actually needs the import to avoid premature primitive churn.

### Per-feature shared library — every multi-page feature owns one

| File | Why per-feature |
|---|---|
| `src/features/<feature>/lib/<feature>TableShared.tsx` | Shared cell + column factories + helpers for THIS feature's data type. Same shape as `trialTrenchTableShared.tsx` (see "Shared-library exports" above). |
| `src/features/<feature>/lib/<page>Columns.ts` | **Thin** wrapper — picks factories from `TableShared`. ~30-50 LOC. |
| `src/features/<feature>/lib/<page>Row.tsx` | **Thin** wrapper — picks factories + adds page-specific action cell. ~50-130 LOC. |
| Expanded panel (e.g. `TrialTrenchExpandedPanel`) | Detail layout is per-feature, not per-page. |
| Filter component (e.g. `UnifiedTrialTrenchFilters`, `JLTTFilterDrawer`) | Filter field set is per-feature. Trigger is the shared `FilterPill`. |

### Worked example — adding the Worker OT queue (with shared library)

```
src/features/workerot/
├── lib/
│   ├── workerOtTableShared.tsx    ← shared cells + columns + helpers (the ONE source of truth)
│   ├── workerOtColumns.ts         ← thin: imports from workerOtTableShared, picks columns
│   └── workerOtRow.tsx            ← thin: imports from workerOtTableShared, picks cells + action cell
├── components/
│   ├── WorkerOtTable.tsx          ← composes DataTable + Pagination
│   ├── WorkerOtExpandedPanel.tsx  ← caller of renderExpanded
│   └── WorkerOtFilterDrawer.tsx   ← reuses vaul Drawer primitive
└── pages/WorkerOtPage.tsx
```

If Worker OT later has **multiple** surfaces (coordinator OT queue +
supervisor OT review + supervisor-home OT feed), they each get their own
thin `<page>Columns.ts` + `<page>Row.tsx` that compose factories from the
SAME `workerOtTableShared.tsx`. Same goes for General Works.

**Do NOT** copy `trialTrenchTableShared.tsx` and globally search-replace —
the data type is different (workerOt has `score` + `hours`; GW has
`photos_count` + `work_category`). What you copy is the **shape**: how
factories are organised, the `String() ?? ''` safety helper, the
`statusBadgeMeta` pattern. The actual cells render WorkerOT / GW data.

### Sibling-feature shared cells (cross-feature)

Some sub-cells are generic enough to share across `trialtrench`,
`workerot`, `generalworks` — `ProjectCell`, `PeopleCell`, `UpdatedCell`.
They currently live at `src/features/trialtrench/components/cfe/cells/`
but already accept structural shapes (not the trial-trench type). When
the second adopter actually needs them, **promote in ONE commit** to
`src/components/primitives/ui/cells/` so TS surfaces every import. Don't
preempt; the W09 rule against preemptive primitive churn applies.

## Actions column & mobile-card consistency standard (2026-05-27)

Lifted from the 3-tab supervisor home (Working Hours / Trial Trench / General Works) where rendering deltas across the otherwise-identical lists made the action icons appear in different places. Every list page must follow these rules so users learn one mental model.

### Desktop — actions cell

| Property | Standard |
|---|---|
| **Position** | Rightmost column. Never between data columns. |
| **Width (column + cell)** | `72px` for 1–2 icon-only buttons · `96px` for 3 icons · `120px+` only when text label is essential (e.g. "Approve") |
| **minWidth** | `width - 10` (small squeeze allowed; `actionsCell` / `actionsGWCell` set this automatically) |
| **Alignment** | `align: 'right'` (set by `actionsCell` factories) |
| **Button style** | `<Button variant="icon" size="sm" className="h-7 w-7">` + Lucide icon (`h-3.5 w-3.5 strokeWidth={2}`) |
| **Required props** | `aria-label` + `title` (tooltip on hover) for every icon-only button |
| **Destructive tone** | `text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30` |
| **Cluster spacing** | `flex items-center gap-1` (4px) — tight |

**❌ Anti-patterns**
- ❌ Outline button with text "Resume" / "Edit" at row level — explodes the column to 100-140px and gets clipped on iPad portrait. Use icon-only with tooltip instead.
- ❌ Mixing icon+text and icon-only across 3 sibling tabs — the same action must look the same in every adopter.
- ❌ Per-page `actionsColumn(N)` widths that diverge for the same icon count.

### Mobile — `MobileListCard` 4-slot shape

```
┌──────────────────────────────────────────────────┐
│ TITLE (sans, font-medium, ellipsis)              │
│ subtitle (12px, wrap when subtitleWrap=true)     │  ← left column (flex-1)
│ meta: [status badge] [mono-text] [date]          │
│                                                 ├── right slot: action cluster
└──────────────────────────────────────────────────┘
                                  (gap-2, icon-only buttons)
```

| Slot | Rule |
|---|---|
| `title` | Identifier — worker name / trench number / file number. Single line, ellipsis. Use `font-mono` only for purely numeric IDs. |
| `subtitle` | Project + client. **Pass `subtitleWrap`** when subtitle is multi-line (e.g. ProjectCell). |
| `meta` | Badges + mono dates + light meta. **NEVER inline action buttons here** — they bunch with metadata and look out of place. |
| `right` | Action cluster — same icon-only buttons as the desktop actions cell. Two max for tap-target hygiene; three only if necessary. |

`MobileListCard` is the canonical 4-slot card. A feature-scoped richer card is acceptable ONLY if data won't fit (rare); document the deviation in the feature's `NOTES.md`.

### Breakpoint contract

| Viewport | Behaviour |
|---|---|
| `< md` (< 768px) | `mobileBody` renders; desktop table hidden via `md:block`. Always wire `mobileBody` — page is silently empty otherwise. |
| `≥ md` (768px+) | Desktop table renders. **`DataTable` outer is `overflow-x-auto`** so columns wider than the viewport (iPad portrait ~768px / narrow desktop window) horizontally scroll inside the rounded container instead of being clipped. The action column is then always reachable even when total `minWidth` exceeds the viewport. |

### Reference factories

```ts
// per-feature lib/<feature>TableShared.tsx
export const actionsCell = (content: ReactNode, width = 72): DataRowCell => ({
  key: 'actions', width, minWidth: width - 10, align: 'right', content,
});

export const actionsColumn = (width = 72): TableHeaderColumn => ({
  key: 'actions', label: '', width, minWidth: width - 10, align: 'right',
});
```

Default to `width = 72`. Bump only when the cell genuinely needs more (multi-icon / labeled button).

### Reference adopters (drift checks)

The 3 supervisor home tabs (Working Hours · Trial Trench · General Works) are kept in lock-step:
- `src/features/supervisor/components/SupervisorWorkingHoursTable.tsx`
- `src/features/supervisor/components/submissions/supervisorHomeRow.tsx` (+ `supervisorHomeColumns.ts`)
- `src/features/supervisor/components/submissions/supervisorHomeGWRow.tsx` (+ `supervisorHomeGWColumns.ts`)

All three render `[Pencil icon] [Trash icon]` icon-only on draft rows, `72px` column, and use `MobileListCard.right` for the cluster on mobile. If you add a fourth supervisor tab or migrate another module, mirror this shape exactly.

## Migrating an existing list page

1. Inventory current state — note the columns, sort keys, filters, selection, mobile body, pagination wiring.
2. Build `lib/<feature>Columns.ts` + `lib/<feature>Row.tsx` mirroring JLTT / Quotation reference.
3. Swap the table component in the page for `<DataTable>` (with `renderExpanded` if inline expand is required) or `<ListPageFrame>` (if the page also wants canonical chrome).
4. Move `<Pagination>` into `DataTable.pagination` (it auto-renders below the body, visible at all viewports).
5. Run `npx tsc --noEmit -p tsconfig.app.json` — `tsconfig.json` alone is empty (`files: []`) and won't catch errors.
6. Visual-verify per [.claude/rules/design-system.md](../../.claude/rules/design-system.md) before committing.
