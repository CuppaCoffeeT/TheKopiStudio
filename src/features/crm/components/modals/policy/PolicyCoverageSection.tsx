/**
 * Coverage fieldset (non-hospitalization): death benefit, TPD with the
 * one-shot "same as death" copy — checking copies the CURRENT death benefit
 * once (NOT reactive to later edits); unchecking keeps the copied value
 * (legacy parity) — plus CI / ECI amounts with notes.
 */

import { Checkbox } from '@/components/primitives/form';
import type { CrmPolicyInput } from '../../../types';
import { ModalSection, TextField } from '../shared';

interface PolicyCoverageSectionProps {
  value: CrmPolicyInput;
  set: (patch: Partial<CrmPolicyInput>) => void;
  coverageError?: string;
}

export function PolicyCoverageSection({ value, set, coverageError }: PolicyCoverageSectionProps) {
  const handleTpdSame = (checked: boolean) =>
    set(checked ? { tpdSameAsDeath: true, tpdCoverage: value.coverageAmount } : { tpdSameAsDeath: false });

  return (
    <ModalSection title="Coverage" testId="crm-policy-coverage-section">
      <TextField
        label="Death benefit (S$)"
        required
        type="number"
        value={value.coverageAmount}
        onChange={(v) => set({ coverageAmount: v })}
        error={coverageError}
        testId="crm-policy-coverage-input"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
        <TextField
          label="TPD coverage (S$)"
          type="number"
          value={value.tpdCoverage}
          onChange={(v) => set({ tpdCoverage: v })}
          testId="crm-policy-tpd-input"
        />
        <div className="sm:pb-2.5">
          <Checkbox
            label="Same as death benefit"
            checked={value.tpdSameAsDeath}
            onCheckedChange={handleTpdSame}
            data-testid="crm-policy-tpd-same-checkbox"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Critical illness (S$)"
          type="number"
          value={value.criticalIllnessCoverage}
          onChange={(v) => set({ criticalIllnessCoverage: v })}
          testId="crm-policy-ci-input"
        />
        <TextField
          label="CI notes"
          value={value.ciNotes}
          onChange={(v) => set({ ciNotes: v })}
          testId="crm-policy-ci-notes-input"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Early critical illness (S$)"
          type="number"
          value={value.earlyCriticalIllnessCoverage}
          onChange={(v) => set({ earlyCriticalIllnessCoverage: v })}
          testId="crm-policy-eci-input"
        />
        <TextField
          label="ECI notes"
          value={value.eciNotes}
          onChange={(v) => set({ eciNotes: v })}
          testId="crm-policy-eci-notes-input"
        />
      </div>
    </ModalSection>
  );
}
