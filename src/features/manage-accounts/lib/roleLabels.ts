/**
 * Role display labels — the three live, assignable roles (`public.roles`).
 * Shared by the role SelectMenu cell and the role-sync success toast.
 */

import type { AssignableRole } from '../types';

export const ASSIGNABLE_ROLES: readonly AssignableRole[] = [
  'advisor',
  'manager',
  'super_admin',
] as const;

export const ROLE_LABELS: Record<AssignableRole, string> = {
  advisor: 'Advisor',
  manager: 'Manager',
  super_admin: 'Super admin',
};

export function isAssignableRole(role: string): role is AssignableRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(role);
}
