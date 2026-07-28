/**
 * ClientFormModal — add/edit one client (FORM archetype, legacy parity per
 * CRM_MODULE_PRD.md port map).
 *
 * - name/email/phone required with inline errors.
 * - "Client since" is editable in BOTH modes (legacy parity); the blank →
 *   today default applies on add only (in clientsService).
 * - "Total bank balance" is ADD-only — it seeds the initial bank-history
 *   row; in edit the balance is managed in Bank history (corrected legacy
 *   bug 1: client edits never write the derived columns). Both rules render
 *   in client/ClientFormSections.tsx.
 */

import { useEffect, useState } from 'react';
import { Field, Textarea } from '@/components/primitives/form';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { useCreateClient, useUpdateClient } from '../../hooks/useClientMutations';
import { EMPTY_CLIENT, RISK_PROFILES, toInput } from './client/clientFormModel';
import type { CrmClient, CrmClientInput } from '../../types';
import { ClientFinancialSection, ClientRelationshipSection } from './client/ClientFormSections';
import { ClientPlanningSection } from './client/ClientPlanningSection';
import { DateField, SelectField, TextField } from './shared';

type ClientErrors = Partial<Record<'name' | 'email' | 'phone', string>>;

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Present → edit mode; absent → add mode. */
  client?: CrmClient;
}

export function ClientFormModal({ open, onOpenChange, client }: ClientFormModalProps) {
  const isEdit = !!client;
  const [form, setForm] = useState<CrmClientInput>(EMPTY_CLIENT);
  const [errors, setErrors] = useState<ClientErrors>({});
  const createClient = useCreateClient();
  const updateClient = useUpdateClient(client?.id ?? '');
  const saving = createClient.isPending || updateClient.isPending;

  // Re-seed the form each time the modal opens (cancelled edits never leak).
  useEffect(() => {
    if (open) {
      setForm(client ? toInput(client) : EMPTY_CLIENT);
      setErrors({});
    }
  }, [open, client]);

  const set = (patch: Partial<CrmClientInput>) => setForm((f) => ({ ...f, ...patch }));

  /** Required-field setter that clears the field's inline error as the user types. */
  const setRequired = (key: keyof ClientErrors) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const handleSubmit = () => {
    const next: ClientErrors = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const options = { onSuccess: () => onOpenChange(false) };
    if (client) updateClient.mutate(form, options);
    else createClient.mutate(form, options);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit client' : 'Add client'}
      description={client ? `Update ${client.name}'s profile.` : 'Create a client record in your book.'}
      size="xl"
      tall
      bodyClassName="px-5 py-4 grid gap-3 overflow-y-auto flex-1"
      onInteractOutside={(e) => {
        if (saving) e.preventDefault();
      }}
      testId="crm-client-form-modal"
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)} data-testid="crm-client-cancel-btn">
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction onClick={handleSubmit} disabled={saving} data-testid="crm-client-save-btn">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add client'}
          </ModalPrimaryAction>
        </>
      }
    >
      <TextField
        label="Full name"
        required
        value={form.name}
        onChange={setRequired('name')}
        error={errors.name}
        placeholder="Client name"
        testId="crm-client-name-input"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Email"
          required
          type="email"
          value={form.email}
          onChange={setRequired('email')}
          error={errors.email}
          placeholder="name@example.com"
          testId="crm-client-email-input"
        />
        <TextField
          label="Phone"
          required
          type="tel"
          value={form.phone}
          onChange={setRequired('phone')}
          error={errors.phone}
          placeholder="9123 4567"
          testId="crm-client-phone-input"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DateField
          label="Date of birth"
          value={form.dateOfBirth}
          onChange={(v) => set({ dateOfBirth: v })}
          testId="crm-client-dob-input"
        />
        <TextField
          label="Occupation"
          value={form.occupation}
          onChange={(v) => set({ occupation: v })}
          placeholder="Engineer, Teacher…"
          testId="crm-client-occupation-input"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Annual income (S$)"
          type="number"
          value={form.annualIncome}
          onChange={(v) => set({ annualIncome: v })}
          testId="crm-client-income-input"
        />
        <SelectField
          label="Risk profile"
          value={form.riskProfile}
          onChange={(v) => set({ riskProfile: v })}
          options={RISK_PROFILES}
          testId="crm-client-risk-select"
        />
      </div>
      <Field label="Notes">
        <Textarea
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Anything worth remembering about this client…"
          minHeight={88}
          aria-label="Notes"
          data-testid="crm-client-notes-textarea"
        />
      </Field>
      <ClientRelationshipSection isEdit={isEdit} value={form} set={set} />
      <ClientFinancialSection isEdit={isEdit} value={form} set={set} />
      <ClientPlanningSection value={form} set={set} />
    </Modal>
  );
}
