import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toastHelper';
import { useLoginRedirect } from '@/hooks/useLoginRedirect';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@/components/primitives/shell';
import { Field, Input } from '@/components/primitives/form';

/**
 * Minimal email/password sign-in for the base.
 *
 * Auth runs against Supabase Auth (`signInWithPassword`). On success the
 * AuthProvider's `onAuthStateChange` rehydrates the session and we land on
 * `/dashboard`. Already-authenticated visitors are bounced straight to
 * `/dashboard` by useLoginRedirect (the contract the E2E storageState
 * harness depends on). Build out password-reset / email-verification flows
 * as your app needs them.
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
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your account credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                data-testid="login-email-input"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                data-testid="login-password-input"
                required
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
              data-testid="login-submit-btn"
            >
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
