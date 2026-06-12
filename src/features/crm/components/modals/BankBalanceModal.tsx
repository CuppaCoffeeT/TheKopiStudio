/**
 * BankBalanceModal — add/edit one bank-balance history record (FORM
 * archetype, legacy parity per CRM_MODULE_PRD.md port map). The client's
 * derived `total_bank_balance` / `last_review_date` recompute happens in
 * bankService after every mutation (corrected legacy bugs 2+3) — this form
 * only captures the row.
 */

import { useEffect, useState } from 'react';
import { Field, Textarea } from '@/components/primitives/form';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { useCreateBankRecord, useUpdateBankRecord } from '../../hooks/useBankMutations';
import type { CrmBankRecord, CrmBankRecordInput } from '../../types';
import { todayDateString } from './dateStrings';
import { DateField, TextField } from './shared';

type BankErrors = Partial<Record<'date' | 'balance' | 'notes', string>>;

interface BankBalanceModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  clientId: string;
  /** Present → edit mode; absent → add mode. */
  record?: CrmBankRecord;
}

function emptyRecord(): CrmBankRecordInput {
  return { date: todayDateString(), balance: '', notes: '' };
}

export function BankBalanceModal({ open, onOpenChange, clientId, record }: BankBalanceModalProps) {
  const isEdit = !!record;
  const [form, setForm] = useState<CrmBankRecordInput>(emptyRecord);
  const [errors, setErrors] = useState<BankErrors>({});
  const createRecord = useCreateBankRecord(clientId);
  const updateRecord = useUpdateBankRecord(clientId);
  const saving = createRecord.isPending || updateRecord.isPending;

  // Re-seed the form each time the modal opens (cancelled edits never leak).
  useEffect(() => {
    if (open) {
      setForm(
        record
          ? { date: record.date || todayDateString(), balance: record.balance, notes: record.notes }
          : emptyRecord()
      );
      setErrors({});
    }
  }, [open, record]);

  const set = (patch: Partial<CrmBankRecordInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const touched = (Object.keys(patch) as Array<keyof BankErrors>).filter((key) => e[key]);
      if (touched.length === 0) return e;
      const next = { ...e };
      touched.forEach((key) => delete next[key]);
      return next;
    });
  };

  const handleSubmit = () => {
    const next: BankErrors = {};
    if (!form.date) next.date = 'Date is required';
    if (form.balance.trim() === '') next.balance = 'Balance is required';
    else if (Number.isNaN(Number(form.balance))) next.balance = 'Balance must be a number';
    if (!form.notes.trim()) next.notes = 'Notes are required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const options = { onSuccess: () => onOpenChange(false) };
    if (record) updateRecord.mutate({ id: record.id, input: form }, options);
    else createRecord.mutate(form, options);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit bank record' : 'Record bank balance'}
      description="The client's total balance derives from the latest history entry."
      size="md"
      onInteractOutside={(e) => {
        if (saving) e.preventDefault();
      }}
      testId="crm-bank-form-modal"
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)} data-testid="crm-bank-cancel-btn">
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction onClick={handleSubmit} disabled={saving} data-testid="crm-bank-save-btn">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Record balance'}
          </ModalPrimaryAction>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DateField
          label="Date"
          required
          value={form.date}
          onChange={(v) => set({ date: v })}
          error={errors.date}
          testId="crm-bank-date-input"
        />
        <TextField
          label="Balance (S$)"
          required
          type="number"
          value={form.balance}
          onChange={(v) => set({ balance: v })}
          error={errors.balance}
          testId="crm-bank-balance-input"
        />
      </div>
      <Field label="Notes" required error={errors.notes}>
        <Textarea
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Source of update — statement review, client call…"
          minHeight={88}
          error={!!errors.notes}
          aria-label="Notes"
          data-testid="crm-bank-notes-textarea"
        />
      </Field>
    </Modal>
  );
}
