# Autonomous Agent
> Last updated: 2026-07-27

Agent ecosystem documentation — architecture, specialist agents, and the Mac-Mini agent state files.

## What belongs here

- Agent architecture and ecosystem design
- Dashboard and monitoring system specs
- Learning pipeline and self-improvement loop
- Specialist agent creation guides
- Gateway watchdog documentation

## What does NOT belong here

- Implementation plans for agent features → `docs/05-implementation/active/`
- Agent task definitions → `.claude/agents/`
- Agent rules and constraints → `.claude/rules/`

## Navigation

| File | Covers |
|------|--------|
| `AGENT_ARCHITECTURE_OVERVIEW.md` | High-level agent ecosystem architecture |
| `CREATING_SPECIALIST_AGENTS.md` | Guide for creating new specialist agents |
| `OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md` | Core autonomous agent system |
| `mac-mini-agent-state/` | `IDENTITY.md` · `SOUL.md` · `USER.md` — the Mac-Mini runner's persistent state |

`AGENT_DASHBOARD_SYSTEM.md`, `LEARNING_PIPELINE_REDESIGN.md`, `OPENCLAW_GATEWAY_WATCHDOG.md` and `SELF_IMPROVEMENT_LEARNING_LOOP.md` were AppBase-template docs and are **not present in this repo** — do not link them.

## Before working here

- Agent task definitions live in `.claude/agents/` (`docs-monitor` · `health-checker` · `jlcms-advisor`)
- The Supabase `agent_corrections` table loop is **retired** — lessons now append to per-workspace `lessons.md` / `decisions.md` (`.claude/rules/lessons-logging.md`)
- There is no in-app agent dashboard (`src/components/agent-dashboard/` does not exist); the nightly E2E self-heal pipeline lives in `scripts/` + `.claude/commands/self-heal-e2e.md`
