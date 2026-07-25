/**
 * ObservationScreen — wizard screens 3–7 (legacy `nvHTML`): one non-verbal
 * observation group. Zero validation — ticking is optional. Toggling mirrors
 * legacy `tgNV`: an id ticked then unticked persists as `false` in the map
 * (and saves that way), while the counter counts TRUE only.
 */

import { Card } from '@/components/primitives/shell/Card';
import { Checkbox } from '@/components/primitives/form';
import { cn } from '@/lib/utils';
import { NVG, PR } from '../../lib/content';
import { DiscBadge } from './WizardAtoms';

interface ObservationScreenProps {
  /** NV group index 0–4 (screen − 3). */
  groupIndex: number;
  nv: Record<string, boolean>;
  onToggle: (id: string) => void;
}

export function ObservationScreen({ groupIndex, nv, onToggle }: ObservationScreenProps) {
  const group = NVG[groupIndex];
  const tickedCount = group.items.filter((item) => nv[item.id]).length;

  return (
    <div className="flex flex-col gap-3" data-testid={`wizard-observations-screen-${groupIndex}`}>
      {/* Section head, 2a type scale. The 22px group emoji (`group.em`) that
          used to lead this row is no longer rendered: 2a admits no
          illustration and no icon, and a colour emoji is the one mark the
          brown/neutral palette cannot absorb. The spec's own device for an
          ordered set replaces it — the Instrument Serif index numeral, one of
          brown's four sanctioned appearances. `NVG[].em` itself is left intact:
          content/observations.ts is under a frozen parity contract.
          The numeral takes --brown-text, not the comp's raw #8B6A47, because
          here it lands on the PAGE cream (4.00:1) rather than the comp's card
          cream (4.58:1). */}
      <div className="flex items-baseline gap-3 border-b border-border pb-4">
        <span
          aria-hidden="true"
          className="flex-none text-[18px] leading-none text-[color:var(--brown-text)]"
          style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
        >
          {String(groupIndex + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <h2
            className="m-0 text-[20px] leading-tight text-foreground"
            style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
          >
            {group.tt}
          </h2>
          {/* Both strings sit ABOVE the Card, i.e. on the page cream, where
              --fg-muted is 4.12:1. --fg-dim reads 6.40:1 there. */}
          <p className="m-0 mt-1 text-[12px] text-[color:var(--fg-dim)]">{group.st}</p>
        </div>
      </div>
      <p className="m-0 text-[13px] leading-5 text-[color:var(--fg-dim)]">
        Tick everything you observed.
      </p>
      <p
        className="m-0 text-[color:var(--brown-text)]"
        style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}
        data-testid="wizard-observations-count"
      >
        {tickedCount === 0
          ? 'Nothing ticked yet'
          : `${tickedCount} signal${tickedCount !== 1 ? 's' : ''} ticked`}
      </p>

      <Card padding="p-2" className="flex flex-col gap-1.5">
        {group.items.map((item) => {
          const ticked = Boolean(nv[item.id]);
          return (
            <div
              key={item.id}
              data-testid={`wizard-obs-${item.id}`}
              className={cn(
                'rounded-xl border transition-colors',
                !ticked &&
                  'border-border hover:border-muted-foreground',
              )}
              style={
                ticked
                  ? { borderColor: PR[item.d].col, backgroundColor: `${PR[item.d].col}14` }
                  : undefined
              }
            >
              <Checkbox
                checked={ticked}
                onCheckedChange={() => onToggle(item.id)}
                labelClassName="flex w-full items-start gap-3 p-3 min-h-[44px] [&>span:last-child]:flex-1 [&>span:last-child]:min-w-0"
                label={
                  <span className="flex w-full items-start justify-between gap-3">
                    <span
                      className={cn(
                        'text-[13px] leading-5',
                        ticked ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {item.t}
                    </span>
                    {ticked && <DiscBadge d={item.d} className="mt-0.5" />}
                  </span>
                }
              />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
