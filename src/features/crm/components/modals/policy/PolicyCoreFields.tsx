/**
 * Policy core fields — type / provider / policy number / dates / status,
 * shared by add + edit. The type select routes through `onTypeChange` so
 * PolicyFormModal can apply the one-way Hospitalization force (premium and
 * coverage set to '0', amber section swap).
 */

import type { CrmPolicyInput } from '../../../types';
import { DateField, SelectField, TextField } from '../shared';
import { POLICY_STATUSES, POLICY_TYPES, type PolicyErrors } from './policyFormModel';

interface PolicyCoreFieldsProps {
  value: CrmPolicyInput;
  set: (patch: Partial<CrmPolicyInput>) => void;
  errors: PolicyErrors;
  onTypeChange: (type: string) => void;
}

export function PolicyCoreFields({ value, set, errors, onTypeChange }: PolicyCoreFieldsProps) {
  return (
    <>
      <SelectField
        label="Policy type"
        required
        value={value.type}
        onChange={onTypeChange}
        options={POLICY_TYPES}
        error={errors.type}
        placeholder="Select type…"
        testId="crm-policy-type-select"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Provider"
          required
          value={value.provider}
          onChange={(v) => set({ provider: v })}
          error={errors.provider}
          placeholder="AIA, Great Eastern…"
          testId="crm-policy-provider-input"
        />
        <TextField
          label="Policy number"
          required
          value={value.policyNumber}
          onChange={(v) => set({ policyNumber: v })}
          error={errors.policyNumber}
          testId="crm-policy-number-input"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DateField
          label="Start date"
          required
          value={value.startDate}
          onChange={(v) => set({ startDate: v })}
          error={errors.startDate}
          testId="crm-policy-start-input"
        />
        <DateField
          label="End date"
          value={value.endDate}
          onChange={(v) => set({ endDate: v })}
          testId="crm-policy-end-input"
        />
      </div>
      <SelectField
        label="Status"
        value={value.status}
        onChange={(v) => set({ status: v })}
        options={POLICY_STATUSES}
        testId="crm-policy-status-select"
      />
    </>
  );
}
