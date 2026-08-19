/**
 * ToolSelect — the tools' dropdown, and `ToolNote`, the quiet line under a tool.
 *
 * Split out of `ToolAtoms.tsx` (2026-08-19) when that file crossed the 200-LOC
 * ceiling. Both are the tools' "supporting cast" around the panels and figures.
 */

import type { ReactNode } from 'react';
import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuTrigger,
  SelectMenuValue,
} from '@/components/primitives/overlays/SelectMenu';

export interface ToolSelectOption {
  value: string;
  label: string;
}

interface ToolSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: ToolSelectOption[];
  /** Required — these selects sit inside `Field`, which renders no <label>. */
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  testId?: string;
}

/**
 * Wraps `SelectMenu` (Radix) rather than the native `Select`, which
 * `no-restricted-imports` bans app-wide — native OS dropdown chrome cannot be
 * themed to the 2a palette. Collapsing the five-part composition into one
 * options-array call keeps the tool pages readable; they use selects in five
 * places between them.
 */
export function ToolSelect({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  className,
  testId,
}: ToolSelectProps) {
  return (
    <SelectMenu value={value} onValueChange={onChange}>
      <SelectMenuTrigger aria-label={ariaLabel} className={className} data-testid={testId}>
        <SelectMenuValue placeholder={placeholder} />
      </SelectMenuTrigger>
      <SelectMenuContent>
        {options.map((option) => (
          <SelectMenuItem key={option.value} value={option.value}>
            {option.label}
          </SelectMenuItem>
        ))}
      </SelectMenuContent>
    </SelectMenu>
  );
}

/** A quiet note under a tool — assumptions, caveats, statutory references. */
export function ToolNote({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <p
      className="m-0 mt-[22px] text-[12px] leading-[1.6] text-[color:var(--fg-dim)]"
      data-testid={testId}
    >
      {children}
    </p>
  );
}
