Audit and maintain CONTEXT.md files across the project. Can be run manually or by the docs-monitor agent nightly.

## What This Command Does

1. Scans all folders for missing or stale CONTEXT.md files
2. Updates `docs/CONTEXT_MAP.md` with current state
3. Flags folders that need a new CONTEXT.md
4. Optionally creates missing CONTEXT.md files (with approval)

## Step 1: Scan Folders

For each folder in the project (`src/`, `docs/`, `supabase/`, `.claude/`, and all `docs/` subfolders):

1. Count `.md` files (excluding CONTEXT.md itself)
2. Count subfolders
3. Check if `CONTEXT.md` exists
4. If exists, check last modified date (via git log or file stat)

**Threshold rule**: Flag a folder as "needs CONTEXT.md" when it has **3+ .md files** OR **3+ subfolders** and no CONTEXT.md.

## Step 2: Audit Existing CONTEXT.md Files

Read `docs/CONTEXT_MAP.md` to find which CONTEXT.md is due for audit today (check the "Next Audit" column).

For each CONTEXT.md due today:

1. Read the CONTEXT.md file
2. Compare its Navigation table against actual folder contents
3. Check these sections exist per the standard format:
   - `# [Name]` + description
   - `## What belongs here`
   - `## What does NOT belong here`
   - `## Navigation` (table — for Layer 1 and Layer 2 with subfolders)
   - `## Before working here`
4. Flag mismatches:
   - Subfolder listed in Navigation but doesn't exist → stale
   - Subfolder exists but not in Navigation → missing
   - File counts significantly off → flag

## Step 3: Update CONTEXT_MAP.md

After scanning, update `docs/CONTEXT_MAP.md`:
- Update "Last Audited" dates for folders checked today
- Set "Next Audit" = today + 7 days
- Update file counts and subfolder counts
- Update "Missing CONTEXT.md" assessment table
- Update the Full Tree section if new CONTEXT.md files were created

## Step 4: Create Missing CONTEXT.md (Interactive Only)

For each flagged folder that needs a CONTEXT.md:

1. Show the user: folder path, file count, subfolder count
2. Ask: **"Create CONTEXT.md for this folder?"**
3. If yes, create using the standard format:

**Layer 1 format** (workspace roots: `src/`, `docs/`, `supabase/`, `.claude/`):
```markdown
# [Workspace Name]

[1-2 sentences: what this workspace is for]

## What belongs here
- [Type of content]

## What does NOT belong here
- [Common mistake → goes in X instead]

## Navigation
| Area | Location | Purpose |
|------|----------|---------|

## Before working here
- Reference: [link to relevant rule]
```

**Layer 2 format** (doc subfolders):
```markdown
# [Folder Name]

[1-2 sentences: what this folder contains]. [Permanent reference / Temporary working] (Layer [3/4]).

## What belongs here
- [Type of content, with examples]

## What does NOT belong here
- [Common mistake → goes in X instead]

## Navigation (only if folder has subfolders)
| Subfolder | Purpose |
|-----------|---------|

## Before working here
- Reference: `.claude/rules/documentation.md` for naming and header standards
- Key rule: [one-liner about the most important convention]
```

4. After creating, update `docs/CONTEXT_MAP.md` with the new entry.

## Autonomous Mode (docs-monitor nightly)

When run by the docs-monitor agent:
- Run Steps 1-3 only (scan, audit, update map)
- Do NOT create new CONTEXT.md files (Step 4 requires human approval)
- Include findings in nightly report JSON under `contextMap` key
- If a folder crosses the 3+ threshold for the first time, flag it in Telegram summary

## Output

```
CONTEXT.md Audit Summary
─────────────────────────
Layer 0: CLAUDE.md — 67 lines ✓
Layer 1: 4/4 exist ✓
Layer 2: 3/7 exist, 3 flagged, 1 skipped

Flagged (needs CONTEXT.md):
  docs/02-security/        — 5 files, 0 subdirs
  docs/04-integrations/    — 15 files, 0 subdirs
  docs/06-operations/      — 4 files, 2 subdirs

Audited today (due):
  src/CONTEXT.md           — ✓ up to date
  docs/03-features/CONTEXT.md — ⚠ missing subfolder: daily-attendance/

CONTEXT_MAP.md updated.
```
