/**
 * Account Settings feature types — flat file (never a types/ directory).
 *
 * Self-service profile + security surface. Reads come from `get_user_profile()`
 * RPC plus a direct `users` select for phone; writes go through `users_update`
 * (name/phone) and `supabase.auth.updateUser` (email/password) — never bare
 * `users.email` writes. Username lives in legacy `profiles` and is display-only.
 */

import type { Tables } from '@/integrations/supabase/types';

/** App user row (`public.users`) — source for name/phone/role/joined fields. */
export type AccountUser = Tables<'users'>;

/** Tab values for the Account Settings TabNav. */
export type AccountSettingsTab = 'profile' | 'security';

/**
 * Combined self-profile read: `get_user_profile()` RPC (id/name/email/role/
 * approval flags — no phone) + `users` select (phone, created_at) + legacy
 * `profiles.username` (display-only; null when no legacy row exists).
 */
export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isApproved: boolean;
  isActive: boolean;
  phone: string | null;
  createdAt: string | null;
  legacyUsername: string | null;
}

/** Self-service editable fields — everything else is read-only on this surface. */
export interface UpdateSelfInput {
  name: string;
  phone: string | null;
}
