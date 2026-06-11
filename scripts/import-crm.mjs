#!/usr/bin/env node
/**
 * CRM import SQL generator (Data Spine PRD, P4).
 *
 * Reads a scripts/export-crm.mjs snapshot and emits ONE idempotent transaction
 * (INSERT … ON CONFLICT (id) DO NOTHING, FK order clients → policies →
 * projected_cash_values → interactions → bank_balance_history) plus a separate
 * verification file. The orchestrator runs both against the canonical project
 * via MCP execute_sql — this script never touches a database.
 *
 *   node scripts/import-crm.mjs --export backups/crm-export-2026-06-11.json \
 *     [--users-map '{"old@email":"<public.users uuid>"}' | --users-map map.json] \
 *     [--default-user <uuid>] [--out <sqlfile>] [--verify-out <sqlfile>]
 *
 * Remaps user_id by source-user email via --users-map, falling back to
 * --default-user; any source user left unmapped aborts with the unmatched list
 * (PRD Open Question #2). Preserves source ids/created_at/created_date, NULLs
 * created_by/updated_by, de-dupes projected_cash_values on (policy_id, age)
 * keeping the last occurrence, and recomputes clients.total_bank_balance +
 * last_review_date from each client's latest bank_balance_history row.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const BACKUPS_DIR = fileURLToPath(new URL('../backups/', import.meta.url));
const TABLES = ['clients', 'policies', 'projected_cash_values', 'interactions', 'bank_balance_history'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INSERT_CHUNK = 500;

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

// ---------- CLI ----------

function parseArgs(argv) {
  const args = { export: null, usersMap: null, defaultUser: null, out: null, verifyOut: null };
  for (let i = 2; i < argv.length; i += 1) {
    const flag = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) fail(`missing value for ${flag}`);
      return argv[i];
    };
    if (flag === '--export') args.export = next();
    else if (flag === '--users-map') args.usersMap = next();
    else if (flag === '--default-user') args.defaultUser = next();
    else if (flag === '--out') args.out = next();
    else if (flag === '--verify-out') args.verifyOut = next();
    else fail(`unknown flag ${flag} (see the JSDoc header for usage)`);
  }
  if (!args.export) fail('--export <file> is required (output of scripts/export-crm.mjs)');
  if (args.defaultUser && !UUID_RE.test(args.defaultUser)) fail(`--default-user must be a uuid, got "${args.defaultUser}"`);
  return args;
}

/** Accepts inline JSON or a path to a JSON file; lowercases email keys. */
function loadUsersMap(raw) {
  if (!raw) return {};
  const text = raw.trim().startsWith('{') ? raw : readFileSync(resolve(raw), 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    fail(`--users-map is not valid JSON: ${err.message}`);
  }
  const map = {};
  for (const [email, id] of Object.entries(parsed)) {
    if (!UUID_RE.test(String(id))) fail(`--users-map value for "${email}" must be a public.users uuid, got "${id}"`);
    map[email.toLowerCase()] = String(id);
  }
  return map;
}

// ---------- SQL value formatting ----------

function sqlString(value) {
  return `'${String(value).replace(/\u0000/g, '').replace(/'/g, "''")}'`;
}

function fmtText(value) {
  return value === null || value === undefined ? 'NULL' : sqlString(value);
}

/** fallback: 'NULL' for nullable dates, 'DEFAULT' for NOT NULL DEFAULT current_date/now(). */
function fmtDate(value, fallback) {
  return value === null || value === undefined || value === '' ? fallback : sqlString(value);
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** fallback matches the target column default: '0' for DEFAULT 0 / NOT NULL, 'NULL' otherwise. */
function fmtNumeric(value, fallback) {
  const n = toFiniteNumber(value);
  return n === null ? fallback : String(n);
}

function toInt(value, fallback) {
  const n = toFiniteNumber(value);
  return n === null ? fallback : Math.trunc(n);
}

function fmtBoolean(value) {
  return value === true || value === 'true' || value === 't' ? 'TRUE' : 'FALSE';
}

function fmtUuid(value, context) {
  if (!UUID_RE.test(String(value))) fail(`${context}: expected a uuid, got "${value}" — source data corrupt, aborting`);
  return `'${String(value).toLowerCase()}'`;
}

// ---------- Column specs (target schema = source columns + AppBase audit columns) ----------
// kind: uuid | user | text | date(fallback) | timestamptz | numeric(fallback) | int | boolean | null

const COLUMN_SPECS = {
  clients: [
    ['id', 'uuid'], ['user_id', 'user'], ['name', 'text'], ['email', 'text'], ['phone', 'text'],
    ['date_of_birth', 'date', 'NULL'], ['occupation', 'text'], ['annual_income', 'numeric', 'NULL'],
    ['risk_profile', 'text'], ['notes', 'text'], ['created_date', 'date', 'NULL'],
    ['last_review_date', 'date', 'NULL'], ['next_review_date', 'date', 'NULL'], ['review_frequency', 'text'],
    ['total_bank_balance', 'numeric', '0'], ['cpf_oa', 'numeric', '0'], ['cpf_sa', 'numeric', '0'],
    ['cpf_ma', 'numeric', '0'], ['created_at', 'timestamptz'], ['created_by', 'null'], ['updated_by', 'null'],
  ],
  policies: [
    ['id', 'uuid'], ['user_id', 'user'], ['client_id', 'uuid'], ['type', 'text'], ['provider', 'text'],
    ['policy_number', 'text'], ['premium', 'numeric', '0'], ['frequency', 'text'],
    ['coverage_amount', 'numeric', '0'], ['tpd_coverage', 'numeric', '0'], ['tpd_same_as_death', 'boolean'],
    ['critical_illness_coverage', 'numeric', '0'], ['ci_notes', 'text'],
    ['early_critical_illness_coverage', 'numeric', '0'], ['eci_notes', 'text'],
    ['start_date', 'date', 'NULL'], ['end_date', 'date', 'NULL'], ['status', 'text'],
    ['has_cash_value', 'boolean'], ['current_cash_value', 'numeric', '0'], ['is_investment_linked', 'boolean'],
    ['current_account_value', 'numeric', '0'], ['investment_allocation', 'text'],
    ['illustrated_value_age_55', 'numeric', '0'], ['illustrated_value_age_65', 'numeric', '0'],
    ['ilp_premium_inclusion_percent', 'numeric', '0'], ['is_hospitalization', 'boolean'],
    ['hospital_type', 'text'], ['integrated_shield_cpf', 'numeric', '0'],
    ['integrated_shield_cash', 'numeric', '0'], ['rider_cash', 'numeric', '0'],
    ['created_at', 'timestamptz'], ['created_by', 'null'], ['updated_by', 'null'],
  ],
  projected_cash_values: [
    ['id', 'uuid'], ['user_id', 'user'], ['policy_id', 'uuid'], ['age', 'int'], ['value', 'numeric', '0'],
    ['created_by', 'null'], ['updated_by', 'null'],
  ],
  interactions: [
    ['id', 'uuid'], ['user_id', 'user'], ['client_id', 'uuid'], ['date', 'date', 'DEFAULT'], ['type', 'text'],
    ['notes', 'text'], ['follow_up', 'date', 'NULL'], ['created_at', 'timestamptz'],
    ['created_by', 'null'], ['updated_by', 'null'],
  ],
  bank_balance_history: [
    ['id', 'uuid'], ['user_id', 'user'], ['client_id', 'uuid'], ['date', 'date', 'DEFAULT'],
    ['balance', 'numeric', '0'], ['notes', 'text'], ['created_at', 'timestamptz'],
    ['created_by', 'null'], ['updated_by', 'null'],
  ],
};

function formatValue(row, table, [name, kind, fallback], userIdMap) {
  const value = row[name];
  switch (kind) {
    case 'uuid': return fmtUuid(value, `${table}.${name}`);
    case 'user': {
      const mapped = userIdMap.get(String(value).toLowerCase());
      if (!mapped) fail(`${table}.user_id "${value}" has no remap entry — internal error`);
      return `'${mapped}'`;
    }
    case 'text': return fmtText(value);
    case 'date': return fmtDate(value, fallback);
    case 'timestamptz': return fmtDate(value, 'DEFAULT');
    case 'numeric': return fmtNumeric(value, fallback);
    case 'int': return String(toInt(value, 0));
    case 'boolean': return fmtBoolean(value);
    case 'null': return 'NULL';
    default: return fail(`unknown column kind "${kind}" for ${table}.${name}`);
  }
}

function insertStatements(table, rows, userIdMap) {
  if (rows.length === 0) return [`-- ${table}: no rows in export\n`];
  const specs = COLUMN_SPECS[table];
  const columns = specs.map(([name]) => name).join(', ');
  const statements = [];
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const chunk = rows.slice(i, i + INSERT_CHUNK);
    const values = chunk
      .map((row) => `  (${specs.map((spec) => formatValue(row, table, spec, userIdMap)).join(', ')})`)
      .join(',\n');
    statements.push(`INSERT INTO public.${table} (${columns})\nVALUES\n${values}\nON CONFLICT (id) DO NOTHING;\n`);
  }
  return statements;
}

// ---------- Main ----------

const args = parseArgs(process.argv);
const exportPath = resolve(args.export);
if (!existsSync(exportPath)) fail(`export file not found: ${exportPath}`);

const exportData = JSON.parse(readFileSync(exportPath, 'utf8'));
for (const table of TABLES) {
  if (!Array.isArray(exportData.tables?.[table])) fail(`export file is missing tables.${table} — not an export-crm.mjs snapshot?`);
}
if (!Array.isArray(exportData.users)) fail('export file is missing the users array (source auth users) — re-run export-crm.mjs');

const usersMap = loadUsersMap(args.usersMap);
if (!args.usersMap && !args.defaultUser) {
  fail('provide --users-map (source email → public.users uuid) and/or --default-user <uuid> to remap user_id');
}

// Build source user_id → canonical public.users.id, aborting on unmatched users (Open Question #2).
const emailBySourceId = new Map(exportData.users.map((u) => [String(u.id).toLowerCase(), u.email ? String(u.email).toLowerCase() : null]));
const referencedUserIds = new Set();
for (const table of TABLES) {
  for (const row of exportData.tables[table]) referencedUserIds.add(String(row.user_id).toLowerCase());
}
const userIdMap = new Map();
const unmatched = [];
for (const sourceId of referencedUserIds) {
  const email = emailBySourceId.get(sourceId) ?? null;
  const canonical = (email && usersMap[email]) || args.defaultUser;
  if (canonical) userIdMap.set(sourceId, canonical);
  else unmatched.push(email ?? `(no email — source auth user ${sourceId})`);
}
if (unmatched.length > 0) {
  console.error('✖ unmatched source users — no --users-map entry and no --default-user (PRD Open Question #2: abort and surface):');
  unmatched.sort().forEach((entry) => console.error(`    ${entry}`));
  console.error('  Add them to --users-map or pass --default-user <public.users uuid>, then re-run.');
  process.exit(1);
}

// De-dupe projected_cash_values on (policy_id, age) keeping the LAST occurrence, then sort.
const pcvSource = exportData.tables.projected_cash_values;
const pcvByKey = new Map();
for (const row of pcvSource) pcvByKey.set(`${String(row.policy_id).toLowerCase()}:${toInt(row.age, 0)}`, row);
const pcvRows = [...pcvByKey.values()].sort((a, b) => {
  const byPolicy = String(a.policy_id).localeCompare(String(b.policy_id));
  return byPolicy !== 0 ? byPolicy : toInt(a.age, 0) - toInt(b.age, 0);
});
const pcvDeduped = pcvSource.length - pcvRows.length;

const tableRows = {
  clients: exportData.tables.clients,
  policies: exportData.tables.policies,
  projected_cash_values: pcvRows,
  interactions: exportData.tables.interactions,
  bank_balance_history: exportData.tables.bank_balance_history,
};
const clientIds = tableRows.clients.map((row) => fmtUuid(row.id, 'clients.id'));

// ---------- Import SQL ----------

const date = new Date().toISOString().slice(0, 10);
const generatedAt = new Date().toISOString();
const importSql = [];
importSql.push(
  `-- CRM import generated ${generatedAt} by scripts/import-crm.mjs`,
  `-- Source: ${exportData.source_url} (exported ${exportData.exported_at})`,
  '-- Idempotent: every INSERT is ON CONFLICT (id) DO NOTHING; safe to re-run.',
  '-- Run via MCP execute_sql against the canonical project.',
  '',
  'BEGIN;',
  ''
);
for (const table of TABLES) {
  importSql.push(`-- ${table} (${tableRows[table].length} rows)`);
  importSql.push(...insertStatements(table, tableRows[table], userIdMap));
}
importSql.push(
  '-- Recompute clients.total_bank_balance and last_review_date from each client\'s',
  '-- latest bank_balance_history row (the source app set these from the *touched*,',
  '-- not latest, history record — known data-layer bug, fixed here at import).'
);
if (clientIds.length > 0) {
  importSql.push(
    'UPDATE public.clients AS c',
    'SET total_bank_balance = h.balance,',
    '    last_review_date   = h.date',
    'FROM (',
    '  SELECT DISTINCT ON (client_id) client_id, balance, date',
    '  FROM public.bank_balance_history',
    '  ORDER BY client_id, date DESC, created_at DESC',
    ') AS h',
    'WHERE h.client_id = c.id',
    `  AND c.id IN (\n${clientIds.map((id) => `    ${id}`).join(',\n')}\n  );`,
    ''
  );
} else {
  importSql.push('-- no clients in export; recompute skipped', '');
}
importSql.push('COMMIT;', '');

// ---------- Verification SQL ----------

const verifySql = [
  `-- CRM import verification generated ${generatedAt} by scripts/import-crm.mjs`,
  '-- Run via MCP execute_sql after the import transaction.',
  '',
  `-- 1) Row-count parity. Expected: ${TABLES.map((t) => `${t}=${tableRows[t].length}`).join(', ')}`,
  `--    (projected_cash_values expectation is post-de-dupe; source export had ${pcvSource.length}.)`,
  `SELECT 'clients' AS table_name, count(*) AS row_count FROM public.clients`,
  ...TABLES.slice(1).map((t) => `UNION ALL SELECT '${t}', count(*) FROM public.${t}`),
  'ORDER BY table_name;',
  '',
  '-- 2) total_bank_balance / last_review_date vs latest history row — expect ZERO rows.',
];
if (clientIds.length > 0) {
  verifySql.push(
    'SELECT c.id, c.name, c.total_bank_balance, h.balance AS latest_history_balance,',
    '       c.last_review_date, h.date AS latest_history_date',
    'FROM public.clients AS c',
    'JOIN (',
    '  SELECT DISTINCT ON (client_id) client_id, balance, date',
    '  FROM public.bank_balance_history',
    '  ORDER BY client_id, date DESC, created_at DESC',
    ') AS h ON h.client_id = c.id',
    `WHERE c.id IN (\n${clientIds.map((id) => `    ${id}`).join(',\n')}\n  )`,
    '  AND (c.total_bank_balance IS DISTINCT FROM h.balance',
    '       OR c.last_review_date IS DISTINCT FROM h.date);',
    ''
  );
} else {
  verifySql.push('-- no clients in export; consistency check skipped', '');
}

// ---------- Write + summary ----------

const outPath = args.out ? resolve(args.out) : join(BACKUPS_DIR, `crm-import-${date}.sql`);
const verifyOutPath = args.verifyOut ? resolve(args.verifyOut) : join(BACKUPS_DIR, `crm-verify-${date}.sql`);
mkdirSync(dirname(outPath), { recursive: true });
mkdirSync(dirname(verifyOutPath), { recursive: true });
writeFileSync(outPath, importSql.join('\n'));
writeFileSync(verifyOutPath, verifySql.join('\n'));

for (const table of TABLES) console.log(`✓ ${table}: ${tableRows[table].length} rows`);
console.log(`✓ user_id remap: ${userIdMap.size} source user(s) → ${new Set(userIdMap.values()).size} canonical user(s)`);
console.log(`✓ projected_cash_values de-duped on (policy_id, age): ${pcvDeduped} duplicate row(s) dropped (last occurrence kept)`);
console.log(`✓ import SQL written: ${outPath}`);
console.log(`✓ verify SQL written: ${verifyOutPath}`);
process.exit(0);
