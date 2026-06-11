/**
 * SecurityEmailForm — start an auth email change (supabase.auth.updateUser via
 * useUpdateEmail). The address only switches after the confirmation link is
 * clicked — explained in the Alert. Never writes public.users.email.
 */

import { useState } from 'react';
import { Field } from '@/components/primitives/form/Field';
import { Input } from '@/components/primitives/form/Input';
import { Button } from '@/components/primitives/shell/Button';
import { Alert } from '@/components/primitives/overlays/Alert';
import { useUpdateEmail } from '../hooks/useUpdateEmail';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SecurityEmailFormProps {
  currentEmail: string;
}

export function SecurityEmailForm({ currentEmail }: SecurityEmailFormProps) {
  const updateEmail = useUpdateEmail();
  const [email, setEmail] = useState('');

  const trimmed = email.trim().toLowerCase();
  const formatError =
    trimmed.length > 0 && !EMAIL_PATTERN.test(trimmed) ? 'Enter a valid email address.' : undefined;
  const sameError =
    trimmed.length > 0 && trimmed === currentEmail.toLowerCase()
      ? 'This is already your current email.'
      : undefined;
  const error = formatError ?? sameError;
  const canSubmit = trimmed.length > 0 && !error;

  const handleSubmit = () => {
    updateEmail.mutate(trimmed, { onSuccess: () => setEmail('') });
  };

  return (
    <div className="flex flex-col gap-4" data-testid="account-security-email-form">
      <Alert
        variant="info"
        title="Email changes need confirmation"
        description={`We'll send a confirmation link when you submit a new address. Your current email (${currentEmail}) keeps working until you click that link.`}
      />
      <Field label="New email" error={error}>
        <Input
          size="lg"
          type="email"
          value={email}
          error={!!error}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="new-address@example.com"
          aria-label="New email"
          data-testid="account-security-email-input"
        />
      </Field>
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={updateEmail.isPending}
          data-testid="account-security-email-btn"
        >
          Send confirmation link
        </Button>
      </div>
    </div>
  );
}
