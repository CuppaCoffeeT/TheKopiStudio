/**
 * Test user credentials — the three e2e accounts for this app's roles
 * (advisor · manager · super_admin).
 *
 * Accounts are real, plus-addressed users in the LIVE auth pool
 * (skytwech+e2e-<role>@gmail.com), created via public signup and then
 * approved/promoted by SQL — see docs in .env.secrets.example.
 *
 * Passwords are NEVER hardcoded: they load from the repo-local `.env.secrets`
 * (gitignored; template in .env.secrets.example) or from env vars set directly
 * (CI). Emails/user-ids have committed defaults so evidence helpers can target
 * the right rows without configuration, with env overrides available.
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const LOCAL_SECRETS = resolve(process.cwd(), '.env.secrets');

// dotenv never overrides an already-set var, so CI env vars always win.
if (existsSync(LOCAL_SECRETS)) config({ path: LOCAL_SECRETS });

export type TestRole = 'advisor' | 'manager' | 'super_admin';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: TestRole;
}

export const testUsers = {
  advisor: {
    id: process.env.TEST_ADVISOR_USER_ID ?? 'ddd53c7d-d034-4ee9-826c-37550cc28306',
    email: process.env.TEST_ADVISOR_EMAIL ?? 'skytwech+e2e-advisor@gmail.com',
    password: process.env.TEST_ADVISOR_PASSWORD ?? '',
    role: 'advisor',
  },
  manager: {
    id: process.env.TEST_MANAGER_USER_ID ?? 'c1ae358a-a34f-4db5-bea2-40729faa2dca',
    email: process.env.TEST_MANAGER_EMAIL ?? 'skytwech+e2e-manager@gmail.com',
    password: process.env.TEST_MANAGER_PASSWORD ?? '',
    role: 'manager',
  },
  super_admin: {
    id: process.env.TEST_SUPER_ADMIN_USER_ID ?? 'ea135b9e-ccd6-46cd-8aca-f77aec581168',
    email: process.env.TEST_SUPER_ADMIN_EMAIL ?? 'skytwech+e2e-superadmin@gmail.com',
    password: process.env.TEST_SUPER_ADMIN_PASSWORD ?? '',
    role: 'super_admin',
  },
} as const satisfies Record<string, TestUser>;

/**
 * Throw a clear error the first time a role's credentials are referenced but
 * absent. Called lazily (at use, not at import) so a logged-out spec doesn't
 * fail because an unrelated role's password happens to be unset.
 */
export function requireTestUser(role: keyof typeof testUsers): TestUser {
  const u = testUsers[role];
  if (!u.password) {
    throw new Error(
      `[tests/fixtures/testUsers] TEST_${role.toUpperCase()}_PASSWORD not set. ` +
        'Copy .env.secrets.example to <repo>/.env.secrets and fill in the TEST_* ' +
        'values, or set the env vars directly in CI.',
    );
  }
  return u;
}
