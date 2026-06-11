#!/usr/bin/env node
// update-ledger-green.mjs — stamp the "Last comprehensive green" line in the ledger.
// Usage: node scripts/ci/update-ledger-green.mjs <ledgerPath> <isoDate> <summary>
// Target line: **Last comprehensive green**: <isoDate> SGT · <summary>
//   exists  → replace in place
//   absent  → insert after "Last local green" line; else after "Last CI green";
//             else after the first blank line following the H1.
// Idempotent. Preserves all other content + trailing newline. Only node:fs.

import { readFileSync, writeFileSync } from 'node:fs';

const [, , ledgerPath, isoDate, summary] = process.argv;

if (!ledgerPath) {
  process.stderr.write('update-ledger-green: missing <ledgerPath>\n');
  process.exit(3);
}

let text;
try {
  text = readFileSync(ledgerPath, 'utf8');
} catch {
  process.stderr.write(`update-ledger-green: cannot read ${ledgerPath}\n`);
  process.exit(3);
}

const line = `**Last comprehensive green**: ${isoDate ?? ''} SGT · ${summary ?? ''}`;

const lines = text.split('\n');
const existingIdx = lines.findIndex((l) => /^\*\*Last comprehensive green\*\*:/.test(l));

if (existingIdx !== -1) {
  // Replace in place — idempotent on re-run.
  lines[existingIdx] = line;
} else {
  // Choose insertion anchor in priority order.
  let anchor = lines.findIndex((l) => /^\*\*Last local green\*\*:/.test(l));
  if (anchor === -1) anchor = lines.findIndex((l) => /^\*\*Last CI green\*\*:/.test(l));
  if (anchor === -1) {
    // First blank line after the H1.
    const h1 = lines.findIndex((l) => /^#\s/.test(l));
    if (h1 !== -1) {
      for (let i = h1 + 1; i < lines.length; i++) {
        if (lines[i].trim() === '') {
          anchor = i;
          break;
        }
      }
    }
  }
  if (anchor === -1) anchor = lines.length - 1; // last resort: append
  lines.splice(anchor + 1, 0, line);
}

writeFileSync(ledgerPath, lines.join('\n'), 'utf8');
process.exit(0);
