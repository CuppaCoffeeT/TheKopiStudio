/**
 * Investment-linked fieldset: account value, allocation, illustrated values
 * at 55/65 and the ILP premium-inclusion percent (drives the annualised
 * premium scaling in lib/finance `summariseClient`).
 */

import type { CrmPolicyInput } from '../../../types';
import { ModalSection, SelectField, TextField } from '../shared';
import { ILP_PERCENT_OPTIONS } from './policyFormModel';

interface PolicyIlpSectionProps {
  value: CrmPolicyInput;
  set: (patch: Partial<CrmPolicyInput>) => void;
}

export function PolicyIlpSection({ value, set }: PolicyIlpSectionProps) {
  return (
    <ModalSection title="Investment details" testId="crm-policy-ilp-section">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Current account value (S$)"
          type="number"
          value={value.currentAccountValue}
          onChange={(v) => set({ currentAccountValue: v })}
          testId="crm-policy-account-value-input"
        />
        <TextField
          label="Investment allocation"
          value={value.investmentAllocation}
          onChange={(v) => set({ investmentAllocation: v })}
          placeholder="e.g., 70% Equity, 30% Bonds"
          testId="crm-policy-allocation-input"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Illustrated value at 55 (S$)"
          type="number"
          value={value.illustratedValueAge55}
          onChange={(v) => set({ illustratedValueAge55: v })}
          testId="crm-policy-illustrated-55-input"
        />
        <TextField
          label="Illustrated value at 65 (S$)"
          type="number"
          value={value.illustratedValueAge65}
          onChange={(v) => set({ illustratedValueAge65: v })}
          testId="crm-policy-illustrated-65-input"
        />
      </div>
      <SelectField
        label="Premium inclusion for protection"
        value={value.ilpPremiumInclusionPercent}
        onChange={(v) => set({ ilpPremiumInclusionPercent: v })}
        options={ILP_PERCENT_OPTIONS}
        testId="crm-policy-ilp-percent-select"
      />
    </ModalSection>
  );
}
