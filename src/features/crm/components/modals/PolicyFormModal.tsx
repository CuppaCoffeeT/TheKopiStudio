/**
 * PolicyFormModal — add/edit one policy for a client (FORM archetype,
 * legacy parity per CRM_MODULE_PRD.md port map).
 *
 * Conditional sections: selecting type 'Hospitalization' one-way forces
 * premium/coverage to '0' and swaps the coverage/cash-value/ILP fieldsets
 * for the amber hospital section; switching away leaves '0' editable.
 * Hidden-section SCALAR state is retained and persisted regardless of the
 * toggles (legacy parity), but projections are gated on submit exactly as
 * legacy PolicyFormModal.jsx: 'Has cash value' unchecked saves [] (clearing
 * stored projections); incomplete projection rows are dropped on save.
 */

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/primitives/form';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { useCreatePolicy, useUpdatePolicy } from '../../hooks/usePolicyMutations';
import type { CrmPolicy, CrmPolicyInput } from '../../types';
import { SelectField, TextField } from './shared';
import {
  EMPTY_POLICY,
  PREMIUM_FREQUENCIES,
  fromProjectionRows,
  toProjectionRows,
  validatePolicy,
  type PolicyErrors,
  type ProjectionRow,
} from './policy/policyFormModel';
import { PolicyCashValueSection } from './policy/PolicyCashValueSection';
import { PolicyCoreFields } from './policy/PolicyCoreFields';
import { PolicyCoverageSection } from './policy/PolicyCoverageSection';
import { PolicyHospitalSection } from './policy/PolicyHospitalSection';
import { PolicyIlpSection } from './policy/PolicyIlpSection';

interface PolicyFormModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  clientId: string;
  /** Present → edit mode; absent → add mode. */
  policy?: CrmPolicy;
}

function toInput(policy: CrmPolicy): CrmPolicyInput {
  const { id: _id, ...input } = policy;
  return input;
}

export function PolicyFormModal({ open, onOpenChange, clientId, policy }: PolicyFormModalProps) {
  const isEdit = !!policy;
  const [form, setForm] = useState<CrmPolicyInput>(EMPTY_POLICY);
  const [rows, setRows] = useState<ProjectionRow[]>([{ age: '', value: '' }]);
  const [errors, setErrors] = useState<PolicyErrors>({});
  const createPolicy = useCreatePolicy(clientId);
  const updatePolicy = useUpdatePolicy(clientId);
  const saving = createPolicy.isPending || updatePolicy.isPending;

  // Re-seed the form each time the modal opens (cancelled edits never leak).
  useEffect(() => {
    if (open) {
      setForm(policy ? toInput(policy) : EMPTY_POLICY);
      setRows(toProjectionRows(policy?.projectedCashValue ?? []));
      setErrors({});
    }
  }, [open, policy]);

  /** Patch the form and clear inline errors for any field the patch touches. */
  const set = (patch: Partial<CrmPolicyInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const touched = (Object.keys(patch) as Array<keyof PolicyErrors>).filter((key) => e[key]);
      if (touched.length === 0) return e;
      const next = { ...e };
      touched.forEach((key) => delete next[key]);
      return next;
    });
  };

  /** One-way Hospitalization force: premium/coverage '0' (not restored on switch-away). */
  const handleTypeChange = (type: string) =>
    set(
      type === 'Hospitalization'
        ? { type, isHospitalization: true, premium: '0', coverageAmount: '0' }
        : { type, isHospitalization: false }
    );

  const handleSubmit = () => {
    const next = validatePolicy(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // Legacy payload gate: hasCashValue=false clears stored projections on save.
    const input: CrmPolicyInput = {
      ...form,
      projectedCashValue: form.hasCashValue ? fromProjectionRows(rows) : [],
    };
    const options = { onSuccess: () => onOpenChange(false) };
    if (policy) updatePolicy.mutate({ policyId: policy.id, input }, options);
    else createPolicy.mutate(input, options);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit policy' : 'Add policy'}
      description={
        policy ? `Update policy ${policy.policyNumber || policy.type}.` : 'Record a policy for this client.'
      }
      size="xl"
      tall
      bodyClassName="px-5 py-4 grid gap-3 overflow-y-auto flex-1"
      onInteractOutside={(e) => {
        if (saving) e.preventDefault();
      }}
      testId="crm-policy-form-modal"
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)} data-testid="crm-policy-cancel-btn">
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction onClick={handleSubmit} disabled={saving} data-testid="crm-policy-save-btn">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add policy'}
          </ModalPrimaryAction>
        </>
      }
    >
      <PolicyCoreFields value={form} set={set} errors={errors} onTypeChange={handleTypeChange} />

      {form.isHospitalization ? (
        <PolicyHospitalSection value={form} set={set} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              label="Premium (S$)"
              required
              type="number"
              value={form.premium}
              onChange={(v) => set({ premium: v })}
              error={errors.premium}
              testId="crm-policy-premium-input"
            />
            <SelectField
              label="Frequency"
              required
              value={form.frequency}
              onChange={(v) => set({ frequency: v })}
              options={PREMIUM_FREQUENCIES}
              testId="crm-policy-frequency-select"
            />
          </div>
          <PolicyCoverageSection value={form} set={set} coverageError={errors.coverageAmount} />
          <Checkbox
            label="Has cash value"
            checked={form.hasCashValue}
            onCheckedChange={(checked) => set({ hasCashValue: checked })}
            data-testid="crm-policy-has-cash-value-checkbox"
          />
          {form.hasCashValue && (
            <PolicyCashValueSection
              currentCashValue={form.currentCashValue}
              onCurrentCashValueChange={(v) => set({ currentCashValue: v })}
              rows={rows}
              onRowsChange={setRows}
            />
          )}
          <Checkbox
            label="Investment-linked policy (ILP)"
            checked={form.isInvestmentLinked}
            onCheckedChange={(checked) => set({ isInvestmentLinked: checked })}
            data-testid="crm-policy-ilp-checkbox"
          />
          {form.isInvestmentLinked && <PolicyIlpSection value={form} set={set} />}
        </>
      )}
    </Modal>
  );
}
