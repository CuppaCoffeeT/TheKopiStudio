/**
 * ClientFormModal — "Retirement planning" section (2026-07-28).
 *
 * The twelve fields the reference CRM adds. They exist to feed ONE thing the
 * report could not previously do: project CPF to 55 *with future
 * contributions* (`lib/cpfContributions`). Without income steps a 35-year-old
 * and a 54-year-old with identical balances project identically, because the
 * twenty years of contributions the younger one will actually make simply do
 * not exist in the model.
 *
 * Everything here is OPTIONAL and everything degrades cleanly: a customer with
 * no steps filled in projects exactly as they did before the fields existed
 * (asserted in `lib/__tests__/cpfContributions.test.ts`). So the section leads
 * with what it buys rather than demanding completion.
 *
 * Three fixed steps, not an open-ended list, because that is what the
 * reference models and what advisors actually fill in: earning years →
 * wind-down → semi-retirement.
 */

import type { CrmClientInput } from '../../../types';
import { ModalSection, TextField } from '../shared';

interface ClientPlanningSectionProps {
  value: CrmClientInput;
  set: (patch: Partial<CrmClientInput>) => void;
}

/**
 * One income step's three inputs. Ages are inclusive at both ends.
 *
 * Every field carries its own label rather than relying on a shared column
 * header: three unlabelled number boxes are unusable with a screen reader, and
 * `TextField` requires a label by design. The stage number is carried in the
 * label text so the three rows are distinguishable out loud.
 */
function IncomeStepRow({
  index,
  income,
  startAge,
  endAge,
  onIncome,
  onStartAge,
  onEndAge,
}: {
  index: 1 | 2 | 3;
  income: string;
  startAge: string;
  endAge: string;
  onIncome: (v: string) => void;
  onStartAge: (v: string) => void;
  onEndAge: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_96px_96px] gap-3">
      <TextField
        label={`Stage ${index} income (S$)`}
        type="number"
        value={income}
        onChange={onIncome}
        testId={`crm-client-income-step${index}-input`}
      />
      <TextField
        label="From age"
        type="number"
        value={startAge}
        onChange={onStartAge}
        testId={`crm-client-income-start${index}-input`}
      />
      <TextField
        label="To age"
        type="number"
        value={endAge}
        onChange={onEndAge}
        testId={`crm-client-income-end${index}-input`}
      />
    </div>
  );
}

export function ClientPlanningSection({ value, set }: ClientPlanningSectionProps) {
  return (
    <ModalSection title="Retirement planning">
      {/* --fg-dim, matching Field's hint: this sits on ModalSection's
          --secondary tint, where --fg-muted is only 4.37:1 at 12px. */}
      <p className="m-0 text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
        All optional. Expected future earnings let the CPF projection keep paying in — without
        them it only grows today&rsquo;s balances, which understates a younger customer badly.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Personal investments (S$)"
          type="number"
          value={value.personalInvestmentValue}
          onChange={(v) => set({ personalInvestmentValue: v })}
          hint="Holdings outside CPF and outside policies."
          testId="crm-client-personal-investment-input"
        />
        <TextField
          label="Expected return (% a year)"
          type="number"
          value={value.personalInvestmentGrowthRate}
          onChange={(v) => set({ personalInvestmentGrowthRate: v })}
          testId="crm-client-personal-growth-input"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[1.5] text-foreground">
        <input
          type="checkbox"
          checked={value.includePersonalInvestmentInRetirement}
          onChange={(e) => set({ includePersonalInvestmentInRetirement: e.target.checked })}
          className="mt-0.5 h-4 w-4 flex-none accent-[color:var(--cta-primary-bg)]"
          data-testid="crm-client-include-investment-checkbox"
        />
        <span>
          Count these investments toward the retirement sum
          <span className="block text-[11.5px] text-[color:var(--fg-dim)]">
            Untick when the pot is earmarked for something else — a property deposit, school fees.
          </span>
        </span>
      </label>

      <div className="mt-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-dim)]">
          Expected future income
        </span>
        <p className="m-0 mb-2 mt-1 text-[11.5px] leading-[1.5] text-[color:var(--fg-dim)]">
          Up to three life stages. Ages include both ends; a gap between stages counts as a
          career break with no contributions.
        </p>
        <div className="flex flex-col gap-2">
          <IncomeStepRow
            index={1}
            income={value.futureIncomeStep1}
            startAge={value.futureIncomeStartAge1}
            endAge={value.futureIncomeEndAge1}
            onIncome={(v) => set({ futureIncomeStep1: v })}
            onStartAge={(v) => set({ futureIncomeStartAge1: v })}
            onEndAge={(v) => set({ futureIncomeEndAge1: v })}
          />
          <IncomeStepRow
            index={2}
            income={value.futureIncomeStep2}
            startAge={value.futureIncomeStartAge2}
            endAge={value.futureIncomeEndAge2}
            onIncome={(v) => set({ futureIncomeStep2: v })}
            onStartAge={(v) => set({ futureIncomeStartAge2: v })}
            onEndAge={(v) => set({ futureIncomeEndAge2: v })}
          />
          <IncomeStepRow
            index={3}
            income={value.futureIncomeStep3}
            startAge={value.futureIncomeStartAge3}
            endAge={value.futureIncomeEndAge3}
            onIncome={(v) => set({ futureIncomeStep3: v })}
            onStartAge={(v) => set({ futureIncomeStartAge3: v })}
            onEndAge={(v) => set({ futureIncomeEndAge3: v })}
          />
        </div>
      </div>
    </ModalSection>
  );
}
