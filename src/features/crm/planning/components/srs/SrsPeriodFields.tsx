/**
 * SrsPeriodFields — the custom drawdown legs.
 *
 * Up to three periods of "take this much a year for this many years", which is
 * how a real plan is usually described: heavy while the mortgage runs, lighter
 * afterwards. Unused legs sit at zero years and contribute nothing.
 *
 * Split from `SrsWithdrawalsPanel` so that panel keeps its shape when the
 * strategy toggles — six extra inputs inline would bury the four that always
 * matter.
 */

import { Field, Input } from '@/components/primitives/form';
import type { PeriodFields } from '../../hooks/useSrsPlanner';

interface SrsPeriodFieldsProps {
  periods: PeriodFields[];
  onChange: (index: number, field: keyof PeriodFields, value: string) => void;
}

export function SrsPeriodFields({ periods, onChange }: SrsPeriodFieldsProps) {
  return (
    <div className="mt-4 border-t border-[color:var(--border-soft)] pt-4" data-testid="srs-periods">
      <p className="m-0 mb-3 text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
        Up to three legs, taken in order. Leave a leg at 0 years to skip it — the
        {' '}10-year window still caps the total.
      </p>
      <div className="flex flex-col gap-4">
        {periods.map((period, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={`Leg ${index + 1} — amount a year`}>
              <Input
                type="number"
                min={0}
                value={period.amount}
                onChange={(e) => onChange(index, 'amount', e.target.value)}
                className="pointer-coarse:text-[16px]"
                data-testid={`srs-period-amount-${index + 1}`}
              />
            </Field>
            <Field label={`Leg ${index + 1} — years`}>
              <Input
                type="number"
                min={0}
                max={10}
                value={period.years}
                onChange={(e) => onChange(index, 'years', e.target.value)}
                className="pointer-coarse:text-[16px]"
                data-testid={`srs-period-years-${index + 1}`}
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}
