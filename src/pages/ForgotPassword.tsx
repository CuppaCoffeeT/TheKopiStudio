import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toastHelper';
import { AuthShell, AUTH_LINK_CLASS } from '@/components/shared/auth-shell/AuthShell';
import { Button } from '@/components/primitives/shell';
import { Field, Input } from '@/components/primitives/form';

/**
 * ForgotPassword — request a reset link.
 *
 * `resetPasswordForEmail` mails a recovery link that lands on /reset-password
 * (that path must be on the project's Auth → URL Configuration redirect
 * allow-list, alongside the localhost origin, or Supabase falls back to the
 * Site URL and the link appears to do nothing).
 *
 * NO ENUMERATION: the confirmation panel is shown for any well-formed address.
 * Supabase deliberately returns success for unknown emails, and this screen
 * must not become a way to test which addresses have accounts — so the copy
 * says "if an account exists", never "sent".
 *
 * This screen deliberately does NOT use useLoginRedirect: someone who is
 * half-signed-in should still be able to ask for a reset link.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      // Rate limits and malformed addresses surface; "no such user" does not.
      showError(`Could not send the reset link: ${error.message}`);
      return;
    }
    setSubmitted(true);
  }

  const footer = (
    <>
      Remembered it?{' '}
      <Link to="/login" className={AUTH_LINK_CLASS} data-testid="forgot-login-link">
        Back to sign in
      </Link>
    </>
  );

  if (submitted) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`If an account exists for ${email.trim()}, a reset link is on its way.`}
        testId="forgot-confirmation"
        footer={footer}
      >
        <div className="mt-5 border-t border-[color:var(--border-soft)] pt-5">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            The link opens a page where you set a new password. It expires after a short while — if
            it lapses, request another from this screen.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to set a new one."
      testId="forgot-card"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-4 border-t border-[color:var(--border-soft)] pt-5"
      >
        <Field label="Email" required>
          <Input
            size="lg"
            type="email"
            className="bg-popover"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-label="Email"
            data-testid="forgot-email-input"
            required
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="mt-1 w-full justify-center"
          data-testid="forgot-submit-btn"
        >
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
