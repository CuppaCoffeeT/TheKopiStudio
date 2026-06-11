/**
 * Results cleanup — zero-residue safety net for specs that insert REAL
 * `public.results` rows through the UI.
 *
 * Deletes rows by EXACT `prospect_name` via PostgREST, authenticated as the
 * ROLE'S OWN saved session (tests/.auth/<role>.json, minted by
 * tests/auth.setup.ts each suite invocation). No service-role key is used —
 * the legacy RLS delete policy (`auth.uid() = user_id`) means this can only
 * ever remove rows the e2e role itself created, never the 8 legacy results
 * or another account's rows, even if the name filter were somehow wrong.
 *
 * Idempotent: 0 matching rows is success (the happy path — specs delete
 * through the UI; this runner only catches mid-flow failures/retries).
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import type { APIRequestContext } from '@playwright/test';
import { authFileFor, type AuthRole } from '../fixtures/roleAuth';

// The dev-server env (.env) carries the Supabase URL + publishable key; load it
// here because worker processes don't re-run playwright.config's dotenv import.
const ENV_FILE = resolve(process.cwd(), '.env');
if (existsSync(ENV_FILE)) config({ path: ENV_FILE });

interface StorageStateOrigin {
  origin: string;
  localStorage: { name: string; value: string }[];
}

/** supabase-js persists the session under `sb-<project-ref>-auth-token`. */
function accessTokenFor(role: AuthRole): string {
  const file = resolve(process.cwd(), authFileFor(role));
  if (!existsSync(file)) {
    throw new Error(
      `[resultsCleanup] no saved session for role "${role}" at ${file} — ` +
        'run under playwright.parallel.config.ts so tests/auth.setup.ts mints it.',
    );
  }
  const state = JSON.parse(readFileSync(file, 'utf-8')) as { origins?: StorageStateOrigin[] };
  for (const origin of state.origins ?? []) {
    for (const entry of origin.localStorage) {
      if (/^sb-.+-auth-token$/.test(entry.name)) {
        const session = JSON.parse(entry.value) as { access_token?: string };
        if (session.access_token) return session.access_token;
      }
    }
  }
  throw new Error(`[resultsCleanup] no sb-*-auth-token entry in ${file}`);
}

/**
 * Hard-delete every `results` row with EXACTLY this prospect_name that the
 * given role's RLS lets it delete (its own rows). Returns how many rows were
 * removed so callers can log unexpected residue.
 */
export async function deleteOwnResultsByProspect(
  request: APIRequestContext,
  role: AuthRole,
  prospectName: string,
): Promise<number> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      '[resultsCleanup] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing — check <repo>/.env',
    );
  }

  const response = await request.delete(
    `${supabaseUrl}/rest/v1/results?prospect_name=eq.${encodeURIComponent(prospectName)}`,
    {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessTokenFor(role)}`,
        // Representation so the caller can count what was actually removed.
        Prefer: 'return=representation',
      },
    },
  );
  if (!response.ok()) {
    throw new Error(
      `[resultsCleanup] DELETE results?prospect_name=eq.${prospectName} → ` +
        `${response.status()}: ${await response.text()}`,
    );
  }
  const rows = (await response.json()) as { id: string }[];
  return rows.length;
}
