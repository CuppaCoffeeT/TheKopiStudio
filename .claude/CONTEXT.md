# .claude/ — Claude Code Tooling
> Last updated: 2026-03-25

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
| `rules/` | 17 | Auto-loaded reference patterns (Layer 3). Scoped via `paths:` frontmatter. Always-loaded: `code-hygiene.md`, `lessons-logging.md`. | `src/` code, `supabase/` migrations, `docs/` standards |
| `commands/` | ~28 | Slash commands — user-invoked multi-step workflows. | Operates across all workspaces |
| `agents/` | 3 | Autonomous task definitions. See `.claude/agents/` for current list. | Reads from `docs/`, `src/`, `supabase/` |
| `backups/` | — | Backup files for recovery | — |
| `scripts/` | — | Helper scripts for agent operations | — |

### Cross-workspace routing

```
rules/     → enforces constraints on src/ (code patterns) + supabase/ (migration patterns) + docs/ (doc standards)
commands/  → orchestrates work across src/, docs/, supabase/ (e.g., /git-sync touches all, /prd-write writes to docs/)
agents/    → reads docs/ for context; appends lessons to workspace lessons.md / decisions.md (retired agent_corrections table loop)
```

## Before working here

- **Decision tree**: Multi-step workflow → `commands/` · Detailed pattern → `rules/` · Autonomous task → `agents/` · Project-wide 1-liner → `CLAUDE.md`
- Commands must appear in CLAUDE.md routing table or slash list
- Rules follow structure: Summary → Detailed Patterns → (optional Known Patterns) → References
- Max 80 lines per rule file — split by subtopic if longer
- Rules with `paths:` frontmatter auto-load only when editing matching files
- Two rules load everywhere (no paths): `code-hygiene.md`, `lessons-logging.md`
