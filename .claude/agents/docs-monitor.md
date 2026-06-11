# AppBase Documentation Monitor Agent

> **This is a task definition**, not a personality file. Personality files (SOUL.md, IDENTITY.md) live on Mac Mini at `~/.openclaw/agents/docs-monitor/agent/`.

Validates documentation health for the AppBase codebase. Runs nightly at 2am SGT (delegated by Agent J). Can also be triggered manually via `/health-check`.

## Tools Required

- Bash, Glob, Read, Grep

## Relationship to other commands

- `/check-docs` — runs the core doc index checks (checks 1-5 below) interactively
- `/context-check` — runs the CONTEXT.md audit and map update (checks 9-10 below) interactively
- This agent runs **all checks** nightly and updates `docs/CONTEXT_MAP.md` automatically

---

## Checks

### 1. File existence
Verify every link in `docs/DOCUMENTATION_INDEX.md` points to an existing `.md` file. List any broken links.

### 2. Unlisted files
Scan all `.md` files under `docs/` recursively. Flag any file NOT referenced in `DOCUMENTATION_INDEX.md`.
**Exclude**: `docs/CONTEXT.md`, `docs/CONTEXT_MAP.md`, `docs/DOCUMENTATION_INDEX.md`, and all `CONTEXT.md` files in subfolders.

### 3. Duplicate entries
Check if any file path appears more than once in the index.

### 4. File count
Count actual `.md` files in `docs/` (excluding CONTEXT.md and CONTEXT_MAP.md) and compare to the "Total Documents" number stated in `docs/DOCUMENTATION_INDEX.md`.

### 5. Stale links in CONTEXT.md
Verify all links in `docs/CONTEXT.md` point to existing files.

### 6. CONTEXT.md freshness
Verify CONTEXT.md exists in `src/`, `docs/`, `supabase/`, `.claude/`. For each, check if its "Last updated" date is older than 90 days. Flag missing or stale files.

### 7. Routing table accuracy
Every `.md` file in `.claude/commands/` should appear in CLAUDE.md's routing table or Slash list. Flag any unrouted commands.

### 8. Layer 3/4 separation
Scan files in `docs/03-features/` for `## Phase` or `## Progress` sections. These indicate implementation plans that should be in `docs/05-implementation/`, not in feature descriptions.

### 9. CONTEXT_MAP.md audit rotation
Read `docs/CONTEXT_MAP.md`. Find CONTEXT.md files where today >= "Next Audit" date. For each one due:
1. Read the CONTEXT.md
2. Compare Navigation table against actual folder contents (subfolders, file counts)
3. Check standard format sections exist: `# Name`, `## What belongs here`, `## What does NOT belong here`, `## Navigation`, `## Before working here`
4. Flag mismatches (missing subfolders, stale entries, wrong counts)

### 10. Missing CONTEXT.md detection
Scan all folders under `docs/`, plus `src/`, `supabase/`, `.claude/`. For each folder:
- Count .md files (excluding CONTEXT.md) and subfolders
- If **3+ files OR 3+ subfolders** and no CONTEXT.md → flag as "needs CONTEXT.md"
- Compare against current CONTEXT_MAP.md assessment — flag new entries

---

## Post-Check: Update CONTEXT_MAP.md

After running checks 9-10, update `docs/CONTEXT_MAP.md`:
- Set "Last Audited" = today for folders checked
- Set "Next Audit" = today + 7 days for those folders
- Update file counts, subfolder counts
- Add/update "Missing CONTEXT.md — Assessment" table
- Update the Full Tree if new CONTEXT.md files were created since last run

---

## Output Format

Return a JSON object:

```json
{
  "timestamp": "ISO-8601",
  "docsHealth": {
    "status": "pass|warn",
    "brokenLinks": [],
    "unlistedFiles": [],
    "duplicateEntries": [],
    "countMismatch": { "stated": 0, "actual": 0 },
    "staleContextLinks": [],
    "staleContextFiles": [],
    "missingContextFiles": [],
    "unroutedCommands": [],
    "misplacedPlans": [],
    "contextMapUpdated": true,
    "contextAudited": [],
    "contextAuditIssues": [],
    "newFoldersNeedingContext": []
  }
}
```

- `status`: `"pass"` if all arrays are empty and counts match, `"warn"` otherwise

---

## Behavior Modes

### Autonomous mode (cron / nightly at 2am SGT)
- Run all 10 checks
- **Auto-fix** simple issues:
  - Wrong doc counts → update counts in DOCUMENTATION_INDEX.md and README.md
  - Broken links → remove from index
  - Duplicate entries → remove duplicates
- **Auto-create** missing CONTEXT.md files for folders with 3+ files/subfolders (use standard template from `/context-check`)
- **Auto-update** stale CONTEXT.md files (Navigation table vs actual folder contents)
- **Update** `docs/CONTEXT_MAP.md` (checks 9-10)
- **Git commit and push** all changes with message: `docs(docs-monitor): nightly auto-fix — YYYY-MM-DD`
- If no changes needed: skip commit
- If `"pass"`: log "Docs healthy" to daily notes, no Telegram alert
- If `"warn"`: log issues + fixes applied to daily notes, include in nightly Telegram summary

### Manual mode (via /health-check)
- Run all 10 checks
- Present results in a readable format
- If issues found, ask: **"Want me to fix these?"**
  - Broken links → remove from index or fix path
  - Unlisted files → add to index in correct category
  - Duplicate entries → remove duplicates
  - Wrong counts → update counts
  - Missing CONTEXT.md → offer to run `/context-check`

---

## How This Fits With Other Checks

| Agent/Command | What it checks | When |
|---------------|---------------|------|
| **docs-monitor** (this) | Doc index + CONTEXT.md health + map updates | Nightly 2am SGT |
| **health-checker** | TypeScript + query compliance + migrations + auth.users | Heartbeat + nightly |
| `/check-docs` | Doc index checks 1-5 (interactive) | Every git-sync |
| `/context-check` | CONTEXT.md audit + creation (interactive) | On demand |
| `/code-hygiene` | Root clutter + system-wide quality drift | Monthly / pre-release |
