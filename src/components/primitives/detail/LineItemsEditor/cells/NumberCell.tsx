/**
 * Line-item cell atoms — read-only `Cell`, editable `NumberCell`, the
 * full-height `EditableCellWrap` click-delegator, and the mobile `MobileField`
 * label wrapper. Extracted from the former single-file primitive
 * (2026-05-31 sub-module split). Behaviour unchanged.
 */

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function Cell({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <div
      className={cn(
        'flex items-center px-2 py-1 rounded text-[12.5px] text-muted-foreground tabular-nums',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children ?? ' '}
    </div>
  );
}

/**
 * EditableCellWrap — full-height click delegator for editable line-item cells.
 *
 * Standard interaction (locked across all editable LineItem cells, 2026-04-27):
 *  - `kind="number"` cells (qty · price · tax) — clicking anywhere in the cell focuses the inner `<input>`.
 *  - `kind="dropdown"` cells (unit · product picker · etc.) — clicking anywhere in the cell forwards
 *    the click to the inner trigger (any `<button>` or input · whichever comes first), opening the
 *    dropdown. No "click the tiny chevron" UX.
 *
 * Visual: full row-height target, subtle `hover:bg-secondary` tint to telegraph clickability.
 * Cursor: `text` for number cells, `pointer` for dropdown cells.
 */
export function EditableCellWrap({ kind, children }: { kind: 'number' | 'dropdown'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'group/cell w-full h-full min-h-[32px] flex items-center justify-center rounded',
        'hover:bg-secondary',
        'transition-colors duration-100',
        kind === 'number' ? 'cursor-text' : 'cursor-pointer'
      )}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return; // let inner controls handle their own clicks
        const root = e.currentTarget as HTMLElement;
        if (kind === 'number') {
          const input = root.querySelector('input') as HTMLInputElement | null;
          if (input && document.activeElement !== input) {
            input.focus();
            input.select();
          }
          return;
        }
        // dropdown — forward click to first trigger button (or input fallback)
        const trigger = (root.querySelector('button, [role="combobox"], input') as HTMLElement | null);
        if (trigger) trigger.click();
      }}
    >
      <div className="w-full">{children}</div>
    </div>
  );
}

interface NumberCellProps {
  value: number | null | undefined;
  onCommit: (value: number | null) => void;
  step?: number;
  min?: number;
  align?: 'left' | 'right' | 'center';
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  dense?: boolean;
  /** Optional stable test id stamped on the inner `<input>` (opt-in via `fieldTestId`). */
  testId?: string;
}

export function NumberCell({ value, onCommit, step = 1, min, align = 'right', prefix, suffix, placeholder, dense = false, testId }: NumberCellProps) {
  const [raw, setRaw] = useState<string>(value === null || value === undefined ? '' : String(value));

  // Sync when value changes externally
  const lastExternal = useRef(value);
  if (lastExternal.current !== value) {
    lastExternal.current = value;
    const next = value === null || value === undefined ? '' : String(value);
    if (next !== raw) setRaw(next);
  }

  const commit = (next: string) => {
    if (next === '') { onCommit(null); return; }
    const parsed = parseFloat(next);
    if (Number.isNaN(parsed)) return;
    onCommit(min !== undefined ? Math.max(min, parsed) : parsed);
  };

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>{prefix}</span>
      )}
      <input
        type="number"
        step={step}
        min={min}
        value={raw}
        placeholder={placeholder}
        data-testid={testId}
        onChange={(e) => { setRaw(e.target.value); commit(e.target.value); }}
        onFocus={(e) => e.currentTarget.select()}
        className={cn(
          'w-full bg-transparent outline-none rounded',
          dense ? 'h-7 text-[12px]' : 'h-7 text-[12.5px]',
          'tabular-nums text-muted-foreground',
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
          prefix ? 'pl-5' : 'pl-2',
          suffix ? 'pr-5' : 'pr-2',
          // Focus: full-opacity brown ring (4.58:1 on card — an alpha ring
          // composites under SC 1.4.11's 3:1) + raised white input surface.
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-popover',
          '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]',
        )}
        style={{ fontFamily: 'var(--font-mono)' }}
      />
      {suffix && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none" style={{ fontFamily: 'var(--font-mono)' }}>{suffix}</span>
      )}
    </div>
  );
}

export function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="text-[9.5px] font-semibold uppercase tracking-widest text-muted-foreground"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      <div className="border border-border rounded overflow-hidden">
        {children}
      </div>
    </div>
  );
}
