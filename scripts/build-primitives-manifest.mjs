#!/usr/bin/env node
/**
 * W11.03 — CLI entry for the primitives adoption manifest.
 *
 * Writes docs/99-refactor/_system/PRIMITIVES_MANIFEST.json.
 *
 * Usage:
 *   node scripts/build-primitives-manifest.mjs [--check]
 *
 * Flags:
 *   --check   Exit non-zero if the manifest would change (CI gate).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPrimitivesManifest } from './primitives-manifest-builder.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(
  REPO_ROOT,
  'docs/99-refactor/_system/PRIMITIVES_MANIFEST.json',
);

const args = process.argv.slice(2);
const checkMode = args.includes('--check');

const manifest = buildPrimitivesManifest(REPO_ROOT);
const serialized = JSON.stringify(manifest, null, 2) + '\n';

if (checkMode) {
  const existing = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf-8') : '';
  // In check mode, compare excluding `generated_at` which shifts every run.
  const strip = (s) => s.replace(/"generated_at":\s*"[^"]*",?\n?/, '');
  if (strip(existing) !== strip(serialized)) {
    console.error('❌ Manifest is stale — run `npm run primitives:manifest` and commit.');
    process.exit(1);
  }
  console.log('✅ Manifest up-to-date.');
  process.exit(0);
}

fs.writeFileSync(OUT_PATH, serialized);
console.log(
  `✅ ${manifest.total_primitives} primitives · ${manifest.total_adopters} total adoptions → ${path.relative(REPO_ROOT, OUT_PATH)}`,
);
