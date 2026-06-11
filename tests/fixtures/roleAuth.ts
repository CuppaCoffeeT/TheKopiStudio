/**
 * roleAuth — per-role storageState file paths + an in-spec UI sign-in fallback.
 *
 * The parallel config (`playwright.parallel.config.ts`) signs each role in ONCE
 * via `tests/auth.setup.ts` and saves the session to `tests/.auth/<role>.json`
 * (advisor · manager · super_admin). Authed specs/projects reuse that session
 * through `storageState` so the in-spec `LoginPage.signIn(...)` becomes an
 * instant no-op (LoginPage detects the /login → /dashboard auto-redirect and
 * returns early).
 *
 * `authFileFor(role)` is the single source of truth for those paths — used by
 * both the setup project (writer) and any role-scoped authed project (reader).
 *
 * `loginAs(page, role)` is the explicit UI sign-in for the rare within-spec role
 * switch (and the default serial gate, where no storageState exists). It is NOT
 * the parallel-suite mechanism — that's storageState.
 */
import type { Page } from '@playwright/test';
import { LoginPage } from '../pom/LoginPage';
import { requireTestUser, testUsers } from './testUsers';

export type AuthRole = keyof typeof testUsers; // 'advisor' | 'manager' | 'super_admin'

/** Every role that gets a saved storageState in the setup project. */
export const AUTH_ROLES: readonly AuthRole[] = [
  'advisor',
  'manager',
  'super_admin',
] as const;

/** storageState path for a role, e.g. authFileFor('manager') → tests/.auth/manager.json */
export function authFileFor(role: AuthRole): string {
  return `tests/.auth/${role}.json`;
}

/**
 * UI sign-in as a role. Throws (via requireTestUser) if that role's password
 * isn't configured. Waits for the dashboard redirect before returning so a
 * caller's subsequent navigation can't race a late session-hydration redirect.
 */
export async function loginAs(page: Page, role: AuthRole): Promise<void> {
  const user = requireTestUser(role);
  await new LoginPage(page).signIn(user.email, user.password);
  await page.waitForURL('**/dashboard', { timeout: 45_000 });
}
