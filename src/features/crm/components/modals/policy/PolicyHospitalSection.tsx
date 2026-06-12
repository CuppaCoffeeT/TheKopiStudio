/**
 * Hospitalization fieldset (amber, legacy parity): ward class + integrated
 * shield premium portions. Premium/coverage are force-set to '0' by the
 * type switch in PolicyFormModal — the cash portions live here instead.
 */

import type { CrmPolicyInput } from '../../../types';
import { ModalSection, SelectField, TextField } from '../shared';
import { HOSPITAL_TYPES } from './policyFormModel';

interface PolicyHospitalSectionProps {
  value: CrmPolicyInput;
  set: (patch: Partial<CrmPolicyInput>) => void;
}

export function PolicyHospitalSection({ value, set }: PolicyHospitalSectionProps) {
  return (
    <ModalSection title="Hospitalization details" tone="amber" testId="crm-policy-hospital-section">
      <SelectField
        label="Hospital coverage type"
        required
        value={value.hospitalType}
        onChange={(v) => set({ hospitalType: v })}
        options={HOSPITAL_TYPES}
        testId="crm-policy-hospital-type-select"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Integrated Shield — CPF (S$)"
          type="number"
          value={value.integratedShieldCPF}
          onChange={(v) => set({ integratedShieldCPF: v })}
          testId="crm-policy-shield-cpf-input"
        />
        <TextField
          label="Integrated Shield — cash (S$)"
          type="number"
          value={value.integratedShieldCash}
          onChange={(v) => set({ integratedShieldCash: v })}
          testId="crm-policy-shield-cash-input"
        />
      </div>
      <TextField
        label="Rider — cash (S$)"
        type="number"
        value={value.riderCash}
        onChange={(v) => set({ riderCash: v })}
        testId="crm-policy-rider-cash-input"
      />
    </ModalSection>
  );
}
