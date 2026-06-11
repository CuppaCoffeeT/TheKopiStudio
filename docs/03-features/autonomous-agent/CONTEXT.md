# Autonomous Agent
> Last updated: 2026-03-26

Agent ecosystem documentation — architecture, dashboards, learning pipeline, specialist agents, and gateway watchdog.

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
| `AGENT_DASHBOARD_SYSTEM.md` | Agent monitoring dashboard |
| `CREATING_SPECIALIST_AGENTS.md` | Guide for creating new specialist agents |
| `LEARNING_PIPELINE_REDESIGN.md` | Redesigned learning pipeline architecture |
| `OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md` | Core autonomous agent system |
| `OPENCLAW_GATEWAY_WATCHDOG.md` | Gateway watchdog monitoring |
| `SELF_IMPROVEMENT_LEARNING_LOOP.md` | Self-improvement and correction learning loop |

## Before working here

- Agent task definitions live in `.claude/agents/`
- Learning corrections log to Supabase `agent_corrections` table
- Dashboard implementation in `src/components/agent-dashboard/`
