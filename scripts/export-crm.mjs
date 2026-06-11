#!/usr/bin/env node
/**
 * One-time CRM book export from the old Insurance-CRM Supabase project (Data Spine PRD, P4).
 *
 * Reads ALL rows of clients, policies, projected_cash_values, interactions and
 * bank_balance_history (paginated select *) plus the source auth users (id+email,
 * for user_id remapping at import time) and writes a single JSON snapshot to
 * backups/crm-export-<YYYY-MM-DD>.json (backups/ is gitignored).
 *
 *   SOURCE_SUPABASE_SERVICE_ROLE_KEY=… node scripts/export-crm.mjs
 *
 * Env:
 *   SOURCE_SUPABASE_URL               source project URL (default: old CRM project)
 *   SOURCE_SUPABASE_SERVICE_ROLE_KEY  REQUIRED — service_role key of the old project
 *
 * Also auto-loads "/Users/tenshi/Documents/Projects/Insurance CRM/.env.migration"
 * when present (simple KEY=VALUE lines), so the key never has to live in the shell
 * history or this repo. Never commit the key.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const ENV_MIGRATION_FILE = '/Users/tenshi/Documents/Projects/Insurance CRM/.env.migration';
const DEFAULT_SOURCE_URL = 'https://uivdgousiyfeyrebloaz.supabase.co';
const TABLES = ['clients', 'policies', 'projected_cash_values', 'interactions', 'bank_balance_history'];
const PAGE_SIZE = 1000;
const BACKUPS_DIR = fileURLToPath(new URL('../backups/', import.meta.url));

/** Minimal .env line parser (no dependency): KEY=VALUE, # comments, optional quotes. */
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

/** Pages through select * 1000 rows at a time until a short page. */
async function fetchAllRows(supabase, table) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table} (rows ${from}–${from + PAGE_SIZE - 1}): ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Pages through auth.admin.listUsers explicitly (its default page size is only 50). */
async function fetchAllAuthUsers(supabase) {
  const users = [];
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`auth.admin.listUsers (page ${page}): ${error.message}`);
    users.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? null })));
    if (data.users.length < perPage) break;
  }
  return users;
}

loadEnvFile(ENV_MIGRATION_FILE);

const sourceUrl = process.env.SOURCE_SUPABASE_URL || DEFAULT_SOURCE_URL;
const serviceRoleKey = process.env.SOURCE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('✖ SOURCE_SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.error('  Get it from the old CRM Supabase dashboard:');
  console.error('    1. Open the old CRM project dashboard (uivdgousiyfeyrebloaz)');
  console.error('    2. Project Settings → API → service_role key');
  console.error(`    3. Put SOURCE_SUPABASE_SERVICE_ROLE_KEY=<key> in "${ENV_MIGRATION_FILE}"`);
  console.error('  This script auto-loads that file when present. Never commit the key.');
  process.exit(1);
}

const supabase = createClient(sourceUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

try {
  const tables = {};
  const counts = {};
  for (const table of TABLES) {
    tables[table] = await fetchAllRows(supabase, table);
    counts[table] = tables[table].length;
    console.log(`✓ ${table}: ${counts[table]} rows`);
  }

  const users = await fetchAllAuthUsers(supabase);
  console.log(`✓ auth users: ${users.length}`);

  mkdirSync(BACKUPS_DIR, { recursive: true });
  const outFile = join(BACKUPS_DIR, `crm-export-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(
    outFile,
    JSON.stringify({ exported_at: new Date().toISOString(), source_url: sourceUrl, counts, users, tables }, null, 2) + '\n'
  );
  console.log(`✓ export written: ${outFile}`);
  process.exit(0);
} catch (err) {
  console.error(`✖ export failed: ${err.message}`);
  process.exit(1);
}
