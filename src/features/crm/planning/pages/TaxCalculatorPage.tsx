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
 * PERSISTS SINCE 2026-08-19. It used to say "nothing here is saved" — the
 * advisor asked for the opposite, because re-typing a customer's reliefs at
 * every review is how they go stale. Save is EXPLICIT: editing still changes
 * nothing until the button is clicked, so the tool is a scratch pad right up
 * to that point. What lands is the income, the reliefs and the donations;
 * `age` is derived from the date of birth and is deliberately not written back.
 */

import { useMemo, useState } from 'react';
import { currentRefYear } from '../../lib/finance';
import type { CrmClient } from '../../types';
import { PlanningToolFrame } from '../components/PlanningToolFrame';
import { ToolNote, ToolPanel } from '@/components/primitives/tools';
import { ToolSaveBar } from '../components/ToolSaveBar';
import { useSaveTaxProfile } from '../hooks/usePlanningProfile';
import { seedAge } from '../lib/customerSeed';
import { money } from '../lib/format';
import { ReliefRow } from '../components/ReliefRow';
import { TaxIncomePanel } from '../components/tax/TaxIncomePanel';
import { TaxStatsRow } from '../components/tax/TaxStatsRow';
import { TaxDonationsPanel } from '../components/tax/TaxDonationsPanel';
import { TaxSummaryPanel } from '../components/tax/TaxSummaryPanel';
import { RELIEFS } from '../lib/taxReliefs';
import {
  assessTax,
  defaultReliefState,
  reliefApplies,
  type EmploymentType,
  type ReliefState,
} from '../lib/taxAssessment';

interface TaxCalculatorProps {
  customer: CrmClient;
  customerId: string | null;
  isOwn: boolean;
  ownerId: string | null;
}

function TaxCalculator({ customer, customerId, isOwn, ownerId }: TaxCalculatorProps) {
  const refYear = currentRefYear();
  const saved = customer.tax;
  const save = useSaveTaxProfile(customerId, ownerId);

  // Seeds read the customer's LAST SAVED calculation and fall back to the
  // statutory default. `''`/null means this tool has never been saved for them,
  // which is why every fallback below is the same value the tool opened on
  // before it persisted anything.
  const [age, setAge] = useState(() => String(seedAge(customer.dateOfBirth, refYear)));
  const [employment, setEmployment] = useState<EmploymentType>(() =>
    saved.employmentType === 'selfEmployed' ? 'selfEmployed' : 'employed',
  );
  const [grossIncome, setGrossIncome] = useState(() => customer.annualIncome || '');
  const [otherIncome, setOtherIncome] = useState(() => saved.otherIncome);
  const [useFedr, setUseFedr] = useState(saved.useFedr);
  const [fedrRate, setFedrRate] = useState(() => saved.fedrRate || '0.6');
  const [donations, setDonations] = useState(() => saved.donations);
  const [reliefs, setReliefs] = useState<ReliefState>(() => ({
    // Spread the defaults UNDER the saved state so a relief added to the
    // catalogue since the last save still appears, rather than reading
    // `undefined` into `ReliefRow`.
    ...defaultReliefState(),
    ...(saved.reliefs ?? {}),
  }));

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

  const lineFor = (id: string) => assessment.lines.find((line) => line.id === id);

  const handleSave = () => {
    save.mutate({
      annualIncome: grossIncome,
      employmentType: employment,
      otherIncome,
      donations,
      useFedr,
      fedrRate,
      reliefs,
    });
  };

  return (
    <div className="flex flex-col gap-[22px]">
      <TaxStatsRow assessment={assessment} />

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

          <TaxDonationsPanel
            value={donations}
            onChange={setDonations}
            deduction={assessment.donationDeduction}
          />
        </div>

        <TaxSummaryPanel assessment={assessment} />
      </div>

      <ToolSaveBar
        testId="tax-save"
        customerName={customer.name}
        customerId={customerId}
        isOwn={isOwn}
        savedAt={saved.savedAt}
        saving={save.isPending}
        onSave={handleSave}
        label="Save to customer"
        blankHint="Nothing is saved until you pick a customer — until then this is a scratch pad."
      />

      <ToolNote testId="tax-save-scope">
        Saving stores the income, reliefs and donations on the customer’s record, ready to pre-fill
        next time. Age comes from their date of birth and is not overwritten here.
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
      {/* Keyed on the customer so switching re-seeds `useState` initialisers —
          which now includes the customer's last saved calculation. */}
      {(customer, customerId, isOwn, ownerId) => (
        <TaxCalculator
          key={customerId ?? 'blank'}
          customer={customer}
          customerId={customerId}
          isOwn={isOwn}
          ownerId={ownerId}
        />
      )}
    </PlanningToolFrame>
  );
}
