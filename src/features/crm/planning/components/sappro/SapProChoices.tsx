/**
 * A row of mutually exclusive toggle buttons (`aria-pressed`) — the sheet's
 * `.seg` control, used for the support tier and the quarterly bonus rate.
 * Buttons are 48px tall, over the 44px touch floor.
 */

import { cn } from '@/lib/utils';
import { CHOICE_BASE, CHOICE_OFF, CHOICE_ON } from './sapProSeries';

interface Choice<T> {
  value: T;
  label: string;
  /** Second line in small type, e.g. "24 mths". */
  sub?: string;
}

interface SapProChoicesProps<T> {
  options: readonly Choice<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Accessible name for the group — the visible label's text. */
  label: string;
  /** Tailwind grid-cols class sized to the option count. */
  columns: string;
  testId: string;
}

export function SapProChoices<T extends string | number>({
  options,
  value,
  onChange,
  label,
  columns,
  testId,
}: SapProChoicesProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('grid gap-1.5', columns)} data-testid={testId}>
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            data-testid={`${testId}-${option.value}`}
            className={cn(
              CHOICE_BASE,
              'min-h-12 px-1 py-2 text-[13.5px] leading-tight',
              pressed ? CHOICE_ON : CHOICE_OFF,
            )}
          >
            {option.label}
            {option.sub && (
              <small
                className={cn(
                  'block text-[11px] font-medium',
                  pressed ? 'text-background/80' : 'text-muted-foreground',
                )}
              >
                {option.sub}
              </small>
            )}
          </button>
        );
      })}
    </div>
  );
}
