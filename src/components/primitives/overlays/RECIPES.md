# Overlay Recipes — compose existing primitives, don't build new ones

Spec source: `docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/OverlayPrimitives.jsx`

These 4 patterns (PopoverFilter · PopoverDate · PopoverUser · DrawerRow) appear in Claude Design's overlay kit but were intentionally NOT extracted — they compose `<Popover>` / `<Drawer>` + form primitives. Use these as copy-paste starting points.

## PopoverFilter — multi-select checkbox list in a popover

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/primitives/overlays';
import { FilterDropdown } from '@/components/primitives/shell';
import { Checkbox } from '@/components/primitives/form';

<FilterDropdown label="Status" count={selected.length} value={`${selected.length} selected`}>
  <div className="flex flex-col gap-1 p-1 min-w-[14rem]">
    {options.map(o => (
      <label key={o.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[color:var(--row-hover)] cursor-pointer">
        <Checkbox checked={selected.includes(o.key)} onCheckedChange={(v) => toggle(o.key, v)} />
        <span className="text-[12.5px]">{o.label}</span>
      </label>
    ))}
  </div>
</FilterDropdown>
```

## PopoverDate — date range picker in a popover

```tsx
import { FilterDropdown } from '@/components/primitives/shell';
import { DatePicker } from '@/components/primitives/form';

<FilterDropdown label="Date" value={rangeLabel} isDate>
  <div className="flex flex-col gap-2 p-2 w-[18rem]">
    <DatePicker value={from} onChange={setFrom} placeholder="From" />
    <DatePicker value={to} onChange={setTo} placeholder="To" />
  </div>
</FilterDropdown>
```

## PopoverUser — user/owner combobox — reuse SearchableMultiSelect

```tsx
import { SearchableMultiSelect } from '@/components/primitives/overlays';

<SearchableMultiSelect
  options={users.map(u => ({ value: u.id, label: u.name }))}
  selected={selected} onChange={setSelected}
  placeholder="Assign owner…" multi
/>
```

(SearchableMultiSelect already composes Popover internally — no FilterDropdown wrap needed.)

## DrawerRow — action sheet item inside a mobile Drawer

```tsx
import { DrawerRoot, DrawerContent, DrawerHeader, DrawerFooter } from '@/components/primitives/overlays';
import { IconGlyph } from '@/components/primitives/IconGlyph';

<DrawerRoot open={open} onOpenChange={setOpen}>
  <DrawerContent>
    <DrawerHeader title="Row actions" />
    <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-[color:var(--row-hover)]" onClick={onEdit}>
      <IconGlyph name="doc" size={16} /> Edit
    </button>
    <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] text-[color:var(--negative-text)] hover:bg-[color:var(--red-soft)]" onClick={onDelete}>
      <IconGlyph name="warn" size={16} /> Delete
    </button>
    <DrawerFooter />
  </DrawerContent>
</DrawerRoot>
```

## Rules

- These are recipes, **not primitives** — do not create `.tsx` files for them.
- If a recipe grows beyond ~20 lines of logic OR ships in 3+ pages, promote it to a primitive via `/design-prompt` → `/design-import --promote`.
