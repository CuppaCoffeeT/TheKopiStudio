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
