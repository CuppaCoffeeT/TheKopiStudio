---
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Rule: Singapore Timezone (UTC+8)

## Summary

All timestamps are stored in the database as UTC and displayed to users in Singapore time (Asia/Singapore, UTC+8). Always use the utility functions from `@/utils/timezoneUtils` for conversions — never use raw `date-fns` formatting directly, as it defaults to the system locale and may produce incorrect results on non-SGT machines.

## Detailed Patterns

```typescript
// ✅ CORRECT — use timezoneUtils, NOT raw date-fns
import { toUTCForDatabase, formatDisplayTime, getLocalDateString } from '@/utils/timezoneUtils';

const utcForDB = toUTCForDatabase(parseFromDateTimeLocal(inputValue)); // user input → DB
const display = formatDisplayTime(record.start_datetime);              // DB → display
const dateKey = getLocalDateString(record.start_datetime);             // DB → SG date grouping
```

### Key Utilities

| Function | Purpose |
|----------|---------|
| `toUTCForDatabase()` | Convert user input (SGT) → UTC for database storage |
| `parseFromDateTimeLocal()` | Parse `<input type="datetime-local">` value |
| `parseFromDatabase()` | Parse UTC/ISO-8601 timestamp from Supabase → Date |
| `formatDisplayTime()` | Format UTC timestamp → SGT display string (HH:mm) |
| `formatDisplayDateLong()` | `dd MMM yyyy` in SGT (e.g. "20 Apr 2026") — TODO W08 |
| `formatDisplayDateTimeLong()` | `dd MMM yyyy, HH:mm` in SGT — TODO W08 |
| `formatDisplayDateSlashed()` | `dd/MM/yyyy` in SGT — TODO W08 |
| `formatDisplayDateTimeSlashed()` | `dd/MM/yyyy HH:mm` in SGT — TODO W08 |
| `formatDisplayDateShort()` | `dd/mm/yy` in SGT (e.g. "20/04/26") — **canonical cell/picker display since 2026-05-29** (`DateCell` + `DatePicker` default) |
| `formatDisplayDateTimeShort()` | `dd/mm/yy, HH:mm` in SGT — `DateTimeCell` display since 2026-05-29 |
| `formatDisplayDateUS()` | `MMM dd, yyyy` in SGT — TODO W08 |
| `formatDisplayDateTimeUS()` | `MMM dd, yyyy HH:mm` in SGT — TODO W08 |
| `formatMonthYear()` | `MMMM yyyy` in SGT (e.g. "April 2026") |
| `getLocalDateString()` | Get SGT date string (yyyy-MM-dd) for grouping/keys |

### Date Library

- **date-fns v3.6** with Singapore timezone
- Always use `timezoneUtils` wrappers for **DISPLAY** and **PARSE** — never raw `format()` / `parseISO()`

### ✅ Allowlist — raw `date-fns` is OK for pure arithmetic & comparison

The helpers below operate on `Date` structurally and do not read system locale or timezone. Importing them directly from `date-fns` is sanctioned by W12.04:

```typescript
// ✅ SANCTIONED — arithmetic (no tz side-effect)
import { startOfMonth, endOfMonth, startOfYear, endOfYear,
         addMonths, subMonths, addDays, subDays, addHours,
         setMonth, setYear, eachDayOfInterval } from 'date-fns';

// ✅ SANCTIONED — comparison / introspection (no tz side-effect)
import { isAfter, isBefore, isEqual, isValid, differenceInDays,
         getMonth, getYear, getDay } from 'date-fns';
```

Rule of thumb: if the symbol **returns a string**, it probably consults the locale → use `timezoneUtils`. If it returns a `Date`, `number`, or `boolean`, it's safe.

### ⚠️ NEEDS-HUMAN — local-tz form input widgets

Components that drive `<input type="datetime-local">` or use `Date#setHours()` intentionally operate in browser-local time (to preserve what the user sees/types). These may continue to use raw `format(d, 'HH:mm')` and `format(d, 'PPP')` pending W08 design-system review:

- `src/components/ui/datetime-picker.tsx` (time input value)
- `src/components/ui/date-picker.tsx` (display format is low-risk; date-only)
- Any shadcn `Popover` + `Calendar` pattern using `format(d, 'PPP')` for the preview chip

## References

- [docs/01-system-architecture/TIMEZONE_POLICY.md](../../docs/01-system-architecture/TIMEZONE_POLICY.md)
- Source: `src/utils/timezoneUtils.ts`
