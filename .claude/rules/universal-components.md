---
paths:
  - 'src/components/primitives/**/*.tsx'
  - 'src/components/primitives/**/*.ts'
  - 'src/components/ui/**/*.tsx'
  - 'src/features/**/*.tsx'
  - 'src/features/**/*.ts'
  - 'src/pages/**/*.tsx'
  - 'src/App.tsx'
---

# Rule: Universal Components — Use Primitives, Not Shadcn Raw (MANDATORY)

## Summary

The `src/components/primitives/` folder is the authoritative design-system layer. It holds **AppBase-styled primitives across 8 groups** (shell · overlays · dashboard · detail · form · ui · charts · 4 root atoms) produced from Claude Design sessions S1 · S2 · S3 · S4 · S-shell + email-inbox lift + retrofits. See [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) for the authoritative inventory + live count (re-counted whenever changed; do not hardcode a number here — it drifts between syncs). **New code imports from `@/components/primitives/**`, never from `@/components/ui/**`.** When editing a primitive, follow the 5-step edit protocol below — a change propagates to every adopter, so backward compatibility is the default.

_Last Updated: 2026-05-30 SGT — dropped hardcoded primitive count (use CONTEXT.md) + added `src/features/**` to `paths:` so this MANDATORY rule auto-loads on feature edits._

## Detailed Patterns

### Use-primitive-over-shadcn (for new code)

| Need | ✅ Import | ❌ Don't import |
|---|---|---|
| Toast | `showSuccess`/`showError` from `@/utils/toastHelper` (root `<Toaster>` is already the primitive) | `@/components/ui/sonner` is now a shim — fine to leave, but new code imports directly from `primitives/overlays` |
| Modal dialog | `Modal`, `ModalPrimaryAction`, `ModalGhostAction` from `@/components/primitives/overlays` | `@/components/ui/dialog` |
| In-page banner | `Alert` from `@/components/primitives/overlays` | `@/components/ui/alert` |
| Bottom sheet | `DrawerRoot`…`DrawerFooter` from `@/components/primitives/overlays` | custom vaul wrapper |
| Popover / flyout | `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/primitives/overlays` | `@/components/ui/popover` |
| Tooltip | `Tooltip`, `TooltipContent` (accepts `shortcut` prop) from `@/components/primitives/overlays` | `@/components/ui/tooltip` |
| Kebab menu | `DropdownMenu*` from `@/components/primitives/overlays` | `@/components/ui/dropdown-menu` |
| Right-click menu | `ContextMenu*` from `@/components/primitives/overlays` | `@/components/ui/context-menu` |
| Combobox / picker | `SearchableMultiSelect` from `@/components/primitives/overlays` (single OR multi, addNew) | `@/components/ui/searchable-select`, building a new one, nesting `Popover`+`Command` |
| Multi-select picker where ONE selection is "primary" (starred) | `StarredMultiSelect` from `@/components/primitives/form` — selected-pill row with star toggle + picker; `primaryValue` / `onPrimaryChange` to enable the star UX | hand-rolling Popover + Command + manual pill render with a star icon (the pattern that lived inside `ClientContactMultiSelect` until 2026-05-25) |
| Multi-select client contacts (with Primary PIC star) | `ClientContactMultiSelect` from `@/components/ui/client-contact-multi-select` — domain wrapper around `StarredMultiSelect`; owns the company-scoped contact query + inline "Add new contact" dialog | hand-rolling Popover + Command for the contact list, OR importing the deleted `@/components/project-management/ClientContactMultiSelect` path |
| ⌘K launcher / command palette | `CommandPalette`+`CommandPaletteGroup`+`CommandPaletteItem`+`useCommandPaletteHotkey` from `@/components/primitives/overlays` | `@/components/ui/command` raw, nesting `Dialog`+cmdk |
| Kbd chip | `Kbd` from `@/components/primitives/overlays` | inline `<kbd>` |
| Primary button | `Button variant="primary"` from `@/components/primitives/shell` | new `<button>` with slate-800 tailwind |
| Filter chip | `Chip kind="filter"` from `@/components/primitives/shell` | ad-hoc rounded-full button |
| Filter bar | `FilterBar` from `@/components/primitives/shell` | inline layout |
| Standalone search input | `SearchInput` from `@/components/primitives/shell` | new `<input type="search">` with icon div |
| Table cell — UTC date | `DateCell` from `@/components/primitives/shell` | inline `formatDisplayDateLong` in a `<span>` |
| Table cell — UTC date+time | `DateTimeCell` from `@/components/primitives/shell` | inline `formatDisplayDateTimeLong` in a `<span>` |
| Table cell — SGD amount | `CurrencyCell` from `@/components/primitives/shell` | inline `formatCurrency` + `text-right` |
| Table cell — number w/ commas | `NumberCell` from `@/components/primitives/shell` | inline `toLocaleString()` in a `<span>` |
| Paginated Supabase read | `fetchPage` from `@/lib/supabase/typed-client` | raw `supabase.from(...).select(...).range(...)` inlined in a hook |
| Single Supabase record | `fetchOne` from `@/lib/supabase/typed-client` | raw `supabase.from(...).eq('id', id).single()` inlined |
| Dropdown Supabase feed | `fetchDropdown` from `@/lib/supabase/typed-client` | raw `supabase.from(...).select(...)` without `.limit()` |
| Supabase count badge | `fetchCount` from `@/lib/supabase/typed-client` | raw `{ count: 'exact', head: true }` inlined |
| Floating CTA | `FloatingCTA` from `@/components/primitives/shell` | absolute-positioned `<button>` |
| Skeleton | `LoadingSkeleton variant="..."` from `@/components/primitives/shell` | shadcn `Skeleton` |
| Error surface | `ErrorState` from `@/components/primitives/shell` | custom error div |
| Empty / no-results | `NoResultsState` from `@/components/primitives/shell` | custom empty div |
| Text / number input | `Input` from `@/components/primitives/form` | `@/components/ui/input`, native `<input>` with ad-hoc Tailwind |
| Multi-line input | `Textarea` from `@/components/primitives/form` | `@/components/ui/textarea` |
| Select dropdown (single) | `SelectMenu` from `@/components/primitives/overlays` (custom-rendered, no native chrome) · `SearchableMultiSelect` for many/searchable options | `Select` from `@/components/primitives/form` — **BANNED** (wraps a native `<select>` → OS chrome); enforced by eslint `no-restricted-imports` + `check-repo.sh §7f`. Also ❌ `@/components/ui/select` raw, native `<select>` |
| Checkbox / Radio / Switch | `Checkbox`·`Radio`·`Switch` from `@/components/primitives/form` | `@/components/ui/checkbox`·`radio-group`·`switch` |
| Date picker (single + range) | `DatePicker` from `@/components/primitives/form` | inline `Popover`+`Calendar`, `@/components/ui/date-picker`, `@/components/ui/datetime-picker` |
| Time-of-day picker (HH:MM, 24h or 12h, with Now/Clear) | `TimePicker` from `@/components/primitives/form` — 2-column popover (Hr · Min · + AM/PM for 12h), `step` minute granularity, `Now` uses SGT (UTC+8) | raw `<input type="time">` (native control · inconsistent across browsers), hand-rolled `Popover` + scroll wheels |
| File upload | `FileUpload` from `@/components/primitives/form` | hand-rolled `<input type="file">` wrapper |
| Form field wrapper (label + input + error) | `Field` from `@/components/primitives/form` | ad-hoc `<label>`+`<input>`+`<p class="text-red">` trio (covers FormRow concept) |
| Progress bar | `Progress` from `@/components/primitives/form` | `@/components/ui/progress` |
| Multi-step form indicator | `Stepper` from `@/components/primitives/form` | custom step dots |
| Card surface | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` from `@/components/primitives/shell` | `@/components/ui/card` |
| Status / count badge (static) | `Badge` from `@/components/primitives/shell` — `variant='status'` (tone + dot) · `'count'` (mono, red-7 solid for critical ≥10) · `'outline'` | `@/components/ui/badge` |
| Data table (full composition) | `DataTable`+`TableHeader`+`DataRow`+`Pagination`+`MobileListCard` from `@/components/primitives/ui` | `@/components/ui/table` raw, TanStack direct, ad-hoc `<table>` |
| Mobile inline-edit row (TOOL archetype mobileBody — attendance / OT entry / payslip lines) | `EditableListCard` from `@/components/primitives/ui` — peer of `MobileListCard`. Header (index/title/subtitle/badge) + flex-wrap controls + full-width footer slot. Caller renders every control. Disabled blocks pointer events on the whole card. | hand-rolled `<div class="border rounded p-3">` per-row card · using `MobileListCard` (read-only, click-through — wrong archetype) |
| List archetype page (full frame) | `ListPageFrame` from `@/components/primitives/ui` | `<DashboardHeader>` + hand-rolled tabs/filter/table/pagination |
| Status segment tabs w/ counts | `StatusTabs` from `@/components/primitives/ui` | ad-hoc underline-tab buttons w/ count pill |
| Filter popover trigger | `FilterDropdown` from `@/components/primitives/shell` | raw `<Popover>` + hand-rolled chevron/count-badge button |
| Sort header / checkbox / page btn | `SortIcon`·`TableCheckbox`·`PageBtn` from `@/components/primitives/ui` | inline svgs in column headers |
| Filter pill (shell) | `FilterPill` from `@/components/primitives/shell` | ad-hoc rounded-full button with count badge |
| Tiny outline icon (KPI / meta) | `IconGlyph` from `@/components/primitives/IconGlyph` (deep import) | hand-rolled `<svg>` for the 15 covered glyph names |
| Chart family (area/bar/hbar) | `ChartShell`+`AreaChart`·`BarChart`·`HBarChart` from `@/components/primitives/charts` | Recharts raw, Tremor, hand-rolled SVG |
| Drawing-workflow status visualization (5-status badge row + segmented bar) | `DrawingStatusBar` from `@/components/primitives/shell` | `@/components/drafter/DrawingProgressBar` (legacy — will be deleted after drafter W09) · hand-rolled status segments |
| 12-step CDW project workflow timeline (full/mini responsive split) | `CDWProgressTimeline` from `@/components/primitives/dashboard` paired with `useCDWMeetingSteps` from `@/hooks/` | `@/components/meeting-projects/MeetingCDWProgressBar` (legacy — will be deleted after engineer-dashboard + meeting-projects W09) · hand-rolled step grid |
| Chart tooltip / loading / error / legend | `ChartTooltip`·`ChartLoading`·`ChartError`·`LegendRow` from `@/components/primitives/charts` | inline fragments per chart |
| KPI / metric tile (dashboard) | `KpiTile` from `@/components/primitives/dashboard` — supports `prefix/suffix/decimals/delta/subtitle/icon/alert/compact/sparkline` · count-up animation via bundled `NumberTicker` | ad-hoc `<Card>` + big number, reinventing delta badge/sparkline wiring |
| Spring-eased count-up number | `NumberTicker` from `@/components/primitives/dashboard` | hand-rolling a custom count-up hook |
| Any clickable thing (button, icon button, CTA, filter chip, sort header, page btn) | `Button` · `IconButton` · `FloatingCTA` · `Chip kind="filter"` · `PageBtn` — pick the fitting primitive | raw `<button>` — ALWAYS a primitive covers the pattern. Trips the primitives-only compliance gate. |
| Form label / any `<label>` | `Field` wrapper from `@/components/primitives/form` (owns label + input + error) OR `ui/form` `FormLabel` inside an RHF adapter | raw `<label>`. Trips the primitives-only compliance gate. |
| Raw `<h1>` page title | `PageTitle` from `@/components/primitives/shell` | raw `<h1>` — font/size is locked in the primitive, per-page overrides create drift |
| Section divider | **No primitive yet — two options** | (a) promote `Separator` primitive via /design-prompt OR (b) inline `<div className="h-px bg-zinc-200" />` and document decision in feature `lib/NOTES.md` |
| Generic Tabs (non-status) | `Tabs`+`TabsList`+`TabsTrigger`+`TabsContent` from `@/components/primitives/overlays` — Radix retrofit on v4 tokens; for status-shaped lists prefer `StatusTabs` from `primitives/ui` | `@/components/ui/tabs` raw, inline Radix |
| Collapsible / disclosure | `Collapsible`+`CollapsibleTrigger`+`CollapsibleContent` from `@/components/primitives/overlays` — Radix retrofit · used by `HistoryTrailList` + `AIPanel` | `@/components/ui/collapsible` raw, inline `<details>` |
| Searchable single-select dropdown (where SearchableMultiSelect is overkill) | `SelectMenu` from `@/components/primitives/overlays` — Popover + Command list composition | hand-rolled `Popover` + `Command` per-callsite |
| Radio group container | `RadioGroup` from `@/components/primitives/form` (pairs with `Radio` row above) | `@/components/ui/radio-group` |
| AppHeader notifications slot (bell + popover) | `NotificationsBell` from `@/components/primitives/shell` — wire with `useNotificationsBell` from `@/hooks/`. `<NotificationsBell {...useNotificationsBell()} />` | `@/components/shell/NotificationsBellPopover` (deleted 2026-05-15). Stateless primitive + connector hook required; no fallback. |
| AppHeader view-as slot (super_admin "test as user") | `ViewAsSelector` from `@/components/primitives/shell` — wire with `useViewAs` from `@/hooks/`. `<ViewAsSelector {...useViewAs()} />`. Self-guards on non-super_admin (slot collapses). | `@/components/admin/ImpersonationSelector` (deleted 2026-05-15). Same pattern as above. |
| Email · AI · WhatsApp surfaces (15 rows) | See [universal-components/email-ai-whatsapp.md](./universal-components/email-ai-whatsapp.md) | — |

**Exception**: existing legacy screens that haven't been W09-migrated stay on `ui/**` until their migration PR lands. Don't opportunistically migrate — it's a testing-scope hazard.

**Inside a feature folder that IS being migrated** → 100% primitive coverage required. See [docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md](../../docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md) (Gate 3) for the five hard greps (6a–6e). "Legacy-keep as backlog" is NOT an allowed outcome as of 2026-04-21.

## Sub-guides (loaded on demand)

- [**universal-components/email-ai-whatsapp.md**](./universal-components/email-ai-whatsapp.md) — Need→Import rows for Email · AI · WhatsApp surfaces (15 rows split out 2026-04-28 to keep parent under rule-doc ceiling).
- [**universal-components-protocols.md**](./universal-components-protocols.md) — sanctioned `ui/**` exceptions table · 5-step edit protocol · create-a-new-primitive protocol · JSDoc pattern · common-violations record. Read when building / editing a primitive.
- [docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md](../../docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md) — Gate 3 holds the five hard greps (6a–6e) + SANCTIONED string + grep-trip translation table.

## References

- [docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md](../../docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md) — full rulebook
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — inventory
- [docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md](../../docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md) — Design · Impl · Adopted (per-primitive · sections A–N) · [DESIGN_CATALOG_MATRIX.md](../../docs/99-refactor/_system/DESIGN_CATALOG_MATRIX.md) (module × primitive matrix) · [DESIGN_CATALOG.md](../../docs/99-refactor/_system/DESIGN_CATALOG.md) (router)
- [docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md](../../docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — 11 hard rules
- [.claude/rules/design-system.md](./design-system.md) — visual verification before commit
