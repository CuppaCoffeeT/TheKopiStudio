(RUN THIS OCCASIONNALY WHEN FILES OR CODE IS VERY MESSY)
# Code Hygiene Command

Periodic system-wide audit. Run **monthly or before major releases**, NOT on every git-sync.

Covers two areas:
- **Root directory** — structural clutter (wrong files, orphaned lockfiles, temp files)
- **Code + docs** — quality drift (deprecated patterns, stale info, redundancy)

**Preserve history**: NEVER remove "Errors Encountered", "What NOT To Try Again", or debugging history sections from docs. These prevent re-attempting failed approaches.

---

## Part 1: Root Directory Audit

Reference: `docs/06-operations/ROOT_CLEANUP_AND_FILE_STANDARDS.md`

### 1.1 tmpclaude temp files
Look for any files matching `tmpclaude-*-cwd` in root. Claude Code session artifacts — always safe to delete.

### 1.2 Freestanding SQL files
Look for any `.sql` files in root. SQL belongs in `supabase/migrations/` only.

### 1.3 Orphaned lockfiles
Check for `bun.lockb`, `yarn.lock`, `pnpm-lock.yaml`. Project uses npm — only `package-lock.json` should exist.

### 1.4 Old tool configs
Check for `.cursorignore`, `.cursor/`, `.clauderc`, or config folders for tools no longer in use.

### 1.5 Unexpected .md files
Root should only contain `CLAUDE.md` and `README.md`. Any other `.md` belongs in `docs/` or should be deleted.

### 1.6 One-off scripts
Check for `.ps1`, `.cmd`, `.sh` files in root (except `deploy-edge-functions.sh` which is the valid deploy script).

### 1.7 Unexpected folders
Valid root folders: `src/`, `docs/`, `supabase/`, `public/`, `pdf-service/`, `dist/`, `node_modules/`, `.claude/`, `.github/`, `.vscode/`, `.git/`. Flag anything else.

---

## Part 2: Code + Docs Quality Scan

Apply the 4 criteria (from Rule #11 in CLAUDE.md) to areas not recently touched.

**Scope (highest value first):**
1. CLAUDE.md — master reference; drift here misleads every session
2. `docs/01-system-architecture/` — live system rules
3. `src/utils/`, `src/hooks/` — shared utilities (widest blast radius)
4. `docs/03-features/` — feature docs go stale as features evolve
5. `src/pages/` — check for CLAUDE.md rule violations

### 2.1 Inconsistencies
- Rules in CLAUDE.md that contradict what the code actually does
- Docs describing behaviour differently from how a feature works today
- Architecture docs whose schema no longer matches the database

### 2.2 Redundancy
- Duplicate logic across components, hooks, or services
- Duplicate documentation — consolidate or cross-reference instead
- Dead code: commented-out blocks, unused imports, backwards-compat shims that can be removed

### 2.3 Clarity
- Code violating CLAUDE.md rules: forbidden toast imports, hardcoded query keys, raw `useSearchParams` where `useURLPagination` is required, hardcoded role checks
- Docs referencing renamed or deleted files/functions
- Unresolved TODO/FIXME comments
- CLAUDE.md examples pointing to code that no longer exists

### 2.4 Up-to-dateness
- Docs with stale "Last Updated" dates whose **content** has changed
- CLAUDE.md "reference implementations" pointing to wrong files
- Entity lists, role lists, or enums in docs that no longer match the database
- Slash commands listed in CLAUDE.md or `.claude/README.md` that no longer exist

---

## Output

**Part 1 — Root issues**: List grouped by check type. If clean, say "Root is clean."
**Part 2 — Code/docs issues**: List grouped by criterion. If clean, say "No drift found."

If issues are found, ask: **"Want me to fix these? Which should I start with?"**

**Part 1 fixes:**
- `tmpclaude-*` → delete immediately
- Freestanding `.sql` → confirm already applied, then delete
- Orphaned lockfiles → delete
- One-off scripts → confirm no longer needed, then delete
- Unexpected `.md` → move to `docs/99-meta/` or delete
- Old tool configs/folders → delete if tool no longer used

**Part 2 fixes:**
- Inconsistencies and clarity violations → fix immediately
- Redundancy → confirm with user before deleting
- Stale docs → run `/check-docs <topic>` for affected areas

---

## How This Fits With Other Commands

| Command | What it checks | When |
|---------|---------------|------|
| `/code-hygiene` | Root clutter + system-wide 4-criteria quality scan | Monthly / pre-release |
| `/check-docs <topic>` | In-depth 4-criteria review of docs for a specific topic | When creating/updating docs |
| `/check-docs` | Doc index accuracy only (broken links, counts) | Every git-sync |
| `/prd-write` | Pre-build: write a full ultracode-executable PRD for a new module | Before building a module |

**Rule #11 in CLAUDE.md** is the lightweight continuous version — applies the 4 criteria to every file you touch. `/code-hygiene` is the deep scan for areas not recently edited.
