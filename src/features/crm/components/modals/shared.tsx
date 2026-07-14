/**
 * Shared field helpers for the CRM form modals — thin Field + primitive
 * combinations so the four modals stay declarative (and ≤200 LOC each).
 *
 * Date values travel as 'YYYY-MM-DD' strings (the row↔model contract in
 * lib/mapping.ts); conversion to/from the DatePicker's Date goes through
 * timezoneUtils only (see ./dateStrings.ts).
 */

import type { ReactNode } from 'react';
import { DatePicker, Field, Input } from '@/components/primitives/form';
import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuTrigger,
  SelectMenuValue,
} from '@/components/primitives/overlays/SelectMenu';
import { cn } from '@/lib/utils';
import { dateStringToDate, dateToDateString } from './dateStrings';

/** Kebab-case a select option value into its data-testid suffix. */
function optionTestId(prefix: string, value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${prefix}-opt-${slug}`;
}

interface BaseFieldProps {
  label: string;
  testId: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (next: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number';
  placeholder?: string;
}

/** Single-line input wrapped in a Field shell. */
export function TextField({
  label,
  testId,
  required,
  error,
  hint,
  disabled,
  value,
  onChange,
  type = 'text',
  placeholder,
}: TextFieldProps) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={!!error}
        disabled={disabled}
        aria-label={label}
        data-testid={testId}
      />
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<string | SelectOption>;
  placeholder?: string;
}

/** Bounded SelectMenu wrapped in a Field shell (string options label themselves). */
export function SelectField({
  label,
  testId,
  required,
  error,
  hint,
  disabled,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <SelectMenu value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectMenuTrigger aria-label={label} data-testid={testId}>
          <SelectMenuValue placeholder={placeholder ?? 'Select…'} />
        </SelectMenuTrigger>
        <SelectMenuContent>
          {options.map((option) => {
            const o = typeof option === 'string' ? { value: option, label: option } : option;
            return (
              <SelectMenuItem key={o.value} value={o.value} data-testid={optionTestId(testId, o.value)}>
                {o.label}
              </SelectMenuItem>
            );
          })}
        </SelectMenuContent>
      </SelectMenu>
    </Field>
  );
}

interface DateFieldProps extends BaseFieldProps {
  value: string;
  onChange: (next: string) => void;
}

/** DatePicker (SG calendar) wrapped in a Field shell — value stays 'YYYY-MM-DD'. */
export function DateField({ label, testId, required, error, hint, disabled, value, onChange }: DateFieldProps) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <DatePicker
        value={dateStringToDate(value)}
        onChange={(d) => onChange(dateToDateString(d))}
        error={!!error}
        disabled={disabled}
        triggerTestId={testId}
      />
    </Field>
  );
}

interface ModalSectionProps {
  title: string;
  /** `amber` = the hospitalization fieldset tone (legacy parity). */
  tone?: 'default' | 'amber';
  testId?: string;
  children: ReactNode;
}

/** Titled fieldset block inside a form modal. */
export function ModalSection({ title, tone = 'default', testId, children }: ModalSectionProps) {
  return (
    <section
      data-testid={testId}
      className={cn(
        'rounded-lg border p-3.5 grid gap-3',
        tone === 'amber'
          ? 'border-amber-400/50 bg-amber-950/20'
          : 'border-border bg-secondary'
      )}
    >
      <span
        className={cn(
          'uppercase',
          tone === 'amber' ? 'text-amber-500' : 'text-muted-foreground'
        )}
        style={{ fontFamily: 'var(--font-pixel)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em' }}
      >
        {title}
      </span>
      {children}
    </section>
  );
}
