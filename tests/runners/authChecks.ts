/**
 * Auth post-action helpers — recovery / verification link minting via the
 * Supabase admin API. Used by `/auth/reset-password` happy-path specs to
 * skip the Gmail round-trip while exercising the exact URL shape Supabase
 * emits to real users.
 */
import { adminClient, getAuthUserByEmail } from './supabaseChecks';

export interface GeneratedRecoveryLink {
  /** Full URL the user would click in their email — points to GoTrue verify endpoint. */
  actionLink: string;
  /** Bare token (Supabase recovery token) — for direct query-string injection. */
  token: string;
  hashedToken: string;
}

/**
 * Mint a real password-recovery link for `email` using the service-role admin
 * API. The returned `actionLink` is the same URL the user would receive in their
 * email inbox — clicking it triggers Supabase's `/auth/v1/verify` endpoint,
 * which exchanges the token for a session and 302-redirects to the project's
 * site URL with the recovery markers in the URL hash.
 */
export async function generateRecoveryLink(
  email: string,
  redirectTo: string,
): Promise<GeneratedRecoveryLink> {
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });
  if (error || !data?.properties) {
    throw new Error(`[generateRecoveryLink] ${error?.message ?? 'no link returned'}`);
  }
  const props = data.properties;
  return {
    actionLink: props.action_link,
    token: props.email_otp,
    hashedToken: props.hashed_token,
  };
}

/**
 * Restore a user's password to a known value using the service-role admin API.
 * Used in spec teardown after a happy-path test changes the password mid-flow,
 * so other specs that depend on the same credentials don't get locked out.
 */
export async function restoreUserPassword(userId: string, password: string): Promise<void> {
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password });
  if (error) {
    throw new Error(`[restoreUserPassword] ${error.message}`);
  }
}

/**
 * Hard-delete a user (auth.users + public.users) by email. No-op if the email
 * doesn't exist. Used by signup specs that mint synthetic seatbelt+<ts>@example.com
 * accounts so the suite leaves zero residue.
 */
export async function deleteUserByEmail(email: string): Promise<void> {
  const user = await getAuthUserByEmail(email);
  if (!user) return;
  // public.users.id has a FK to auth.users(id) — delete the profile row first
  // to avoid a constraint violation if the cascade hasn't been wired.
  const { error: profileErr } = await adminClient.from('users').delete().eq('id', user.id);
  if (profileErr && profileErr.code !== 'PGRST116') {
    throw new Error(`[deleteUserByEmail] public.users delete: ${profileErr.message}`);
  }
  const { error: authErr } = await adminClient.auth.admin.deleteUser(user.id);
  if (authErr) {
    throw new Error(`[deleteUserByEmail] auth.users delete: ${authErr.message}`);
  }
}

/**
 * Assert no row remains in auth.users OR public.users for the given email.
 * Pairs with deleteUserByEmail() to guarantee zero residue after a synthetic
 * signup test.
 *
 * Email moved off `public.users` during people-normalization — it now lives
 * on `public.people.email`, joined via `users.person_id`. The residue check
 * follows that join: find the person by email, then look for any users row
 * still referencing them.
 */
export async function assertNoUserResidue(email: string): Promise<void> {
  const authUser = await getAuthUserByEmail(email);
  if (authUser) {
    throw new Error(`[assertNoUserResidue] auth.users row still present for ${email} (id=${authUser.id})`);
  }
  const { data: people, error: peopleErr } = await adminClient
    .from('people')
    .select('id')
    .eq('email', email)
    .limit(1);
  if (peopleErr) {
    throw new Error(`[assertNoUserResidue] public.people query: ${peopleErr.message}`);
  }
  if (!people || people.length === 0) return; // no person row → no possible users residue
  const personId = people[0].id;
  const { data, error } = await adminClient
    .from('users')
    .select('id')
    .eq('person_id', personId)
    .limit(1);
  if (error) {
    throw new Error(`[assertNoUserResidue] public.users query: ${error.message}`);
  }
  if (data && data.length > 0) {
    throw new Error(`[assertNoUserResidue] public.users row still present for ${email} (id=${data[0].id}, person_id=${personId})`);
  }
}
