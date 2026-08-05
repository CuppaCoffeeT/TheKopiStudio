import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toastHelper';
import { useLoginRedirect } from '@/hooks/useLoginRedirect';
import { Card, Button, Wordmark } from '@/components/primitives/shell';
import { Field, Input } from '@/components/primitives/form';

/**
 * Login — signed-out entry, in the 2a "Kopi House" language.
 *
 * Auth runs against Supabase Auth (`signInWithPassword`). On success the
 * AuthProvider's `onAuthStateChange` rehydrates the session and we land on
 * `/dashboard`. Already-authenticated visitors are bounced straight to
 * `/dashboard` by useLoginRedirect (the contract the E2E storageState
 * harness depends on).
 *
 * 2a never mocked a signed-out screen, so this is derived from the comps'
 * own vocabulary rather than invented: page cream ground, the shared
 * `Wordmark` lockup as the H1 at 34px (display type — raw brand brown is
 * sanctioned >= 18px), an uppercase kicker above it, one cream card carrying
 * a serif 22px section head + hairline + form, and the brown primary CTA.
 * Deviations recorded in
 * docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md.
 *
 * The inputs step UP to the raised white (`bg-popover`): the shared `Input`
 * primitive paints card cream, which is the card's own colour here, so the
 * field would dissolve into its panel. `--popover` is the token the spec
 * assigns to inputs ("the only place white appears in the comp").
 */
export default function Login() {
  useLoginRedirect();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      showError(`Sign in failed: ${error.message}`);
      return;
    }
    navigate('/dashboard');
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 py-12"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <main className="w-full max-w-sm">
        <header className="mb-10">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--fg-dim)]"
            data-testid="login-kicker"
          >
            Advisor suite
          </p>
          <h1
            className="mt-2 leading-[1.05] tracking-[-0.02em] text-foreground"
            style={{ fontSize: 'clamp(38px, 3.5vw + 24px, 44px)' }}
          >
            <Wordmark />
          </h1>
        </header>

        <Card>
          <h2
            className="text-[22px] leading-tight text-foreground m-0"
            style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
          >
            Sign in
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Use your account credentials to continue.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 flex flex-col gap-4 border-t border-[color:var(--border-soft)] pt-5"
          >
            <Field label="Email">
              <Input
                size="lg"
                type="email"
                className="bg-popover"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                aria-label="Email"
                data-testid="login-email-input"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                size="lg"
                type="password"
                className="bg-popover"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-label="Password"
                data-testid="login-password-input"
                required
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="mt-1 w-full justify-center"
              data-testid="login-submit-btn"
            >
              Sign in
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
