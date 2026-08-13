/**
 * Seed the three E2E auth accounts into the EPHEMERAL LOCAL Supabase stack.
 *
 * Runs as a CI step AFTER `supabase start`, BEFORE Playwright — see
 * .github/workflows/seatbelt.yml and docs/06-operations/CI_TEST_DB_ISOLATION.md.
 * NEVER point this at a hosted project: it hard-writes privileged rows.
 *
 * Why the admin API and not raw `INSERT INTO auth.users` in seed.sql: the
 * auth.users column set (encrypted_password format, confirmation columns,
 * identities) moves between gotrue releases, so a hand-written INSERT silently
 * produces an account that cannot sign in. `auth.admin.createUser` is the
 * version-stable contract; it also fires public.handle_new_user(), which
 * creates the matching public.users + public.profiles rows for us.
 *
 * The three things this must get right, all of them load-bearing:
 *
 *  1. `app_metadata.role` — has_capability() / is_super_admin() read the role
 *     from `auth.jwt()->'app_metadata'->>'role'`, NOT from public.users. Miss
 *     this and every RLS capability check fails closed: the manager sees an
 *     empty book and `view_all_clients` / `view_all_results` never engage.
 *  2. `public.users` role + is_approved + is_active — handle_new_user() inserts
 *     every signup as an unapproved 'advisor'. is_approved/is_active gate
 *     /dashboard (is_approved_user()), and users.role drives module grants via
 *     role_modules. The BEFORE UPDATE protect_user_privileges() trigger admits
 *     us because PostgREST presents `request.jwt.claims.role = service_role`.
 *  3. `public.profiles.role` — the legacy table. `get_my_role()` reads it, and
 *     the "Managers read all results/profiles" policies are written against
 *     get_my_role() = 'manager'. Its CHECK constraint allows only
 *     advisor|manager, so super_admin maps to 'manager' — the exact mapping
 *     supabase/functions/role-sync/index.ts (v2) applies in prod.
 *
 * Idempotent: re-running against an already-seeded stack updates in place.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  throw new Error(
    '[seed-auth-users] SUPABASE_KEY (local service_role) not set. ' +
      'Export it from `supabase status -o env` before running this.',
  );
}
if (!/(127\.0\.0\.1|localhost)/.test(SUPABASE_URL)) {
  throw new Error(
    `[seed-auth-users] refusing to run against a non-local URL: ${SUPABASE_URL}. ` +
      'This script is for the ephemeral CI database only.',
  );
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Sign-in probes go through the anon key — the same key the browser presents,
// so a passing probe is real evidence the suite can log in.
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? SERVICE_KEY;
const probe = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

/**
 * Ids/emails mirror the committed defaults in tests/fixtures/testUsers.ts —
 * specs address rows by these ids, so they must not drift.
 * `profilesRole` is the legacy-table mapping described in the header.
 */
const USERS = [
  {
    id: 'ddd53c7d-d034-4ee9-826c-37550cc28306',
    email: 'skytwech+e2e-advisor@gmail.com',
    name: 'e2e-advisor',
    role: 'advisor',
    profilesRole: 'advisor',
    passwordEnv: 'TEST_ADVISOR_PASSWORD',
  },
  {
    id: 'c1ae358a-a34f-4db5-bea2-40729faa2dca',
    email: 'skytwech+e2e-manager@gmail.com',
    name: 'e2e-manager',
    role: 'manager',
    profilesRole: 'manager',
    passwordEnv: 'TEST_MANAGER_PASSWORD',
  },
  {
    id: 'ea135b9e-ccd6-46cd-8aca-f77aec581168',
    email: 'skytwech+e2e-superadmin@gmail.com',
    name: 'e2e-superadmin',
    role: 'super_admin',
    profilesRole: 'manager',
    passwordEnv: 'TEST_SUPER_ADMIN_PASSWORD',
  },
];

/** The legacy "Bee zhen" fixture — owned by the super_admin so it stays
 *  FOREIGN to the manager, which is what results-manager.spec's read-all
 *  assertion actually exercises. results.user_id FKs to profiles, not users. */
const BEE_ZHEN_RESULT_ID = '883d2eca-e09a-4dc8-957c-b1a84bf15e5d';
const RESULT_OWNER_ID = USERS[2].id;

function passwordFor(user) {
  const password = process.env[user.passwordEnv];
  if (!password) throw new Error(`[seed-auth-users] ${user.passwordEnv} not set`);
  return password;
}

/** Create the auth user, or reset an existing one to the same known state. */
async function upsertAuthUser(user) {
  const password = passwordFor(user);
  const attrs = {
    email: user.email,
    password,
    email_confirm: true,
    app_metadata: { role: user.role, provider: 'email', providers: ['email'] },
    user_metadata: { full_name: user.name, username: user.name },
  };

  const { error } = await admin.auth.admin.createUser({ id: user.id, ...attrs });
  if (!error) return 'created';

  // A re-run hits "already been registered" / duplicate id — reconcile instead.
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, attrs);
  if (updateError) {
    throw new Error(
      `[seed-auth-users] ${user.email}: create failed (${error.message}) ` +
        `and update failed (${updateError.message})`,
    );
  }
  return 'updated';
}

/** Promote the rows handle_new_user() just created to their real state. */
async function applyRoles(user) {
  const { error: usersError } = await admin
    .from('users')
    .update({
      name: user.name,
      email: user.email,
      role: user.role,
      is_approved: true,
      is_active: true,
      is_deleted: false,
    })
    .eq('id', user.id);
  if (usersError) throw new Error(`[seed-auth-users] users ${user.email}: ${usersError.message}`);

  const { error: profilesError } = await admin
    .from('profiles')
    .update({ role: user.profilesRole, full_name: user.name, email: user.email })
    .eq('id', user.id);
  if (profilesError) {
    throw new Error(`[seed-auth-users] profiles ${user.email}: ${profilesError.message}`);
  }
}

/**
 * Fail here — loudly, in one step — rather than as N opaque Playwright login
 * timeouts. Mirrors assertUserProfileLive in tests/runners/supabaseChecks.ts
 * and additionally proves the role resolves to at least one granted module.
 */
async function verify(user) {
  const { data: row, error } = await admin
    .from('users')
    .select('id, role, is_approved, is_active')
    .eq('id', user.id)
    .single();
  if (error) throw new Error(`[seed-auth-users] verify ${user.email}: ${error.message}`);
  if (row.role !== user.role || !row.is_approved || !row.is_active) {
    throw new Error(`[seed-auth-users] verify ${user.email}: unexpected row ${JSON.stringify(row)}`);
  }

  const { count, error: moduleError } = await admin
    .from('role_modules')
    .select('id', { count: 'exact', head: true })
    .eq('role', user.role)
    .eq('is_granted', true);
  if (moduleError) throw new Error(`[seed-auth-users] modules ${user.role}: ${moduleError.message}`);
  if (!count) {
    throw new Error(
      `[seed-auth-users] role '${user.role}' has no granted modules — ` +
        'supabase/seed.sql did not apply, so every route will bounce to /dashboard.',
    );
  }

  // Sign in for real: proves the password + email_confirm landed, which is the
  // one thing a service-role read cannot tell us.
  const { error: signInError } = await probe.auth.signInWithPassword({
    email: user.email,
    password: passwordFor(user),
  });
  if (signInError) {
    throw new Error(`[seed-auth-users] sign-in ${user.email}: ${signInError.message}`);
  }

  console.log(`[seed-auth-users] ok ${user.email} — ${user.role}, ${count} module grant(s)`);
}

for (const user of USERS) {
  const action = await upsertAuthUser(user);
  await applyRoles(user);
  console.log(`[seed-auth-users] ${action} ${user.email}`);
}

const { data: reassigned, error: reassignError } = await admin
  .from('results')
  .update({ user_id: RESULT_OWNER_ID })
  .eq('id', BEE_ZHEN_RESULT_ID)
  .select('id');
if (reassignError) {
  throw new Error(`[seed-auth-users] reassign Bee zhen result: ${reassignError.message}`);
}
// A 0-row update is NOT an error in PostgREST — check it, or a seed.sql that
// never applied slips through and surfaces as a results-manager assertion.
if (!reassigned?.length) {
  throw new Error(
    `[seed-auth-users] result ${BEE_ZHEN_RESULT_ID} ("Bee zhen") not found — ` +
      'supabase/seed.sql did not apply.',
  );
}

for (const user of USERS) await verify(user);

console.log('[seed-auth-users] done — 3 accounts seeded, "Bee zhen" reassigned to super_admin.');
