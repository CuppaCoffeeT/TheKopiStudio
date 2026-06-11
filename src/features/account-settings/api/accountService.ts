/**
 * Account Settings data access — self-profile reads + self-update writes.
 *
 * Reads: `get_user_profile()` RPC (no phone) + direct `users` select for
 * phone/created_at + legacy `profiles.username` (display-only, pre-cutover).
 * Writes: name/phone via the `users_update` policy. Email/password are NEVER
 * written here — they go through `supabase.auth.updateUser` (see hooks/).
 */

import { supabase } from '@/integrations/supabase/client';
import type { AccountProfile, AccountUser, UpdateSelfInput } from '../types';

/** Fetch the signed-in user's combined profile (RPC + users row + legacy username). */
export async function getAccountProfile(userId: string): Promise<AccountProfile> {
  const [profileRes, userRowRes, legacyRes] = await Promise.all([
    supabase.rpc('get_user_profile'),
    supabase
      .from('users')
      .select('phone, created_at')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (userRowRes.error) throw userRowRes.error;
  if (legacyRes.error) throw legacyRes.error;

  const rpcRow = profileRes.data?.[0];
  if (!rpcRow) {
    throw new Error('get_user_profile returned no row for the current session');
  }

  return {
    id: rpcRow.id,
    name: rpcRow.name,
    email: rpcRow.email,
    role: rpcRow.role,
    isApproved: rpcRow.is_approved,
    isActive: rpcRow.is_active,
    phone: userRowRes.data?.phone ?? null,
    createdAt: userRowRes.data?.created_at ?? null,
    // Legacy mirror row may simply not exist for post-cutover signups.
    legacyUsername: legacyRes.data?.username ?? null,
  };
}

/** Update the signed-in user's own name/phone (allowed by `users_update`). */
export async function updateSelf(
  userId: string,
  input: UpdateSelfInput,
): Promise<AccountUser> {
  const { data, error } = await supabase
    .from('users')
    .update({ name: input.name, phone: input.phone })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Profile update affected no rows — your session may be stale');
  }
  return data;
}
