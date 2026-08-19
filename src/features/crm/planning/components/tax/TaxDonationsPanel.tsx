/**
 * TaxDonationsPanel — cash donations to approved IPCs.
 *
 * Split out of `TaxCalculatorPage` (LOC ceiling) when the page gained its save
 * bar. Fully controlled, like the other tax panels: the page owns the value and
 * the assessment, so this cannot hold a second opinion about either.
 */

import { Field, Input } from '@/components/primitives/form';
import { ToolPanel } from '@/components/primitives/tools';
import { money } from '../../lib/format';

interface TaxDonationsPanelProps {
  value: string;
  onChange: (next: string) => void;
  /** The 2.5× deduction the assessment derived; hidden when nothing was given. */
  deduction: number;
}

export function TaxDonationsPanel({ value, onChange, deduction }: TaxDonationsPanelProps) {
  return (
    <ToolPanel label="Donations" testId="tax-donations-panel">
      <Field label="Cash donations to approved IPCs" hint="Deducted at 2.5× the amount given">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pointer-coarse:text-[16px]"
          data-testid="tax-donations"
        />
      </Field>
      {deduction > 0 && (
        <p className="m-0 mt-2.5 text-[12px] text-[color:var(--fg-dim)]">
          Deduction:{' '}
          <strong className="font-semibold text-foreground">{money(deduction)}</strong>
        </p>
      )}
    </ToolPanel>
  );
}
