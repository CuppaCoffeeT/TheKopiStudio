/**
 * ReliefRow — one switchable relief in the tax calculator.
 *
 * The reference tool builds every row from its relief list, so this component
 * takes a `ReliefDefinition` and renders whichever control that definition's
 * `kind` implies: a stepper for per-dependant reliefs, a number input for the
 * manual ones, nothing for the auto ones. Adding a relief must never mean
 * touching this file.
 *
 * The computed amount is passed IN rather than derived here — `assessTax` owns
 * every figure, so the row can never disagree with the summary beside it.
 */

import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/primitives/form';
import { Switch } from '@/components/primitives/form';
import { Badge } from '@/components/primitives/shell/Badge';
import { cn } from '@/lib/utils';
import { money } from '../lib/format';
import type { ReliefDefinition } from '../lib/taxReliefs';
import type { ReliefEntry } from '../lib/taxAssessment';

interface ReliefRowProps {
  relief: ReliefDefinition;
  entry: ReliefEntry;
  /** Computed by `assessTax` — never recomputed locally. */
  amount: number;
  capped: boolean;
  onChange: (next: ReliefEntry) => void;
}

export function ReliefRow({ relief, entry, amount, capped, onChange }: ReliefRowProps) {
  const showStepper =
    relief.kind === 'quantity' || relief.kind === 'wmcrFixed' || relief.kind === 'wmcrPercentage';
  const maxQuantity = relief.maxQuantity ?? 8;

  const step = (delta: number) =>
    onChange({
      ...entry,
      quantity: Math.min(maxQuantity, Math.max(1, entry.quantity + delta)),
    });

  return (
    <div
      className="flex items-center gap-3 border-b border-[color:var(--border-soft)] py-3 last:border-b-0"
      data-testid={`tax-relief-${relief.id}`}
    >
      <Switch
        checked={entry.on}
        disabled={relief.locked}
        onCheckedChange={(checked) => onChange({ ...entry, on: checked })}
        aria-label={relief.name}
        data-testid={`tax-relief-${relief.id}-toggle`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-medium text-foreground">{relief.name}</span>
          {relief.kind === 'auto' && (
            <Badge tone="accent" dot={false} className="flex-none">
              auto
            </Badge>
          )}
          {capped && (
            <Badge tone="warning" dot={false} className="flex-none">
              Capped
            </Badge>
          )}
        </div>
        <p className="m-0 mt-0.5 text-[11.5px] leading-tight text-muted-foreground">
          {relief.hint}
        </p>
      </div>

      {showStepper && entry.on && (
        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            aria-label={`Fewer — ${relief.name}`}
            onClick={() => step(-1)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border border-border bg-popover',
              'text-foreground transition-colors hover:bg-[color:var(--row-hover)]',
              'focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]',
              'pointer-coarse:h-11 pointer-coarse:w-11',
            )}
            data-testid={`tax-relief-${relief.id}-minus`}
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
          </button>
          <span
            className="w-6 text-center text-[13px] tabular-nums text-foreground"
            data-testid={`tax-relief-${relief.id}-qty`}
          >
            {entry.quantity}
          </span>
          <button
            type="button"
            aria-label={`More — ${relief.name}`}
            onClick={() => step(1)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border border-border bg-popover',
              'text-foreground transition-colors hover:bg-[color:var(--row-hover)]',
              'focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]',
              'pointer-coarse:h-11 pointer-coarse:w-11',
            )}
            data-testid={`tax-relief-${relief.id}-plus`}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}

      {relief.kind === 'manual' && entry.on && (
        <Input
          type="number"
          min={0}
          max={relief.cap}
          inputMode="decimal"
          className="w-[110px] flex-none text-[13px] pointer-coarse:text-[16px]"
          value={entry.manualAmount === 0 ? '' : String(entry.manualAmount)}
          placeholder="0"
          aria-label={`${relief.name} amount`}
          onChange={(event) =>
            onChange({ ...entry, manualAmount: Number(event.target.value) || 0 })
          }
          data-testid={`tax-relief-${relief.id}-amount`}
        />
      )}

      <span
        className={cn(
          'w-[86px] flex-none text-right text-[13px] tabular-nums',
          amount === 0 ? 'text-muted-foreground' : 'font-medium text-foreground',
        )}
        data-testid={`tax-relief-${relief.id}-value`}
      >
        {money(amount)}
      </span>
    </div>
  );
}
