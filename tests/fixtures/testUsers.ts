/**
 * Test user credentials.
 *
 * Loaded from TWO dotenv files because the keys are split across them:
 *   - VOLUME `/Volumes/YourVolume/.env.secrets`  → AIGENT_* (admin) + SUPABASE_* (service role)
 *   - LOCAL  `<repo>/.env.secrets`            → TEST_<ROLE>_EMAIL / TEST_<ROLE>_PASSWORD
 *
 * dotenv does NOT override an already-set var, and the two files hold disjoint
 * keys, so loading order is safe. We load the VOLUME first (it's the canonical
 * source on the dev Mac), then the LOCAL repo file fills in the TEST_* keys it
 * doesn't carry. Each `config()` is guarded by existsSync so a missing file is
 * a no-op (CI sets the env vars directly). See tests/lessons.md.
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const VOLUME_SECRETS = '/Volumes/YourVolume/.env.secrets';
const LOCAL_SECRETS = resolve(process.cwd(), '.env.secrets');

// Order matters only for duplicate keys; these two files are disjoint, so either
// order works. We load both unconditionally (guarded) rather than picking one.
if (existsSync(VOLUME_SECRETS)) config({ path: VOLUME_SECRETS });
if (existsSync(LOCAL_SECRETS)) config({ path: LOCAL_SECRETS });

export type TestRole = 'super_admin' | 'coordinator' | 'supervisor' | 'storeman';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: TestRole;
}

export const testUsers = {
  admin: {
    id: process.env.AIGENT_USER_ID ?? '3839133d-3444-4dfb-a344-5f991cb85802',
    email: process.env.AIGENT_EMAIL ?? 'admin@example.com',
    password: process.env.AIGENT_PASSWORD ?? '',
    role: 'super_admin',
  },
  coordinator: {
    id: process.env.TEST_COORDINATOR_USER_ID ?? 'beaab681-46dd-4c43-aab6-c13f265bf1a1',
    email: process.env.TEST_COORDINATOR_EMAIL ?? 'aigent+coordinator@example.com',
    password: process.env.TEST_COORDINATOR_PASSWORD ?? '',
    role: 'coordinator',
  },
  supervisor: {
    id: process.env.TEST_SUPERVISOR_USER_ID ?? '0c8f5500-1912-439d-a0cc-f664d6631b7c',
    email: process.env.TEST_SUPERVISOR_EMAIL ?? 'aigent+supervisor@example.com',
    password: process.env.TEST_SUPERVISOR_PASSWORD ?? '',
    role: 'supervisor',
  },
  storeman: {
    id: process.env.TEST_STOREMAN_USER_ID ?? '44e25ff0-d939-4e7c-964d-2c69f519f88d',
    email: process.env.TEST_STOREMAN_EMAIL ?? 'aigent+storeman@example.com',
    password: process.env.TEST_STOREMAN_PASSWORD ?? '',
    role: 'storeman',
  },
} as const satisfies Record<string, TestUser>;

/**
 * Throw a clear error the first time a role's password is referenced but absent.
 * Called lazily (at use, not at import) so a spec that only needs `admin`
 * doesn't fail because a `TEST_STOREMAN_PASSWORD` happens to be unset.
 */
export function requireTestUser(role: keyof typeof testUsers): TestUser {
  const u = testUsers[role];
  if (!u.password) {
    const envKey =
      role === 'admin' ? 'AIGENT_PASSWORD' : `TEST_${role.toUpperCase()}_PASSWORD`;
    throw new Error(
      `[tests/fixtures/testUsers] ${envKey} not set. ` +
        'Source /Volumes/YourVolume/.env.secrets (admin/service) + the repo-local ' +
        '.env.secrets (TEST_* role creds), or set the env vars in CI.',
    );
  }
  return u;
}

// Admin guard preserved: admin is used by the base setup + the bulk of the
// suite, so fail fast at import if its password is missing (matches prior behavior).
if (!testUsers.admin.password) {
  throw new Error(
    '[tests/fixtures/testUsers] AIGENT_PASSWORD not set. ' +
      'Source /Volumes/YourVolume/.env.secrets or set env var in CI.',
  );
}
