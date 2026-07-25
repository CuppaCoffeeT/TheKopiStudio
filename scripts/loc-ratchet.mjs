#!/usr/bin/env node
/**
 * Per-file LOC ratchet (W23 quality gate).
 *
 * Fails if the number of source files exceeding the LOC ceiling grows beyond the
 * committed baseline (.loc-baseline.json). Decompose a new oversized file (or split
 * an old one) to keep the count non-increasing. The count may only go DOWN.
 *
 *   npm run loc:check       # verify against baseline (CI/pre-push)
 *   npm run loc:baseline    # re-baseline AFTER a deliberate, reviewed reduction
 *
 * Excludes generated Supabase types + tests. Tracks git-tracked src/*.ts(x) only.
 *
 * `git ls-files` reports the INDEX, not the worktree, so a file deleted but not
 * yet staged is still listed and used to crash the run with ENOENT. Such files
 * are skipped: a file that is not on disk has no lines and can never be an
 * offender, so skipping it cannot let an oversized file through the gate. Note
 * that files that are new and unstaged are likewise invisible to `git ls-files`
 * — the gate only becomes authoritative once changes are staged.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const CEILING = 200;
const BASELINE_FILE = '.loc-baseline.json';
const update = process.argv.includes('--update');

const files = execSync("git ls-files 'src/*.ts' 'src/*.tsx' 'src/**/*.ts' 'src/**/*.tsx'", { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => f !== 'src/integrations/supabase/types.ts')
  .filter((f) => !/\.(test|spec)\.tsx?$/.test(f))
  .filter((f) => existsSync(f)); // tracked but deleted in the worktree — see header

const over = files
  .map((f) => ({ f, loc: readFileSync(f, 'utf8').split('\n').length }))
  .filter((x) => x.loc > CEILING)
  .sort((a, b) => b.loc - a.loc);

const current = over.length;

if (update || !existsSync(BASELINE_FILE)) {
  writeFileSync(
    BASELINE_FILE,
    JSON.stringify({ filesOverCeiling: current, ceiling: CEILING, updated: new Date().toISOString().slice(0, 10) }, null, 2) + '\n'
  );
  console.log(`LOC ratchet baseline set: ${current} files over ${CEILING} LOC.`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
if (current > baseline.filesOverCeiling) {
  console.error(`✖ LOC ratchet FAILED: ${current} files over ${CEILING} LOC (baseline ${baseline.filesOverCeiling}, +${current - baseline.filesOverCeiling}).`);
  console.error('  Decompose the new oversized file(s) into sub-components/hooks/lib, or split an existing one. Worst offenders:');
  over.slice(0, 12).forEach((o) => console.error(`    ${String(o.loc).padStart(5)}  ${o.f}`));
  process.exit(1);
}
const headroom = baseline.filesOverCeiling - current;
console.log(`✓ LOC ratchet: ${current} ≤ baseline ${baseline.filesOverCeiling} files over ${CEILING} LOC${headroom > 0 ? ` (${headroom} below — run \`npm run loc:baseline\` to lock the gain)` : ''}.`);
process.exit(0);
