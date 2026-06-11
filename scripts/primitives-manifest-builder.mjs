/**
 * W11.03 — Primitives adoption manifest builder.
 *
 * Pure function. Scans src/components/primitives/** + greps all src/** for
 * imports + reads the latest handoff snapshot's MANIFEST.json to compute
 * Designed/Built/Adopted status for every primitive.
 *
 * Used by:
 *   - scripts/build-primitives-manifest.mjs (CLI)
 *   - vite.config.ts docsAssetsPlugin (live endpoint /api/primitives-manifest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { COMPOSITION_PRIMITIVES } from './lib/composition-primitives.mjs';

const IGNORE_FILE_SUFFIXES = ['.test.tsx', '.stories.tsx', '.spec.tsx'];
const IGNORE_FILES = new Set(['index.ts', 'index.tsx', 'CONTEXT.md']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.git']);

function isPrimitiveFile(name) {
  if (IGNORE_FILES.has(name)) return false;
  if (!name.endsWith('.tsx')) return false;
  return !IGNORE_FILE_SUFFIXES.some((s) => name.endsWith(s));
}

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function listPrimitives(repoRoot) {
  const primitivesDir = path.join(repoRoot, 'src/components/primitives');
  if (!fs.existsSync(primitivesDir)) return [];
  const out = [];

  // Top-level groups (subfolders like shell · overlays · dashboard · detail · ui)
  const entries = fs.readdirSync(primitivesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const groupDir = path.join(primitivesDir, entry.name);
      const files = fs.readdirSync(groupDir).filter(isPrimitiveFile);
      for (const file of files) {
        out.push({
          name: file.replace(/\.tsx$/, ''),
          group: entry.name,
          file: path.relative(repoRoot, path.join(groupDir, file)),
        });
      }
    } else if (isPrimitiveFile(entry.name)) {
      // Root-level primitives (rare)
      out.push({
        name: entry.name.replace(/\.tsx$/, ''),
        group: 'root',
        file: path.relative(repoRoot, path.join(primitivesDir, entry.name)),
      });
    }
  }
  return out;
}

function collectTsFiles(dir, out = []) {
  walk(dir, (file) => {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) out.push(file);
  });
  return out;
}

/**
 * Extract all import statements from source content. Each statement is parsed
 * into `{ names: string[], source: string }` where names are the destructured
 * identifiers (excluding `type` prefix) and source is the module specifier.
 *
 * Handles: multi-line imports, `type` prefix, aliased `as` imports, default
 * imports mixed with named. Excludes matches inside comments via whole-word
 * line-start anchoring.
 */
function extractImports(content) {
  const results = [];
  // Line-anchored: `^import` (optionally with `type` for type-only imports).
  // Captures everything up to the matching `from '...'` — non-greedy.
  const re = /^\s*import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const body = m[2].trim();
    const source = m[3];
    const names = [];
    // Default import before brace: `X, { Y, Z }`
    const braceMatch = body.match(/\{([^}]*)\}/);
    if (braceMatch) {
      for (const raw of braceMatch[1].split(',')) {
        const token = raw.trim();
        if (!token) continue;
        // Strip `type ` prefix, take identifier before `as`.
        const clean = token.replace(/^type\s+/, '').trim().split(/\s+as\s+/)[0].trim();
        if (clean) names.push(clean);
      }
    }
    // Default import (before or without braces): `import X from` or `import X, { ... }`.
    const defaultMatch = body.match(/^([A-Za-z_$][\w$]*)\s*(?:,|$)/);
    if (defaultMatch) {
      names.push(defaultMatch[1]);
    }
    // Namespace import: `import * as X from`.
    const nsMatch = body.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (nsMatch) {
      names.push(nsMatch[1]);
    }
    results.push({ names, source });
  }
  return results;
}

/**
 * Classify an adopter path into prod / lab / test based on location.
 *
 * - test  — file name contains .test./.spec. or sits under tests/
 * - lab   — preview, mockup feature folders
 * - prod  — everything else (real feature pages + real components that pages use)
 */
function classifyAdopter(relPath) {
  const p = relPath.replace(/\\/g, '/');
  if (/\.test\./.test(p) || /\.spec\./.test(p) || p.startsWith('tests/')) return 'test';
  const LAB_PATTERNS = [
    '/preview/',
    '/mockups/',
  ];
  if (LAB_PATTERNS.some((pat) => p.includes(pat))) return 'lab';
  return 'prod';
}

/**
 * For each composition primitive, return which primitive NAMES it internally imports.
 * Built once per manifest build and reused for every primitive's indirect-adopter scan.
 * Returns Map<repoRelCompFile, { displayName, internalNames: Set<string> }>.
 */
function buildCompositionInternalsMap(repoRoot, primitiveNames) {
  const map = new Map();
  const nameSet = new Set(primitiveNames);
  for (const [compFile, displayName] of Object.entries(COMPOSITION_PRIMITIVES)) {
    const full = path.join(repoRoot, compFile);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf-8');
    // Parse every import statement (absolute OR relative) — composition primitives
    // often live inside primitives/<group>/ and reference siblings via `./X`, which
    // wouldn't match an absolute-only pattern.
    const re = /import\s*(?:type\s+)?\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;
    const internalNames = new Set();
    let m;
    while ((m = re.exec(content)) !== null) {
      const names = m[1]
        .split(',')
        .map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      for (const n of names) {
        if (nameSet.has(n)) internalNames.add(n);
      }
    }
    map.set(compFile, { displayName, internalNames });
  }
  return map;
}

/**
 * Does `file` (consumer) import this composition wrapper?
 * Accepts direct-path or barrel imports.
 */
function fileImportsComposition(imports, compFile) {
  const baseName = path.basename(compFile, '.tsx');
  const directPath = `@/${compFile.replace('src/', '').replace('.tsx', '')}`;
  const groupBarrel = compFile.startsWith('src/components/primitives/')
    ? `@/components/primitives/${compFile.split('/')[3]}`
    : null;
  const shimPath = compFile === 'src/components/DashboardHeader.tsx'
    ? '@/components/DashboardHeader'
    : null;
  return imports.some((imp) => {
    if (imp.source === directPath) return true;
    if (shimPath && imp.source === shimPath) return true;
    if (groupBarrel && imp.source === groupBarrel && imp.names.includes(baseName)) return true;
    return false;
  });
}

function listAdopters(primitive, tsFiles, repoRoot, compositionInternals) {
  const adopters = [];
  const targetFilePath = path.join(repoRoot, primitive.file);
  const groupBarrel = `@/components/primitives/${primitive.group}`;
  const directFile = `@/components/primitives/${primitive.group}/${primitive.name}`;
  const rootBarrel = `@/components/primitives`;

  // Compositions whose internal primitive set INCLUDES this primitive — used for indirect scan.
  const compositionsUsingThis = [...compositionInternals.entries()]
    .filter(([, meta]) => meta.internalNames.has(primitive.name))
    .map(([compFile, meta]) => ({ compFile, displayName: meta.displayName }));

  const seenFiles = new Set();

  for (const file of tsFiles) {
    if (file === targetFilePath) continue;
    // Skip other primitive files — they're co-located siblings, not adopters
    if (file.includes(`${path.sep}src${path.sep}components${path.sep}primitives${path.sep}`)) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    const imports = extractImports(content);
    const rel = path.relative(repoRoot, file);

    // 1) Direct adopter — imports this primitive straight.
    const directMatch = imports.some((imp) => {
      if (imp.source === directFile) return true;
      if (imp.source === groupBarrel && imp.names.includes(primitive.name)) return true;
      if (imp.source === rootBarrel && imp.names.includes(primitive.name)) return true;
      return false;
    });
    if (directMatch) {
      seenFiles.add(rel);
      adopters.push({ file: rel, kind: classifyAdopter(rel) });
      continue;
    }

    // 2) Indirect adopter — imports a composition wrapper whose internal set includes this primitive.
    for (const { compFile, displayName } of compositionsUsingThis) {
      if (file === path.join(repoRoot, compFile)) continue; // skip composition's own file
      if (fileImportsComposition(imports, compFile)) {
        if (seenFiles.has(rel)) break;
        seenFiles.add(rel);
        adopters.push({ file: rel, kind: classifyAdopter(rel), source: `via ${displayName}` });
        break; // one composition attribution is enough
      }
    }
  }
  adopters.sort((a, b) => a.file.localeCompare(b.file));
  return adopters;
}

function getLatestHandoffDesignedSet(repoRoot) {
  const handoffsDir = path.join(
    repoRoot,
    'docs/99-refactor/_system/design/handoffs',
  );
  if (!fs.existsSync(handoffsDir)) {
    return { latest: null, designedTargets: new Set(), previewMap: new Map() };
  }
  // Sort by MANIFEST.staged_at when present (so a new same-day snapshot wins
  // even if its hash suffix sorts earlier alphabetically). Fallback to folder
  // name for snapshots without a MANIFEST.
  const snapshots = fs
    .readdirSync(handoffsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
    .map((e) => {
      const name = e.name;
      const mp = path.join(handoffsDir, name, 'MANIFEST.json');
      let stagedAt = null;
      try {
        if (fs.existsSync(mp)) {
          const m = JSON.parse(fs.readFileSync(mp, 'utf-8'));
          stagedAt = m.staged_at ?? null;
        }
      } catch { /* ignore */ }
      return { name, stagedAt };
    })
    .sort((a, b) => {
      // Prefer staged_at descending; fall back to folder name descending.
      const ta = a.stagedAt ?? '';
      const tb = b.stagedAt ?? '';
      if (ta && tb && ta !== tb) return tb.localeCompare(ta);
      return b.name.localeCompare(a.name);
    })
    .map((s) => s.name);
  const emptyMatchers = { has: () => false, previewFor: () => null };
  if (!snapshots.length) {
    return { latest: null, designedTargets: new Set(), previewMap: new Map(), folderMatchers: emptyMatchers };
  }
  const latest = snapshots[0];
  const manifestPath = path.join(handoffsDir, latest, 'MANIFEST.json');
  if (!fs.existsSync(manifestPath)) {
    return { latest, designedTargets: new Set(), previewMap: new Map(), folderMatchers: emptyMatchers };
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const targets = new Set();
    const folderTargets = []; // [{ prefix, url }] for folder-level coverage
    const previewMap = new Map(); // target → preview URL (iframe src)
    for (const f of manifest.files ?? []) {
      if (f.target && typeof f.target === 'string') {
        const raw = f.target.trim();
        const isFolder = raw.endsWith('/');
        const t = raw.replace(/\/$/, '');
        const url = (f.bundle && typeof f.bundle === 'string' && f.bundle.endsWith('.html'))
          ? `/docs-assets/handoffs/${latest}/${f.bundle}`
          : null;
        if (isFolder) {
          folderTargets.push({ prefix: t + '/', url });
        } else {
          targets.add(t);
          if (url && !previewMap.has(t)) previewMap.set(t, url);
        }
      }
    }
    // Second pass: folder coverage — every primitive file under a folder
    // target is considered designed. Preview URL falls back to the folder's
    // ui-kit HTML if the primitive has no dedicated component-*.html.
    const folderMatchers = {
      has(file) {
        return folderTargets.some((ft) => file.startsWith(ft.prefix));
      },
      previewFor(file) {
        const ft = folderTargets.find((ft) => file.startsWith(ft.prefix) && ft.url);
        return ft?.url ?? null;
      },
    };
    return { latest, designedTargets: targets, previewMap, folderMatchers };
  } catch {
    return { latest, designedTargets: new Set(), previewMap: new Map(), folderMatchers: { has: () => false, previewFor: () => null } };
  }
}

function fileLastModified(repoRoot, relFile) {
  try {
    const stat = fs.statSync(path.join(repoRoot, relFile));
    return stat.mtime.toISOString();
  } catch {
    return null;
  }
}

/**
 * Pending primitives — designed in the latest handoff but don't yet exist in src/.
 * Derived by subtracting built primitive targets from handoff targets under
 * src/components/primitives/.
 */
function listPendingPrimitives(repoRoot, builtFiles, designedTargets, previewMap, latestHandoff) {
  const pending = [];
  if (!latestHandoff) return pending;
  const manifestPath = path.join(
    repoRoot,
    'docs/99-refactor/_system/design/handoffs',
    latestHandoff,
    'MANIFEST.json',
  );
  if (!fs.existsSync(manifestPath)) return pending;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return pending;
  }
  const builtSet = new Set(builtFiles);
  const seen = new Set();
  // Prefer entries that point at preview HTMLs (bundle ends with .html) as the
  // promote source — they're the visual spec. Fall back to JSX entries.
  const sorted = [...(manifest.files ?? [])].sort((a, b) => {
    const ah = a.bundle?.endsWith('.html') ? 0 : 1;
    const bh = b.bundle?.endsWith('.html') ? 0 : 1;
    return ah - bh;
  });
  for (const f of sorted) {
    if (!f.target || typeof f.target !== 'string') continue;
    const target = f.target.trim().replace(/\/$/, '');
    if (!target.startsWith('src/components/primitives/')) continue;
    if (builtSet.has(target)) continue;
    if (seen.has(target)) continue; // Dedupe — one row per target
    seen.add(target);
    // Parse group + name from target path
    const relFromPrimitives = target.replace(/^src\/components\/primitives\//, '');
    const parts = relFromPrimitives.split('/');
    if (parts.length < 2) continue; // Not a file
    const fileName = parts.pop();
    if (!fileName.endsWith('.tsx')) continue;
    const name = fileName.replace(/\.tsx$/, '');
    const group = parts.join('/') || 'root';
    pending.push({
      name,
      group,
      file: target,
      bundle: f.bundle,
      preview_html: previewMap.get(target) ?? null,
    });
  }
  return pending;
}

export function buildPrimitivesManifest(repoRoot) {
  const primitives = listPrimitives(repoRoot);
  const {
    latest: latestHandoff,
    designedTargets,
    previewMap,
    folderMatchers,
  } = getLatestHandoffDesignedSet(repoRoot);
  const srcDir = path.join(repoRoot, 'src');
  const tsFiles = collectTsFiles(srcDir);
  // Build the composition-internals map ONCE — reused for every primitive's
  // indirect-adopter scan. Prevents re-reading wrapper files N times.
  const primitiveNames = primitives.map((p) => p.name);
  const compositionInternals = buildCompositionInternalsMap(repoRoot, primitiveNames);

  const rows = primitives.map((p) => {
    const adopters = listAdopters(p, tsFiles, repoRoot, compositionInternals);
    // Designed = latest handoff MANIFEST has (a) an exact target match OR
    // (b) a folder-level target that contains this primitive file.
    const designed = designedTargets.has(p.file) || folderMatchers.has(p.file);
    const directAdopters = adopters.filter((a) => !a.source);
    const indirectAdopters = adopters.filter((a) => a.source);
    const prodAdopters = directAdopters.filter((a) => a.kind === 'prod');
    const labAdopters = directAdopters.filter((a) => a.kind === 'lab');
    const testAdopters = directAdopters.filter((a) => a.kind === 'test');
    const preview_html = previewMap.get(p.file) ?? folderMatchers.previewFor(p.file) ?? null;
    return {
      name: p.name,
      group: p.group,
      file: p.file,
      designed,
      built: true,
      // `live` = has any prod adopter (direct OR indirect). Indirect prod adopters
      // come through a composition wrapper — they still count as "in production".
      live: prodAdopters.length > 0 || indirectAdopters.some((a) => a.kind === 'prod'),
      preview_html,
      last_modified: fileLastModified(repoRoot, p.file),
      adopters,
      adoption_count: adopters.length,
      prod_count: prodAdopters.length,
      lab_count: labAdopters.length,
      test_count: testAdopters.length,
      indirect_count: indirectAdopters.length,
    };
  });

  // Add pending primitives — designed but not yet built
  const pending = listPendingPrimitives(
    repoRoot,
    primitives.map((p) => p.file),
    designedTargets,
    previewMap,
    latestHandoff,
  );
  for (const p of pending) {
    rows.push({
      name: p.name,
      group: p.group,
      file: p.file,
      designed: true,
      built: false,
      live: false,
      preview_html: p.preview_html,
      bundle: p.bundle,
      last_modified: null,
      adopters: [],
      adoption_count: 0,
      prod_count: 0,
      lab_count: 0,
      test_count: 0,
    });
  }

  rows.sort((a, b) => {
    if (a.group !== b.group) return a.group.localeCompare(b.group);
    return a.name.localeCompare(b.name);
  });

  const groupSummary = {};
  for (const r of rows) {
    if (!groupSummary[r.group]) {
      groupSummary[r.group] = {
        total: 0,
        adopted: 0,
        live: 0,
        designed: 0,
        total_adoption: 0,
        total_prod: 0,
      };
    }
    groupSummary[r.group].total += 1;
    if (r.designed) groupSummary[r.group].designed += 1;
    if (r.adoption_count > 0) groupSummary[r.group].adopted += 1;
    if (r.live) groupSummary[r.group].live += 1;
    groupSummary[r.group].total_adoption += r.adoption_count;
    groupSummary[r.group].total_prod += r.prod_count;
  }

  return {
    generated_at: new Date().toISOString(),
    latest_handoff: latestHandoff,
    total_primitives: rows.length,
    total_adopters: rows.reduce((sum, r) => sum + r.adoption_count, 0),
    group_summary: groupSummary,
    primitives: rows,
  };
}
