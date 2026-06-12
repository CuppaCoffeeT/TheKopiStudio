/**
 * InteractionFormModal — log/edit one client interaction (FORM archetype,
 * legacy parity per CRM_MODULE_PRD.md port map). Date defaults to today
 * (SG calendar); notes are required; follow-up stays optional ('' → null in
 * lib/mapping — the schema `date` column rejects '').
 */

import { useEffect, useState } from 'react';
import { Field, Textarea } from '@/components/primitives/form';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { useCreateInteraction, useUpdateInteraction } from '../../hooks/useInteractionMutations';
import type { CrmInteraction, CrmInteractionInput } from '../../types';
import { todayDateString } from './dateStrings';
import { DateField, SelectField } from './shared';

const INTERACTION_TYPES = ['Meeting', 'Phone Call', 'Email', 'Follow-up', 'Policy Review'] as const;

type InteractionErrors = Partial<Record<'date' | 'notes', string>>;

interface InteractionFormModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  clientId: string;
  /** Present → edit mode; absent → add mode. */
  interaction?: CrmInteraction;
}

function emptyInteraction(): CrmInteractionInput {
  return { date: todayDateString(), type: 'Meeting', notes: '', followUp: '' };
}

export function InteractionFormModal({ open, onOpenChange, clientId, interaction }: InteractionFormModalProps) {
  const isEdit = !!interaction;
  const [form, setForm] = useState<CrmInteractionInput>(emptyInteraction);
  const [errors, setErrors] = useState<InteractionErrors>({});
  const createInteraction = useCreateInteraction(clientId);
  const updateInteraction = useUpdateInteraction(clientId);
  const saving = createInteraction.isPending || updateInteraction.isPending;

  // Re-seed the form each time the modal opens (cancelled edits never leak).
  useEffect(() => {
    if (open) {
      setForm(
        interaction
          ? {
              date: interaction.date || todayDateString(),
              type: interaction.type,
              notes: interaction.notes,
              followUp: interaction.followUp,
            }
          : emptyInteraction()
      );
      setErrors({});
    }
  }, [open, interaction]);

  const set = (patch: Partial<CrmInteractionInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const touched = (Object.keys(patch) as Array<keyof InteractionErrors>).filter((key) => e[key]);
      if (touched.length === 0) return e;
      const next = { ...e };
      touched.forEach((key) => delete next[key]);
      return next;
    });
  };

  const handleSubmit = () => {
    const next: InteractionErrors = {};
    if (!form.date) next.date = 'Date is required';
    if (!form.notes.trim()) next.notes = 'Notes are required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const options = { onSuccess: () => onOpenChange(false) };
    if (interaction) updateInteraction.mutate({ id: interaction.id, input: form }, options);
    else createInteraction.mutate(form, options);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit interaction' : 'Log interaction'}
      description="Keep the client's contact history current."
      size="md"
      onInteractOutside={(e) => {
        if (saving) e.preventDefault();
      }}
      testId="crm-interaction-form-modal"
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)} data-testid="crm-interaction-cancel-btn">
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction onClick={handleSubmit} disabled={saving} data-testid="crm-interaction-save-btn">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Log interaction'}
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
          testId="crm-interaction-date-input"
        />
        <SelectField
          label="Type"
          required
          value={form.type}
          onChange={(v) => set({ type: v })}
          options={INTERACTION_TYPES}
          testId="crm-interaction-type-select"
        />
      </div>
      <Field label="Notes" required error={errors.notes}>
        <Textarea
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="What was discussed, outcomes, next steps…"
          minHeight={100}
          error={!!errors.notes}
          aria-label="Notes"
          data-testid="crm-interaction-notes-textarea"
        />
      </Field>
      <DateField
        label="Follow-up reminder"
        value={form.followUp}
        onChange={(v) => set({ followUp: v })}
        hint="Optional — future dates count toward upcoming follow-ups."
        testId="crm-interaction-follow-up-input"
      />
    </Modal>
  );
}
