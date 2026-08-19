/**
 * /tools/tax-calculator — Singapore resident income tax, YA 2025/2026.
 *
 * Tool 04. Opens with OR without a customer: pick one in the bar at the top and
 * age + gross income pre-fill from their record; with nobody chosen it is a
 * blank calculator, which is what a walk-in or a what-if needs.
 *
 * Every figure comes from a single `assessTax` call — the relief rows, the
 * summary ladder and the headline all read the same result object, so a row can
 * never disagree with the total beside it.
 *
 * Nothing here is persisted; the page says so, since there is no Save button.
 */

import { useMemo, useState } from 'react';
import { Field, Input, Switch } from '@/components/primitives/form';
import { currentRefYear } from '../../lib/finance';
import type { CrmClient } from '../../types';
import { PlanningToolFrame } from '../components/PlanningToolFrame';
import {
  SummaryRow,
  ToolNote,
  ToolPanel,
  ToolSelect,
  ToolStatGrid,
} from '../components/PlanningAtoms';
import { seedAge } from '../lib/customerSeed';
import { money, moneyNegative, percent } from '../lib/format';
import { ReliefRow } from '../components/ReliefRow';
import { TaxIncomePanel } from '../components/tax/TaxIncomePanel';
import { TaxSummaryPanel } from '../components/tax/TaxSummaryPanel';
import { RELIEFS } from '../lib/taxReliefs';
import {
  assessTax,
  defaultReliefState,
  reliefApplies,
  type EmploymentType,
  type ReliefState,
} from '../lib/taxAssessment';
import { RELIEF_CAP } from '../lib/singaporeTax';

/** The reference tool's FEDR options for the self-employed. */
const FEDR_OPTIONS = [
  { value: '0.6', label: '60% — most trades' },
  { value: '0.5', label: '50%' },
  { value: '0.4', label: '40%' },
  { value: '0.3', label: '30%' },
];

function TaxCalculator({ customer, named }: { customer: CrmClient; named: boolean }) {
  const refYear = currentRefYear();

  const [age, setAge] = useState(() => String(seedAge(customer.dateOfBirth, refYear)));
  const [employment, setEmployment] = useState<EmploymentType>('employed');
  const [grossIncome, setGrossIncome] = useState(() => customer.annualIncome || '');
  const [otherIncome, setOtherIncome] = useState('');
  const [useFedr, setUseFedr] = useState(false);
  const [fedrRate, setFedrRate] = useState('0.6');
  const [donations, setDonations] = useState('');
  const [reliefs, setReliefs] = useState<ReliefState>(defaultReliefState);

  const assessment = useMemo(
    () =>
      assessTax({
        age: Number(age) || 0,
        employment,
        grossIncome: Number(grossIncome) || 0,
        otherIncome: Number(otherIncome) || 0,
        useFedr,
        fedrRate: Number(fedrRate) || 0,
        donations: Number(donations) || 0,
        reliefs,
      }),
    [age, employment, grossIncome, otherIncome, useFedr, fedrRate, donations, reliefs],
  );

  const selfEmployed = employment === 'selfEmployed';
  const lineFor = (id: string) => assessment.lines.find((line) => line.id === id);

  return (
    <div className="flex flex-col gap-[22px]">
      <ToolStatGrid
        testId="tax-stats"
        stats={[
          {
            label: 'Tax payable',
            value: money(assessment.tax.net),
            hint: `after ${money(assessment.tax.rebate)} rebate`,
            testId: 'tax-stat-payable',
          },
          {
            label: 'Effective rate',
            value: percent(assessment.effectiveRate),
            hint: 'of assessable income',
            testId: 'tax-stat-rate',
          },
          {
            label: 'Reliefs applied',
            value: money(assessment.reliefsApplied),
            hint: assessment.reliefCapHit ? `capped at ${money(RELIEF_CAP)}` : 'under the cap',
            testId: 'tax-stat-reliefs',
          },
          {
            label: 'Tax saved',
            value: money(assessment.taxSaved),
            hint: 'vs no reliefs or donations',
            tone: assessment.taxSaved > 0 ? 'positive' : 'neutral',
            testId: 'tax-stat-saved',
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-[22px]">
          <TaxIncomePanel
            age={age}
            onAge={setAge}
            employment={employment}
            onEmployment={setEmployment}
            grossIncome={grossIncome}
            onGrossIncome={setGrossIncome}
            otherIncome={otherIncome}
            onOtherIncome={setOtherIncome}
            useFedr={useFedr}
            onUseFedr={setUseFedr}
            fedrRate={fedrRate}
            onFedrRate={setFedrRate}
            earnedIncome={assessment.earnedIncome}
          />

          <ToolPanel label="Reliefs" testId="tax-reliefs-panel">
            {RELIEFS.filter((relief) => reliefApplies(relief, employment)).map((relief) => {
              const line = lineFor(relief.id);
              return (
                <ReliefRow
                  key={relief.id}
                  relief={relief}
                  entry={reliefs[relief.id]}
                  amount={line?.amount ?? 0}
                  capped={line?.capped ?? false}
                  onChange={(next) => setReliefs((prev) => ({ ...prev, [relief.id]: next }))}
                />
              );
            })}
          </ToolPanel>

          <ToolPanel label="Donations" testId="tax-donations-panel">
            <Field
              label="Cash donations to approved IPCs"
              hint="Deducted at 2.5× the amount given"
            >
              <Input
                type="number"
                min={0}
                value={donations}
                onChange={(e) => setDonations(e.target.value)}
                className="pointer-coarse:text-[16px]"
                data-testid="tax-donations"
              />
            </Field>
            {assessment.donationDeduction > 0 && (
              <p className="m-0 mt-2.5 text-[12px] text-[color:var(--fg-dim)]">
                Deduction:{' '}
                <strong className="font-semibold text-foreground">
                  {money(assessment.donationDeduction)}
                </strong>
              </p>
            )}
          </ToolPanel>
        </div>

        <TaxSummaryPanel assessment={assessment} />
      </div>

      <ToolNote testId="tax-not-saved">
        Nothing on this page is saved{named ? ` to ${customer.name}’s record` : ''} — change
        anything you like.
      </ToolNote>
    </div>
  );
}

export default function TaxCalculatorPage() {
  return (
    <PlanningToolFrame
      index="04"
      title="Tax calculator"
      description="Singapore resident income tax for YA 2025/2026, relief by relief."
      testId="tax-calculator"
      activityTool="tax-calculator"
      blankHint="No customer chosen — the calculator starts blank. Pick one to pre-fill age and income."
    >
      {/* Keyed on the customer so switching re-seeds `useState` initialisers. */}
      {(customer, customerId) => (
        <TaxCalculator key={customerId ?? 'blank'} customer={customer} named={Boolean(customerId)} />
      )}
    </PlanningToolFrame>
  );
}
