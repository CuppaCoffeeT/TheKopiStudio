# Creating Agents

**Created**: 2026-03-23 11:00:00 SGT
**Last Updated**: 2026-03-25 14:15:00 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

Step-by-step guide to creating a new agent on the Mac Mini that reports to Agent J. Every agent is a **full independent entity** with its own OpenClaw workspace, personality files, memory, and focused task.

There are no "sub-agents" or "lightweight definitions". Every task that is repetitive (daily, weekly, or trigger-based) gets its own agent.

## 📚 Related Documentation

- [AGENT_ARCHITECTURE_OVERVIEW.md](./AGENT_ARCHITECTURE_OVERVIEW.md) — How all agents and memory systems fit together
- [OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md](./OPENCLAW_AUTONOMOUS_AGENT_SYSTEM.md) — Full implementation phases
- [SELF_IMPROVEMENT_LEARNING_LOOP.md](./SELF_IMPROVEMENT_LEARNING_LOOP.md) — How Agent J improves all agents
- [LEARNING_PIPELINE_REDESIGN.md](./LEARNING_PIPELINE_REDESIGN.md) — Two-layer learning pipeline (implemented)

---

## 🎯 When to Create an Agent

Create a new agent when:
- The task is **repetitive** — runs daily, weekly, or on a trigger
- It has a **clear, focused scope** — one job, done well
- It benefits from **its own memory** — domain-specific patterns and knowledge

**Don't create an agent when:**
- The task is a one-off command → use a slash command in `.claude/commands/`
- The task is a human workflow → use a skill in `.claude/commands/`

---

## 🧬 Agent Anatomy

Every agent has the same structure:

```
~/.openclaw/agents/<agent-name>/agent/
├── SOUL.md          ← Personality: values, principles, voice, boundaries
├── IDENTITY.md      ← Role: name, responsibilities, org chart, reports to Agent J
├── USER.md          ← About Wei Jie (copied from Agent J — same human)
├── MEMORY.md        ← Lightweight knowledge index (points to references/)
├── references/      ← Detailed domain knowledge files (created over time)
│   ├── <topic>.md   ← e.g., build-errors.md, sender-patterns.md
│   └── ...
└── auth-profiles.json
```

| Category | Files | Auto-Loaded? | Purpose |
|----------|-------|-------------|---------|
| **Personality** | SOUL.md, IDENTITY.md, USER.md | Yes — OpenClaw loads all `.md` from agentDir | Who the agent is, how it communicates |
| **Knowledge Index** | MEMORY.md | Yes — loaded with personality files | Lightweight index pointing to reference files (max 50 lines) |
| **References** | references/*.md | **No** — agent reads on-demand via Read tool | Detailed domain knowledge (created by Learning Agent over time) |
| **Shared Rules** | .claude/rules/*.md (in workspace) | Yes — Claude Code auto-loads rule files | Project-wide patterns all agents follow |
| **Task Definition** | .claude/agents/<slug>.md (in repo) | Varies — used by Agent J for delegation | What the agent does, tools, process flow |

### How Context Loading Works (Critical)

When an agent runs via `claude -p "..." --agent <name>`:

```
Auto-loaded (always in context):
├── CLAUDE.md          ← from workspace root (shared project rules)
├── .claude/rules/*.md ← from workspace (shared detailed rule patterns)
├── SOUL.md            ← from agentDir (personality)
├── IDENTITY.md        ← from agentDir (role & responsibilities)
├── USER.md            ← from agentDir (user context)
└── MEMORY.md          ← from agentDir (knowledge index — keep under 50 lines!)

On-demand (agent reads when needed, based on MEMORY.md pointers):
└── references/*.md    ← from agentDir/references/ (detailed domain knowledge)
```

**Why this matters**: MEMORY.md is auto-loaded every run, so it must stay small (index only). Detailed knowledge lives in `references/` files that the agent reads only when relevant — this prevents context window bloat.

### What Makes Each Agent Unique

Each agent is **hyper-focused on one task area**:

| Agent | Sole Focus | Example Memory |
|-------|-----------|----------------|
| Health Checker | Code health (TS, queries, migrations) | "src/pages/InvoiceList.tsx frequently breaks" |
| Docs Monitor | Documentation quality | "docs/03-features/ has the most stale files" |
| AppBase Advisor | Architecture Q&A | "People normalization is asked about most" |
| Learning Agent | Correction analysis & rule improvement | "shadcn component pattern has 8 occurrences" |
| Context Architect | Context hierarchy audit & error prevention | "toast-system.md paths: too narrow — corrections in page files" |
| Email Agent | Gmail classification + drafts | "abc@company.com always sends RFQs" |

---

## 📝 Step-by-Step Guide

### Step 1: Create the OpenClaw Agent

```bash
# SSH into Mac Mini
ssh youruser@your-mac-mini

# Create the agent with its own workspace
openclaw agents add <agent-name> --workspace ~/<agent-workspace>

# Example: Health Checker
openclaw agents add health-checker --workspace ~/appbase-health-checker
```

### Step 2: Create the Workspace

```bash
# Clone the AppBase repo (most agents need code access)
git clone git@github.com:weijieJL/trench-trace-portal-app.git ~/<agent-workspace>
```

### Step 3: Write Personality Files

Create files in `~/.openclaw/agents/<agent-name>/agent/`:

#### SOUL.md — How the agent thinks

```markdown
# Soul

You are [role description]. You are [personality traits].

## Principles
- [Key principle 1]
- [Key principle 2]

## Voice
- [Communication style]

## Boundaries
- [What this agent should NOT do]
- You report findings to Agent J — do not act autonomously on critical decisions
- You follow all rules in CLAUDE.md
```

#### IDENTITY.md — Who the agent is

```markdown
# Identity

- name: [Agent Name]
- creature: [role title]
- vibe: [personality in 3-5 words]

## Role
[One paragraph: what this agent does — one focused task]

## Responsibilities
- [Specific task 1]
- [Specific task 2]

## Reports To
Agent J (Orchestrator) — consolidates findings into Telegram summaries

## Organisation Chart
Wei Jie (Human)
└── Agent J (Orchestrator)
    └── [This Agent] ← YOU ARE HERE
```

#### USER.md — Copy from Agent J

```bash
# Same human, so copy the USER.md
cp ~/.openclaw/agents/main/agent/USER.md ~/.openclaw/agents/<agent-name>/agent/USER.md
```

#### MEMORY.md — Knowledge Index (Standard Pattern)

```markdown
# Agent Memory — <Agent Name>

## Active Context
<!-- Current priorities or active incidents — clear when resolved -->

## Domain Knowledge Index
<!-- One line per reference — pointer only, no detail -->
- <topic>: see references/<topic>.md
- <shared-rule>: see .claude/rules/<rule>.md (shared repo)

## Past Analyses
<!-- Last 10 runs — date + one-line summary -->

## Patterns Watching
<!-- Populated by Learning Agent nightly audit -->
```

**Rules**: Max 50 lines, no inline detail, one line per pointer in Domain Knowledge Index. See `.claude/agents/learning-agent.md` for full standard.

#### references/ — Domain Knowledge Directory

```bash
# Create the references directory (Learning Agent populates it over time)
mkdir -p ~/.openclaw/agents/<agent-name>/agent/references/
```

Reference files are **NOT auto-loaded** — the agent reads them on-demand based on MEMORY.md pointers. This prevents context window bloat while keeping detailed knowledge accessible.

### Step 4: Configure the Agent

```bash
# Set identity from the files you created
openclaw agents set-identity --agent <agent-name> --from-identity

# Verify
openclaw agents list
```

### Step 5: Set Up Scheduling

For agents that run on a schedule:

```bash
crontab -e

# Example: Health Checker runs nightly at 2am
0 2 * * * /opt/homebrew/bin/claude -p "Run health checks..." -d ~/appbase-health-checker >> /tmp/health-checker-$(date +\%Y\%m\%d).log 2>&1 && ~/.claude/scripts/parse-nightly-log.sh /tmp/health-checker-$(date +\%Y\%m\%d).log nightly cron health-checker
```

### Step 6: Register with Agent J

1. Update Agent J's IDENTITY.md org chart to include the new agent
2. Keep the task definition in `.claude/agents/<name>.md` in the repo (this tells Agent J what the agent does and how to delegate)

### Step 7: Register in Agent Dashboard

Add the agent to the Agent Dashboard so its runs appear and character usage is tracked:

1. **Add to Agent Registry** (`src/config/agentRegistry.ts`) — single source of truth for all agent metadata (slug, name, role, icon, schedule, tools, category). This makes the agent appear on the dashboard and have a clickable detail page.

2. **Add to `sync-agent-files.sh`** (`.claude/scripts/sync-agent-files.sh`) — add the agent's directory→slug mapping to the `SLUG_MAP` so personality files (SOUL.md, IDENTITY.md, MEMORY.md) get synced from Mac Mini to the `agent_files` Supabase table. Then run the sync or manually insert the files via SQL. **Without this, the agent's personality files won't appear on the dashboard profile card.**
   ```bash
   # In SLUG_MAP, add:
   ["context-architect"]="context-architect"

   # Then run the sync on Mac Mini:
   bash .claude/scripts/sync-agent-files.sh

   # Or manually insert via Supabase MCP if sync script has issues:
   INSERT INTO agent_files (agent_slug, file_name, content, updated_at)
   VALUES ('new-agent', 'SOUL.md', '<content>', NOW())
   ON CONFLICT (agent_slug, file_name) DO UPDATE SET content = EXCLUDED.content, updated_at = EXCLUDED.updated_at;
   ```

3. **Assign a chart color** — add the agent's slug to `AGENT_COLORS` in `agentRegistry.ts` so it gets a distinct color in the stacked usage overview chart.

4. **Ensure character tracking columns** — the agent's run table MUST have `input_chars int` and `output_chars int` columns (plus `prompt_input text` and `full_output text` for prompt visibility). Without these, the agent won't show character usage in the overview chart.
   - If using the shared `agent_runs` table: columns already exist
   - If using a separate table (like `email_agent_runs`): add the columns via migration

5. **Log runs with character data** — when logging agent runs, always record:
   - `input_chars`: character count of the prompt sent to the agent
   - `output_chars`: character count of the agent's full output
   - `prompt_input`: the actual prompt text (shown in expandable detail)
   - `full_output`: the complete agent response (shown in expandable detail)

6. **Update `getRunsForChart()`** in `agentDashboardService.ts` — if using a separate run table, add a query block to merge the agent's runs into the chart data (see `email_agent_runs` merge pattern as reference).

7. **Ensure `parse-nightly-log.sh`** captures this agent's runs with the agent slug as the **4th positional argument** (NOT a flag) → inserts into `agent_runs` with the correct `agent_name` value. The script returns the inserted run's UUID on stdout for delegation chain linking.
   ```bash
   # Usage: parse-nightly-log.sh <log_file> <run_type> <triggered_by> <agent_name> [parent_run_id] [triggered_by_agent]

   # Standalone agent (no delegation chain):
   bash ~/.claude/scripts/parse-nightly-log.sh /tmp/my-agent-20260324.log nightly cron my-agent

   # Agent delegated by another agent (with delegation chain):
   PARENT_ID=$(bash ~/.claude/scripts/parse-nightly-log.sh /tmp/parent.log nightly cron parent-agent)
   bash ~/.claude/scripts/parse-nightly-log.sh /tmp/my-agent.log nightly cron my-agent "$PARENT_ID" parent-agent
   ```
   If the agent is delegated by the nightly orchestration script (`nightly-health-check.sh`), add a parse call in step 8 of that script — Agent J is parsed first to get his run ID, then specialist agents are parsed with `parent_run_id` and `triggered_by_agent` set. See existing patterns for health-checker, docs-monitor, learning-agent in that script.

8. **Update the `agent_name` CHECK constraint** — both `agent_runs` and `agent_corrections` have a CHECK constraint that only allows valid slugs. You MUST add the new agent's slug via migration:
   ```sql
   ALTER TABLE public.agent_runs DROP CONSTRAINT agent_runs_valid_agent_name;
   ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_valid_agent_name
     CHECK (agent_name IN ('agent-j', 'health-checker', 'docs-monitor', 'appbase-advisor', 'email-agent', 'learning-agent', 'new-agent-slug'));
   -- Same for agent_corrections
   ```
   Without this, inserts with the new slug will be rejected by the database.

### Step 9: Test

```bash
# Test the agent responds (openclaw agents run does NOT exist — use claude -p directly)
claude -p "hello, what is your role?" -d ~/appbase-<agent-workspace>

# Test via Agent J delegation
# From Telegram: "run a health check" → Agent J delegates to Health Checker
```

---

## 📂 Full Agent Registry

```
~/.openclaw/agents/
├── main/                              ← Agent J (Orchestrator)
│   └── agent/
│       ├── SOUL.md
│       ├── IDENTITY.md
│       ├── USER.md                    ← About Wei Jie
│       └── MEMORY.md
│
├── health-checker/                    ← Health Checker (✅ promoted 2026-03-24)
│   └── agent/
│       ├── SOUL.md                    ← "Thorough, systematic, zero false positives"
│       ├── IDENTITY.md               ← "Code health monitor, reports to Agent J"
│       ├── USER.md                    ← Copy of Agent J's USER.md
│       └── MEMORY.md                  ← Build error patterns, frequently broken files
│
├── docs-monitor/                      ← Docs Monitor (✅ promoted 2026-03-24)
│   └── agent/
│       ├── SOUL.md                    ← "Meticulous, consistency-focused"
│       ├── IDENTITY.md               ← "Documentation validator, reports to Agent J"
│       ├── USER.md
│       └── MEMORY.md                  ← Stale doc patterns, common link issues
│
├── appbase-advisor/                     ← AppBase Advisor (✅ promoted 2026-03-24)
│   └── agent/
│       ├── SOUL.md                    ← "Knowledgeable, cites sources, concise"
│       ├── IDENTITY.md               ← "Architecture knowledge agent, reports to Agent J"
│       ├── USER.md
│       └── MEMORY.md                  ← Frequently asked patterns, common confusions
│
├── learning-agent/                    ← Learning Agent (Phase A4 of redesign)
│   └── agent/
│       ├── SOUL.md                    ← "Analytical, pattern-focused, conservative (3+ threshold)"
│       ├── IDENTITY.md               ← "Correction analyst & rule improver, reports to Agent J"
│       ├── USER.md
│       └── MEMORY.md                  ← Correction patterns, rule change history
│
├── email-agent/                       ← Email Agent (Phase A6 — Mac Mini, Claude Max $0)
│   └── agent/
│       ├── SOUL.md                    ← "Cautious, DRAFTS ONLY, never auto-sends"
│       ├── IDENTITY.md               ← "Email classifier, reports to Agent J"
│       ├── USER.md
│       └── MEMORY.md                  ← Email patterns, sender history
│
└── [future-agent]/
    └── agent/
        ├── SOUL.md, IDENTITY.md, USER.md, MEMORY.md
```

---

## 🧠 Memory & Rules — What's Shared vs Isolated

| File | Agent J | Other Agents | Purpose |
|------|---------|-------------|---------|
| **CLAUDE.md** (repo) | ✅ Reads | ✅ Reads | Shared project rules — all agents follow |
| **SOUL.md** | Own | Own (isolated) | Personality, voice, principles |
| **IDENTITY.md** | Own | Own (isolated) | Role, responsibilities, org chart |
| **USER.md** | Own | Copied from Agent J | Context about Wei Jie (same human) |
| **MEMORY.md** | Own | Own (isolated) | Curated domain knowledge |
| Learning loop | ✅ Coordinates | Each agent can contribute corrections | Agent J analyzes patterns + proposes improvements |

### How Agents Get Improved (via Learning Agent)

```
Corrections logged (human or agent self-correction)
     │
     ▼  (nightly — Learning Agent analyzes)
     │
     ├── Project-wide pattern? (e.g., "always use .range() for queries")
     │   → Update .claude/rules/<category>.md → git commit + push
     │   → ALL agents + VS Code benefit automatically (auto-loaded from workspace)
     │
     └── Agent-specific issue? (e.g., "Health Checker missed a migration")
         → Create/update references/<topic>.md in that agent's agentDir
         → Add pointer in that agent's MEMORY.md (one line: "- <topic>: see references/<topic>.md")
         → Next run: agent sees pointer in MEMORY.md (auto-loaded), reads reference file when relevant
```

**Two improvement paths, two file types:**

| Correction Source | Where Knowledge Goes | Auto-Loaded? | Who Benefits |
|-------------------|---------------------|-------------|-------------|
| Human (VS Code) | `.claude/rules/<category>.md` (shared repo) | Yes — all agents + VS Code | Everyone |
| Agent self-correction | `references/<topic>.md` (agent-specific) | No — read on-demand via MEMORY.md pointer | That specific agent |

**Daily memory audit**: The Learning Agent also checks all agents' MEMORY.md files for compliance with the standard pattern (see `.claude/agents/learning-agent.md` for the full audit spec).

Agent J coordinates this process — he delegates analysis to the Learning Agent, reviews proposed changes, and forwards them to Wei Jie via Telegram for approval. See [AGENT_ARCHITECTURE_OVERVIEW.md](./AGENT_ARCHITECTURE_OVERVIEW.md) for the full specialization flywheel.

---

## ✅ Checklist for New Agent

- [ ] `openclaw agents add <name> --workspace <path>`
- [ ] Create workspace (clone repo)
- [ ] Write SOUL.md (personality, principles, boundaries)
- [ ] Write IDENTITY.md (name, role, org chart, reports to Agent J)
- [ ] Copy USER.md from Agent J
- [ ] Create MEMORY.md following standard pattern (4 sections, max 50 lines)
- [ ] Create `references/` directory (`mkdir -p agent/references/`)
- [ ] `openclaw agents set-identity --agent <name> --from-identity`
- [ ] Set up cron if scheduled
- [ ] Update Agent J's IDENTITY.md org chart
- [ ] Keep `.claude/agents/<name>.md` task definition in repo
- [ ] Add to `src/config/agentRegistry.ts` (slug, name, role, icon, color, category)
- [ ] Add to `sync-agent-files.sh` SLUG_MAP + run sync (or manual SQL insert into `agent_files`)
- [ ] Ensure run table has `input_chars`, `output_chars`, `prompt_input`, `full_output` columns
- [ ] If separate run table: update `getRunsForChart()` in `agentDashboardService.ts` to merge data
- [ ] Update CHECK constraint on `agent_runs` and `agent_corrections` to include new slug (migration required)
- [ ] Ensure activity tracking via `parse-nightly-log.sh` (4th arg = agent slug) or direct Supabase logging
- [ ] If delegated by nightly script: add parse call in `nightly-health-check.sh` with agent slug + `parent_run_id` + `triggered_by_agent`
- [ ] Test: agent responds correctly to domain questions
- [ ] Test: Agent J can delegate to this agent

---

## 🚨 Errors Encountered & Resolutions

### `openclaw agents add` pre-creates workspace directory
**What happened**: Running `openclaw agents add <name> --workspace <path>` creates an empty git repo in the workspace directory with template files (AGENTS.md, BOOTSTRAP.md, etc.).
**Resolution**: `rm -rf` the contents and re-clone the AppBase repo, or use `git init` + `git fetch` + `git checkout`.
**Discovered during**: Phase A1 (Health Checker promotion, 2026-03-24)

### `set-identity --from-identity` flag doesn't work as documented
**What happened**: `openclaw agents set-identity --agent <name> --from-identity` looks in the workspace root, not the agent personality directory.
**Resolution**: Use `--identity-file` flag pointing to the workspace IDENTITY.md directly. Also create a copy of IDENTITY.md at the workspace root.
**Discovered during**: Phase A1, A3 (2026-03-24)

### `openclaw agents run` doesn't exist
**What happened**: The documented command `openclaw agents run <name> "prompt"` is not a real command.
**Resolution**: Use `claude -p "prompt" -d ~/workspace` to invoke an agent in its workspace.
**Discovered during**: Phase A3 (AppBase Advisor promotion, 2026-03-24)

### Agent personality files missing from dashboard after full deployment
**What happened**: Context Architect was fully deployed (registry, CHECK constraints, nightly script, Mac Mini personality files) but SOUL.md/IDENTITY.md/MEMORY.md didn't show on the Agent Dashboard profile card.
**Root cause**: The `sync-agent-files.sh` script has a hardcoded `SLUG_MAP` that maps agent directories to slugs. The new agent wasn't added to this map, so the sync never uploaded its files to the `agent_files` Supabase table.
**Resolution**: Add the agent to `SLUG_MAP` in `.claude/scripts/sync-agent-files.sh` and run the sync. Step 7.2 in the checklist now documents this correctly.
**Discovered during**: Context Architect deployment (2026-03-25)

### `sync-agent-files.sh` fails on Mac Mini (bash 3.2)
**What happened**: The script uses `declare -A` (associative arrays) which requires bash 4+. Mac Mini has bash 3.2.
**Root cause**: macOS ships bash 3.2 (GPLv2). Homebrew bash wasn't installed on the Mac Mini.
**Resolution**: Either install bash 4+ via `brew install bash` or manually insert agent files via Supabase SQL. The checklist now includes the manual SQL fallback.
**Discovered during**: Context Architect deployment (2026-03-25)

---

## ⚠️ What NOT To Try Again

- ❌ **"Sub-agents" as prompt files inside Agent J's context** — This was the initial approach (`.claude/agents/*.md` running within Agent J). It doesn't scale: no isolated memory, no independent scheduling, shared context window. Every task gets its own full agent.
- ❌ **Sharing MEMORY.md between agents** — each agent's memory is isolated. Shared knowledge goes in CLAUDE.md or docs/.
- ❌ **Letting agents directly message Telegram** — all Telegram communication goes through Agent J unless explicitly configured otherwise.
- ❌ **Forgetting `agent_name` in `parse-nightly-log.sh`** — the `agent_runs` table has `agent_name NOT NULL`. If you don't pass the 4th positional arg, it defaults to `agent-j` and all runs get attributed to Agent J. Every cron/script call MUST pass the correct agent slug.
- ❌ **Separate run tables without character tracking columns** — `email_agent_runs` was created without `input_chars`/`output_chars`/`prompt_input`/`full_output`, making the email agent invisible in the usage overview chart. ALL agent run tables MUST have these columns from day one.
- ❌ **Using `--agent-name` as a flag** — `parse-nightly-log.sh` uses positional arguments, not flags. The agent name is the 4th argument: `parse-nightly-log.sh <log> <type> <trigger> <agent-name>`.
- ❌ **Only parsing the orchestration log** — the nightly script initially only parsed Agent J's orchestration log. Specialist agents (health-checker, docs-monitor, learning-agent) outputs must ALSO be saved to separate log files and parsed individually with their own `agent_name`.
- ❌ **Skipping `sync-agent-files.sh` SLUG_MAP update** — personality files (SOUL.md, IDENTITY.md, MEMORY.md) show on the dashboard via the `agent_files` Supabase table, NOT via Vite imports. If you don't add the agent to `SLUG_MAP` in `.claude/scripts/sync-agent-files.sh`, the profile card will be empty. This is Step 7.2.

---

## 📝 Change Log

| Date | Change | Notes |
|------|--------|-------|
| 2026-03-23 | Initial guide created | Step-by-step for creating specialist agents on Mac Mini |
| 2026-03-23 | Architecture redesign | Removed sub-agent concept. All agents are full independent entities. Added agent anatomy, registry, dashboard registration steps. |
| 2026-03-24 | Dashboard registration overhaul | Step 7 now references `agentRegistry.ts`, `agentPersonalityFiles.ts`, `AGENT_COLORS`, and requires `input_chars`/`output_chars` columns for chart tracking. Checklist updated. |
| 2026-03-24 | Delegation chain support | Step 7.7 updated: `parse-nightly-log.sh` now accepts optional 5th arg (`parent_run_id`) and 6th arg (`triggered_by_agent`). Returns inserted UUID on stdout for chaining. Nightly script parses Agent J first, passes ID to specialist parses. |
| 2026-03-24 | MEMORY.md + references architecture | Added MEMORY.md standard pattern (4 sections, max 50 lines) and `references/` directory to agent anatomy. Documented context loading chain (what's auto-loaded vs on-demand). Updated improvement flow diagram. Added to checklist. |
| 2026-03-25 | Fix Step 7.2: personality files via `sync-agent-files.sh` | Step 7.2 was wrong — referenced non-existent `agentPersonalityFiles.ts`. Actual mechanism is `agent_files` Supabase table populated by `sync-agent-files.sh` SLUG_MAP. Checklist updated. Added errors & "What NOT To Try" entries. |
