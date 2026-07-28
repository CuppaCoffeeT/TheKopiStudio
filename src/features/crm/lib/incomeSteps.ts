/**
 * A customer's expected future earnings, as three life stages.
 *
 * Split from `cpfContributions.ts` (W23 LOC ceiling) along a real seam: this
 * is what the CUSTOMER told us about their career, and the CPF simulation is
 * one consumer of it. Anything else that needs to know "what will they earn at
 * 47?" reads it from here rather than re-deriving it from nine flat columns.
 */

/** One stage of expected future earnings. Ages are INCLUSIVE at both ends. */
export interface IncomeStep {
  annualIncome: number;
  startAge: number;
  endAge: number;
}

/**
 * Income at a given age, from the customer's steps.
 *
 * First matching step wins, and a step only counts when it carries a positive
 * income — the CRM stores three fixed slots, most of them blank, so "defined"
 * has to mean "has money in it", not "the column exists". No match means no
 * income, therefore no contribution: a gap between steps is a real career
 * break, not something to interpolate over.
 */
export function incomeForAge(steps: readonly IncomeStep[], age: number): number {
  for (const step of steps) {
    if (step.annualIncome > 0 && age >= step.startAge && age <= step.endAge) {
      return step.annualIncome;
    }
  }
  return 0;
}

/**
 * Read the three CRM income-step slots into a list.
 *
 * The CRM stores them as nine flat columns; everything downstream wants a list.
 * Slots with no income or no age range are dropped here rather than being
 * carried as zero-value steps that `incomeForAge` would have to skip anyway.
 */
export function incomeStepsFromClient(client: {
  futureIncomeStep1?: string | number | null;
  futureIncomeStartAge1?: string | number | null;
  futureIncomeEndAge1?: string | number | null;
  futureIncomeStep2?: string | number | null;
  futureIncomeStartAge2?: string | number | null;
  futureIncomeEndAge2?: string | number | null;
  futureIncomeStep3?: string | number | null;
  futureIncomeStartAge3?: string | number | null;
  futureIncomeEndAge3?: string | number | null;
}): IncomeStep[] {
  const slots: [unknown, unknown, unknown][] = [
    [client.futureIncomeStep1, client.futureIncomeStartAge1, client.futureIncomeEndAge1],
    [client.futureIncomeStep2, client.futureIncomeStartAge2, client.futureIncomeEndAge2],
    [client.futureIncomeStep3, client.futureIncomeStartAge3, client.futureIncomeEndAge3],
  ];

  const steps: IncomeStep[] = [];
  for (const [income, start, end] of slots) {
    const annualIncome = Number(income) || 0;
    const startAge = Number(start) || 0;
    const endAge = Number(end) || 0;
    if (annualIncome > 0 && startAge > 0 && endAge >= startAge) {
      steps.push({ annualIncome, startAge, endAge });
    }
  }
  return steps;
}
