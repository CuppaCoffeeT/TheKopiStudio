# /design-import — Stage a Claude Design handoff, then promote per-file

**Two modes**: STAGE (default) lands the bundle in `docs/.../export/` for review. PROMOTE applies the mapped Edit for ONE file into `src/`. Never wholesale-copy into `src/`.

## Invocation

```
/design-import <url-or-path>              # STAGE mode
/design-import --promote <staged-file>    # PROMOTE mode
```

- URL form: `https://api.anthropic.com/v1/design/h/<id>`
- Staged path form: `docs/99-refactor/_system/design/handoffs/<YYYY-MM-DD>-<short-hash>/...`

### Always ask for the latest URL before fetching

**Claude Design handoff URLs rotate every export.** The ID in the URL is a one-shot signed link. Even if the user previously shared a URL minutes ago, **always** ask for the latest URL before running STAGE mode:

```
Before I fetch: please paste the **latest** Claude Design handoff URL.
Format: https://api.anthropic.com/v1/design/h/<id>
(These rotate per export — an old URL will 404.)
```

If the user supplies a path (not a URL), skip the ask and jump to step 2.

## STAGE mode (default)

Every Claude Design handoff URL returns the **full design system snapshot** — not a per-session slice. So every stage lands as a dated, full-system snapshot under a single canonical tree.

### 1. Fetch + extract

- URL: `WebFetch` → gzipped tarball saved to tool-results. `Bash` to `mkdir -p /tmp/cd-handoff-<short-id>` + `tar -xzf <saved-path> -C <tmp>`.
- Local path: skip to step 2.

### 2. Resolve the snapshot folder

Always:

```
docs/99-refactor/_system/design/handoffs/<YYYY-MM-DD>-<short-hash>/
```

- `<YYYY-MM-DD>` = today SGT
- `<short-hash>` = last 8 chars of the URL's handoff ID (e.g. `Upp99AisrO` → `p99AisrO`)
- If a folder with the same name already exists today, append `-v2` / `-v3`

Do NOT ask about session — the bundle is full-system, not session-scoped.

### 3. Copy the bundle into the snapshot folder

`cp -R /tmp/cd-handoff-*/* <snapshot-folder>/` — bundle intact. Design history, not production code. Nothing to `src/` yet.

### 4. Compute diff vs previous snapshot

Find the most recent prior snapshot under `docs/99-refactor/_system/design/handoffs/` (by folder name). If one exists, compute per-file diff:
- `new` — file exists in this snapshot, not previous
- `changed` — file exists in both, bytes differ
- `unchanged` — file exists in both, bytes identical
- `removed` — file in previous, not this

If no prior snapshot: everything is `new`.

### 5. Read + write MANIFEST.json

Read the bundle in order for context:
1. `<snapshot>/README.md` — decisions resolved
2. `<snapshot>/chats/*.md` — intent (every transcript in full)
3. `<snapshot>/project/reference/` — `source-tokens.ts`, `source-index.css`, `LOCKED_PICKS.md`, etc
4. `<snapshot>/project/preview/*.html` — component specs

Write `MANIFEST.json` at the snapshot root. **The `files[]` array is FLAT at the top level** — no nesting. Group files by the `group` field.

#### Schema per file entry

| Field | Required | Values | Notes |
|---|---|---|---|
| `group` | yes | `ui-kit` · `type` · `colors` · `spacing` · `components` · `brand` · `reference` · `fonts` | Matches Claude Design's own categories — controls visual grouping |
| `name` | yes | Human-readable | Shown as the row title (e.g. `PageShell`, `Type — Families`) |
| `bundle` | yes | Path from snapshot root | The file that gets iframed (if `.html`) or linked |
| `source` | optional | Path from snapshot root | JSX/TS source-of-truth if the preview HTML is just a render |
| `target` | yes (or `null`) | Path from repo root | Where PROMOTE writes. `null` = preview-only, no promotion |
| `diff` | yes | `new` · `changed` · `unchanged` · `removed` | Computed vs previous snapshot |
| `action` | yes | `create` · `edit` · `copy` · `preview-only` · `reference-only` · `read-only` | Drives what PROMOTE does |
| `status` | yes | `staged` · `promoted` · `reference` | `reference` = no promote button |
| `priority` | yes | integer | Sort order within group (lower = earlier) |

#### Group assignment (matches Claude Design's own taxonomy)

The 8 groups below mirror Claude Design's own project-page layout. Diff vs previous snapshot is tracked via the `diff` field — don't use a separate group for "new" items.

| Bundle path pattern | Group | Notes |
|---|---|---|
| `project/preview/archetype-*.html` · `project/ui_kits/appbase/*.html` | `ui-kit` | Archetype showcases — Dashboard, Data table, Overlays, Session shell, Heavyweight Detail, etc. |
| `project/preview/type-*.html` | `type` | Body & UI · Body & mono · Families · Headings · Pixel wordmark |
| `project/preview/color-*.html` | `colors` | Brand red · Neutrals (zinc) · Semantic tokens · Status |
| `project/preview/spacing-*.html` | `spacing` | Motion · Radius · Scale · Shadow |
| `project/preview/component-*.html` | `components` | ALL component previews — existing + new. New ones carry `diff: "new"` |
| `project/preview/brand-*.html` | `brand` | Iconography · Wordmark & mark |
| `project/reference/*.md` · `source-tokens.ts` · `source-index.css` · `chats/*.md` · top-level `README.md` · `project/ui_kits/appbase/*.{md,jsx,css}` (non-archetype) | `reference` | Docs, tokens, source JSX, chat transcripts. Tokens + index.css have real targets; others `target: null`. |
| `project/uploads/*.woff2` | `fonts` | Target `public/fonts/<family>/<file>.woff2` |
| Anything else | `reference` | Catch-all — still show but low priority |

**Naming rule**: Row `name` must read like a Claude Design tile — e.g. `"Components — PageShell"`, `"Type — Families"`, `"Colors — Brand red"`, `"UI Kit — Heavyweight Detail Archetype"`.

**Priority ordering within groups** — match Claude Design's own order:
- ui-kit: Dashboard · Data table · Overlays · Session shell · (session's new archetype last)
- type: Body & UI · Body & mono · Families · Headings · Pixel wordmark
- colors: Brand red · Neutrals (zinc) · Semantic tokens · Status
- spacing: Motion · Radius · Scale · Shadow
- components: App header · Badges & chips · Buttons · Cards · Data row · Inputs · KPI tile · Module tile · Stepper & Timeline · then session's new components alphabetically
- brand: Iconography · Wordmark & mark
- reference: README · chat · source-tokens.ts · source-index.css · LOCKED_PICKS · W08 · CLAUDE_DESIGN_GAME_PLAN · ui_kits source files
- fonts: alphabetical

#### Example MANIFEST.json shape

```json
{
  "handoff_url": "https://api.anthropic.com/v1/design/h/<id>",
  "handoff_id": "<id>",
  "staged_at": "2026-04-20T08:15:00+08:00",
  "staged_by": "/design-import",
  "previous_snapshot": "2026-04-19-<earlier-hash>",
  "diff_summary": { "new": 9, "changed": 2, "unchanged": 47, "removed": 0 },
  "files": [
    {
      "group": "archetype",
      "name": "Heavyweight Detail Archetype (showcase)",
      "bundle": "project/preview/archetype-heavyweight-detail.html",
      "target": null,
      "diff": "new",
      "action": "preview-only",
      "status": "reference",
      "priority": 0
    },
    {
      "group": "heavyweight-detail",
      "name": "PageShell",
      "bundle": "project/preview/component-pageshell.html",
      "source": "project/ui_kits/appbase/src/PageShell.jsx",
      "target": "src/components/primitives/detail/PageShell.tsx",
      "diff": "new",
      "action": "create",
      "status": "staged",
      "priority": 1
    },
    {
      "group": "reference-docs",
      "name": "source-index.css",
      "bundle": "project/reference/source-index.css",
      "target": "src/index.css",
      "diff": "changed",
      "action": "edit (patch @theme block)",
      "status": "staged",
      "priority": 61
    }
  ]
}
```

**Golden rule**: after writing the MANIFEST, review the groups in the MANIFEST.json directly. If a file ended up in the wrong group, fix the heuristic above and re-run `/design-import` on the same URL (it will overwrite the same dated folder).

### 6. Auto-archive

If the `handoffs/` folder has > 5 dated snapshots, move the oldest to `handoffs/_archive/`. Never delete.

### 7. Report

Print:
- Snapshot folder path (clickable)
- Diff summary (new / changed / unchanged / removed)
- Stop. The user reviews the staged files, runs `--promote` per file when happy.

**Do not** write anything under `src/` in STAGE mode.

## PROMOTE mode (`--promote <staged-file>`)

### 1. Locate manifest

Read the `MANIFEST.json` in the snapshot folder containing the staged file. Resolve path like:
`docs/99-refactor/_system/design/handoffs/<YYYY-MM-DD>-<hash>/MANIFEST.json`.

### 2. Follow the mapping

| Bundle | Repo target | Action |
|---|---|---|
| `project/reference/source-tokens.ts` | existing tokens file (Grep) | Edit |
| `project/reference/source-index.css` + `colors_and_type.css` | `src/index.css` | Edit (patch `@theme` block) |
| `project/reference/LOCKED_PICKS.md` | `docs/99-refactor/_system/LOCKED_PICKS.md` | Edit (keep repo-only sections) |
| `project/reference/W##_*.md` | matching `docs/99-refactor/_system/workflows/W##_*.md` | Edit (keep repo-only sections) |
| `project/preview/component-<name>.html` | `src/components/primitives/**/<Name>.tsx` (or wherever the target component lives) | Translate HTML→React as a targeted patch (not copy): re-read the spec, keep the prop API backward-compatible, implement all interaction states |
| `project/uploads/*.woff2` | `public/fonts/` | Copy |

### 3. Apply the Edit

- Show diff first. Stop if ambiguous.
- Patch shared components, don't rewrite — keep existing prop APIs backward-compatible (grep consumers before any breaking change).
- Never delete `Errors Encountered` / `What NOT To Try Again` sections from docs.
- After Edit: update `MANIFEST.json` `status: "promoted"` + `promoted_at: <iso>`.

### 4. Verify

- `tsc --noEmit` + `npm run build` — no TS/CSS breakage.
- List touched files + MANIFEST status.

## Rules

- **Never** auto-apply without showing the diff summary (both modes).
- **Never** wholesale-copy bundle HTML prototypes into `src/`. They stay in `docs/.../export/`.
- **Never** run PROMOTE if the staged file's `status != "staged"` — already promoted or unknown → ask.
- If the chat transcript contradicts the HTML, **transcript wins** — ask user.
- Archive old exports: if a session folder has > 5 dated exports, move the oldest to `export/_archive/`.

## Scope

**Belongs**: ingesting a Claude Design handoff (stage) or promoting one staged file to `src/` (promote).
**Doesn't**: designing in-repo · outbound prompt (→ `/design-prompt`) · direct-to-src imports.

## Related

- [/design-prompt](design-prompt.md) — the outbound counterpart
