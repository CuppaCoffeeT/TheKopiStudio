/**
 * TaxIncomePanel — the income half of the tax calculator's inputs.
 *
 * Extracted from `TaxCalculatorPage` (W23 LOC ceiling). Fully controlled: the
 * page owns every value, so this file has no state and no maths. `earnedIncome`
 * is passed IN already computed by `assessTax`, so the FEDR readout can never
 * disagree with the assessment beside it.
 */

import { Field, Input, Switch } from '@/components/primitives/form';
import { ToolPanel, ToolSelect } from '../PlanningAtoms';
import { money } from '../../lib/format';
import type { EmploymentType } from '../../lib/taxAssessment';

/** The reference tool's FEDR options for the self-employed. */
const FEDR_OPTIONS = [
  { value: '0.6', label: '60% — most trades' },
  { value: '0.5', label: '50%' },
  { value: '0.4', label: '40%' },
  { value: '0.3', label: '30%' },
];

interface TaxIncomePanelProps {
  age: string;
  onAge: (next: string) => void;
  employment: EmploymentType;
  onEmployment: (next: EmploymentType) => void;
  grossIncome: string;
  onGrossIncome: (next: string) => void;
  otherIncome: string;
  onOtherIncome: (next: string) => void;
  useFedr: boolean;
  onUseFedr: (next: boolean) => void;
  fedrRate: string;
  onFedrRate: (next: string) => void;
  /** Post-FEDR trade income, computed by `assessTax`. */
  earnedIncome: number;
}

export function TaxIncomePanel({
  age, onAge, employment, onEmployment, grossIncome, onGrossIncome,
  otherIncome, onOtherIncome, useFedr, onUseFedr, fedrRate, onFedrRate, earnedIncome,
}: TaxIncomePanelProps) {
  const selfEmployed = employment === 'selfEmployed';

  return (
<ToolPanel label="Income" testId="tax-income-panel">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <Field label="Age">
      <Input
        type="number"
        min={16}
        max={100}
        value={age}
        onChange={(e) => onAge(e.target.value)}
        className="pointer-coarse:text-[16px]"
        data-testid="tax-age"
      />
    </Field>
    <Field label="Employment">
      <ToolSelect
        value={employment}
        onChange={(next) => onEmployment(next as EmploymentType)}
        ariaLabel="Employment type"
        options={[
          { value: 'employed', label: 'Employed' },
          { value: 'selfEmployed', label: 'Self-employed' },
        ]}
        testId="tax-employment"
      />
    </Field>
    <Field
      label={selfEmployed ? 'Gross trade receipts' : 'Employment income'}
      hint="Per year, before CPF"
    >
      <Input
        type="number"
        min={0}
        value={grossIncome}
        onChange={(e) => onGrossIncome(e.target.value)}
        className="pointer-coarse:text-[16px]"
        data-testid="tax-gross-income"
      />
    </Field>
    <Field label="Other income" hint="Rental, royalties, anything not earned from work">
      <Input
        type="number"
        min={0}
        value={otherIncome}
        onChange={(e) => onOtherIncome(e.target.value)}
        className="pointer-coarse:text-[16px]"
        data-testid="tax-other-income"
      />
    </Field>
  </div>

  {selfEmployed && (
    <div className="mt-4 border-t border-[color:var(--border-soft)] pt-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={useFedr}
          onCheckedChange={onUseFedr}
          aria-label="Use the Fixed Expense Deduction Ratio"
          data-testid="tax-fedr-toggle"
        />
        <div className="min-w-0 flex-1">
          <span className="text-[13px] font-medium text-foreground">
            Fixed Expense Deduction Ratio
          </span>
          <p className="m-0 text-[11.5px] text-muted-foreground">
            Deduct a flat percentage instead of itemising actual expenses.
          </p>
        </div>
        {useFedr && (
          <ToolSelect
            value={fedrRate}
            onChange={onFedrRate}
            ariaLabel="Fixed Expense Deduction Ratio"
            options={FEDR_OPTIONS}
            className="w-[170px] flex-none"
            testId="tax-fedr-rate"
          />
        )}
      </div>
      {useFedr && (
        <p className="m-0 mt-2.5 text-[12px] text-[color:var(--fg-dim)]">
          Net trade income after FEDR:{' '}
          <strong className="font-semibold text-foreground">
            {money(earnedIncome)}
          </strong>
        </p>
      )}
    </div>
  )}
</ToolPanel>
  );
}
