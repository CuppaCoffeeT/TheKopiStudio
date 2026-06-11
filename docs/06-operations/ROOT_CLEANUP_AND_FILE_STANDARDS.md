# Root Directory Cleanup and File Standards

**Created**: 2026-03-22 10:37:05 SGT
**Last Updated**: 2026-03-22 10:37:05 SGT
**Status**: 🟢 Production
**Priority**: 🟢 Medium

## 📋 Overview

Documents what belongs in the project root, what was cleaned up (and why), and how to keep it from getting messy again. Run `/code-hygiene` to audit root health in the future.

## 📚 Related Documentation
- [DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md](../99-meta/DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md) - Doc standards and folder structure
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - Central doc index

---

## ✅ What Belongs in Root

These files are **required to stay in root** — all their tools auto-discover them here and moving them would break the build:

| File/Folder | Purpose | Can Move? |
|-------------|---------|-----------|
| `CLAUDE.md` | Claude Code project instructions | No — Claude reads from root |
| `README.md` | Project overview | No — GitHub convention |
| `package.json` / `package-lock.json` | npm config & lockfile | No |
| `vite.config.ts` | Vite bundler config | No — Vite auto-discovers from root |
| `tailwind.config.ts` | Tailwind CSS config | No — PostCSS/Tailwind auto-discovers |
| `postcss.config.js` | PostCSS config | No |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | TypeScript config | No — tsc reads from root |
| `eslint.config.js` | ESLint 9 flat config | No — ESLint auto-discovers from root |
| `components.json` | shadcn/ui config | No — shadcn CLI reads from root |
| `index.html` | Vite entry point | No |
| `docker-compose.yml` | pdf-service local dev | No — Docker convention |
| `deploy-edge-functions.sh` | Supabase Edge Function deploy | No — deployment script |
| `.mcp.json` | MCP server config (gitignored) | No — Claude Code reads from root |
| `.env` / `.env.local` | Environment variables (gitignored) | No |
| `.gitignore` / `.github/` | Git config | No |
| `.vscode/` | VSCode settings (extensions.json only) | No |
| `src/` | Application source code | No |
| `docs/` | Project documentation | No |
| `supabase/` | Migrations, types, MCP template | No |
| `public/` | Static assets | No |
| `pdf-service/` | PDF generation microservice | No |
| `dist/` | Build output (gitignored) | No |
| `node_modules/` | Dependencies (gitignored) | No |

---

## 🗑️ What Does NOT Belong in Root

### Never leave these here:

| Type | Examples | Where Instead |
|------|---------|--------------|
| Temp files from Claude Code | `tmpclaude-*-cwd` | Delete immediately |
| One-off SQL fix scripts | `fix_*.sql` | Execute via Supabase MCP then delete |
| One-off utility scripts | `rename_*.ps1` | Delete once the task is done |
| Tool-specific ignores for tools you don't use | `.cursorignore` | Delete when migrating away from tool |
| Old tool configs superseded by new ones | `.clauderc` (superseded by `.mcp.json`) | Delete |
| Windows install scripts not part of the project | `install.cmd` | Delete |
| Orphaned lockfiles from package managers not in use | `bun.lockb` (using npm) | Delete |
| Stale audit/report docs | `CODEBASE_AUDIT_REPORT.md` | Move to `docs/99-meta/` or delete once resolved |
| Old tool config folders | `.cursor/` | Delete when fully migrated away |

---

## 📜 Cleanup History

### 2026-03-22 — Initial Root Cleanup

**Deleted** (17 items):

| File | Reason |
|------|--------|
| `tmpclaude-24c2-cwd` (×10 files) | Temp files from Claude Code sessions, Jan 2026. Contained only a Windows path string. |
| `rename_migrations.ps1` | One-off PowerShell script to fix migration filenames with wrong date prefix (202501 → 20250909). Already applied Sep 2025. |
| `.cursorignore` | Cursor-specific ignore file. Project migrated from Cursor to Claude Code. |
| `install.cmd` | Windows CMD bootstrap for installing Claude Code. Not part of the application. |
| `bun.lockb` | Leftover lockfile from when bun was tested. Project uses npm (`package-lock.json`). |
| `fix_evonne_account.sql` | Emergency SQL fix for a user account (Nov 2025). Already applied via Supabase MCP. Contained user email data. |
| `CODEBASE_AUDIT_REPORT.md` | Standards compliance audit (Jan 2026). Issues were addressed. No longer actionable. |
| `.clauderc` | Old Supabase MCP config. Superseded by `.mcp.json`. Already gitignored. |
| `.cursor/` (folder) | Old Cursor IDE config folder (`config.json`, `mcp.json`, `plans`, `rules`). Fully replaced by `.claude/`. |
| `scripts/refresh_supabase_snapshots.sh` | Script to dump DB schema + generate types via Supabase CLI. CLI is banned (use MCP instead); `npm run db:types` covers type generation. `scripts/` folder also removed (empty). |

**Why config files were NOT moved to a subfolder**: `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`, and `postcss.config.js` are all auto-discovered from the project root by their respective tools. Moving them requires `--config` flags on every tool's CLI invocation, breaks many IDE integrations, and goes against the convention of every tool involved. The real clutter was one-off files, not config files.

---

## 🔍 How to Keep Root Clean — Rules

### Rule 1: One-off files → delete after use
If you create a `.sql`, `.sh`, `.ps1`, or any script for a specific task, **delete it immediately after the task is done**. Don't let it linger.

### Rule 2: No ad-hoc SQL in root
SQL fixes must go through Supabase MCP migrations (`supabase/migrations/`), not freestanding `.sql` files in root.

### Rule 3: Audit reports → docs or delete
If Claude generates an audit/report `.md` file, either:
- Move it to `docs/99-meta/` and add it to `DOCUMENTATION_INDEX.md`, OR
- Delete it once the issues are resolved

### Rule 4: tmpclaude-* files
These are Claude Code artifacts from crashed or interrupted sessions. Safe to delete anytime. Run `/code-hygiene` to catch them.

### Rule 5: Old tool configs
When migrating away from a tool (Cursor → Claude Code), delete the old config folder (`.cursor/`) and any tool-specific files (`.cursorignore`) immediately.

### Rule 6: Don't add new lockfiles
Use npm only. Don't `bun install` or `yarn install` — they'll create orphaned lockfiles.

---

## 🛠️ `/code-hygiene` Command (Part 1: Root Audit)

Use `/code-hygiene` to audit root health (Part 1 of the command). It checks for:
1. `tmpclaude-*` temp files
2. Freestanding `.sql` files not in `supabase/migrations/`
3. Files from tools no longer in use (`.cursorignore`, `bun.lockb`, etc.)
4. Orphaned scripts that should have been deleted after use
5. Unexpected `.md` files in root (should be `CLAUDE.md` and `README.md` only)
6. Any new folders that don't belong
