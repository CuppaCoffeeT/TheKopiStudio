/**
 * SecurityPasswordForm — change the auth password (supabase.auth.updateUser
 * via useUpdatePassword). Client-validated: min 8 characters + confirm match.
 */

import { useState } from 'react';
import { Field } from '@/components/primitives/form/Field';
import { Input } from '@/components/primitives/form/Input';
import { Button } from '@/components/primitives/shell/Button';
import { useUpdatePassword } from '../hooks/useUpdatePassword';

const MIN_PASSWORD_LENGTH = 8;

export function SecurityPasswordForm() {
  const updatePassword = useUpdatePassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const lengthError =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : undefined;
  const matchError =
    confirm.length > 0 && confirm !== password ? 'Passwords do not match.' : undefined;
  const canSubmit =
    password.length >= MIN_PASSWORD_LENGTH && confirm === password && !updatePassword.isPending;

  const handleSubmit = () => {
    updatePassword.mutate(password, {
      onSuccess: () => {
        setPassword('');
        setConfirm('');
      },
    });
  };

  return (
    <div className="flex flex-col gap-4" data-testid="account-security-password-form">
      <Field
        label="New password"
        required
        error={lengthError}
        hint={lengthError ? undefined : `At least ${MIN_PASSWORD_LENGTH} characters.`}
      >
        <Input
          size="lg"
          type="password"
          autoComplete="new-password"
          value={password}
          error={!!lengthError}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="New password"
          data-testid="account-security-password-input"
        />
      </Field>
      <Field label="Confirm new password" required error={matchError}>
        <Input
          size="lg"
          type="password"
          autoComplete="new-password"
          value={confirm}
          error={!!matchError}
          onChange={(e) => setConfirm(e.target.value)}
          aria-label="Confirm new password"
          data-testid="account-security-password-confirm-input"
        />
      </Field>
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={updatePassword.isPending}
          data-testid="account-security-password-btn"
        >
          Update password
        </Button>
      </div>
    </div>
  );
}
