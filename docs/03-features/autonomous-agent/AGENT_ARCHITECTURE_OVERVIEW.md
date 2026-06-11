# Agent Architecture Overview

**Created**: 2026-03-23 10:40:00 SGT
**Last Updated**: 2026-03-25 13:20:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

A single-page guide to how Agent J, the AppBase autonomous agent ecosystem, and all its subsystems fit together. Read this first. Dive into the linked docs for implementation details.

## 📚 Related Documentation

- [OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md](./OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md) — Full implementation phases, checklists, cron config
- [EMAIL_AUTOMATION_SYSTEM.md](../email-automation/EMAIL_AUTOMATION_SYSTEM.md) — Phase 8: Gmail sync, inbox module, AI classification agent, feedback loop
- [CREATING_SPECIALIST_AGENTS.md](./CREATING_SPECIALIST_AGENTS.md) — Step-by-step guide to adding a new agent
- [SELF_IMPROVEMENT_LEARNING_LOOP.md](./SELF_IMPROVEMENT_LEARNING_LOOP.md) — How corrections become CLAUDE.md improvements
- [LEARNING_PIPELINE_REDESIGN.md](./LEARNING_PIPELINE_REDESIGN.md) — Two-layer learning, Supabase-direct logging, `.claude/rules/` directory structure (implemented)
- [SEMANTIC_MEMORY_LAYER.md](../../05-implementation/active/SEMANTIC_MEMORY_LAYER.md) — Future: vector search over agent memory (Phase 11)
- [AGENT_DASHBOARD_SYSTEM.md](./AGENT_DASHBOARD_SYSTEM.md) — Dashboard UI and data pipeline
- [OPENCLAW_GATEWAY_WATCHDOG.md](./OPENCLAW_GATEWAY_WATCHDOG.md) — 5-min watchdog: detects stuck sessions, auto-restarts gateway, Telegram alerts
- [CLAUDE.md](../../../CLAUDE.md) — The project rules all agents enforce
- [MODULE_CREATION_SOP.md](../../06-operations/MODULE_CREATION_SOP.md) — SOP for building new AppBase modules

---

## Useful Videos
https://www.youtube.com/watch?v=tH54k9hKBG8
https://www.youtube.com/watch?v=ZrBvPoFBVUo&t=20s

## 🏗️ The Big Picture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Wei Jie (Human)                               │
│   Laptop: VS Code + Claude Code (interactive coding)                 │
│   Phone: Telegram (commands + alerts)                                │
└──────────────┬───────────────────────────────────┬───────────────────┘
               │ git push                          │ Telegram
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Mac Mini (24/7, headless)                         │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐       │
│   │  AGENT J — Orchestrator                                   │       │
│   │  Coordinates all agents, owns the learning loop,          │       │
│   │  consolidates reports, improves everyone.                 │       │
│   │                                                          │       │
│   │  Personality: SOUL.md + IDENTITY.md + USER.md            │       │
│   │  Rules: CLAUDE.md (shared, in repo)                      │       │
│   └──────────────────────────────────────────────────────────┘       │
│         │ orchestrates                                               │
│         ▼                                                            │
│   ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────────┐│
│   │ Health       │ │ Docs        │ │ AppBase        │ │ Learning     ││
│   │ Checker      │ │ Monitor     │ │ Advisor      │ │ Agent        ││
│   │              │ │             │ │              │ │              ││
│   │ Own workspace│ │ Own workspace│ │ Own workspace│ │ Own workspace││
│   │ Own SOUL.md  │ │ Own SOUL.md │ │ Own SOUL.md  │ │ Own SOUL.md  ││
│   └─────────────┘ └─────────────┘ └──────────────┘ └──────────────┘│
│                                                                      │
│   ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│   │ Email Agent │ │ Context      │ │ Docs Agent   │ │ QA Agent    ││
│   │             │ │ Architect    │ │ (future)     │ │ (future)    ││
│   └─────────────┘ └──────────────┘ └──────────────┘ └─────────────┘│
│                                                                      │
│   Infrastructure: OpenClaw daemon + cron + watchdog + Tailscale      │
└──────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Cloud: Supabase (PostgreSQL + Edge Functions + MCP)                  │
│  Cloud: GitHub (repo, shared by laptop + Mac Mini)                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Core Principles

### Every Agent Is a Full Agent

There are **no sub-agents**. Every agent is a fully independent entity with its own:

| Component | Purpose |
|-----------|---------|
| **SOUL.md** | Personality, values, principles, decision-making style |
| **IDENTITY.md** | Name, role, responsibilities, org chart position |
| **USER.md** | Context about Wei Jie (shared across all agents — same human) |
| **MEMORY.md** | Domain-specific curated knowledge (isolated per agent) |
| **Skills** | Focused on one particular task area |
| **Schedule/Trigger** | When it runs (cron, webhook, on-demand, etc.) |
| **Own workspace** | Own OpenClaw workspace, own learning data |

### Agent J Is the Orchestrator

Agent J does NOT do the tasks himself. He:
- **Coordinates** — delegates tasks to the right agent
- **Consolidates** — collects all agent reports into unified Telegram summaries
- **Improves** — coordinates the learning loop (delegates analysis to the Learning Agent), proposes CLAUDE.md improvements
- **Reviews** — checks agent output quality, fixes agent configs when needed

### Each Agent Is Hyper-Focused

Each agent has **one job** — a typically repetitive task that runs on a schedule or trigger:

| Agent | Focus | Trigger |
|-------|-------|---------|
| Agent J | Orchestration + coordination | Heartbeat 30min + nightly 2am |
| Health Checker | Code health (TypeScript, queries, migrations) | Nightly 2am (delegated by Agent J) |
| Docs Monitor | Documentation index validation | Nightly 2am (delegated by Agent J) |
| AppBase Advisor | Architecture Q&A (knowledge retrieval) | On-demand (Telegram / manual) |
| Learning Agent | Correction analysis & rule improvement | Nightly 2am (delegated by Agent J) |
| Context Architect | Context hierarchy audit & error prevention | Weekly (delegated by Agent J) |
| Email Agent | Gmail classification + draft replies (Claude Max, $0) | 10-min cron on Mac Mini (Phase A6) |
| Docs Agent | Continuous doc quality on git push | Future |
| QA Agent | Test suite, code quality, regressions | Future |

---

## 🤖 Agent J — The Orchestrator

Agent J is the **coordinator** of the entire ecosystem. He reports to Wei Jie.

### Personality (OpenClaw Agent Files)

Stored on Mac Mini at `~/.openclaw/agents/main/agent/`:

| File | What It Defines | Status |
|------|----------------|--------|
| **SOUL.md** | Values, voice, principles, decision-making style | Deployed |
| **IDENTITY.md** | Name (Agent J), role (Orchestrator), org chart, responsibilities | Deployed |
| **USER.md** | Who Wei Jie is, how he works, his goals | Deployed |
| **TOOLS.md** | MCP servers, infra, credentials | Builds organically |
| **AGENTS.md** | Operating rules, workflows | Builds organically |
| **MEMORY.md** | Long-term curated knowledge from conversations | Builds organically |

**Philosophy** (from Marcelo/Clear Mud): Start minimal. Use the agent daily. Let MEMORY.md build from conversations. After 2 weeks, tell Agent J to scan his memory and refine SOUL.md + IDENTITY.md. The most authentic personality comes from usage, not upfront design.
Clear Mud: https://www.youtube.com/watch?v=WSQmcYU3jB4

### What Agent J Does

| Schedule | What Happens |
|----------|-------------|
| Every 30 min | Heartbeat: git pull, check daily notes, delegate quick checks |
| 2am SGT nightly | Orchestrate full audit: delegate to Health Checker + Docs Monitor + Learning Agent, consolidate results, send Telegram report |
| On demand | Route questions to the right agent (e.g., architecture Q → AppBase Advisor) |
| Per correction | Log correction silently to learning system |
| Nightly | Analyze correction patterns, queue CLAUDE.md improvements, review agent performance |

### What Agent J Does NOT Do

- ❌ Run health checks himself → delegates to Health Checker
- ❌ Validate docs himself → delegates to Docs Monitor
- ❌ Answer architecture questions himself → delegates to AppBase Advisor
- ❌ Analyze corrections himself → delegates to Learning Agent
- ❌ Audit context architecture himself → delegates to Context Architect
- ❌ Process emails → delegates to Email Agent

Agent J reads the results, consolidates, and reports to Wei Jie.

---

## 📂 Where Everything Lives

### Three Locations

```
REPO (GitHub — shared by laptop + Mac Mini)
├── CLAUDE.md                    ← Project rules (ALL agents read this)
├── .claude/agents/              ← Agent definitions (task specs, not personality)
├── .claude/commands/            ← Slash commands (/health-check, /analyze-errors, etc.)
├── docs/                        ← 140 project docs (architecture, features, integrations)
└── src/                         ← Application source code

MAC MINI ~/.openclaw/agents/     (Each agent's personality — NOT in repo)
├── main/agent/                  ← Agent J (Orchestrator)
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── USER.md                  ← About Wei Jie
│   └── MEMORY.md
├── health-checker/agent/        ← Health Checker
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── USER.md                  ← Same USER.md (shared)
│   └── MEMORY.md
├── docs-monitor/agent/          ← Docs Monitor
│   ├── SOUL.md, IDENTITY.md, USER.md, MEMORY.md
├── appbase-advisor/agent/         ← AppBase Advisor
│   ├── SOUL.md, IDENTITY.md, USER.md, MEMORY.md
├── learning-agent/agent/        ← Learning Agent (correction analysis)
│   ├── SOUL.md, IDENTITY.md, USER.md, MEMORY.md
├── context-architect/agent/     ← Context Architect (context hierarchy audit)
│   ├── SOUL.md, IDENTITY.md, USER.md, MEMORY.md
├── email-agent/agent/           ← Email Agent (Phase 8)
│   ├── SOUL.md, IDENTITY.md, USER.md, MEMORY.md
└── [future-agent]/agent/

MAC MINI ~/.claude/               (Operational data — NOT in repo)
├── daily-notes/                 ← Agent J operational log
├── learning/
│   ├── corrections/YYYY-MM-DD.md  ← Raw corrections from sessions
│   ├── PATTERN_MEMORY.md          ← Distilled recurring patterns
│   └── IMPROVEMENT_QUEUE.md       ← Pending CLAUDE.md proposals
├── reports/                     ← Nightly structured reports
├── scripts/                     ← Cron scripts
└── memory/                      ← Claude auto-memory (per-session preferences)
```

### Simple Rule

| Question | Answer |
|----------|--------|
| Should all agents follow this rule? | **Repo** → CLAUDE.md or `.claude/agents/` |
| Is it about an agent's personality? | **Mac Mini** → `~/.openclaw/agents/<name>/agent/` |
| Is it operational data from agent runs? | **Mac Mini** → `~/.claude/` |
| Is it project architecture/features? | **Repo** → `docs/` |

---

## 🔄 The Three Systems

### 1. Health Monitoring (Active)

```
Agent J (heartbeat every 30 min)          Agent J (nightly 2am)
├── git pull                               ├── Delegate to Health Checker:
├── Check daily notes for tasks            │   ├── TypeScript build check
├── Quick status check                     │   ├── Query compliance scan (Rule #8)
└── Resume pending work                    │   ├── Migration gap check (Rule #3)
                                           │   └── auth.users violation scan (Rule #3)
                                           ├── Delegate to Docs Monitor:
                                           │   ├── Docs index validation
                                           │   └── Rolling review (10 files/night)
                                           ├── Delegate to Learning Agent:
                                           │   ├── Correction pattern analysis
                                           │   ├── .claude/rules/ updates (3+ threshold)
                                           │   └── Agent config improvements
                                           ├── Delegate to Context Architect (weekly):
                                           │   ├── Layer 0-3 context hierarchy audit
                                           │   ├── Error prevention traces
                                           │   └── Routing improvement suggestions
                                           └── Consolidate + send Telegram summary
```

**Details**: [OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md](./OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md) — Phases 4-6

### 2. Self-Improvement Learning Loop (Active — Agent J Coordinates)

```
Correction happens (any source: human, agent self-correction, conflict found)
     │
     ▼
Layer 1: CORRECTIONS                ← Logged immediately (Rule #13)
     │   → Supabase via MCP (primary) or ~/.claude/learning/corrections/ (fallback)
     │
     ▼  (nightly at 2am)
Layer 2: PATTERN MEMORY             ← Nightly groups by theme, counts occurrences
     │   ~/.claude/learning/PATTERN_MEMORY.md
     │
     ▼  (when pattern hits 3+ occurrences)
Layer 3: IMPROVEMENT QUEUE          ← Proposes rule update
     │   ~/.claude/learning/IMPROVEMENT_QUEUE.md
     │
     ▼
You approve/reject via Telegram → Rules updated
     │
     ▼
ALL agents benefit (they all read CLAUDE.md)
```

**Two-layer learning** (✅ implemented — see [LEARNING_PIPELINE_REDESIGN.md](./LEARNING_PIPELINE_REDESIGN.md)):
- **Human coder corrections** (VS Code) → improve repo rules (CLAUDE.md, `.claude/rules/`)
- **Agent self-corrections** (Agent J, other agents) → improve agent configs (SOUL.md, IDENTITY.md, etc.)

**Learning Agent** (✅ deployed — see [AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md) Phase A4):
A dedicated agent that handles ALL correction analysis and rule improvement. Two input streams (human + agent corrections), two output targets (repo rules + agent configs). Agent J delegates nightly analysis to the Learning Agent. Has its own workspace (`~/appbase-learning-agent`), personality files, and runs are tracked in `agent_runs` with `agent_name = 'learning-agent'`.

**How agents get improved**:
- Project-wide pattern → Learning Agent proposes `.claude/rules/` update → Telegram approval → ALL agents benefit
- Agent-specific issue → Learning Agent updates that agent's files (SOUL.md, MEMORY.md, etc.)

**How each agent specializes through its own memory**:

Each agent has an **isolated MEMORY.md** that builds organically from its work. This is the mechanism that makes each agent increasingly better at its specific job over time:

| Agent | What Its MEMORY.md Learns | Example |
|-------|--------------------------|---------|
| Health Checker | Build error patterns, frequently breaking files, false positive suppressions | "src/pages/InvoiceList.tsx breaks on import order changes" |
| Docs Monitor | Stale doc patterns, common link formats, frequently mislinked files | "docs/03-features/ has the most churn" |
| AppBase Advisor | Common architecture questions, misconceptions, FAQ patterns | "People normalization is asked about most — always mention person_id" |
| Learning Agent | Correction categories, threshold tuning, which patterns recur | "shadcn component pattern reached 8 occurrences, rule was accepted" |
| Context Architect | Routing effectiveness, recurring context gaps, rule scoping patterns | "toast-system.md paths: too narrow — corrections still happen in page files" |
| Email Agent | Sender patterns, classification accuracy, project/quotation associations | "abc@company.com always sends RFQs → auto-classify as quotation" |

**The specialization flywheel**:
```
Agent runs → produces output → corrections logged
                                    │
                                    ▼ (nightly)
                            Learning Agent analyzes
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            Project-wide?                   Agent-specific?
            Update CLAUDE.md                Update that agent's:
            (ALL agents benefit)            ├── SOUL.md (behavior tweak)
                                            ├── MEMORY.md (domain knowledge)
                                            └── Task definition (.claude/agents/)
                                                    │
                                                    ▼
                                            Agent runs better next time
                                            (specialization deepens)
```

This means each agent gets better at its **specific task** over time. The Health Checker learns what breaks, the Email Agent learns sender patterns, and the Docs Monitor learns where staleness accumulates. No agent needs to know about another's domain — specialization through isolation.

**Details**: [SELF_IMPROVEMENT_LEARNING_LOOP.md](./SELF_IMPROVEMENT_LEARNING_LOOP.md)

### 3. Semantic Memory Layer (Future — Phase 11)

```
Existing corrections + daily notes
     │
     ▼  (nightly, after pattern analysis)
Generate vector embeddings (Supabase pgvector)
     │
     ▼
agent_memory_embeddings table
     │
     ▼
Search by MEANING, not just keywords
├── /memory-search <topic>
├── Telegram: "remember anything about pagination?"
└── Agent Dashboard search
```

**When to build**: After 30+ corrections logged, when grep fails to find a relevant past experience.

**Details**: [SEMANTIC_MEMORY_LAYER.md](../../05-implementation/active/SEMANTIC_MEMORY_LAYER.md)

---

## 📊 Activity Tracking (Agent Dashboard)

**The Agent Dashboard tracks ALL Claude agent activity** with character usage (input + output chars) for each run. The Agent Usage Overview chart shows a stacked bar breakdown by agent over time.

### What Gets Tracked

| Source | Table | Agent Name | Status |
|--------|-------|------------|--------|
| Nightly orchestration (Agent J) | `agent_runs` | `agent-j` | ✅ Active |
| Heartbeat (Agent J, 30min) | `agent_runs` | `agent-j` | ✅ Active |
| Health Checker (nightly delegation) | `agent_runs` | `health-checker` | ✅ Active |
| Docs Monitor (nightly delegation) | `agent_runs` | `docs-monitor` | ✅ Active |
| Learning Agent (nightly delegation) | `agent_runs` | `learning-agent` | ✅ Active |
| Context Architect (weekly delegation) | `agent_runs` | `context-architect` | ✅ Active |
| Email Agent (10-min cron) | `email_agent_runs` | merged as `email-agent` | ✅ Active |
| Telegram sessions (OpenClaw hook) | `agent_runs` | `agent-j` | ✅ Active |
| Manual ad-hoc runs | `agent_runs` | per agent slug | ✅ Active (via `manual-run-wrapper.sh`) |

### Two Tables, One Chart

The dashboard merges data from TWO tables for the overview chart:
- **`agent_runs`** — shared by Agent J, Health Checker, Docs Monitor, AppBase Advisor, Learning Agent
- **`email_agent_runs`** — Email Agent only (has domain-specific columns like `threads_classified`)

`agentDashboardService.getRunsForChart()` queries both tables, normalizes email rows (adds `agent_name: 'email-agent'`), and merges by `started_at`. **If you add a new agent with a separate table, you MUST update this method.**

### What Each Row Tracks

- `agent_name` — which agent (critical — NOT NULL, indexed)
- `prompt_input` + `input_chars` — what was sent to the agent
- `full_output` + `output_chars` — what it produced
- `started_at` / `completed_at` — duration
- `files_read` / `files_edited` — what it touched
- Total chars = `input_chars + output_chars` (used by the overview chart)

### Data Pipeline

```
parse-nightly-log.sh <log_file> <run_type> <triggered_by> <agent_name> [parent_run_id] [triggered_by_agent]
                                                            ↑ CRITICAL       ↑ Delegation chain (optional)
```

The nightly orchestration script (`nightly-health-check.sh`) parses Agent J **first** to capture his run ID, then passes it as `parent_run_id` to specialist agent parses:

```bash
# Step 8a: Agent J first — returns UUID
AGENT_J_RUN_ID=$(parse-nightly-log.sh "$LOG" nightly cron agent-j)

# Step 8b-8d: Specialists linked to Agent J
parse-nightly-log.sh "$HC_LOG" nightly cron health-checker "$AGENT_J_RUN_ID" agent-j
parse-nightly-log.sh "$DM_LOG" nightly cron docs-monitor   "$AGENT_J_RUN_ID" agent-j
parse-nightly-log.sh "$LA_LOG" nightly cron learning-agent "$AGENT_J_RUN_ID" agent-j
```

This creates a **delegation tree** in the database: each specialist run links back to Agent J's run via `parent_run_id`.

**Current state**: All interaction modes are tracked — cron runs via `parse-nightly-log.sh`, Telegram sessions via `telegram-tracker` OpenClaw hook (Phase C2, input-only — output via delegation chain), manual runs via `manual-run-wrapper.sh`. See [AGENT_DASHBOARD_SYSTEM.md](./AGENT_DASHBOARD_SYSTEM.md) for full pipeline details.

### Delegation Chain (Inter-Agent Communication)

**Purpose**: Track which agent triggered a run and link parent → child runs, enabling the dashboard to show full delegation trees.

**Database columns** (on `agent_runs`):
- `parent_run_id uuid` — FK to the parent `agent_runs.id` that triggered this run
- `triggered_by_agent text` — slug of the agent that initiated the delegation (e.g., `agent-j`)

**Why this matters**: The delegation chain is the **core mechanism for tracking multi-agent communication**. As the system grows — agents discussing with each other, planning together, delegating work — the dashboard provides visibility into:
- **Who asked whom**: `triggered_by_agent` shows which agent delegated
- **Conversation flow**: `parent_run_id` links child runs back to the orchestrating run
- **Decision trees**: Recursive queries can reconstruct full delegation chains
- **Cross-agent discussion**: When Agent A asks Agent B to do something, both runs are linked
- **Input/output without duplication**: Each agent's row has its own input and output. The parent row records what was asked; the child row records what was done. No need to capture output in the parent.

**Current state**: Nightly delegation (Agent J → specialists) and Telegram input tracking are live. The delegation chain pattern naturally extends to:
- Telegram-triggered delegation (Wei Jie → Agent J → specialist) — each layer creates linked rows
- Agent-to-agent delegation without Agent J as intermediary
- Multi-agent planning sessions where agents discuss and decide together
- Dashboard visualization of delegation trees (tree view, not just flat list)

```
Delegation tree example:
Agent J (nightly orchestration)           ← parent_run_id: NULL
├── Health Checker (code health check)    ← parent_run_id: Agent J's run UUID
├── Docs Monitor (doc validation)         ← parent_run_id: Agent J's run UUID
├── Learning Agent (correction analysis)  ← parent_run_id: Agent J's run UUID
└── Context Architect (weekly audit)      ← parent_run_id: Agent J's run UUID
```

---

## 🧠 How Memory Works Across All Agents

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED (all agents read)                      │
│                                                                 │
│  CLAUDE.md ──────────── Project rules                           │
│  docs/ ──────────────── 140 architecture + feature docs         │
│  .claude/agents/ ────── Agent task definitions                  │
│                                                                 │
│  These live in the git repo. When Agent J's learning loop       │
│  improves CLAUDE.md, ALL agents automatically benefit.          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              AGENT J (Orchestrator)                              │
│                                                                 │
│  ~/.openclaw/agents/main/agent/                                 │
│  ├── SOUL.md ────────── Agent J's personality                   │
│  ├── IDENTITY.md ────── Orchestrator role + org chart           │
│  ├── USER.md ────────── Context about Wei Jie                   │
│  └── MEMORY.md ──────── Agent J's curated long-term knowledge   │
│                                                                 │
│  ~/.claude/learning/    (Agent J coordinates this)              │
│  ├── corrections/ ───── Raw corrections from all sources        │
│  ├── PATTERN_MEMORY ─── Distilled patterns                      │
│  └── IMPROVEMENT_QUEUE ─ Pending rule change proposals          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           EACH AGENT (own workspace, own identity)              │
│                                                                 │
│  ~/.openclaw/agents/<agent-name>/agent/                         │
│  ├── SOUL.md ────────── This agent's own personality            │
│  ├── IDENTITY.md ────── This agent's role + responsibilities    │
│  ├── USER.md ────────── Same Wei Jie context (shared)           │
│  └── MEMORY.md ──────── This agent's domain knowledge ONLY      │
│                                                                 │
│  Example: Health Checker's MEMORY.md knows common build errors, │
│  recurring TypeScript patterns, files that frequently break.    │
│  It does NOT know about email classification or doc formatting. │
│                                                                 │
│  Each agent CAN have its own learning data (planned).           │
│  Agent J coordinates improvement across all agents.             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              FUTURE: SEMANTIC MEMORY (Phase 11)                 │
│                                                                 │
│  Supabase: agent_memory_embeddings table                        │
│  Indexes all agents' corrections + notes as vectors             │
│  Enables search by meaning: "remember anything about X?"        │
│  Accessible by Agent J + Agent Dashboard                        │
└─────────────────────────────────────────────────────────────────┘
```

**The improvement flow**:
```
Correction happens (human or agent)
     │
     ├── Logged to Supabase agent_corrections (source: human/agent/self)
     │
     ▼  (nightly — Learning Agent)
     │
     ├── Project-wide pattern → update .claude/rules/ → ALL agents benefit
     │
     ├── Agent-specific issue → Learning Agent updates that agent's files:
     │   ├── SOUL.md (behavioral adjustment)
     │   ├── MEMORY.md (add domain knowledge)
     │   └── Agent task definition in .claude/agents/
     │
     └── Context routing gap → Context Architect (weekly) traces to upstream cause:
         ├── Missing route in CONTEXT.md → add reference
         ├── Rule not loading → fix paths: scoping
         └── Rule unclear → add Common Violations examples
```

Agent J is the **coordinator** — he delegates correction analysis to the Learning Agent, reviews proposed changes, and forwards them to Wei Jie via Telegram for approval. The Learning Agent does the analysis; Agent J decides what gets approved.

---

## 📊 Implementation Status

| Phase | What | Status | Day |
|-------|------|--------|-----|
| 1 | Mac Mini foundation (SSH, tmux, Node, Claude CLI) | ✅ Complete | Day 1 |
| 2 | OpenClaw + Telegram (bot, daemon, pairing) | ✅ Complete | Day 1 |
| 3 | Daily notes memory system | ✅ Complete | Day 2 |
| 4 | Health monitoring + cron (heartbeat + nightly) | ✅ Complete | Day 2 |
| 5 | Application health monitoring (what checks run) | ✅ Descriptive | — |
| 6 | VS Code daily integration (how it fits your workflow) | ✅ Descriptive | — |
| 7 | AppBase Knowledge Advisor agent | ✅ Complete | Day 3 |
| 8 | Email Automation System (Email Agent) — [full spec](../email-automation/EMAIL_AUTOMATION_SYSTEM.md) | 🟡 In Progress (8A+8B+8C+8D+8F done, 8E pending) | Week 2+ |
| 9 | Self-improvement learning loop | ✅ Complete | Day 2 |
| 10 | Agent Dashboard in AppBase — [full spec](./AGENT_DASHBOARD_SYSTEM.md) | ✅ Complete (UI + Mac Mini pipeline deployed) | Day 3-4 |
| 11 | Semantic memory layer (pgvector) | 🔵 Planned | After Phase 10 |
| — | Agent J identity (SOUL.md, IDENTITY.md, USER.md) | ✅ Complete | Day 3 |
| — | Promote agents to full independent entities (own workspaces) | ✅ Complete | [Execution Plan](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md) A1-A3, A6 (2026-03-24) |
| — | Create Learning Agent (correction analysis & rule improvement) | ✅ Complete | [Execution Plan](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md) A4 (2026-03-24) |
| — | Update Agent J to pure orchestrator | ✅ Complete | [Execution Plan](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md) A5 (2026-03-24) |
| — | Activity tracking for ALL interactions (incl. Telegram) | ✅ Complete (cron + Telegram tracked, manual pending) | [Execution Plan](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md) C1-C4 |
| — | Learning pipeline redesign (two-layer, Supabase-direct) | ✅ Complete | [Execution Plan](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md) B1-B5 |

### Dashboard Vision

The Agent Dashboard (`/agent-dashboard`) is the **single pane of glass** for the entire autonomous agent ecosystem — an overview of what all agents are doing. As the system scales to multi-agent communication, discussion, and planning, the dashboard provides full visibility into:

1. **Who talked to whom** — delegation chain shows which agent triggered which run
2. **What was discussed** — each agent's row has its own input/output (no duplication needed)
3. **How decisions flow** — parent → child run links show delegation trees
4. **Resource usage** — character tracking (input + output) per agent over time
5. **Agent specialization** — each agent's corrections and improvements tracked separately
6. **Multi-agent conversations** — as agents discuss and plan with each other, each turn creates a linked row in the delegation chain

**Current capabilities**:
- Agent Usage Overview chart (stacked bar by agent, interactive, time scale selector)
- All 6 agents clickable with detail pages
- Activity timeline with expandable run details (prompt, output, files, chars)
- Delegation chain badges (`← agent-j`) on triggered runs
- Corrections tab showing agent-specific learning

**Future capabilities** (as the system grows toward multi-agent communication):
- Delegation tree visualization (nested tree view, not just flat list)
- Cross-agent conversation threads (agents discuss and plan with each other, each turn a linked row)
- Multi-layer delegation (Wei Jie → Agent J → Specialist → Sub-specialist)
- Real-time run monitoring (live status during long-running delegations)
- Agent performance comparison (accuracy, speed, chars/run over time)
- Planning sessions — multiple agents collaborating on a decision, tracked as a conversation chain

**Current state**: Phases 1-10 complete. **All three workstreams complete** (2026-03-24). **Workstream A** — all 5 specialist agents promoted to full independent entities, Agent J updated to pure orchestrator (A5), nightly script delegates to agents and parses each output separately into `agent_runs`. **Workstream B** — learning pipeline fully operational: Supabase-direct correction logging, `source` column for two-layer tracking, `.claude/rules/` directory with 12 sub-files, Learning Agent writes to rules files, dashboard source filter. **Workstream C** — all agent cards clickable with detail pages, `agent_name` column added, Telegram sessions tracked via OpenClaw hook (`telegram-tracker`). See [AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md) for the full execution history.

---

## 🚨 Errors Encountered & Resolutions

*See [OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md](./OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md) for the full error log (8 errors documented with root causes and fixes).*

---

## ⚠️ What NOT To Try Again

### Agent Architecture
- ❌ **"Sub-agents" as prompt files inside Agent J's context** — Every agent should be a full independent entity with own workspace, personality, and memory. Prompt files (`.claude/agents/*.md`) are task definitions, not agents.
- ❌ **Agent J doing tasks himself** — Agent J orchestrates and improves. He delegates tasks to focused agents.

### Activity Tracking & Dashboard
- ❌ **Only tracking cron runs in Activity** — ALL Claude API usage (Telegram, cron, manual) must be tracked for full observability.
- ❌ **Creating agent run tables without `input_chars`/`output_chars`** — Every agent run table MUST have character tracking columns (`input_chars int`, `output_chars int`, `prompt_input text`, `full_output text`) from day one. Without these, the agent is invisible in the usage overview chart. This happened with `email_agent_runs` and required a retroactive migration.
- ❌ **Forgetting `agent_name` in `parse-nightly-log.sh`** — The 4th positional argument is the agent slug. `agent_runs.agent_name` is NOT NULL. Without it, all runs default to `agent-j` and the stacked chart shows only one agent.
- ❌ **Only parsing the orchestration log in the nightly script** — Each specialist agent's output must be saved to a separate log file and parsed individually with `parse-nightly-log.sh`. The nightly script initially only parsed Agent J's log — Health Checker, Docs Monitor, and Learning Agent runs were lost.
- ❌ **Manual UTC offsets for timezone display** — Never do `new Date(ts + 8 * 60 * 60 * 1000)`. Always use `SINGAPORE_TIMEZONE` from `timezoneUtils.ts` with `toLocaleDateString`/`toLocaleTimeString`. Violating this produces confusing chart labels.
- ❌ **Assuming one table serves all agents in the chart** — Email Agent has its own table. The chart service (`getRunsForChart()`) must merge ALL agent tables. Any new separate run table requires updating this method.
- ❌ **Using `agents_called` or `run_type` to identify which agent owns a run** — `agents_called` tracks delegation, `run_type` tracks trigger type. Only `agent_name` identifies ownership.
- ❌ **Capturing Telegram output by reading Claude CLI JSONL transcripts** — Tried 3 iterations (timer delays, content matching, retry polling). Fundamentally unreliable: sessions overlap, timing varies, wrong output gets matched. Use input-only capture + delegation chain for output tracking instead.

*See [OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md](./OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md) for the full list of failed approaches. See [AGENT_DASHBOARD_SYSTEM.md](./AGENT_DASHBOARD_SYSTEM.md) for dashboard-specific error history.*

---

## 📝 Change Log

| Date | Change | Notes |
|------|--------|-------|
| 2026-03-23 | Initial overview created | Combines context from OPENCLAW, SELF_IMPROVEMENT, and SEMANTIC_MEMORY docs |
| 2026-03-23 | Phase 8 references updated | Linked to EMAIL_AUTOMATION_SYSTEM.md, added Gmail API details |
| 2026-03-23 | Post-Phase 10 accuracy review | Fixed rule count (12→13), doc count (133→136), updated Phase 10 status references |
| 2026-03-23 | Architecture redesign | Removed sub-agent concept — all agents are full independent entities. Agent J is orchestrator only. Activity tracks ALL API usage. |
| 2026-03-23 | Added Learning Agent | Added Learning Agent to agent table, Big Picture diagram, improvement flow, nightly delegation. Linked execution plan. Fixed doc count (138). |
| 2026-03-24 | Dashboard enhancement | Phase 10 fully deployed: AgentOverviewChart (stacked bar by agent), AgentActivityChart (per-agent interval graph), all 6 agents clickable with detail pages, centralized agentRegistry.ts, per-agent filtering via agent_name column. |
| 2026-03-24 | Character tracking across all agents | Added input_chars/output_chars to email_agent_runs. Fixed parse-nightly-log.sh to pass agent_name (4th arg). Updated nightly script to parse each specialist agent's output separately. Comprehensive "What NOT To Try" section for dashboard lessons learned. |
| 2026-03-24 | Delegation chain | Added parent_run_id + triggered_by_agent to agent_runs. Nightly script parses Agent J first, passes ID to specialist parses. Dashboard shows delegation badges. Documented specialization flywheel and dashboard vision. |
| 2026-03-24 | Telegram session tracking (C2) | Custom OpenClaw hook `telegram-tracker` at `~/.openclaw/hooks/telegram-tracker/`. Captures input instantly via `message:received` — input-only design (output tracking via delegation chain). Workstream C fully complete. |
| 2026-03-25 | Context Architect agent added | New specialist agent that audits context hierarchy (Layer 0→3) based on MWP standard. Traces corrections to context routing gaps. Weekly schedule, `/context-audit` manual trigger. Deployed on Mac Mini with full personality files. |
