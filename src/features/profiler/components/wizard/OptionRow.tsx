/**
 * OptionRow — one single-select answer row (radio, ≥44px tap target).
 * Extracted from `QuestionScreen` (2026-09-25) when v6's discovery screen
 * needed the same row for the money anchor and the four two-pole tracks.
 *
 * Selected tint: a DISC answer tints with its letter's hue (`tint` hex); a
 * track answer has no DISC letter and takes the brand-brown wash instead.
 * Selected text flips to the ink token — a tint drops --fg-muted to
 * 4.21–4.33:1, so the one row that must read best was the one failing.
 */

import type { ReactNode } from 'react';
import { Radio } from '@/components/primitives/form';
import { cn } from '@/lib/utils';

interface OptionRowProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  /** Hex of the DISC hue to tint with when selected; omitted → brown wash. */
  tint?: string;
  /** Right-hand marker shown only when selected (legacy `.dbg`). */
  badge?: ReactNode;
  testId: string;
}

export function OptionRow({ name, value, checked, onSelect, label, tint, badge, testId }: OptionRowProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-xl border transition-colors',
        !checked && 'border-border hover:border-muted-foreground',
        checked && !tint && 'border-accent bg-accent/10',
      )}
      style={checked && tint ? { borderColor: tint, backgroundColor: `${tint}14` } : undefined}
    >
      <Radio
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        labelClassName="flex w-full items-start gap-3 p-3 min-h-[44px] [&>span:last-child]:flex-1 [&>span:last-child]:min-w-0"
        label={
          <span className="flex w-full items-start justify-between gap-3">
            <span
              className={cn('text-[13.5px] leading-5', checked ? 'text-foreground' : 'text-muted-foreground')}
            >
              {label}
            </span>
            {checked && badge}
          </span>
        }
      />
    </div>
  );
}
