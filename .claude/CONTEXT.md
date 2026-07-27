# .claude/ — Claude Code Tooling
> Last updated: 2026-07-27

Claude Code-specific configuration: rules, commands, and agents.

## What belongs here

Rules, slash commands, agent definitions, and Claude Code settings. This is the only tool-specific directory — other tools have their own equivalents.

## What does NOT belong here

- Application code → `src/`
- Documentation → `docs/`
- Database migrations → `supabase/`

## Navigation

| Folder | Count | Purpose | Enforces patterns for |
|--------|-------|---------|----------------------|
| `rules/` | 15 (+ `CONTEXT.md`) | Auto-loaded reference patterns (Layer 3). Scoped via `paths:` frontmatter. Always-loaded: `code-hygiene.md`, `lessons-logging.md`. Visual contract: `light-theme.md`. | `src/` code, `supabase/` migrations, `docs/` standards |
| `commands/` | 22 (+ `CONTEXT.md`) | Slash commands — user-invoked multi-step workflows. | Operates across all workspaces |
| `agents/` | 3 (+ `README.md`) | Autonomous task definitions: `docs-monitor` · `health-checker` · `jlcms-advisor`. | Reads from `docs/`, `src/`, `supabase/` |
| `hooks/` | 1 | Shell hooks Claude Code fires on events (`track-failure.sh`). | — |
| `scripts/` | 2 | Helper scripts for agent operations (`manual-run-wrapper.sh` · `sync-agent-files.sh`). | — |

### Cross-workspace routing

```
rules/     → enforces constraints on src/ (code patterns) + supabase/ (migration patterns) + docs/ (doc standards)
commands/  → orchestrates work across src/, docs/, supabase/ (e.g., /git-sync touches all, /prd-write writes to docs/)
agents/    → reads docs/ for context; appends lessons to workspace lessons.md / decisions.md (retired agent_corrections table loop)
```

## Before working here

- **Decision tree**: Multi-step workflow → `commands/` · Detailed pattern → `rules/` · Autonomous task → `agents/` · Project-wide 1-liner → `CLAUDE.md`
- Commands must appear in CLAUDE.md routing table or slash list
- Rules follow structure: Summary → Detailed Patterns → (optional Known Patterns / Anti-patterns) → References
- Max 80 lines per rule file — split by subtopic if longer. Standing exemption: `rules/light-theme.md` (reason recorded in its header)
- Rules with `paths:` frontmatter auto-load only when editing matching files
- Two rules load everywhere (no paths): `code-hygiene.md`, `lessons-logging.md`
- **Any UI edit is governed by `rules/light-theme.md`** — the app is light-pinned on the Kopi Studio cream/brown palette (2026-07-25). There is no dark mode and no theme toggle.
