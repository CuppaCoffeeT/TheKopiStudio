/**
 * Playwright globalSetup — profiler edition.
 *
 * The donor app's setup seeded a TEST_INVOICE_AUTOMATION fixture into
 * companies/projects/quotations/claims tables. Those tables DO NOT exist in
 * this database, so this suite seeds NOTHING. Specs run against the live
 * tables (results, users, modules) as one of the three pre-provisioned e2e
 * accounts — see tests/fixtures/testUsers.ts and .env.secrets.example.
 *
 * What this still does (fail fast here, not as 30 opaque login timeouts):
 *  - verifies the dev-server env contract (VITE_SUPABASE_URL +
 *    VITE_SUPABASE_PUBLISHABLE_KEY) that `npm run dev` needs to boot;
 *  - warns when TEST_* role credentials are absent (auth.setup / loginAs will
 *    then fail loudly per role via requireTestUser).
 *
 * Paired with tests/global-teardown.ts (a logging no-op — nothing is seeded,
 * so nothing needs cleaning up).
 */
import { testUsers } from './fixtures/testUsers';

const REQUIRED_DEV_SERVER_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
] as const;

export default async function globalSetup() {
  // playwright.config.ts imports 'dotenv/config', so .env is already loaded;
  // importing testUsers above loads .env.secrets (TEST_* role creds).
  const missing = REQUIRED_DEV_SERVER_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[global-setup] missing dev-server env: ${missing.join(', ')}. ` +
        'Check <repo>/.env — the Vite dev server cannot reach Supabase without them.',
    );
  }

  const credentialless = Object.entries(testUsers)
    .filter(([, user]) => !user.password)
    .map(([role]) => role);
  if (credentialless.length > 0) {
    console.warn(
      `[global-setup] no password configured for role(s): ${credentialless.join(', ')}. ` +
        'Copy .env.secrets.example to .env.secrets and fill in the TEST_* values — ' +
        'authed specs for those roles will fail at sign-in.',
    );
  }

  console.log('[global-setup] env verified — no fixture seeding required for the profiler suite.');
}
