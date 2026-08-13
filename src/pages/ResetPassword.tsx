import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toastHelper';
import { useRecoverySession } from '@/hooks/useRecoverySession';
import { AuthShell, AUTH_LINK_CLASS } from '@/components/shared/auth-shell/AuthShell';
import { Button, LoadingSpinner } from '@/components/primitives/shell';
import { Field, Input } from '@/components/primitives/form';

const MIN_PASSWORD_LENGTH = 8; // matches SecurityPasswordForm

/**
 * ResetPassword — the landing page for the recovery link mailed by
 * /forgot-password.
 *
 * The recovery session that authorises the change is established by
 * useRecoverySession (which documents the implicit-flow mechanics); this file
 * is just the form over it.
 *
 * NOT wrapped in useLoginRedirect on purpose — a recovery session IS a session,
 * and that hook would bounce the user to /dashboard before they could type a
 * new password.
 *
 * On success we sign out rather than continue into the app: the point of a
 * password reset is to end whatever access the old password had, and the
 * subsequent sign-in proves the new one works.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { state, linkError } = useRecoverySession();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const lengthError =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : undefined;
  const matchError =
    confirm.length > 0 && confirm !== password ? 'Passwords do not match.' : undefined;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && confirm === password && !saving;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSaving(false);
      showError(`Could not update the password: ${error.message}`);
      return;
    }
    await supabase.auth.signOut();
    setSaving(false);
    setSaved(true);
    showSuccess('Password updated. Sign in with your new password.');
    navigate('/login', { replace: true });
  }

  const footer = (
    <Link to="/login" className={AUTH_LINK_CLASS} data-testid="reset-login-link">
      Back to sign in
    </Link>
  );

  if (state === 'checking' || saved) {
    return (
      <AuthShell title="Set a new password" testId="reset-checking">
        <div className="mt-5 flex justify-center border-t border-[color:var(--border-soft)] pt-6">
          <LoadingSpinner size="lg" />
        </div>
      </AuthShell>
    );
  }

  if (state === 'invalid') {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This reset link is no longer valid."
        testId="reset-invalid"
        footer={footer}
      >
        <div className="mt-5 flex flex-col gap-3 border-t border-[color:var(--border-soft)] pt-5">
          {linkError && (
            <p className="text-[12.5px] leading-relaxed text-[color:var(--negative-text)]">
              {linkError}
            </p>
          )}
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Reset links can only be used once and expire after a short while. Request a fresh one —
            if that also fails, your account may be awaiting approval, and your administrator can
            sort it out.
          </p>
          <Link
            to="/forgot-password"
            className={`${AUTH_LINK_CLASS} text-[12.5px]`}
            data-testid="reset-request-again-link"
          >
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you haven't used here before."
      testId="reset-card"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-4 border-t border-[color:var(--border-soft)] pt-5"
      >
        <Field
          label="New password"
          required
          error={lengthError}
          hint={lengthError ? undefined : `At least ${MIN_PASSWORD_LENGTH} characters.`}
        >
          <Input
            size="lg"
            type="password"
            className="bg-popover"
            value={password}
            error={!!lengthError}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-label="New password"
            data-testid="reset-password-input"
            required
          />
        </Field>
        <Field label="Confirm new password" required error={matchError}>
          <Input
            size="lg"
            type="password"
            className="bg-popover"
            value={confirm}
            error={!!matchError}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-label="Confirm new password"
            data-testid="reset-confirm-input"
            required
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={saving}
          disabled={!canSubmit}
          className="mt-1 w-full justify-center"
          data-testid="reset-submit-btn"
        >
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
