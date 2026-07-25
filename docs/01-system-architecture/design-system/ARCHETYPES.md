# Page Archetypes

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

Six canonical page shapes. Every page in the app is one of these.

## 1. List

Scannable tabular data — the default for any entity index (projects, people, quotations, work entries).

**Primary**: `ListPageFrame` wraps `AppHeader` · `PageTitle` · `PageDescription` · `FilterBar` (`FilterDropdown` + `FilterPill` + `SearchInput`) · `StatusTabs` (optional) · `DataTable` (`TableHeader` + `DataRow` + `Pagination`) · `MobileListCard` (<768px fallback).

**Folder shape**:
```
src/features/<slug>/
├── pages/<Slug>List.tsx
├── components/<Slug>FilterDropdown.tsx · <Slug>StatusTabs.tsx
├── hooks/use<Slug>List.ts
├── api/<slug>List.ts
└── index.ts
```

**Live examples**: `/peoplemanagement` · `/companylist` · `/generalworks` · `/quotations` · `/projectlist` · `/payment-management`.

Full rules: [CANONICAL_LIST_TABLE_PATTERN.md](../canonical-page-patterns/CANONICAL_LIST_TABLE_PATTERN.md).

## 2. Detail

Single-record view with tabbed content and sidebar metadata.

**Primary**: `DetailPageFrame` owns `AppHeader` · breadcrumb · hero (title / `recordId` / status pill / meta bullets / actions) · `TabNav` (sticky) · main + side-rail 2-column · mobile action bar. Inside: `Timeline` · `ActivityLogTimeline` · `RelatedRecordsCard` · `LineItemsEditor` · `StatusTransitionModal` · `SendEmailDialog` · `DestructiveConfirmDialog`.

**Folder shape**:
```
src/features/<slug>/pages/<Slug>Detail.tsx
├── components/
│   ├── tabs/<Slug>TabOverview.tsx · <Slug>TabActivity.tsx · <Slug>TabRelated.tsx
│   ├── <Slug>SideRail.tsx
│   └── <Slug>Actions.tsx
```

**Live examples**: `/companylist/:id` · `/quotations/:id` (P2 header-lift).

Full rules: [CANONICAL_DETAIL_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_DETAIL_PAGE_PATTERN.md).

## 3. Form (Create / Edit)

Data entry with validation, often multi-step.

**Primary**: `AppHeader` · `PageTitle` · `Field`-wrapped `Input` · `Textarea` · `Select` · `Checkbox` · `Radio` · `Switch` · `DatePicker` · `FileUpload` · `Progress` · `Stepper` (multi-step) · `Button` primary + ghost.

**RHF adapter**: `ui/form` (`Form`/`FormField`/`FormControl`) wraps primitive inputs — sanctioned exception (see [universal-components-protocols.md](../../../.claude/rules/universal-components-protocols.md)).

**Folder shape**:
```
src/features/<slug>/pages/<Slug>Create.tsx
├── lib/<slug>FormSchema.ts (Zod)
├── api/<slug>Create.ts (mutation)
└── components/<Slug>FieldGroup_*.tsx
```

Full rules: [CANONICAL_FORM_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_FORM_PAGE_PATTERN.md).

## 4. Dashboard

Home Overview (masthead + KPI row + feed) OR role dashboard (KPIs + charts + activity).

**Home-Overview primary**: `GreetingHeader` · `KpiIndexCard` · `DataRow` feed. The module-launcher composition it replaced (`CategoryHeader` · `ModuleCard` · `ModuleSearch`) was **deleted 2026-07-25** — module navigation is the sidebar rail plus the ⌘K `CommandPalette`. See [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md). `NeedsAttentionPill` · `AttentionHeader` · `CountBadge` survive but have no current adopter.

**Role / operational primary**: `KpiTile` (+ bundled `NumberTicker`) · `ChartShell` + `AreaChart` / `BarChart` / `HBarChart` · `ChartTooltip` / `LegendRow` · activity section via `DataRow`.

**Live examples**: `/dashboard` (2a Overview, rebuilt 2026-07-25) · role dashboards pending.

Full rules: [CANONICAL_DASHBOARD_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_DASHBOARD_PAGE_PATTERN.md).

## 5. Settings

User / admin configuration — tabbed sections of grouped fields.

**Primary**: `AppHeader` · `TabNav` (not `StatusTabs`) · `Card`-grouped `Field` sections · `Button` Save / Cancel / Reset · `Toaster` confirmation. Often uses vertical tab layout with `ScrollArea`.

Full rules: [CANONICAL_SETTINGS_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_SETTINGS_PAGE_PATTERN.md).

## 6. Tool / Calculator

One-off utility — OT calculator, report generators, export tools. No fixed skeleton; intentionally bespoke. Must still compose primitives, not hand-roll UI.

**Primary kit**: `DashboardHeader` as root · form primitives (`Field` + `Input` / `Select` / `DatePicker`) for parameter entry · `DataTable` for tabular results · `ChartShell` + chart family for visual results · `Button variant="primary"` for run / export · shadcn `ui/Card` IS allowed for result blocks (compliance #6 exception — document in `NOTES.md`) · `Badge` for status.

**Typical shape**:
```tsx
<DashboardHeader title="<Tool>" description="...">
  <FormSection title="Inputs">
    <Field label="Start date"><DatePicker ... /></Field>
    <Field label="Base rate"><Input type="number" ... /></Field>
  </FormSection>
  <FormSection title="Result">
    <ResultDisplay value={computed} />
    <Button variant="primary" onClick={export}>Export PDF</Button>
  </FormSection>
</DashboardHeader>
```

**Folder shape**:
```
src/features/<slug>/
├── pages/<Slug>Page.tsx
├── components/InputsSection.tsx · ResultSection.tsx
├── hooks/use<Slug>Calculator.ts   ← pure computation
├── api/<slug>DataFetch.ts         ← if needs server data
├── lib/<slug>Math.ts              ← pure helpers (sum · prorate · format)
└── types.ts
```

**Rewrite rules**:
1. `DashboardHeader` is root — never a bespoke one-off header.
2. All input collection follows the form archetype rules (Field wrappers · Input/Select/DatePicker primitives · no naked inputs).
3. All result display uses primitives. `ui/Card` exception for result blocks requires a `NOTES.md` entry.
4. Export buttons: `<Button variant="primary">`, NOT floating CTAs (unless mobile-heavy).
5. Page-specific computation in `hooks/use<Tool>Calculator.ts` — pure functions, easy to test.
6. Heavy / async computation: show `<Progress>` in result slot, never a page-level spinner.

**Anti-patterns**:
- NO competing submit flows — live update OR explicit button press, not both.
- NO page-scoped CSS files. Tailwind + tokens only.
- NO skipping compliance #6 because the page is bespoke. Missing primitive → `NOTES.md` entry, not `@/components/ui/**` import.

**Mobile**: Tool pages are often mobile-heavy (field calculators on-site). Apply aggressive mobile spec coverage.

**When to reclassify**: if a tool evolves to need CRUD on records (e.g. saving historical runs), reclassify as list + detail combo.

**Live examples**: `/ot-calculator` · `JLTTPage` · `LeavesPage` · `PayslipPage`.

## Cross-archetype invariants

- **AppHeader** on every page — never a one-off header. Legacy `DashboardHeader` is a shim that delegates to `AppHeader` + `PageTitle` + `PageDescription`.
- **PageTitle + PageDescription** — always the primitive, never raw `<h1>`.
- **Module-access via `useAuth().modules` path check** — never role-string comparison.
- **React Query keys via `queryKeys` factory** — never hardcoded arrays.
- **Timezone via `timezoneUtils`** — never raw `date-fns`.
- **Toasts via `showSuccess`/`showError`** — never `useToast`.

## 📚 Related

- [PRIMITIVES.md](./PRIMITIVES.md) — full inventory behind each archetype
- [canonical-page-patterns/](../canonical-page-patterns/) — authoritative per-archetype rules (LIST_TABLE · DETAIL · FORM · DASHBOARD · SETTINGS · FEATURE_FOLDER)
- [MODULE_COMPLIANCE_CHECKLIST.md](../../../docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md) — primitive-coverage greps + compliance gate
