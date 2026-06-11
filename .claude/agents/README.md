# Agent Task Definitions

Task definitions for the AppBase autonomous agent ecosystem (OpenClaw on Mac Mini).

**These are task definitions, not personality files.** Each file describes what an agent does, what tools it needs, and what output format it returns. The actual personality files (SOUL.md, IDENTITY.md, USER.md) live on the Mac Mini at `~/.openclaw/agents/<name>/agent/`.

## Architecture

```
Agent J (Orchestrator) — delegates to specialist agents, consolidates results
├── Health Checker — code health monitoring (nightly 2am, delegated by Agent J)
├── Docs Monitor — documentation validation (nightly 2am, delegated by Agent J)
├── AppBase Advisor — architecture Q&A (on-demand, delegated by Agent J)
├── Learning Agent — correction analysis & rule improvement (nightly 2am, delegated by Agent J)
└── Context Architect — context hierarchy audit & improvement (weekly, delegated by Agent J)
```

## Agents

| Agent | Task Definition | Schedule | Trigger |
|-------|----------------|----------|---------|
| **Health Checker** | `health-checker.md` | Nightly 2am (delegated by Agent J) | `/health-check` |
| **Docs Monitor** | `docs-monitor.md` | Nightly 2am (delegated by Agent J) | `/health-check` |
| **AppBase Advisor** | `appbase-advisor.md` | On-demand | Telegram, manual |

## How Agents Are Used

1. **Agent J orchestrates** — the nightly 2am cron invokes Agent J, which delegates to Health Checker and Docs Monitor as separate agents
2. **Each agent runs in its own workspace** — isolated git clone, isolated memory, isolated context
3. **Agent J consolidates** — collects results from all agents, sends unified Telegram summary to Wei Jie
4. **`/health-check`** slash command triggers Health Checker + Docs Monitor for manual runs
5. **Output formats**: Health Checker and Docs Monitor return structured JSON; AppBase Advisor returns conversational markdown; Learning Agent returns JSON summary of patterns found

## Related

- `.claude/commands/health-check.md` — slash command that triggers Health Checker + Docs Monitor
- `docs/03-features/autonomous-agent/AGENT_ARCHITECTURE_OVERVIEW.md` — how Agent J and all subsystems fit together
- `docs/03-features/autonomous-agent/CREATING_SPECIALIST_AGENTS.md` — step-by-step guide for adding new agents
- `docs/03-features/autonomous-agent/OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md` — full system design
- `docs/03-features/autonomous-agent/SELF_IMPROVEMENT_LEARNING_LOOP.md` — learning loop spec
