/**
 * /tools/shield-comparison — Singlife Shield Plan 1 + Health Plus Private
 * against Enhanced IncomeShield Preferred + Optima Care, private tier only.
 *
 * Tool 07. Ported 2026-09-24 from the advisor's standalone
 * `shield-comparison.html`, figure for figure — `lib/__tests__/shield.test.ts`
 * locks the port against that sheet's own arithmetic.
 *
 * Opens with OR without a customer. With one, the age opens at their age NEXT
 * birthday (what both insurers price on); without, at the sheet's own 36.
 * Nothing is saved: this is a conversation aid, and the premiums it quotes are
 * published tables, not the customer's data.
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/overlays/Tabs';
import { getLocalDateString } from '@/utils/timezoneUtils';
import { PlanningToolFrame } from '../components/PlanningToolFrame';
import { ShieldByAgeTab } from '../components/shield/ShieldByAgeTab';
import { ShieldCancerTab } from '../components/shield/ShieldCancerTab';
import { ShieldCompareTab } from '../components/shield/ShieldCompareTab';
import { ShieldEverydayTab } from '../components/shield/ShieldEverydayTab';
import { ShieldFitTab } from '../components/shield/ShieldFitTab';
import { ShieldNotesTab } from '../components/shield/ShieldNotesTab';
import { ShieldPremiumTab } from '../components/shield/ShieldPremiumTab';
import { FIT_QUESTIONS, type FitAnswers } from '../lib/shieldFit';
import { ageNextBirthday, SHIELD_DEFAULT_AGE, shieldPremium } from '../lib/shieldPremium';

const TABS = [
  ['premium', 'Premium'],
  ['byage', 'By age'],
  ['everyday', 'Everyday claims'],
  ['cancer', 'Cancer'],
  ['fit', 'Fit finder'],
  ['compare', 'Compare'],
  ['notes', 'Notes'],
] as const;

function ShieldComparison({ dateOfBirth }: { dateOfBirth: string | null | undefined }) {
  const [age, setAge] = useState(
    () => ageNextBirthday(dateOfBirth, getLocalDateString(new Date())) ?? SHIELD_DEFAULT_AGE,
  );
  const [answers, setAnswers] = useState<FitAnswers>(() => FIT_QUESTIONS.map(() => null));
  const premium = shieldPremium(age);

  const answer = (question: number, option: number | null) =>
    setAnswers((prev) => prev.map((value, index) => (index === question ? option : value)));

  return (
    <Tabs defaultValue="premium" data-testid="shield-tabs">
      <TabsList className="mb-6 w-full">
        {TABS.map(([value, label]) => (
          <TabsTrigger key={value} value={value} data-testid={`shield-tab-${value}`}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="premium">
        <ShieldPremiumTab age={age} onAge={setAge} premium={premium} />
      </TabsContent>
      <TabsContent value="byage">
        <ShieldByAgeTab age={age} />
      </TabsContent>
      <TabsContent value="everyday">
        <ShieldEverydayTab />
      </TabsContent>
      <TabsContent value="cancer">
        <ShieldCancerTab />
      </TabsContent>
      <TabsContent value="fit">
        <ShieldFitTab answers={answers} onAnswer={answer} age={age} premium={premium} />
      </TabsContent>
      <TabsContent value="compare">
        <ShieldCompareTab />
      </TabsContent>
      <TabsContent value="notes">
        <ShieldNotesTab />
      </TabsContent>
    </Tabs>
  );
}

export default function ShieldComparisonPage() {
  return (
    <PlanningToolFrame
      index="07"
      title="Shield comparison"
      description="Singlife against Income on the private tier — premiums by age, claims, cancer cover and fit."
      testId="shield-comparison"
      activityTool="shield-comparison"
      blankHint="No customer chosen — prices open at age 36. Pick one to start at their age next birthday."
    >
      {/* Keyed on the customer so switching re-seeds the age from their DOB. */}
      {(customer, customerId) => (
        <ShieldComparison key={customerId ?? 'blank'} dateOfBirth={customer.dateOfBirth} />
      )}
    </PlanningToolFrame>
  );
}
