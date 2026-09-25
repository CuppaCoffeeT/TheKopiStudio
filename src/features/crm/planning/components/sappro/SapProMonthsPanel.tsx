/**
 * "Set each month separately" — the switch, the fill row and the 36-month grid.
 *
 * The grid inputs are UNCONTROLLED, re-mounted on `gridVersion`: exactly the
 * sheet's `buildGrid()`, which rewrites the grid only when the switch turns on
 * or "Fill all months" runs, and otherwise leaves what was typed alone.
 */

import { useState } from 'react';
import { Switch } from '@/components/primitives/form';
import { ToolPanel } from '@/components/primitives/tools';
import { parseAmount } from '../../lib/sapProMath';
import { SAP_STEP } from '../../lib/sapProCopy';

interface SapProMonthsPanelProps {
  custom: boolean;
  flat: number;
  months: readonly number[];
  gridVersion: number;
  onToggle: (on: boolean) => void;
  onFill: (amount: number) => void;
  onMonth: (index: number, amount: number) => void;
}

const FIELD =
  'h-11 w-full rounded-lg border border-border bg-popover px-2.5 text-[14px] font-semibold text-foreground tabular-nums pointer-coarse:text-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function SapProMonthsPanel({ custom, flat, months, gridVersion, onToggle, onFill, onMonth }: SapProMonthsPanelProps) {
  const [fill, setFill] = useState('');

  const toggle = (on: boolean) => {
    if (on) setFill(String(flat));
    onToggle(on);
  };

  return (
    <ToolPanel label="Month by month" testId="sap-pro-months">
      <Switch
        checked={custom}
        onCheckedChange={toggle}
        label="Set each month separately"
        labelClassName="min-h-11 font-semibold"
        data-testid="sap-pro-custom-toggle"
      />
      <p className="m-0 mt-2 text-[13px] leading-[1.5] text-[color:var(--fg-dim)]">
        {custom
          ? 'Type a base commission for each month. Turning this off goes back to one flat amount.'
          : 'Off: every month uses the same base commission.'}
      </p>

      {custom && (
        <div className="mt-4">
          <div className="flex gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              value={fill}
              onChange={(event) => setFill(event.target.value)}
              placeholder="Amount"
              aria-label="Fill all months with amount"
              className={FIELD}
              data-testid="sap-pro-fill-input"
            />
            <button
              type="button"
              onClick={() => onFill(parseAmount(fill))}
              className="min-h-11 flex-none rounded-lg bg-[color:var(--cta-primary-bg)] px-3.5 text-[13.5px] font-semibold text-[color:var(--cta-primary-fg)] hover:bg-[color:var(--cta-primary-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              data-testid="sap-pro-fill"
            >
              Fill all months
            </button>
          </div>

          <div key={gridVersion}>
            {[0, 1, 2].map((year) => (
              <div key={year}>
                <h3 className="m-0 mb-2 mt-4 text-[14px] font-semibold text-foreground">Year {year + 1}</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 12 }, (_, k) => year * 12 + k).map((i) => (
                    <div key={i}>
                      <label htmlFor={`sap-pro-m${i}`} className="block text-[11.5px] text-[color:var(--fg-dim)]">
                        Month {i + 1}
                      </label>
                      <input
                        id={`sap-pro-m${i}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={SAP_STEP}
                        defaultValue={months[i]}
                        onChange={(event) => onMonth(i, parseAmount(event.target.value))}
                        className={FIELD}
                        data-testid={`sap-pro-month-${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
