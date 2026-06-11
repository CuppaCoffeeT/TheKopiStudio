# Claude Code Configuration

## Agents

```
.claude/agents/
├── health-checker.md  # TypeScript + query compliance + migration + auth.users health checks
├── docs-monitor.md    # Documentation index accuracy and orphan file detection
└── README.md          # Agent definitions index
```

Agents are read by Claude Code (via cron or Telegram) on the Mac Mini to execute automated checks. See `docs/03-features/autonomous-agent/OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md` for the full system design.

## Commands

```
.claude/commands/
├── git-sync.md            # /git-sync - Full git workflow: status → pull → commit → push (includes doc health check)
├── git-quick.md           # /git-quick - Fast git sync (no doc check) for time-sensitive pushes
├── check-docs.md          # /check-docs [topic] - Review & fix docs quality + doc index health (broken links, counts)
├── code-hygiene.md        # /code-hygiene - Root clutter + system-wide hygiene scan (monthly or pre-release)
├── prd-write.md           # /prd-write - Write a full ultracode-executable PRD for a new module
└── health-check.md        # /health-check - Run all health checks (TypeScript, queries, migrations, docs)
```

## Key Files

- **CLAUDE.md** (project root) — Source of truth for all project instructions
- **docs/DOCUMENTATION_INDEX.md** — Central index of all project documentation
- **.mcp.json** — MCP server config (Supabase, Nakkas, Playwright)
