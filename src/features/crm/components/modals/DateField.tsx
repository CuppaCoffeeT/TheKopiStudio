/**
 * DateField — the DatePicker wrapped in a Field shell, for the CRM form modals.
 *
 * Split out of `shared.tsx` when it grew the `birth` variant. It is the only
 * field there that has to reason about the picker's own configuration, and the
 * reasoning is worth keeping next to the field rather than buried among the
 * one-liner wrappers.
 *
 * Values travel as 'YYYY-MM-DD' strings (the row↔model contract in
 * lib/clientMapping.ts); conversion to/from the picker's `Date` goes through
 * timezoneUtils only (see ./dateStrings.ts).
 */

import type { ReactNode } from 'react';
import { DatePicker, Field } from '@/components/primitives/form';
import { getSingaporeYear } from '@/utils/timezoneUtils';
import { dateStringToDate, dateToDateString } from './dateStrings';

/** How far back a date of birth may reach. Comfortably past any living customer. */
const BIRTH_YEARS_BACK = 120;

interface DateFieldProps {
  label: string;
  testId: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  value: string;
  onChange: (next: string) => void;
  /**
   * `birth` narrows the year dropdown to a lifetime, blocks future days, and
   * spells the year out — a date of birth shown as `28/01/01` cannot be read as
   * 1901 or 2001, and the narrowed window is also what makes a typed two-digit
   * year resolve to 19xx (the pivot keys off `toYear`). Omit for ordinary
   * dates; the picker's own wide window then applies.
   */
  variant?: 'default' | 'birth';
}

export function DateField({
  label,
  testId,
  required,
  error,
  hint,
  disabled,
  value,
  onChange,
  variant = 'default',
}: DateFieldProps) {
  const birth = variant === 'birth';
  const thisYear = getSingaporeYear();
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <DatePicker
        value={dateStringToDate(value)}
        onChange={(d) => onChange(dateToDateString(d))}
        error={!!error}
        disabled={disabled}
        triggerTestId={testId}
        format={birth ? 'long' : undefined}
        fromYear={birth ? thisYear - BIRTH_YEARS_BACK : undefined}
        toYear={birth ? thisYear : undefined}
        disabledDate={birth ? (d) => d > new Date() : undefined}
      />
    </Field>
  );
}
