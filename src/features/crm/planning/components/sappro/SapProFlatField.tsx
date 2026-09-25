/**
 * "Base commission per month" — ±$250 stepper, typed field, $0–15,000 slider
 * and four presets, all bound to one flat amount, plus the payout hint.
 *
 * The typed field keeps its own draft, as the sheet's input does: typing
 * "1234.6" commits 1,235 but leaves what was typed on screen. Every other
 * control writes both. Typing above $15,000 is allowed; the slider just pins.
 */

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { money } from '../../lib/format';
import { payHint, SAP_PRESETS, SAP_SLIDER_MAX, SAP_STEP } from '../../lib/sapProCopy';
import { parseAmount, type SapTier } from '../../lib/sapProMath';

interface SapProFlatFieldProps {
  tier: SapTier;
  flat: number;
  onFlat: (next: number) => void;
}

const STEP_BUTTON =
  'inline-flex h-12 w-12 flex-none items-center justify-center rounded-lg border border-border bg-popover text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function SapProFlatField({ tier, flat, onFlat }: SapProFlatFieldProps) {
  const [draft, setDraft] = useState(String(flat));
  const set = (value: number | string) => {
    const next = parseAmount(value);
    setDraft(String(next));
    onFlat(next);
  };
  const hint = payHint(tier, flat, false);

  return (
    <div data-testid="sap-pro-flat">
      <label htmlFor="sap-pro-flat-input" className="mb-2.5 block text-[14px] font-semibold text-foreground">
        Base commission per month
      </label>
      <div className="flex items-center gap-2">
        <button type="button" className={STEP_BUTTON} aria-label="Decrease by 250" onClick={() => set(flat - SAP_STEP)}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="flex h-12 min-w-0 flex-1 items-center rounded-lg border border-border bg-popover px-3 focus-within:ring-2 focus-within:ring-ring">
          <span className="font-semibold text-muted-foreground" aria-hidden="true">
            $
          </span>
          <input
            id="sap-pro-flat-input"
            type="number"
            inputMode="numeric"
            min={0}
            step={SAP_STEP}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              onFlat(parseAmount(event.target.value));
            }}
            className="w-full min-w-0 border-0 bg-transparent px-1.5 text-[22px] font-semibold text-foreground tabular-nums outline-none"
            data-testid="sap-pro-flat-input"
          />
        </div>
        <button type="button" className={STEP_BUTTON} aria-label="Increase by 250" onClick={() => set(flat + SAP_STEP)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={SAP_SLIDER_MAX}
        step={SAP_STEP}
        value={Math.min(flat, SAP_SLIDER_MAX)}
        onChange={(event) => set(event.target.value)}
        aria-label="Base commission slider"
        className="mb-1 mt-3.5 h-7 w-full accent-[color:var(--brand-brown)]"
      />
      <div className="flex flex-wrap gap-1.5">
        {SAP_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => set(preset)}
            className="min-h-11 rounded-full border border-border bg-popover px-3 text-[13px] font-semibold text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {money(preset)}
          </button>
        ))}
      </div>
      {hint && (
        <p
          className={cn(
            'm-0 mt-2.5 text-[13px] leading-[1.5]',
            hint.warn ? 'text-[color:var(--negative-text)]' : 'text-[color:var(--fg-dim)]',
          )}
          aria-live="polite"
          data-testid="sap-pro-pay-hint"
        >
          {hint.text}
        </p>
      )}
    </div>
  );
}
