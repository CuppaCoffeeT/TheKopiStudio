/**
 * Supabase post-action evidence runner.
 * Uses the service-role key (bypasses RLS) so tests can verify DB state
 * regardless of what the logged-in user could see.
 *
 * SUPABASE_URL + SUPABASE_KEY load from the repo-local `.env.secrets`
 * (gitignored; template in .env.secrets.example) or from env vars set
 * directly (CI). Specs that never import this module don't need them.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const LOCAL_SECRETS = resolve(process.cwd(), '.env.secrets');
if (existsSync(LOCAL_SECRETS)) config({ path: LOCAL_SECRETS });

const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  'https://mymzcbalyqqgdmzsfmam.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_KEY;

if (!SERVICE_KEY) {
  throw new Error(
    '[supabaseChecks] SUPABASE_KEY (service role) not set. ' +
      'Add it to <repo>/.env.secrets (see .env.secrets.example) or set the env var in CI.',
  );
}

export const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Returns auth.users row for a given email, or null.
 * Used to confirm a user exists + auth session state is sane.
 */
export async function getAuthUserByEmail(email: string) {
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`[getAuthUserByEmail] ${error.message}`);
  return data.users.find((u) => u.email === email) ?? null;
}

/**
 * Confirm the given user signed in recently (within the last N seconds).
 * Default window: 60s — aligned with a single test run.
 */
export async function assertRecentSignIn(email: string, withinSeconds = 60) {
  const user = await getAuthUserByEmail(email);
  if (!user) throw new Error(`[assertRecentSignIn] user not found: ${email}`);

  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  if (!lastSignIn) throw new Error(`[assertRecentSignIn] no last_sign_in_at for ${email}`);

  const ageSeconds = (Date.now() - lastSignIn.getTime()) / 1000;
  if (ageSeconds > withinSeconds) {
    throw new Error(
      `[assertRecentSignIn] last_sign_in_at too old for ${email}: ${ageSeconds.toFixed(1)}s ago (expected < ${withinSeconds}s)`,
    );
  }

  return {
    userId: user.id,
    email: user.email,
    lastSignInAt: lastSignIn.toISOString(),
    ageSeconds: Math.round(ageSeconds),
  };
}

/**
 * Fetch all active modules for smoke testing.
 */
export async function fetchActiveModules() {
  const { data, error } = await adminClient
    .from('modules')
    .select('id, name, path, category')
    .eq('is_active', true)
    .order('category')
    .order('sort_order')
    .limit(500);
  if (error) throw new Error(`[fetchActiveModules] ${error.message}`);
  return data ?? [];
}

/**
 * Confirm the user's public.users profile row is approved + active.
 * These flags gate /dashboard access.
 */
export async function assertUserProfileLive(userId: string) {
  const { data, error } = await adminClient
    .from('users')
    .select('id, is_approved, is_active, role')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`[assertUserProfileLive] ${error.message}`);
  if (!data.is_approved) throw new Error(`[assertUserProfileLive] user ${userId} not approved`);
  if (!data.is_active) throw new Error(`[assertUserProfileLive] user ${userId} not active`);

  return data;
}
