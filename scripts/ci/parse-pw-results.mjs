#!/usr/bin/env node
// parse-pw-results.mjs — parse a Playwright JSON report, emit a verdict.
// Usage: node scripts/ci/parse-pw-results.mjs <jsonPath> [field]
//   field omitted  → one line compact JSON {verdict,expected,unexpected,flaky,skipped,failedSpecFiles}
//   field=verdict  → just the verdict word (green|red|error)
//   field=failed   → failedSpecFiles, newline-separated (empty if none)
// verdict=green iff unexpected===0 AND expected>=1; else red. Unparseable ⇒ error + exit 3.
// Only node:fs. No external deps.

import { readFileSync } from 'node:fs';

const [, , jsonPath, field] = process.argv;

// --- emit "error" verdict + exit 3 (bad path / bad JSON) ---
function fail() {
  if (field === 'verdict') process.stdout.write('error\n');
  else if (field === 'failed') process.stdout.write('');
  else
    process.stdout.write(
      JSON.stringify({
        verdict: 'error',
        expected: 0,
        unexpected: 0,
        flaky: 0,
        skipped: 0,
        failedSpecFiles: [],
      }) + '\n'
    );
  process.exit(3);
}

if (!jsonPath) fail();

let report;
try {
  report = JSON.parse(readFileSync(jsonPath, 'utf8'));
} catch {
  fail();
}
if (!report || typeof report !== 'object') fail();

// --- recursive walk: count test statuses + collect failed spec files ---
const counts = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
const failedFiles = new Set();
const cwd = process.cwd();

// Normalise an absolute path to repo-relative; leave relative paths alone.
function rel(p) {
  if (!p) return p;
  if (p.startsWith(cwd + '/')) return p.slice(cwd.length + 1);
  return p;
}

function walkSuite(suite, inheritedFile) {
  if (!suite || typeof suite !== 'object') return;
  const file = suite.file || inheritedFile;

  for (const spec of suite.specs || []) {
    const specFile = spec.file || file;
    let specFailed = spec.ok === false;
    for (const test of spec.tests || []) {
      const status = test.status; // expected|unexpected|flaky|skipped
      if (status && counts[status] !== undefined) counts[status]++;
      if (status === 'unexpected') specFailed = true;
    }
    if (specFailed && specFile) failedFiles.add(rel(specFile));
  }

  for (const child of suite.suites || []) walkSuite(child, file);
}

for (const top of report.suites || []) walkSuite(top, top.file);

// --- prefer top-level stats when present; fall back to counted tests ---
const stats = report.stats && typeof report.stats === 'object' ? report.stats : null;
const expected = stats && Number.isFinite(stats.expected) ? stats.expected : counts.expected;
const unexpected =
  stats && Number.isFinite(stats.unexpected) ? stats.unexpected : counts.unexpected;
const flaky = stats && Number.isFinite(stats.flaky) ? stats.flaky : counts.flaky;
const skipped = stats && Number.isFinite(stats.skipped) ? stats.skipped : counts.skipped;

// no-tests-ran ⇒ red
const verdict = unexpected === 0 && expected >= 1 ? 'green' : 'red';
const failedSpecFiles = [...failedFiles];

if (field === 'verdict') {
  process.stdout.write(verdict + '\n');
} else if (field === 'failed') {
  process.stdout.write(failedSpecFiles.length ? failedSpecFiles.join('\n') + '\n' : '');
} else {
  process.stdout.write(
    JSON.stringify({ verdict, expected, unexpected, flaky, skipped, failedSpecFiles }) + '\n'
  );
}
process.exit(0);
