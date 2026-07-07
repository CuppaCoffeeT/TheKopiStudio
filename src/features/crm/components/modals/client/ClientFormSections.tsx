/**
 * ClientFormModal sections — "Client relationship" + "Financial information"
 * (port map: CRM_MODULE_PRD.md § UI port map / ClientFormModal).
 *
 * Edit-mode rule (corrected legacy bug 1): "Total bank balance" is not
 * rendered in edit — the balance is managed in Bank history, whose recompute
 * owns the derived client columns. "Client since" stays editable in BOTH
 * modes (legacy parity); the blank→today default applies on add only.
 */

import type { CrmClientInput } from '../../../types';
import { DateField, ModalSection, SelectField, TextField } from '../shared';

const REVIEW_FREQUENCIES = ['Quarterly', 'Semi-Annual', 'Annual'] as const;

interface ClientSectionProps {
  isEdit: boolean;
  value: CrmClientInput;
  set: (patch: Partial<CrmClientInput>) => void;
}

export function ClientRelationshipSection({ isEdit, value, set }: ClientSectionProps) {
  return (
    <ModalSection title="Client relationship">
      <DateField
        label="Client since"
        value={value.createdDate}
        onChange={(v) => set({ createdDate: v })}
        hint={isEdit ? undefined : "Leave blank to use today's date."}
        testId="crm-client-since-input"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DateField
          label="Next review"
          value={value.nextReviewDate}
          onChange={(v) => set({ nextReviewDate: v })}
          testId="crm-client-next-review-input"
        />
        <SelectField
          label="Review frequency"
          value={value.reviewFrequency}
          onChange={(v) => set({ reviewFrequency: v })}
          options={REVIEW_FREQUENCIES}
          testId="crm-client-frequency-select"
        />
      </div>
    </ModalSection>
  );
}

export function ClientFinancialSection({ isEdit, value, set }: ClientSectionProps) {
  return (
    <ModalSection title="Financial information">
      {isEdit ? (
        <span className="text-[12px] text-muted-foreground">
          Balance is managed in Bank history
        </span>
      ) : (
        <TextField
          label="Total bank balance (S$)"
          type="number"
          value={value.totalBankBalance}
          onChange={(v) => set({ totalBankBalance: v })}
          hint="A balance above zero seeds the first bank-history entry."
          testId="crm-client-balance-input"
        />
      )}
      <div className="grid grid-cols-3 gap-3">
        <TextField
          label="CPF OA (S$)"
          type="number"
          value={value.cpfOA}
          onChange={(v) => set({ cpfOA: v })}
          testId="crm-client-cpf-oa-input"
        />
        <TextField
          label="CPF SA (S$)"
          type="number"
          value={value.cpfSA}
          onChange={(v) => set({ cpfSA: v })}
          testId="crm-client-cpf-sa-input"
        />
        <TextField
          label="CPF MA (S$)"
          type="number"
          value={value.cpfMA}
          onChange={(v) => set({ cpfMA: v })}
          testId="crm-client-cpf-ma-input"
        />
      </div>
    </ModalSection>
  );
}
