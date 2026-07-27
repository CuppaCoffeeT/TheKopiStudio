---
paths:
  - src/components/**/*.tsx
---

# Rule: UI Component Standards

## Summary

Prefer the existing `DatePicker` and `SearchableMultiSelect` components (currently in `@/components/primitives/`) over hand-rolled equivalents. The legacy shadcn-style equivalents at `@/components/ui/date-picker` and `@/components/ui/searchable-select` are deprecated. Portal rendering inside Dialogs is component-specific: Radix `Select` / `DropdownMenu` Portal-render correctly, but `SearchableMultiSelect` MUST NOT use Portal (iOS Safari touch event blocking).

## Detailed Patterns

### DatePicker Component (MANDATORY for new code)

```typescript
// ✅ CORRECT — primitive
import { DatePicker } from '@/components/primitives/form';
<DatePicker value={date} onChange={setDate} placeholder="Select date" />

// ⚠ DEPRECATED — legacy ui/ wrapper (kept for unmigrated callsites)
import { DatePicker } from '@/components/ui/date-picker';

// ❌ FORBIDDEN in new code — Inline Popover+Calendar pattern
<Popover><PopoverTrigger>...</PopoverTrigger><PopoverContent><Calendar ... /></PopoverContent></Popover>
```

**Props**: `value`, `onChange`, `placeholder`, `disabled`, `className`, `fromYear` (default 2020), `toYear` (default 2030), `disabledDate?: (d: Date) => boolean` (added 2026-04-27), `format?: 'short' | 'long'` (added 2026-05-29)
**Features**: Month/year dropdown selectors, Today/Clear buttons, auto-close on select. **Default display is `dd/mm/yy` app-wide (2026-05-29)** — pass `format="long"` only where a spelled-out `dd MMM yyyy` is explicitly wanted. **Single mode is typeable (2026-05-29)** — type `dd/mm/yy` (numbers) directly OR click the calendar icon; typed text commits on blur/Enter, reverts if invalid.
**Location**: `src/components/primitives/form/DatePicker.tsx`

### SearchableMultiSelect (combobox / picker — MANDATORY for new code)

```typescript
// ✅ CORRECT — primitive (handles single + multi via discriminator)
import { SearchableMultiSelect, type SMSOption } from '@/components/primitives/overlays';

// ⚠ DEPRECATED — `@/components/ui/searchable-select` (kept for unmigrated callsites)
// ❌ FORBIDDEN — hand-rolling Popover + Command per callsite
```

**Reference**: [docs/01-system-architecture/SEARCHABLE_SELECT_COMPONENT.md](../../docs/01-system-architecture/SEARCHABLE_SELECT_COMPONENT.md) — props, migration table, legacy → primitive prop map.
**Location**: `src/components/primitives/overlays/SearchableMultiSelect.tsx`

### Portal Inside Dialogs/Modals (component-specific)

| Component | Portal? | Why |
|---|---|---|
| Radix `Select` (`SelectPrimitive.Portal`) | ✅ Required | Avoids clipping by Dialog `overflow: hidden`; Portal works with `react-remove-scroll` for native Select rows |
| Radix `DropdownMenu` (`DropdownMenuPrimitive.Portal`) | ✅ Required | Same as Select |
| `SearchableMultiSelect` / `ui/searchable-select` | ❌ **Forbidden** | Portal-rendered Popover content sits outside Radix Dialog's `react-remove-scroll` shard → iOS Safari blocks touch events on options. Verified 2026-03-20. Fix clipping at the container level instead. |
| Other custom `Popover`+content compositions | Case-by-case | Default to no Portal for combobox patterns; use Portal only when the content has no touch interactions inside Dialog. |

```typescript
// ✅ CORRECT — Radix Select with Portal
<SelectPrimitive.Portal>
  <SelectPrimitive.Content>...</SelectPrimitive.Content>
</SelectPrimitive.Portal>

// ❌ FORBIDDEN — never wrap SearchableMultiSelect content in Portal
```

## References

- [docs/01-system-architecture/SEARCHABLE_SELECT_COMPONENT.md](../../docs/01-system-architecture/SEARCHABLE_SELECT_COMPONENT.md) — combobox primitive (canonical)
- Source: `src/components/primitives/form/DatePicker.tsx`
- Source: `src/components/primitives/overlays/SearchableMultiSelect.tsx`
- Related: [docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md](../../docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md) — Need → Import matrix (there is no `.claude/rules/universal-components.md`; this rule file *is* the rule)
- Related: [light-theme.md](./light-theme.md) — the palette / surface / type contract every primitive must honour
- Related: [docs/99-refactor/_system/DEPRECATIONS.md](../../docs/99-refactor/_system/DEPRECATIONS.md) — check a primitive still exists before importing it
