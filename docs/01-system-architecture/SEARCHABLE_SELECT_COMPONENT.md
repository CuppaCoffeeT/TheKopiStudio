# Searchable Select Primitives

**Created**: 2026-02-20 10:00:00 SGT
**Last Updated**: 2026-05-30 SGT — repointed legacy-callsite list + Status header to live importers (`xero-settings/.../InvoiceProjectAssigner`, `ui/quotation-select`, `ui/duplicate-contact-dialog`); removed dead engineer-dashboard / client-management/contacts entries; `ProjectSelect` migration row repointed to `@/components/ui/project-select`.
**Status**: 🟢 **Production** — every new combobox MUST import the primitive `<SearchableMultiSelect>` (or its primary-aware sibling `<StarredMultiSelect>`). The legacy `@/components/ui/searchable-select.tsx` file still exists ONLY for a small set of unmigrated callsites that haven't gone through W09 yet (`xero-settings/.../InvoiceProjectAssigner`, `ui/quotation-select`, `ui/duplicate-contact-dialog`). DO NOT import the legacy path in new code.
**Priority**: 🔴 Critical

> ⚠️ **For new code, ALWAYS import from primitives:**
> ```tsx
> import { SearchableMultiSelect, type SMSOption } from '@/components/primitives/overlays';
> import { StarredMultiSelect } from '@/components/primitives/form';
> ```
> The `@/components/ui/searchable-select` path is **deprecated**. Treat it as quarantined — it only exists so unmigrated W09 callsites still compile.

## 📋 Overview

**THE universal dropdown stack for all select / combobox UI in this application.**

Every dropdown — single OR multi, inline OR inside a Dialog — MUST use one of:

| Need | Primitive | Path |
|---|---|---|
| Single OR multi-select picker (most common) | `SearchableMultiSelect` | `@/components/primitives/overlays` |
| Multi-select with ONE selection as "primary" (star toggle on pills) | `StarredMultiSelect` | `@/components/primitives/form` |
| Single-select dropdown where SearchableMultiSelect is overkill (small static list) | `SelectMenu` | `@/components/primitives/overlays` |
| Form-native single-select with inline error | `Select` | `@/components/primitives/form` |

Domain-specific dropdowns (project picker, company picker, staff picker, …) compose one of these primitives + a query hook + an optional "Add new" dialog. They live at `@/components/ui/<name>` and are listed in the sanctioned exceptions table in [.claude/rules/universal-components-protocols.md](../../.claude/rules/universal-components-protocols.md).

## 📚 Related Documentation

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — design system standards
- [react-query-cache/CONTEXT.md](./react-query-cache/CONTEXT.md) — query key patterns for data-fetching wrappers
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [src/lib/README.md](../../src/lib/README.md#typed-supabase-client-query-compliance-enforced) — typed Supabase wrapper for populating dropdowns (`fetchDropdown`)
- [.claude/rules/universal-components-protocols.md](../../.claude/rules/universal-components-protocols.md) — sanctioned exceptions table for domain wrappers at `ui/`

---

## Built-in features

All features are always available on `SearchableMultiSelect`. Enable them via props — no extra code needed.

| Feature | Always on? | Prop to enable | Description |
|---|---|---|---|
| **Searchable** | Default `true` | `searchable={false}` to disable | Search input filters options by label + description; auto-focuses on open |
| **Scrollable** | Yes | — | `max-h-[300px] overflow-y-auto` on the options list |
| **Works inside Dialogs** | Yes | — | No Portal rendering → touch + scroll work on iOS Safari (verified 2026-03-20) |
| **Single select** | Default | `value` + `onValueChange` | Select one option, Check icon indicator |
| **Multi select** | — | `values` + `onValuesChange` | Discriminator: passing `values` flips to multi mode. Checkbox indicators, Badge pills on trigger |
| **Add new item inline** | — | `onCreateNew` + `createLabelPrefix` | "Create new {query}" row appears at the bottom when search has no match |
| **Clearable** | Default `true` (single-select) | `clearable={false}` to disable | X button to clear selection (single mode only) |
| **Disabled items (greyed out)** | — | `disabled` on `SMSOption` | Greyed out, sorted to bottom, shows toast (via `disabledMessage`) on tap |
| **Description text** | — | `description` on `SMSOption` | Secondary text below the label |
| **Section headers** | — | `group` on `SMSOption` | Sticky uppercase mono section headers; group order is first-seen |
| **Disabled dropdown** | — | `disabled` on component | Entire dropdown becomes non-interactive |
| **Test IDs** | — | `triggerTestId` + `optionTestIdPrefix` | Forwards `data-testid` to the trigger and per-option rows for Playwright |

---

## Props reference

### `SMSOption`

```typescript
import type { SMSOption } from '@/components/primitives/overlays';

interface SMSOption {
  value: string;
  label: string;
  description?: string;     // Secondary text below label (e.g., "UEN: 12345678A")
  disabled?: boolean;       // Grey out and block selection, sorted to bottom
  disabledMessage?: string; // Toast message shown when tapping a disabled item
  group?: string;           // Section header label — when set on ANY option, list renders grouped under uppercase mono headers
}
```

### `SearchableMultiSelect`

```typescript
interface SearchableMultiSelectProps {
  options: SMSOption[];

  // Single-select (default — passing `value` flips to single mode)
  value?: string | null;
  onValueChange?: (next: string | null) => void;

  // Multi-select (passing `values` flips to multi mode — mutually exclusive with `value`)
  values?: string[];
  onValuesChange?: (next: string[]) => void;

  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;            // Default: true
  clearable?: boolean;              // Default: true (single-select only)

  // Inline create
  onCreateNew?: (query: string) => void;
  createLabelPrefix?: string;       // Default: "Create new"

  // Variants
  variant?: 'default' | 'bare';     // `bare` strips frame for grid-cell embeds (e.g. LineItemsEditor unit cell)

  // Server-side filter hook — fires on every keystroke for paginated/remote search
  onQueryChange?: (q: string) => void;

  // Playwright contracts
  triggerTestId?: string;           // data-testid on trigger button
  optionTestIdPrefix?: string;      // data-testid on each option row: `${prefix}-${value}`

  className?: string;
}
```

### `StarredMultiSelect`

```typescript
import { StarredMultiSelect } from '@/components/primitives/form';

interface StarredMultiSelectProps {
  options: SMSOption[];
  values: string[];
  onValuesChange: (next: string[]) => void;

  /**
   * Optional "primary" — exactly zero or one of `values`. Pass both `primaryValue`
   * AND `onPrimaryChange` to enable the star toggle on pills. Omit `onPrimaryChange`
   * for a read-only primary indicator.
   */
  primaryValue?: string | null;
  onPrimaryChange?: (next: string | null) => void;

  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: (query: string) => void;
  createLabelPrefix?: string;
  triggerTestId?: string;
  optionTestIdPrefix?: string;
  className?: string;
}
```

---

## Usage examples

### 1. Basic single-select

```typescript
import { SearchableMultiSelect, type SMSOption } from '@/components/primitives/overlays';

const options: SMSOption[] = [
  { value: '1', label: 'Option A' },
  { value: '2', label: 'Option B' },
  { value: '3', label: 'Option C' },
];

<SearchableMultiSelect
  options={options}
  value={selectedId}
  onValueChange={(id) => setSelectedId(id ?? '')}
  placeholder="Select an option..."
/>
```

### 2. Single-select with description text

```typescript
const options: SMSOption[] = companies.map((c) => ({
  value: c.id,
  label: c.company_name,
  description: c.uen ? `UEN: ${c.uen}` : undefined,
}));

<SearchableMultiSelect
  options={options}
  value={selectedCompanyId ?? null}
  onValueChange={(v) => setSelectedCompanyId(v ?? '')}
  placeholder="Select company..."
/>
```

### 3. Single-select with disabled (greyed-out) items + toast on tap

```typescript
const options: SMSOption[] = projects.map((p) => ({
  value: p.id,
  label: formatProjectDisplayName(p),
  disabled: !isTrialTrenchProject(p),
  disabledMessage: 'Only trial trench projects can be selected',
}));

<SearchableMultiSelect
  options={options}
  value={selectedProjectId ?? null}
  onValueChange={(v) => setSelectedProjectId(v ?? '')}
/>
```

### 4. Single-select with inline "Add new" row

```typescript
<SearchableMultiSelect
  options={options}
  value={selectedId ?? null}
  onValueChange={(v) => setSelectedId(v ?? '')}
  placeholder="Select company..."
  onCreateNew={() => setIsCreateDialogOpen(true)}
  createLabelPrefix="Add new company"
/>
```

### 5. Multi-select with badge pills

```typescript
<SearchableMultiSelect
  options={options}
  values={selectedIds}
  onValuesChange={setSelectedIds}
  placeholder="Select staff members..."
/>
```

### 6. Multi-select with ONE primary (star) — use `StarredMultiSelect`

```typescript
import { StarredMultiSelect } from '@/components/primitives/form';

<StarredMultiSelect
  options={contacts.map((c) => ({
    value: c.id,
    label: c.name,
    description: c.role,
  }))}
  values={selectedIds}
  onValuesChange={setSelectedIds}
  primaryValue={primaryId}
  onPrimaryChange={setPrimaryId}
  placeholder="Add client contacts..."
  onCreateNew={() => setAddDialogOpen(true)}
  createLabelPrefix="Add new contact"
/>
```

### 7. Category-grouped catalogue (sticky uppercase headers)

```typescript
const options: SMSOption[] = unitTypes.map((u) => ({
  value: u.id,
  label: u.display_name,
  group: u.category, // "Fixed Price" | "Measurement" | "Time" | ...
}));

<SearchableMultiSelect options={options} value={value} onValueChange={onChange} />
```

---

## Wrapper component pattern

Domain-specific dropdowns (projects, companies, staff, client contacts, …) compose a primitive + a query hook + an optional "Add new" dialog. They live at `@/components/ui/<name>` and are listed in the sanctioned exceptions table in [.claude/rules/universal-components-protocols.md](../../.claude/rules/universal-components-protocols.md) so grep 6a accepts them.

### Example: `CompanySelect` (primitive + inline add dialog)

```typescript
import { SearchableMultiSelect, type SMSOption } from '@/components/primitives/overlays';

function CompanySelect({ companies, value, onValueChange, showNoClientOption }) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const options: SMSOption[] = [
    ...(showNoClientOption ? [{ value: 'no-client', label: 'No Client Selected' }] : []),
    ...companies.map((c) => ({
      value: c.id,
      label: c.company_name,
      description: c.uen ? `UEN: ${c.uen}` : undefined,
    })),
  ];

  return (
    <>
      <SearchableMultiSelect
        options={options}
        value={value ?? null}
        onValueChange={(v) => onValueChange(v ?? '')}
        placeholder="Search companies..."
        onCreateNew={() => setIsAddDialogOpen(true)}
        createLabelPrefix="Add new company"
      />
      <Modal open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        {/* CompanyForm … */}
      </Modal>
    </>
  );
}
```

### Example: `ClientContactMultiSelect` (primary-aware wrapper around `StarredMultiSelect`)

```typescript
import { StarredMultiSelect } from '@/components/primitives/form';

function ClientContactMultiSelect({ companyId, value, onChange }) {
  const { data: contacts = [] } = useQuery({ /* fetch by companyId */ });
  const { data: primaryPicRoleId } = usePrimaryPicRoleId();

  // map domain SelectedContact[] → SMSOption[] + values[] + primaryValue
  const options = contactsToOptions(contacts, value);
  const values = value.map((c) => c.client_contact_id);
  const primaryValue = value.find((c) => c.contact_role_id === primaryPicRoleId)?.client_contact_id ?? null;

  return (
    <StarredMultiSelect
      options={options}
      values={values}
      onValuesChange={(ids) => onChange(reconcile(ids, value, contacts, primaryPicRoleId))}
      primaryValue={primaryValue}
      onPrimaryChange={(id) => onChange(restampPrimary(value, id, primaryPicRoleId))}
      placeholder="Add client contacts..."
      onCreateNew={() => setAddDialogOpen(true)}
      createLabelPrefix="Add new contact"
    />
  );
}
```

---

## Key design decision: NO Portal

**🚨 NEVER add `<PopoverPrimitive.Portal>` to `SearchableMultiSelect` or `StarredMultiSelect`.**

Both primitives render Popover content **without** Portal. The dropdown DOM is a child of its container rather than appended to `<body>`.

**Why**: Radix `Dialog` uses `react-remove-scroll` to lock background scrolling. It only allows scroll/touch events on elements inside the Dialog content DOM tree (its "shard"). Portal-rendered Popover content is outside this shard, so **touch events are blocked on iOS Safari** — users cannot tap to select options when the dropdown is inside a Dialog (e.g., Supervisor Mode "Add Work Entry"). Android is unaffected because Chrome handles touch events differently.

**Verified**: iOS Safari (2026-03-20) — both Supervisor Mode "Add Work Entry" and "Add Working Hours" project dropdowns work correctly on iPhone inside Dialogs.

**If the dropdown is visually clipped**: fix at the container level (e.g., adjust `overflow` on the parent Dialog content). Do NOT re-add Portal — it will break iOS again.

**If touch stops working on iOS**: check if someone re-added Portal. Also check that option items use `onClick` (not `onPointerDown`).

---

## Domain wrapper migration status

| Wrapper | Path | Status | Internal |
|---|---|---|---|
| `ProjectSelect` | `@/components/ui/project-select` | ✅ Sanctioned 2026-04-27 (relocated 2026-05-26 from `@/components/projects/ProjectSelect`) | Primitive `SelectMenu` + project query hook |
| `CompanySelect` | `@/components/ui/company-select` | ✅ Migrated 2026-04-27 | Primitive `SearchableMultiSelect` + inline add-Dialog |
| `StaffSelect` | `@/components/ui/staff-select` | ✅ Migrated 2026-04-27 | Primitive `SearchableMultiSelect` |
| `UnitSelect` | `@/components/ui/unit-select` | ✅ Migrated 2026-04-27 (eod) | Primitive `SearchableMultiSelect` w/ `SMSOption.group` |
| `ClientContactMultiSelect` | `@/components/ui/client-contact-multi-select` | ✅ Migrated 2026-05-25 (W09 `/projects/create`) | Primitive `StarredMultiSelect` (which composes `SearchableMultiSelect`) |
| `PeopleSelect` | `@/components/ui/people-select` | ⚠ Bespoke retained | Blocked on `SearchableMultiSelectProps.renderOption?` (Worker / Staff / Client badges + auto-suggest highlight) |
| `QuotationSelect` | `@/components/ui/quotation-select` | ⚠ Legacy import retained | Quick swap to primitive — same shape as `StaffSelect`. Deferred to keep `/projects/create` migration surgical. |
| `MultiSelectField.tsx` | `@/components/...MultiSelectField` | ⚠ Bespoke retained | Blocked on `SearchableMultiSelectProps.renderOption?` (per-option risk_level / access_difficulty badges + per-option `ListPlus` action) |

### Primitive enhancements shipped

| Date | Enhancement |
|---|---|
| 2026-04-27 | `SMSOption.disabledMessage?` — toast on tap for disabled options |
| 2026-04-27 | `SearchableMultiSelectProps.triggerTestId?` — forwarded as `data-testid` on trigger |
| 2026-04-27 | `SearchableMultiSelectProps.optionTestIdPrefix?` — forwarded as per-option `data-testid` |
| 2026-04-27 | `SMSOption.group?` — sticky uppercase mono section headers (powers `UnitSelect`) |
| 2026-04-27 | `SearchableMultiSelectProps.variant='bare'` — frame stripped for grid-cell embed |
| 2026-05-25 | **`StarredMultiSelect` primitive** — multi-select + "star one as primary" affordance (powers `ClientContactMultiSelect`) |

### Primitive enhancements still needed

- `SearchableMultiSelectProps.renderOption?: (option, defaults) => ReactNode` — custom row-level render. Would unlock the remaining bespoke wrappers (`MultiSelectField` + `PeopleSelect` + the `QuotationLineItemsEditor` ProductPicker bespoke listbox).

---

## Legacy file (do not import)

`@/components/ui/searchable-select.tsx` is **deprecated** and exists only because a handful of unmigrated features still depend on its old `SelectOption` shape + `onAddNew` / `multiple` / `searchPlaceholder` prop API. These callsites will be swapped to the primitive during their respective W09 passes:

- `src/features/xero-settings/components/invoice-import/InvoiceProjectAssigner.tsx`
- `src/components/ui/quotation-select.tsx`
- `src/components/ui/duplicate-contact-dialog.tsx` (relocated from `client-management/contacts/DuplicateContactDialog.tsx`)

**Never add a new callsite to `ui/searchable-select`.** If you find yourself reaching for it, you want `SearchableMultiSelect` (or `StarredMultiSelect`) from primitives instead.

### Legacy → primitive prop map (for swapping a callsite)

| Legacy `ui/searchable-select` | Primitive `SearchableMultiSelect` |
|---|---|
| `multiple={true}` discriminator | Pass `values` array (presence is the discriminator) |
| `onAddNew()` | `onCreateNew(query)` (receives the current query string) |
| `addNewLabel` | `createLabelPrefix` (label is built as `${prefix} {query}`) |
| `searchPlaceholder` | Not exposed — uses single `placeholder` |
| `emptyMessage` | Not exposed — uses default "No results" |
| `SelectOption` | `SMSOption` (adds optional `group?` for section headers) |
