# OpenClaw Autonomous Agent System

**Created**: 2026-03-22 20:00:00 SGT
**Last Updated**: 2026-05-31 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

This document describes the OpenClaw-style autonomous agent setup for AppBase — an always-on Claude Code agent running on a dedicated Mac Mini (Claude Max 20x) that monitors the application, enforces CLAUDE.md standards, learns from corrections, and processes business operations (starting with email intelligence). It complements daily VS Code + Claude Code work; it does not replace it.

## 📚 Related Documentation

- [AGENT_ARCHITECTURE_OVERVIEW.md](./AGENT_ARCHITECTURE_OVERVIEW.md) — **Start here** — how Agent J, all subsystems, and multi-agent architecture fit together
- [EMAIL_AUTOMATION_SYSTEM.md](../email-automation/EMAIL_AUTOMATION_SYSTEM.md) — **Phase 8 full spec** — Gmail sync, inbox module, AI classification, feedback loop (6 sub-phases)
- [CREATING_SPECIALIST_AGENTS.md](./CREATING_SPECIALIST_AGENTS.md) — Step-by-step guide to adding new specialist agents
- [SELF_IMPROVEMENT_LEARNING_LOOP.md](./SELF_IMPROVEMENT_LEARNING_LOOP.md) — Phase 9: how the agent learns from corrections and improves CLAUDE.md over time
- [SEMANTIC_MEMORY_LAYER.md](../../05-implementation/active/SEMANTIC_MEMORY_LAYER.md) — Phase 11: vector search over agent memory (pgvector, future)
- [CLAUDE.md](../../../CLAUDE.md) — Project rules the agent enforces (and proposes improvements to)
- [SUPABASE_QUERY_STANDARDS.md](../../01-system-architecture/SUPABASE_QUERY_STANDARDS.md) — Rule #8 the health checker enforces
- [MODULE_SYSTEM.md](../../01-system-architecture/MODULE_SYSTEM.md) — How to add the Email Inbox module
- [WORKFLOW_SYSTEM.md](../../01-system-architecture/WORKFLOW_SYSTEM.md) — Approval workflow the email agent integrates with
- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md) — Full docs index

---

## 🗺️ How Everything Works Together

> **If you're confused about what runs where and why — start here.**

### The Three Machines / Environments

```
┌─────────────────────────────────┐     ┌──────────────────────────────────┐
│  YOUR LAPTOP                    │     │  MAC MINI (headless, 24/7)       │
│                                 │     │                                  │
│  VS Code + Claude Code          │     │  Claude Code CLI (headless)      │
│  (interactive, you drive)       │     │  (autonomous, cron-driven)       │
│                                 │     │                                  │
│  AppBase repo (where you code)    │─git→│  AppBase repo (clone, read-only    │
│                                 │push │  for health checks)              │
│                                 │     │                                  │
│  Browser: your-app.example.com        │     │  OpenClaw daemon (Telegram bridge)│
│  (the live AppBase app)           │     │  Cron jobs (heartbeat + nightly) │
└─────────────────────────────────┘     │  ~/.claude/ (memory + logs)      │
                                        └──────────────────────────────────┘
         │                                           │
         └──────────────────┬────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │  CLOUD SERVICES            │
              │                            │
              │  Supabase (PostgreSQL DB)  │
              │  GitHub (code repository)  │
              │  Telegram (notifications)  │
              └────────────────────────────┘
```

### What "OpenClaw" Actually Is

**OpenClaw IS a real software product** — a free, open-source (MIT), self-hosted messaging gateway. Install it with `npm install -g openclaw`.

> OpenClaw bridges Telegram → Claude Code CLI on your Mac Mini. It uses the `claude` CLI binary as its backend agent, so it runs on your Claude Max subscription with no extra API billing.

The pieces:
| Component | What it is | Runs on |
|---|---|---|
| **OpenClaw** | Free, open-source Telegram ↔ Claude gateway (`npm install -g openclaw`) | Mac Mini (launchd daemon) |
| **Claude Code CLI** | The `claude` command — OpenClaw's backend agent, already authenticated via `claude login` | Mac Mini |
| **cron jobs** | Scheduled `claude -p "..."` commands for heartbeat + nightly | Mac Mini |
| **tmux** | Terminal session manager — keeps agent alive when SSH disconnects | Mac Mini |
| **AppBase repo** | Git clone of your app — agent reads this to do health checks | Mac Mini |
| **Supabase MCP** | Claude's tool to query/migrate your database | Mac Mini |
| **`~/.claude/`** | Memory, daily notes, learning logs | Mac Mini |
| **`~/.openclaw/`** | OpenClaw config, sessions, Telegram bot credentials | Mac Mini |

### Data Flow: How Everything Connects

```
1. YOU CODE (on laptop)
   VS Code + Claude Code (interactive session)
       ↓ you write code, test, fix bugs
   /git-sync → git push to GitHub

2. MAC MINI PICKS UP CHANGES (every 30 min heartbeat)
   Cron fires → claude -p "check daily notes, resume pending tasks"
   Agent does: git pull → runs health checks on new code
       ↓ if TypeScript errors / CLAUDE.md violations found:
   Telegram alert to your phone: "2 errors in InvoiceList.tsx:142"

3. NIGHTLY AUDIT (2am SGT)
   Agent runs: TypeScript build + docs health + migration check
             + correction pattern analysis (learning loop)
             + daily notes consolidation
   Sends Telegram summary: "All clear / X issues found"

4. YOU MESSAGE TELEGRAM (from phone)
   "Check if any migrations are missing"
       ↓ OpenClaw receives → passes to claude CLI on Mac Mini
   Claude checks Supabase MCP + local migrations
       ↓ OpenClaw sends response back
   Telegram reply: "3 local migrations not yet applied: ..."

5. COMPANY EMAIL ARRIVES (Phase 8 — 8A-8F complete, 8E Part 2 pending)
   Gmail API syncs email → Edge Functions store in Supabase
   Email Agent (Mac Mini, Claude Max $0) classifies + generates draft reply
   AppBase /emailinbox shows it with AI classification badge
   If RFQ: creates draft quotation + Telegram alert
   ⚠️ Classification runs on Mac Mini (NOT edge function) — zero API costs
   See: EMAIL_AUTOMATION_SYSTEM.md for full spec
```

### Your Daily Workflow (UNCHANGED)

```
Morning:
  Check Telegram for nightly summary
  Open VS Code → start coding
  Claude Code assists interactively (same as now)

During the day:
  Mac Mini agent runs silently in background
  You get Telegram pings only when something needs attention

Evening:
  /git-sync before closing laptop
  Mac Mini pulls changes, runs health check
  Telegram confirms "All good" or flags issues
```

### Why VS Code + Mac Mini Agent Are Both Needed

| VS Code Claude Code | Mac Mini Agent |
|---|---|
| Interactive — you ask, it answers | Autonomous — it acts on schedule |
| Context resets each session | Daily notes persist across cycles |
| Deep coding assistance | Health monitoring + auditing |
| You must be at computer | Runs while you sleep |
| Best for writing features | Best for catching regressions |

---

## 🤖 Agent J — Identity & Multi-Agent Architecture

### Who Is Agent J?

**Agent J** is the Chief Agent Officer — the primary autonomous agent running 24/7 on the Mac Mini. He reports directly to Wei Jie and all future specialist agents report to him.

**Personality files** (on Mac Mini at `~/.openclaw/agents/main/agent/`):

| File | Purpose | Changes When |
|------|---------|-------------|
| `SOUL.md` | Beliefs, values, voice, principles | Rarely — it's core |
| `IDENTITY.md` | Name, role, org chart, responsibilities | When org evolves |
| `USER.md` | Context about Wei Jie (goals, preferences, background) | As we learn more |
| `TOOLS.md` | Environment-specific notes (MCP, infra) | When infra changes |
| `AGENTS.md` | Operating rules, workflows | When processes change |
| `MEMORY.md` | Long-term curated knowledge from conversations | Continuously |

**Currently deployed**: SOUL.md, IDENTITY.md, USER.md (2026-03-23). TOOLS.md, AGENTS.md, MEMORY.md will build organically over time.

### Multi-Agent Architecture

```
Wei Jie (Human — Founder/Director)
└── Agent J (Chief Agent Officer — Orchestrator) ← ACTIVE
    ├── Health Checker (code health monitoring)
    ├── Docs Monitor (documentation validation)
    ├── AppBase Advisor (architecture Q&A)
    ├── Learning Agent (correction analysis & rule improvement) — pending (Phase A4)
    ├── Email Agent (Gmail classification & drafts) — Phase A6 (Mac Mini, Claude Max $0)
    ├── Docs Agent (future — continuous format/freshness validation)
    ├── QA Agent (future — test runs, code quality checks)
    └── [Other specialists as needed]
```

**How it works**: Every agent is a **full independent entity** with its own OpenClaw workspace (`openclaw agents add <name> --workspace <path>`), own SOUL.md, IDENTITY.md, USER.md, and MEMORY.md — isolated personality and memory. Agent J orchestrates: delegates tasks, consolidates reports, and coordinates the learning loop.

**Current state**: Health Checker, Docs Monitor, AppBase Advisor, and Email Agent are **promoted to full independent agents** on Mac Mini (completed 2026-03-24, Phases A1-A3 + A6). Learning Agent (Phase A4) and Agent J orchestrator update (Phase A5) are next. See [AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md).

---

## 🏗️ Full Architecture

```
Mac Mini (dedicated server, headless, 24/7)
├── Tailscale — secure remote SSH/VNC from anywhere (already set up ✓)
├── tmux session "appbase-agent" — persistent terminal
├── OpenClaw — Telegram bot bridge (phone control + alerts)
├── launchd service — auto-restart OpenClaw on crash/reboot
│
├── Heartbeat (cron every 30min)
│   ├── Read today's daily note for pending tasks
│   ├── git pull AppBase repo
│   ├── Resume any in-progress work
│   └── Run quick health checks if idle
│
├── Nightly Jobs (2am SGT cron)
│   ├── TypeScript build check
│   ├── /check-docs validation
│   ├── Migration compliance check
│   ├── Correction pattern analysis → update PATTERN_MEMORY.md
│   ├── Queue CLAUDE.md improvements → Telegram approval request
│   ├── Consolidate daily notes
│   └── Send Telegram summary
│
└── Memory System (4 layers)
    ├── /docs/                        ← Project knowledge (140 docs — in git repo)
    ├── ~/.claude/memory/             ← User preferences & patterns (auto-written per session)
    ├── ~/.claude/daily-notes/        ← Agent operational log (created ✓)
    └── ~/.claude/learning/           ← Corrections + patterns + CLAUDE.md proposals (created ✓, NOT in repo)
```

---

## 🔧 Implementation Phases

### Phase 1: Mac Mini Foundation

**Status**: ✅ Complete

**Step 1.1 — Mac Mini System Settings** (do on Mac Mini via VNC):
```
System Settings → Battery → "Prevent sleeping when display is off": ON
System Settings → Energy → "Restart after power failure": ON
System Settings → Lock Screen → "Automatic login": ON
```

**Step 1.2 — Install tmux** (run via SSH into Mac Mini):
```bash
brew install tmux
tmux new-session -d -s appbase-agent
# To attach later: tmux attach -t appbase-agent
# To detach (leave running): Ctrl+B then D
```

**Step 1.3 — Caffeinate hooks** (already done — in `.claude/settings.json` in this repo):
Prevents Mac Mini from sleeping during active Claude tasks. Auto-runs `caffeinate` when a prompt is submitted and kills it when Claude stops.

---

### Phase 2: Telegram Control via OpenClaw

**Status**: ✅ Complete

**Goal**: Control Claude from phone; receive proactive alerts.

**✅ Billing**: OpenClaw uses the `claude` CLI binary as its backend agent — **no Anthropic API key needed**, uses your Claude Max subscription. Zero extra cost.

**Run on Mac Mini (via SSH):**
```bash
# 1. Authenticate Claude Code with your Max account (one-time)
claude login
# Opens browser auth URL — open on any device, sign in to your Anthropic account

# 2. Install OpenClaw
npm install -g openclaw@latest

# 3. Run onboarding wizard
openclaw onboard --install-daemon
# Wizard steps:
#   Security: Yes
#   Mode: QuickStart
#   Model: Anthropic → setup-token → run `claude setup-token` in a 2nd terminal, paste token
#     ⚠️ The OAuth token wraps across terminal lines — pasting truncates it → 401 error
#     ⚠️ SKIP THIS — the token approach does NOT work reliably. Proceed through wizard,
#        then immediately do Step 4 below to switch to claude-cli backend instead.
#   Channel: Telegram → paste BotFather token
#   Web search: Skip
#   Skills: No
#   Hooks: boot-md + command-logger + session-memory
#   Hatch: TUI

# 4. MANDATORY after onboarding: switch to claude CLI backend (bypasses all auth issues)
# Edit ~/.openclaw/openclaw.json and set:
#   agents.defaults.cliBackends = { "claude-cli": { "command": "/opt/homebrew/bin/claude" } }
#   agents.defaults.model.primary = "claude-cli/claude-sonnet-4-6"
#   agents.defaults.workspace = "/Users/jlmac/repo/AppBase/trench-trace-portal-app"
# Then restart daemon: launchctl stop ai.openclaw.gateway && launchctl start ai.openclaw.gateway
# ✅ This uses Claude Max subscription — no API key needed, zero extra cost

# 5. Register as launchd daemon (auto-starts on reboot)
openclaw onboard --install-daemon  # already done during setup
# Verify:
launchctl list | grep openclaw
```

**Create Telegram bot first:**
1. Open Telegram → search `@BotFather` → `/newbot`
2. Name it e.g. "AppBase Agent" / username e.g. `appbase_agent_bot`
3. Copy the API token → paste during `openclaw onboard` wizard

**Test commands from phone (in Telegram DM to your bot):**
- "test" → agent replies
- "What's the TypeScript status of AppBase?"
- "Check if any migrations are missing"

**⚠️ Security**: OpenClaw uses pairing-based access control — only your paired Telegram account can send commands. Email is **never** a command channel — only Telegram is trusted to prevent prompt injection.

---

### Phase 3: Daily Notes Memory System

**Goal**: Agent remembers what it was doing between heartbeat cycles.

**Run on Mac Mini:**
```bash
mkdir -p ~/.claude/daily-notes
mkdir -p ~/.claude/appbase-agent
```

**Create template** at `~/.claude/appbase-agent/daily-note-template.md`:
```markdown
# Daily Notes — {{DATE}}

## Morning Status
- [ ] TypeScript build clean?
- [ ] Migrations applied?
- [ ] Docs health OK?
- [ ] Corrections from yesterday reviewed?

## Tasks In Progress

## Completed Today

## Pending / Blocked

## Discoveries
<!-- Bug findings, compliance issues, violations -->
```

**Nightly consolidation** (cron at 2am): Claude reads day's notes, extracts important findings into `.claude/memory/`, creates tomorrow's note from template, sends Telegram summary.

**The 4 memory layers explained:**

| Layer | Location | Purpose | Who writes |
|---|---|---|---|
| Project knowledge | `/docs/` | Architecture, features, policies | Human + Claude (manual, in git) |
| User preferences | `~/.claude/memory/` | How Claude should behave with you | Claude auto, per conversation |
| Operational log | `~/.claude/daily-notes/` | What the agent is doing right now | Agent autonomous, each heartbeat |
| Learning system | `~/.claude/learning/` | Corrections → patterns → CLAUDE.md proposals | Agent nightly + per-correction (NOT in repo) |

**Future — Phase 11**: A 5th layer adds **semantic search** over corrections and daily notes via Supabase pgvector, so the agent can find relevant past experiences by meaning, not just by filename or keyword. See [SEMANTIC_MEMORY_LAYER.md](../../05-implementation/active/SEMANTIC_MEMORY_LAYER.md).

#### Where Memory Lives: Repo vs Laptop vs Mac Mini

```
REPO (GitHub) — shared by BOTH machines via git
├── CLAUDE.md              ← Rules for ALL Claude sessions (laptop + Mac Mini)
├── .claude/agents/        ← Agent role definitions (read by Mac Mini cron)
├── .claude/commands/      ← Slash commands (usable from both machines)
└── docs/                  ← Project knowledge (architecture, features, policies)

LAPTOP ~/.claude/          ← Your laptop (VS Code sessions)
├── projects/              ← Auto-memory: per-project preferences (auto-written by Claude)
│   └── -Users-tanweijie-repo-AppBase-.../memory/  ← AppBase-specific preferences
└── learning/corrections/  ← Corrections YOU make during VS Code sessions

MAC MINI ~/.claude/        ← Mac Mini (autonomous agent)
├── memory/                ← Agent's own preferences (separate from yours)
├── daily-notes/           ← Operational log: what the agent did today
├── appbase-agent/           ← Agent config (daily note template)
├── learning/
│   ├── corrections/       ← Corrections from Telegram sessions
│   ├── PATTERN_MEMORY.md  ← Nightly analysis of correction patterns
│   └── IMPROVEMENT_QUEUE.md ← Proposed CLAUDE.md edits (pending approval)
├── reports/               ← Nightly health check reports
└── scripts/               ← Cron scripts (nightly-health-check.sh, etc.)
```

**The simple rule:**

| Question | Where it goes |
|----------|---------------|
| Should it change how Claude writes code? | **Repo** → CLAUDE.md, .claude/commands/, .claude/agents/ |
| Is it about the agent's nightly operations? | **Mac Mini** → ~/.claude/ |
| Is it about your personal work preferences? | **Laptop** → ~/.claude/projects/.../memory/ |

**Correction sync gap**: Corrections logged on the laptop (`~/.claude/learning/corrections/`) are NOT automatically synced to the Mac Mini. The Mac Mini nightly analysis only reads its own corrections. For now, run `/analyze-errors` manually in VS Code to analyze laptop corrections. A future improvement could add a sync step to `/git-sync`.

---

### Phase 4: AppBase Health Check Agents

**New folder in repo**: `.claude/agents/`

#### `health-checker.md`
Runs on heartbeat and nightly. Checks:
1. `npx tsc --noEmit` — TypeScript errors
2. Supabase queries missing `.range()` or `.limit()` (CLAUDE.md Rule #8)
3. Local migrations vs applied migrations (via `mcp__supabase__list_migrations`)
4. `auth.users` references in src/ or migrations (CLAUDE.md Rule #3)

Returns JSON: `{ typescript, queryCompliance, missingMigrations, authUsersViolations }`

#### `docs-monitor.md`
Runs nightly. Validates:
1. All links in `DOCUMENTATION_INDEX.md` exist
2. No unlisted `.md` files in `docs/`
3. Doc counts correct

#### New slash command: `/health-check`
File: `.claude/commands/health-check.md` — manually trigger from VS Code or Telegram.

#### Crontab entries (installed on Mac Mini via `crontab -e`):
```bash
# Heartbeat (every 30 min) — resume tasks, git pull, quick checks
*/30 * * * * /opt/homebrew/bin/claude -p "Read today's daily note at ~/.claude/daily-notes/$(date +\%Y-\%m-\%d).md (create from template at ~/.claude/appbase-agent/daily-note-template.md if missing). Then: 1) cd ~/repo/AppBase/trench-trace-portal-app && git pull origin main 2) Check for any pending tasks in the daily note 3) If idle, do a quick TypeScript check (npx tsc --noEmit | head -5) and note result in daily note." --allowedTools "Read,Write,Bash(git:*),Bash(npx:*),Bash(date:*),Bash(cat:*),Bash(head:*),Bash(sed:*),Glob" --output-format text --max-turns 8 -d ~/repo/AppBase/trench-trace-portal-app >> ~/.claude/heartbeat.log 2>&1

# Nightly (2am SGT) — full audit + learning loop + summary (orchestrated by shell script)
0 2 * * * /bin/bash ~/.claude/scripts/nightly-health-check.sh >> ~/.claude/nightly-cron.log 2>&1
```

**Nightly script** (`~/.claude/scripts/nightly-health-check.sh`): Creates daily note → git pull → TypeScript check → health agent → docs review (1 file = 1 prompt) → learning loop analysis → daily notes consolidation → structured report → Telegram summary.

**Docs review script** (`~/.claude/scripts/nightly-docs-review.sh`): Weeknights: git-changed files + 10 rolling (day-of-year offset cycles through all ~128 in ~13 days). Sunday: full scan. Each file gets its own `claude -p` call with structured JSON output.

---

> ⛔ **GATE — Do not proceed to Phase 5+ until Phase 9 (learning loop) is verified running.**
> Verify: `ls ~/.claude/learning/corrections/` exists · `crontab -l` shows both cron entries · a test correction has been logged to `~/.claude/learning/corrections/YYYY-MM-DD.md` · `/analyze-errors` runs without error from Telegram.
> See full gate checklist in the Implementation Checklist section (Day 2 gate).

### Phase 5: Application Health Monitoring

| Check | Command | CLAUDE.md Rule |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | General |
| Missing .limit/.range | `grep -rn "\.from(" src/` | Rule #8 |
| auth.users violations | `grep -rn "auth\.users" src/ supabase/` | Rule #3 |
| Build health | `npm run build` | General |
| Migration gaps | `mcp__supabase__list_migrations` vs local files | Rule #3 |

---

### Phase 6: VS Code Daily Integration

Daily workflow is **unchanged**. Agent is a silent background layer.

```
Daily VS Code work → /git-sync pushes → GitHub
    ↓
Mac Mini heartbeat: git pull → health checks on new code
    ↓ (if issues found)
Telegram: "2 TypeScript warnings in InvoiceList.tsx:142"
    ↓
Fix next time you open VS Code
```

---

### Phase 7: AppBase Knowledge Advisor Agent

**File**: `.claude/agents/appbase-advisor.md`

An agent with full `/docs` context that:
- Answers "where should the new X feature go?"
- Identifies "this code violates CLAUDE.md Rule #8"
- Suggests "this pattern already exists in `PeopleManagement.tsx`"

Always reads `CLAUDE.md` and `DOCUMENTATION_INDEX.md` before answering. Cites the specific doc/rule behind every suggestion.

---

### Phase 8: Email Automation System (Separate Agent)

> **Full specification**: [EMAIL_AUTOMATION_SYSTEM.md](../email-automation/EMAIL_AUTOMATION_SYSTEM.md) — 6 sub-phases (8A-8F), complete database schema, sync engine, AI classification, ClawhHub humanizer integration, feedback loop.

**Goal**: Gmail API sync → AI classify → surface in AppBase `/emailinbox` → draft replies → feedback improves Agent J.

**Architecture decision**: The Email Agent is a **full independent agent** — not a task within Agent J. It has its own workspace, SOUL.md, IDENTITY.md, and MEMORY.md via `openclaw agents add email-agent --workspace ~/appbase-email-agent`. It runs on its own 10-min cron (self-scheduled, not delegated by Agent J). See [AGENT_ARCHITECTURE_OVERVIEW.md](./AGENT_ARCHITECTURE_OVERVIEW.md) for the multi-agent architecture.

**Why separate**: Email processing is a distinct domain with its own rules, needs its own memory (sender patterns, email history), runs on a faster schedule (every 10 min vs Agent J's 30 min), and must be cautious (DRAFTS ONLY, never auto-submit).

**Email provider decided**: Gmail API (not IMAP) — native threading, Pub/Sub push notifications, incremental sync via history API, labels support. See full rationale in [EMAIL_AUTOMATION_SYSTEM.md](../email-automation/EMAIL_AUTOMATION_SYSTEM.md).

#### Email Categories

| Category | Auto-action |
|---|---|
| `quotation_request` | Create DRAFT quotation (confidence > 0.85 only) |
| `invoice_query` | Link to existing invoice |
| `project_update` | Add comment to matching project |
| `scheduling` | Flag for coordinator |
| `internal` | Route internally, lower priority |
| `general` | Queue for manual response |
| `spam_marketing` | Archive, no action |

**Critical**: Auto-creation creates **DRAFTS ONLY**. Human must review and submit. Never auto-submit.

#### Database Tables (Implemented)

> **Full schema**: See [EMAIL_AUTOMATION_SYSTEM.md](../email-automation/EMAIL_AUTOMATION_SYSTEM.md) for complete DDL.

6 normalized tables (Phase 8B):
- `email_accounts` — OAuth tokens, sync state per Gmail account
- `email_threads` — Conversations (mirrors Gmail threads)
- `email_messages` — Individual messages with body + headers
- `email_participants` — From/To/CC/BCC normalized, linked to `people` table
- `email_labels` — Gmail labels per account
- `email_message_labels` — Message ↔ label junction
- `email_attachments` — Attachment metadata (lazy download to Supabase Storage)

Future (Phase 8D): `email_classifications`, `email_draft_replies`

#### New AppBase Module: `/emailinbox` (Phase 8C — not yet built)
- Route: `/emailinbox` | Access: management + coordinator + Office_admin
- List view: category badge, AI confidence %, sender, subject
- Manual override dropdown + action buttons
- RFQ → auto-creates draft quotation + Telegram alert

---

### Phase 9: Self-Improvement Learning Loop

> **Built during Phase 4 execution** — set up on the same day as the nightly cron (Day 2), because the nightly cron already includes learning loop steps. Do not proceed to Phase 5+ until Phase 9 is verified running.

**Full spec**: [SELF_IMPROVEMENT_LEARNING_LOOP.md](./SELF_IMPROVEMENT_LEARNING_LOOP.md) — the definitive reference for how the learning loop works, including the Learning Agent, correction flow, pattern analysis, and improvement proposals.

**Summary**: Corrections from ALL sources (human coders on VS Code, agent self-corrections, conflicts, improvements spotted) are logged and analyzed. The **Learning Agent** — a dedicated independent agent — runs nightly to identify recurring patterns and propose rule updates. When a pattern hits 3+ occurrences, it creates/updates `.claude/rules/<category>.md` files and sends a proposal to Wei Jie via Agent J's Telegram for approval.

**Key components:**
- **CLAUDE.md Rule #13** — triggers correction logging (4 types: user correction, self-correction, conflict, improvement)
- **Learning Agent** — dedicated agent for correction analysis and rule improvement ([Execution Plan Phase A4](../../05-implementation/active/AGENT_ECOSYSTEM_REDESIGN_EXECUTION_PLAN.md))
- **`agent_corrections` table** — Supabase table tracking all corrections with `source` column (`human`/`agent`/`self`)
- **`.claude/rules/` directory** — detailed rule sub-files that the Learning Agent creates and updates

**New slash commands:** `/analyze-errors`, `/review-improvements`

**Current state**: Correction logging and slash commands are implemented. The Learning Agent is planned — currently Agent J handles the nightly analysis directly. See [SELF_IMPROVEMENT_LEARNING_LOOP.md](./SELF_IMPROVEMENT_LEARNING_LOOP.md) for implementation status.

---

## 📁 All Files To Create / Modify

### New Files (in repo)
| File | Phase | Purpose |
|---|---|---|
| `.claude/agents/health-checker.md` | 4 | TypeScript + query + migration health |
| `.claude/agents/docs-monitor.md` | 4 | Docs validation agent |
| `.claude/agents/appbase-advisor.md` | 7 | AppBase architecture advisor |
| `.claude/commands/health-check.md` | 4 | `/health-check` slash command |
| `.claude/commands/analyze-errors.md` | 4+9 | Trigger learning pattern analysis (built Day 2 with Phase 4) |
| `.claude/commands/review-improvements.md` | 4+9 | Review + approve CLAUDE.md proposals (built Day 2 with Phase 4) |
| `src/pages/EmailInboxPage.tsx` | 8C | Email inbox module |
| `src/hooks/useEmailThreads.ts` | 8C | Email thread list hook |
| `supabase/migrations/20260323_120017_create_email_accounts_and_settings_module.sql` | 8A | ✅ email_accounts table + module |
| `supabase/migrations/20260323_122236_create_email_sync_tables.sql` | 8B | ✅ 6 email sync tables + indexes |
| `supabase/migrations/20260323_220921_create_email_classification_tables.sql` | 8D | ✅ email_classifications, email_draft_replies, email_classification_settings, email_agent_runs |
| `supabase/functions/email-classify/index.ts` | 8D | ✅ AI classification edge function (Claude API) |
| `.claude/agents/email-categorizer.md` | 8D | 🔴 Retired 2026-05-31 (Refactor Tooling Retirement) — agent removed |
| `.claude/commands/process-emails.md` | 8D | 🔴 Retired 2026-05-31 (Refactor Tooling Retirement) — command removed |
| `src/services/email/emailClassificationService.ts` | 8D | ✅ Classification CRUD + types |
| `src/hooks/useEmailClassification.ts` | 8D | ✅ 7 query + 5 mutation hooks |
| `src/pages/AgentDashboardPage.tsx` | 10 | Agent activity timeline + corrections + character count |
| `src/services/agentDashboardService.ts` | 10 | Service layer with paginated queries for agent_runs + agent_corrections |
| `src/components/agent-dashboard/AgentProfilesTab.tsx` | 10 | Agent hierarchy cards with ?raw Vite imports of personality files |
| `supabase/migrations/..._agent_runs.sql` | 10 | agent_runs + agent_corrections tables |
| `supabase/migrations/..._enable_pgvector.sql` | 11 | Enable pgvector extension |
| `supabase/migrations/..._agent_memory_embeddings.sql` | 11 | Embeddings table + search_agent_memory() RPC |
| `supabase/functions/embed-agent-memory/index.ts` | 11 | Edge Function: embedding generation + storage |
| `.claude/commands/memory-search.md` | 11 | `/memory-search <topic>` — semantic search over agent memory |

### Modified Files (in repo)
| File | Phase | Change |
|---|---|---|
| `.claude/settings.json` | 1 | Caffeinate hooks (already done ✓) |
| `CLAUDE.md` | 9 | Add correction-logging instruction |
| `src/App.tsx` | 8, 10 | Add `/emailinbox` route (Phase 8C) + `/emailaccount` (8F, ✅ done) + `/agent-dashboard` route (Phase 10) |

### Files on Mac Mini (outside repo — run via SSH)
| File/Folder | Phase | Purpose |
|---|---|---|
| `~/.claude/daily-notes/` | 3 | Agent operational log |
| `~/.claude/appbase-agent/daily-note-template.md` | 3 | Note template |
| `~/.claude/learning/corrections/` | 4+9 | Per-session correction logs — created Day 2 (private, NOT in repo) |
| `~/.claude/learning/PATTERN_MEMORY.md` | 4+9 | Long-term pattern tracking — created Day 2 (private, NOT in repo) |
| `~/.claude/learning/IMPROVEMENT_QUEUE.md` | 4+9 | Pending CLAUDE.md proposals — created Day 2 (private, NOT in repo) |
| crontab entries | 4 | Heartbeat + nightly |
| `~/.openclaw/` | 2 | OpenClaw config, sessions, Telegram credentials |
| `~/.claude/reports/` | 4 | Structured nightly report files (YYYY-MM-DD-nightly.md) — Option A morning summary |
| `~/.claude/scripts/parse-nightly-log.sh` | 10 | Post-cron script: parses nightly log → inserts to Supabase agent_runs |

---

## 🗓️ Implementation Checklist

> **Rule**: Do not start a phase until all items in the previous phase are checked off AND the gate is passed.

---

### Phase 1 + 2 — Day 1: Foundation + Telegram (~2 hours)

**Phases covered**: Phase 1 (Mac Mini), Phase 2 (OpenClaw)

- [x] SSH/VNC into Mac Mini working ✓
- [x] Mac Mini system settings: auto-login + auto-restart after power failure ✓
- [x] `brew install tmux` ✓
- [x] `tmux new-session -d -s appbase-agent` ✓ (session alive, created 2026-03-22 17:18)
- [x] Verify `.claude/settings.json` caffeinate hooks are in place (already committed to repo) ✓
- [x] `brew install node` → Node v25.8.1 + npm 11.11.0 ✓
- [x] Fixed PATH: `~/.zprofile` + `~/.zshrc` source Homebrew via `/opt/homebrew/bin/brew shellenv` ✓
- [x] `npm install -g @anthropic-ai/claude-code` → Claude Code CLI v2.1.81 ✓
- [x] `claude login` → authenticated with Claude Max account ✓
- [x] Created Telegram bot via @BotFather ✓
- [x] `npm install -g openclaw@latest` → OpenClaw v2026.3.13 ✓
- [x] `openclaw onboard --install-daemon` → Telegram channel configured ✓
- [x] Configured `claude-cli` backend in `~/.openclaw/openclaw.json` ✓
- [x] `openclaw tui` → agent responds to messages ✓ ("Hey, I'm here. All good on my end.")
- [x] Paired Telegram account: `/start` → pairing code A3CSTC86 → `openclaw pairing approve telegram A3CSTC86` ✓
- [x] `launchctl list | grep openclaw` → PID 8366 running ✓
- [x] Clone AppBase repo: `git clone git@github.com:weijieJL/trench-trace-portal-app.git ~/repo/AppBase/trench-trace-portal-app` ✓
- [x] Set `agents.defaults.workspace` in `~/.openclaw/openclaw.json` to `/Users/jlmac/repo/AppBase/trench-trace-portal-app` ✓ (agent listed all 73 src/pages files from Telegram)
- [x] Reboot Mac Mini → confirm OpenClaw auto-restarts ✓ (PID 405 after reboot, uptime 27s)

**✅ GATE — PASSED ✓**
- [x] Send message from phone → Claude replies in Telegram ✓
- [x] Send "what files are in the AppBase src/pages/ folder?" → Claude listed all 73 files accurately ✓ (6:58pm SGT)
- [x] Reboot Mac Mini → `launchctl list | grep openclaw` still shows service running ✓ (PID 405, uptime 27s — confirmed Day 1)

---

### Phase 3 + 4 + 9 — Day 2: Memory + Agents + Learning Loop (~3 hours)

**Phases covered**: Phase 3 (daily notes), Phase 4 (health agents + cron), Phase 9 (learning loop)

> Build all three together — Phase 4 nightly cron already includes the learning loop steps, so setting them up separately on different days creates an inconsistent cron.

**Memory system (Phase 3) — Mac Mini:**
- [x] `mkdir -p ~/.claude/daily-notes ~/.claude/appbase-agent ~/.claude/learning/corrections ~/.claude/reports ~/.claude/scripts` ✓
- [x] Create `~/.claude/appbase-agent/daily-note-template.md` ✓ (sections: Morning Status, Tasks In Progress, Completed, Pending, Discoveries)
- [x] Create `~/.claude/learning/PATTERN_MEMORY.md` ✓ (skeleton with HIGH/MEDIUM/LOW frequency sections)
- [x] Create `~/.claude/learning/IMPROVEMENT_QUEUE.md` ✓ (skeleton with Pending Proposals + Applied history table)

**Agent definitions (Phase 4) — In Repo:**
- [x] Create `.claude/agents/` folder in AppBase repo ✓
- [x] Write `.claude/agents/health-checker.md` ✓ (4 checks: TypeScript, query compliance, migration gaps, auth.users)
- [x] Write `.claude/agents/docs-monitor.md` ✓ (delegates to /check-docs, JSON output, autonomous/manual modes)
- [x] Write `.claude/commands/health-check.md` ✓ (orchestrates both agents, combined report table)

**Learning loop (Phase 9) — In Repo:**
- [x] Write `.claude/commands/analyze-errors.md` ✓ (reads corrections → groups by theme → classifies severity → updates PATTERN_MEMORY.md → queues improvements)
- [x] Write `.claude/commands/review-improvements.md` ✓ (per-item apply/skip/edit flow for CLAUDE.md proposals)
- [x] Add to `CLAUDE.md`: Rule #12 — correction logging instruction ✓ (also updated Quick Commands + Project Structure sections)

**Nightly scripts (Phase 4) — Mac Mini:**
- [x] Create `~/.claude/scripts/nightly-health-check.sh` ✓ (master nightly: git pull → TypeScript → health check → docs review → learning loop → daily notes → report → Telegram)
- [x] Create `~/.claude/scripts/nightly-docs-review.sh` ✓ (1 file = 1 prompt: weeknights = changed + 10 rolling, Sunday = full 128-file scan)
- [x] Both scripts `chmod +x` ✓

**Cron (Phase 4) — Mac Mini:**
- [x] `crontab -e` → heartbeat (*/30 every 30min) + nightly (0 2 at 2am SGT) ✓
- [x] `crontab -l` — both entries visible ✓

**Option A — Morning Telegram summary:**
- [x] Nightly script writes structured report to `~/.claude/reports/YYYY-MM-DD-nightly.md` ✓
- [x] Nightly script sends Telegram digest via Bot API (curl to api.telegram.org) ✓
- [ ] Verify you can ask bot "show me last night's report" → receives full report text (test after first nightly run)

**✅ GATE — must pass before Day 3:**
- [x] `ls ~/.claude/daily-notes/` exists ✓
- [x] `ls ~/.claude/learning/corrections/` exists ✓
- [x] `ls ~/.claude/learning/PATTERN_MEMORY.md` exists ✓
- [x] `ls ~/.claude/learning/IMPROVEMENT_QUEUE.md` exists ✓
- [x] `crontab -l` shows both heartbeat and nightly entries ✓ (*/30 heartbeat + 0 2 nightly)
- [x] `~/.claude/scripts/nightly-health-check.sh` + `nightly-docs-review.sh` exist and executable ✓
- [x] From Telegram: "run a health check" → receives TypeScript + migration report ✓ (2026-03-23 09:19 SGT — 0 TS errors, 9 query compliance warnings, 0 migration gaps, 0 auth.users violations, docs healthy)
- [x] In-repo agent definitions committed (`.claude/agents/`, `.claude/commands/`) ✓ (all files verified: health-checker.md, docs-monitor.md, README.md, health-check.md, analyze-errors.md, review-improvements.md, CLAUDE.md Rule #13)
- [ ] Make a deliberate correction in VS Code ("no, use shadcn Select not native select") → verify `~/.claude/learning/corrections/YYYY-MM-DD.md` has an entry ✓
- [x] From Telegram: `/analyze-errors` → runs without error ✓ (2026-03-23 09:23 SGT — "No corrections logged yet", correctly reports empty state)

---

### Phase 7 — Day 3: Knowledge Advisor + Full Test (~1 hour)

**Phases covered**: Phase 7 (appbase-advisor)

> Only start Day 3 once the Day 2 gate is fully passed — the learning loop must already be logging corrections.

- [x] Write `.claude/agents/appbase-advisor.md` ✓ (read-only Q&A agent: 5 knowledge domains, cites CLAUDE.md rules + docs, conversational output)
- [ ] From Telegram: "where should a new payroll feature go?" → receives answer citing a doc ✓
- [ ] Full end-to-end test: push a code change from laptop → Mac Mini picks it up → health check runs → Telegram notification received ✓
- [ ] Wait for first nightly run (2am) → receive Telegram nightly summary ✓

**✅ GATE — must pass before Week 2:**
- [ ] Full cycle working: code on laptop → git push → Mac Mini health check → Telegram alert ✓
- [ ] Nightly cron has run at least once successfully ✓
- [ ] `/analyze-errors` and `/review-improvements` respond correctly from Telegram ✓

---

### Phase 8 — Week 2+: Email Automation System

> Only start after all Day 3 gates pass. The autonomous agent must be stable and proven before adding email processing.
> **Full spec**: [EMAIL_AUTOMATION_SYSTEM.md](../email-automation/EMAIL_AUTOMATION_SYSTEM.md) — 6 sub-phases (8A-8F)

- [x] Decide email provider → **Gmail API** (native threading, Pub/Sub push, incremental sync) ✓
- [x] Write detailed implementation spec with database schema ✓
- [x] Phase 8A: Gmail OAuth2 + account management (`email_accounts` table + `gmail-auth` Edge Function) ✓ (2026-03-23)
- [x] Phase 8B: Gmail sync engine (6 tables + Pub/Sub webhook + incremental sync) ✓ (2026-03-23)
- [x] Phase 8C: Email Inbox module `/emailinbox` (thread list, detail, compose, reply, forward) ✓ (2026-03-23)
- [x] Phase 8D: AI classification agent (edge function + 4 DB tables + settings UI + agent status UI) ✓ (2026-03-23)
- [x] Phase 8E Part 1: Frontend feedback UI (confirm/correct classifications, AI category filters) ✓ (2026-03-23)
- [ ] Phase 8E Part 2: Nightly learning cycle (DEFERRED — pending Agent Ecosystem Redesign)
- [x] Phase 8F: Email Account module `/emailaccount` ✓ (2026-03-23)
- [x] Write `.claude/agents/email-categorizer.md` ✓ (2026-03-23) — 🔴 retired 2026-05-31 (Refactor Tooling Retirement)
- [x] Write `.claude/commands/process-emails.md` ✓ (2026-03-23) — 🔴 retired 2026-05-31 (Refactor Tooling Retirement)
- [ ] Test: send a fake RFQ email → verify draft quotation created in AppBase ✓
- [ ] Test: manual category override in `/emailinbox` works ✓

---

### Phase 10 — After Phase 8: Agent Dashboard in AppBase ✅ IMPLEMENTED

> **Status**: Fully implemented (2026-03-23). Restructured to profile-first layout (2026-03-23).
> **Full spec**: [AGENT_DASHBOARD_SYSTEM.md](./AGENT_DASHBOARD_SYSTEM.md)
> **Future redesign**: [LEARNING_PIPELINE_REDESIGN.md](./LEARNING_PIPELINE_REDESIGN.md) — two-layer learning, Supabase-direct logging, CLAUDE.md directory structure
> **Remaining**: Deploy `parse-nightly-log.sh` to Mac Mini + set `SUPABASE_SERVICE_ROLE_KEY` in `~/.zprofile`

**Goal**: Full observability into the OpenClaw agent ecosystem from within AppBase.

**Architecture** (profile-first layout):
- `/agent-dashboard` — Main page showing Agent Profiles grid (Agent J hero card, operational agents, specialist agents)
- `/agent-dashboard/agent-j` — Agent J detail page with Activity timeline + Corrections & Learning sub-tabs
- Future: each agent can have its own detail page showing agent-specific findings

**Database**: `agent_runs` + `agent_corrections` tables (see [AGENT_DASHBOARD_SYSTEM.md](./AGENT_DASHBOARD_SYSTEM.md) for full schema)

**Data pipeline**: `parse-nightly-log.sh` runs after each cron job on Mac Mini, parses logs → inserts to Supabase via REST API

See [AGENT_DASHBOARD_SYSTEM.md](./AGENT_DASHBOARD_SYSTEM.md) for complete implementation details, file list, and design decisions.

---

### Phase 11: Semantic Memory Layer (Future)

> **Do NOT implement until**: Phases 1–10 are stable, the learning loop has 30+ corrections logged, and you've hit a real situation where grep fails to find a relevant past correction.

**Full spec**: [SEMANTIC_MEMORY_LAYER.md](../../05-implementation/active/SEMANTIC_MEMORY_LAYER.md)

**Summary**: Adds vector search (Supabase pgvector) over corrections, daily notes, and patterns. The nightly cron gets an extra step: after pattern analysis, embed new entries into `agent_memory_embeddings` table. The agent can then search by meaning via `/memory-search` command or Dashboard Tab 4.

**Key decisions**:
- Uses **Supabase pgvector** (not Qdrant) — no new infrastructure
- Embeds at correction/section level, not line level
- Nightly batch embedding (not during interactive sessions)
- Cost: < $0.01/month

**Extends Phase 10**: Adds Tab 4 (Memory Search) to the Agent Dashboard.

**New files when implemented**:
| File | Purpose |
|---|---|
| `supabase/migrations/..._enable_pgvector.sql` | Enable vector extension |
| `supabase/migrations/..._agent_memory_embeddings.sql` | Embeddings table + search function |
| `supabase/functions/embed-agent-memory/index.ts` | Edge Function: generate + store embeddings |
| `.claude/commands/memory-search.md` | `/memory-search <topic>` command |

---

## 🚨 Errors Encountered & Resolutions

### Error: Clautel is a paid product ($4–9/mo)
**What happened**: Initially chose `clautel` as the Telegram bridge. During setup it asked to choose a paid plan.
**Resolution**: Switched to **OpenClaw** (`npm install -g openclaw`) — free, open source (MIT), self-hosted. Same functionality, zero cost.
**Root cause**: Clautel is a commercial product. OpenClaw is the correct free alternative.

---

### Error: `npm` / `claude` not found in SSH sessions
**What happened**: `npm` and `claude` installed by Homebrew but not in PATH when connecting via SSH. Non-interactive SSH sessions don't source `~/.zshrc`.
**Resolution**: Created `~/.zprofile` with `eval "$(/opt/homebrew/bin/brew shellenv)"` — this file IS sourced for login shells and cron jobs.
**Root cause**: `~/.zshrc` is only sourced for interactive shells; `~/.zprofile` covers login shells (SSH, cron).

---

### Error: OpenClaw 401 `Invalid bearer token` — OAuth token truncated on paste
**What happened**: `claude setup-token` outputs a long token split across two lines in the terminal. When pasted into the OpenClaw wizard, only the first line was captured. The truncated token stored in `~/.openclaw/agents/main/agent/auth-profiles.json` failed with HTTP 401.
**What was tried**:
- Re-running `openclaw models auth setup-token` multiple times — same truncation
- `openclaw models auth paste-token --provider anthropic` with token in the command — syntax error
**Resolution**: Directly edited `~/.openclaw/agents/main/agent/auth-profiles.json` via SSH using a Python heredoc to write the full token without shell truncation.
**Root cause**: Terminal line-wrapping causes visual line breaks in token display, but the token is one continuous string. Paste into the wizard captures only what the TTY sees as one line.

---

### Error: OpenClaw 401 — even after fixing token
**What happened**: Even with the full token stored correctly, OpenClaw kept returning HTTP 401. The `sk-ant-oat01-` OAuth token format requires `Authorization: Bearer` header, but OpenClaw may have been sending it as `x-api-key`.
**Resolution**: Configured OpenClaw to use the **`claude` CLI binary as a backend agent** instead of calling the Anthropic API directly. Added to `~/.openclaw/openclaw.json`:
```json
"agents": {
  "defaults": {
    "cliBackends": {
      "claude-cli": { "command": "/opt/homebrew/bin/claude" }
    },
    "model": { "primary": "claude-cli/claude-sonnet-4-6" }
  }
}
```
**Root cause**: OAuth tokens (`sk-ant-oat01-`) are not standard Anthropic API keys and behave differently when called directly. Using the `claude` CLI as the backend bypasses this entirely — the CLI handles its own auth, uses Claude Max subscription, no API key needed.

---

### Error: `Unrecognized key: "cwd"` — daemon crash after workspace config
**What happened**: Added `cwd` key to `cliBackends.claude-cli` in `~/.openclaw/openclaw.json`. OpenClaw rejected it as an unknown key, daemon crashed (exit code 1), bot stopped responding.
**Resolution**: Removed `cwd` key. The workspace directory for the agent is controlled via `agents.defaults.workspace`, not `cliBackends.cwd`.
**Root cause**: OpenClaw's JSON schema validation rejects unknown keys in `cliBackends`. Always run `openclaw doctor` after editing config manually.

---

### Error: `No conversation found with session ID: 8af2d833...` after daemon restart
**What happened**: After restarting the daemon, OpenClaw tried to resume a Claude CLI session (stored in `sessions.json`) that no longer existed. Every Telegram message returned "Agent failed before reply."
**Resolution**: Cleared stale `cliSessionIds` and `claudeCliSessionId` from `~/.openclaw/agents/main/sessions/sessions.json` via Python, then restarted the daemon. From Telegram, send `/reset` to force a fresh session.
**Root cause**: The `claude-cli` backend stores session IDs in OpenClaw's sessions.json. When the daemon restarts and the claude process ends, the old session IDs become invalid. OpenClaw doesn't auto-clear them.

---

### Error: Agent replies but says "Tools are disabled in this session"
**What happened**: After fixing the 401 error and configuring `claude-cli` backend, the agent responds via Telegram but can't browse the filesystem — replies "Tools are disabled in this session, so I can't browse the filesystem directly."
**Root cause**: The AppBase repo had not been cloned on the Mac Mini. The OpenClaw workspace pointed to `~/.openclaw/workspace` (empty).
**Resolution** ✅:
1. Generated ED25519 SSH key on Mac Mini, added to GitHub (`jlmac-macmini-openclaw`)
2. Cloned repo: `git clone git@github.com:weijieJL/trench-trace-portal-app.git ~/repo/AppBase/trench-trace-portal-app`
3. Set `agents.defaults.workspace` in `~/.openclaw/openclaw.json` to `/Users/jlmac/repo/AppBase/trench-trace-portal-app`
**Note**: Do NOT use `cliBackends.cwd` — that key is rejected by OpenClaw's JSON schema and crashes the daemon. Use `agents.defaults.workspace` only.

---

### Error: `Unknown model: anthropic/claude-cli`
**What happened**: Set `model.primary = "claude-cli"` — OpenClaw prefixed the provider name automatically, resulting in `anthropic/claude-cli` which is unknown.
**Resolution**: Use the full format `"claude-cli/claude-sonnet-4-6"` — provider ID on the left, model variant on the right.
**Root cause**: OpenClaw model ref format is `<provider>/<model>`. The provider ID is the key under `cliBackends` (`"claude-cli"`), not `anthropic`.

---

### Error: `claude -p` says "Not logged in" after reboot — keychain locked
**What happened**: After rebooting the Mac Mini, sending "Run a health check" from Telegram returned "Agent failed before reply: CLI produced no output for 180s and was terminated." Running `claude -p` via SSH also failed with "Not logged in · Please run /login". However, `claude` worked fine when launched via VNC (GUI session).
**Root cause**: Claude Code stores its auth token in the macOS login keychain. After reboot, the keychain is locked until the GUI session fully initializes. OpenClaw (launchd) may start before the keychain is ready, and SSH sessions never get automatic keychain access.
**Resolution**:
1. From VNC or the Mac Mini terminal: `security unlock-keychain ~/Library/Keychains/login.keychain-db` (enter Mac login password)
2. This unlocks the keychain for all processes under the user, including OpenClaw and cron
**Prevention**: After any Mac Mini reboot, unlock the keychain before testing Telegram or cron. With auto-login enabled, the GUI session should unlock it automatically — but there can be a race condition where OpenClaw starts first. If Telegram commands fail after reboot, unlock the keychain as step 1.
**Note**: `security unlock-keychain` does NOT persist across reboots — it only unlocks for the current boot session.

---

## ⚠️ What NOT To Try Again

- ❌ **Using Clautel** — it's a paid product ($4–9/mo). Use OpenClaw instead (free, MIT, `npm install -g openclaw`).
- ❌ **Pasting `claude setup-token` output via terminal wizard** — the token wraps across lines and gets truncated. If you need to re-paste a token, use `openclaw models auth setup-token` (handles it automatically) or edit `~/.openclaw/agents/main/agent/auth-profiles.json` directly via Python to avoid shell truncation.
- ❌ **Using `sk-ant-oat01-` tokens with OpenClaw's API-direct mode** — OAuth tokens don't work reliably with direct API calls. Always use the `claude-cli` backend (`cliBackends` in `~/.openclaw/openclaw.json`) so the claude CLI handles its own auth.
- ❌ **Setting `model.primary = "claude-cli"`** — must be full format `"claude-cli/claude-sonnet-4-6"` (provider/model).
- ❌ **Using `.claude/memory/` for operational task tracking** — memory = persistent preferences. Use `~/.claude/daily-notes/` for "what am I working on now."
- ❌ **Using `~/.claude/memory/` for correction logs** — corrections go to `~/.claude/learning/corrections/YYYY-MM-DD.md`. See SELF_IMPROVEMENT_LEARNING_LOOP.md.
- ❌ **Auto-submitting quotations or invoices** — DRAFTS ONLY. Human review required before any document reaches a client.
- ❌ **Using email as a command channel** — only Telegram is trusted input. Email is information-only to prevent prompt injection attacks.
- ❌ **Cron jobs without `--allowedTools` restrictions** — always scope headless `-p` invocations to minimum tools.
- ❌ **Supabase migrations via CLI** — always use `mcp__supabase__apply_migration`. See CLAUDE.md Rule #3.
- ❌ **Editing CLAUDE.md directly without Telegram approval** — all proposed changes go to `IMPROVEMENT_QUEUE.md` first.

---

## 📝 Change Log

| Date | Change | Notes |
|------|--------|-------|
| 2026-03-22 | Initial planning doc | 8 phases, Mac Mini SSH/VNC already working |
| 2026-03-22 | Added Phase 9 (learning loop) | Integrates SELF_IMPROVEMENT_LEARNING_LOOP.md |
| 2026-03-22 | Added full architecture overview | "How Everything Works Together" section |
| 2026-03-23 | Day 1 complete ✅ | Telegram working, repo cloned, tools enabled — agent listed all 73 src/pages files from phone |
| 2026-03-23 | Day 2 Phase 4+9 in-repo files complete ✅ | Created agents (health-checker, docs-monitor), commands (health-check, analyze-errors, review-improvements), CLAUDE.md Rule #12 |
| 2026-03-23 | Docs review: autonomous-agent topic | Fixed stale statuses, checklist items, doc counts, crontab examples to match actual installed config |
| 2026-03-23 | Telegram health check gate passed ✓ | Added keychain error + resolution (Error #8). Marked gate item complete. |
| 2026-03-23 | Added Phase 11 + memory architecture | Linked SEMANTIC_MEMORY_LAYER.md, added "Where Memory Lives" section (repo vs laptop vs Mac Mini), Phase 11 summary + files table |
| 2026-03-23 | Phase 7 — appbase-advisor.md created ✓ | Read-only Q&A agent: 5 knowledge domains, cites Rules + docs, conversational output. Day 2 /analyze-errors gate also marked ✓ |
| 2026-03-23 | Agent J identity deployed | Created SOUL.md, IDENTITY.md, USER.md on Mac Mini. Added multi-agent architecture section. Future: specialist agents report to Agent J. |
| 2026-03-23 | Created AGENT_ARCHITECTURE_OVERVIEW.md | Big-picture overview tying all 4 autonomous-agent docs together. Phase 8 marked as separate OpenClaw agent. |
| 2026-03-23 | Phase 8 detailed spec created | EMAIL_AUTOMATION_SYSTEM.md — 6 sub-phases, Gmail API decided, full DB schema, sync engine, AI classification, ClawhHub humanizer, feedback loop |
| 2026-03-23 | Post-Phase 10 accuracy review | Fixed: "token usage"→"character count", nonexistent hook files→actual service/component files, Tab 3 "hardcoded"→"?raw Vite imports", doc count 133→136 |
