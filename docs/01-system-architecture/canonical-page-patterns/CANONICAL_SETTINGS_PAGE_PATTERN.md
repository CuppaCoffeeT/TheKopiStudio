# Canonical Settings Page Pattern

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The **single canonical pattern** for any SETTINGS page in AppBase (one of 6 page archetypes). A settings page is a tabbed configuration surface: the plain `AppHeaderShell` frame, a tab strip, and per-tab panels of editable reference data or toggles. `AppHeaderShell` is also the frame for the **TOOL** archetype (calculators, one-off interactive surfaces).

**Read this first** if your task is: "build a settings page", "add a settings tab", or "migrate a config / tool page to primitives".

Router-style doc — links to real adopters + primitives. Does not duplicate code.

## The Canonical Stack

| Layer | Use | Never |
|-------|-----|-------|
| Page frame | `AppHeaderShell` (`@/components/primitives/shell`) | hand-rolled header + `<main>` |
| Tab strip | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` (`@/components/primitives/overlays`) · or `StatusTabs` (`@/components/primitives/ui`) for count-style segments | raw button row + manual active state |
| Tab panel body | `DataTable` (ref-data list) or `Field`+`Input`/`Select` (config form) | bespoke `<table>` / native inputs |
| Ref-data CRUD modals | sanctioned `ui/quotation-ref-data-modals` (`JobTypeFormModal` · `ClientWorkTypeFormModal` · `AreaTypeFormModal`) | inline dialogs duplicated per feature |
| Toggle row | `Switch` (`@/components/primitives/form`) | native checkbox |
| Card surface | `Card` (`@/components/primitives/shell`) | `@/components/ui/card` |

`AppHeaderShell` is the shared frame for SETTINGS **and** TOOL archetypes. Full inventory: [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md).

## Shape

```tsx
<AppHeaderShell title="Quotation settings">
  <Tabs value={active} onValueChange={setActive}>     {/* controlled by page */}
    <TabsList>
      <TabsTrigger value="job-types">Job types</TabsTrigger>
      <TabsTrigger value="work-types">Work types</TabsTrigger>
    </TabsList>
    <TabsContent value="job-types"><JobTypesPanel /></TabsContent>
    <TabsContent value="work-types"><WorkTypesPanel /></TabsContent>
  </Tabs>
</AppHeaderShell>
```

Each tab panel is typically a small CRUD surface (a `DataTable` of reference rows + an inline-create modal) or a block of toggles/fields. Extract each panel to its own component.

## Adopter references

| Adopter | File |
|---------|------|
| Quotation settings | `src/features/quotation-settings/pages/QuotationSettingsPage.tsx` |
| Xero settings | `src/features/xero-settings/pages/XeroSettingsPage.tsx` |
| Payslip management | `src/features/payslip/pages/PayslipManagement.tsx` |
| PDF template management | `src/features/pdf-templates/pages/PDFTemplateManagementPage.tsx` |
| OT calculator (TOOL — shares frame) | `src/features/otcalculator/pages/OTCalculatorPage.tsx` |

Start from **QuotationSettingsPage.tsx** — clean `AppHeaderShell` + tabs + ref-data-CRUD example.

## Rules

- Tab state is **controlled** by the page (`useState`), passed via `value` + `onValueChange`. The tab primitive does not own it.
- Inline-create / edit dialogs for shared reference data (job types, work types, area types) come from sanctioned `ui/quotation-ref-data-modals` — do not re-implement per feature (avoids cross-feature import + duplication).
- Each settings mutation uses `showSuccess`/`showError` and invalidates its ref-data query key.
- A SETTINGS page renders no record-hero and no KPI row — if you need those, it's a DETAIL or DASHBOARD, not SETTINGS.
- Keep the page component under 200 LOC; one child component per tab panel.

## SETTINGS vs TOOL

Both use `AppHeaderShell`. **SETTINGS** = tabbed persisted configuration (tabs + ref-data CRUD). **TOOL** = a single-purpose interactive surface (e.g. `ot-calculator`) with a bespoke body and usually no tabs. Same frame, different body shape.

## 📚 Related Documentation

- [CANONICAL_DASHBOARD_PAGE_PATTERN.md](./CANONICAL_DASHBOARD_PAGE_PATTERN.md) — DASHBOARD archetype
- [CANONICAL_LIST_TABLE_PATTERN.md](./CANONICAL_LIST_TABLE_PATTERN.md) — LIST archetype (DataTable used in tab panels)
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [.claude/rules/universal-components-protocols.md](../../.claude/rules/universal-components-protocols.md) — sanctioned ref-data modal wrappers
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
