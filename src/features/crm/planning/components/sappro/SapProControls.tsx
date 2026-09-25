/**
 * The sheet's first panel: income support tier, the flat base commission
 * (hidden while each month is set separately) and the quarterly bonus rate.
 */

import { ToolPanel } from '@/components/primitives/tools';
import { SAP_RATES, SAP_TIERS, tierHint } from '../../lib/sapProCopy';
import type { SapTier } from '../../lib/sapProMath';
import { SapProChoices } from './SapProChoices';
import { SapProFlatField } from './SapProFlatField';

interface SapProControlsProps {
  tier: SapTier;
  onTier: (next: SapTier) => void;
  custom: boolean;
  flat: number;
  onFlat: (next: number) => void;
  rate: number;
  onRate: (next: number) => void;
}

const TIER_OPTIONS = SAP_TIERS.map((t) => ({ value: t.value, label: t.label, sub: t.term }));
const RATE_OPTIONS = SAP_RATES.map((r) => ({ value: r, label: `${Math.round(r * 100)}%` }));

const FIELD_LABEL = 'mb-2.5 block text-[14px] font-semibold text-foreground';
const HINT = 'm-0 mt-2.5 text-[13px] leading-[1.5] text-[color:var(--fg-dim)]';

export function SapProControls({ tier, onTier, custom, flat, onFlat, rate, onRate }: SapProControlsProps) {
  return (
    <ToolPanel label="Your inputs" testId="sap-pro-inputs">
      <div className="space-y-6">
        <div>
          <span className={FIELD_LABEL}>Income support tier</span>
          <SapProChoices
            options={TIER_OPTIONS}
            value={tier}
            onChange={onTier}
            label="Income support tier"
            columns="grid-cols-5"
            testId="sap-pro-tier"
          />
          <p className={HINT} data-testid="sap-pro-tier-hint">
            {tierHint(tier)}
          </p>
        </div>

        {!custom && <SapProFlatField tier={tier} flat={flat} onFlat={onFlat} />}

        <div>
          <span className={FIELD_LABEL}>Quarterly bonus rate</span>
          <SapProChoices
            options={RATE_OPTIONS}
            value={rate}
            onChange={onRate}
            label="Quarterly bonus rate"
            columns="grid-cols-4"
            testId="sap-pro-rate"
          />
          <p className={HINT}>
            Monthly bonus (BDB) is 25% of base commission. On the income support scheme, it starts from month 13.
          </p>
        </div>
      </div>
    </ToolPanel>
  );
}
