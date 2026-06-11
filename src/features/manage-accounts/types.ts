/**
 * Manage Accounts feature types — flat file (never a types/ directory).
 *
 * Approvals + role management for managers/super_admins. The list reads
 * `public.users` directly (NOT `get_all_users()`, which is super_admin-gated
 * and silently returns 0 rows for managers). ALL role/approval mutations go
 * through the role-sync edge function — direct UPDATEs are blocked by design.
 */

import type { Tables } from '@/integrations/supabase/types';

/** Managed user row (`public.users`). */
export type ManagedUser = Tables<'users'>;

/** Live roles assignable via role-sync. */
export type AssignableRole = 'advisor' | 'manager' | 'super_admin';
