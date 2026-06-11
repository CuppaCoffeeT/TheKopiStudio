# Workspace & Agent Architecture Standard

**Created**: 2026-03-25 14:00:00 SGT
**Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

This document defines how the project folder is structured so that **any AI agent** — Claude Code, Cursor, Copilot, autonomous cron agents, or future tools — can navigate efficiently with minimal token waste.

Based on the **Model Workspace Protocol (MWP)** by Van Clief & McDermott (2026), which applies Unix pipeline design (McIlroy 1978), modular decomposition (Parnas 1972), and separation of concerns (Dijkstra 1974) to the specific problem of structuring context for AI agents.

**Core insight**: LLMs perform significantly worse when relevant information is buried in long contexts full of irrelevant material (Liu et al., "Lost in the Middle", 2024). The fix is not compression — it's **prevention**. Only load what the current task needs.

**Tool-agnostic by design**: The only tool-specific file is Layer 0 (the entry point, e.g., `CLAUDE.md` for Claude Code, `AGENTS.md` for cross-tool). Everything below Layer 0 uses `CONTEXT.md` — a convention any agent can follow.

---

## 1. The Five-Layer Context Hierarchy

Every AI interaction in this project navigates five layers. Layers 0-2 are **structural** (routing). Layers 3-4 are **content** (the actual knowledge).

```
Layer 0: CLAUDE.md          "Where am I?"           ~800 tokens
Layer 1: CONTEXT.md          "Where do I go?"        ~300 tokens
Layer 2: Folder CONTEXT.md   "What do I do here?"    200-500 tokens
Layer 3: Reference material   "What rules apply?"     500-2,000 tokens
Layer 4: Working artifacts    "What am I working on?" varies
         ─────────────────────────────────────────────────────────
         Structural (routing)  │  Content (factory + product)
```

**Target**: 2,000-8,000 tokens loaded per task. The pre-refactor monolithic CLAUDE.md historically loaded on the order of tens of thousands of tokens regardless of task.

### Layer 0: The Entry Point — `CLAUDE.md` (root)

The only tool-specific file. Claude Code reads this automatically. Other tools have their own equivalents (`AGENTS.md`, `.cursor/rules/`, etc.).

**What it does**: Tells the agent what this project is, where things are, and where to go for any given task.

**Max**: ~800 tokens (~50-60 lines). If it's longer, content belongs in Layer 1 or 2.

**Contains ONLY**:
- Project identity + tech stack (3 lines)
- Quick commands (5-8 lines)
- Routing table (10-15 lines — "for task X, read Y, use skill Z")
- Hard rules that apply to ALL tasks (5-7 one-liner rules, max)
- Folder structure overview (5-10 lines)
- MCP config (3 lines)

**Does NOT contain**: Code examples, detailed rule explanations, troubleshooting, architecture descriptions, conventions that only apply to specific tasks. All of these belong in Layers 1-3.

**The test**: "If I remove this line, would it break a task that has nothing to do with it?" If yes, keep it. If no, move it deeper.

### Layer 1: The Router — `CONTEXT.md` (workspace root)

Sits at the root of each major workspace area (`src/`, `docs/`, `supabase/`, `.claude/`).

**What it does**: Tells the agent what this workspace is for, what's in it, and how to navigate within it. This is the "room" — the agent reads this when it enters the workspace.

**Max**: ~300 tokens (~20-30 lines).

**Format**:
```markdown
# [Workspace Name]

[1-2 sentences: what this workspace is for]

## What belongs here
- [Type of content]
- [Another type]

## What does NOT belong here
- [Common mistake → goes in X instead]

## Navigation
| Area | Location | Purpose |
|------|----------|---------|
| [subfolder] | ./subfolder/ | [what's in it] |

## Before working here
- Reference: [link to relevant rule or CONTEXT.md]
- Key rule: [one-liner about the most important convention]
```

### Layer 2: The Contract — `CONTEXT.md` (per subfolder, where needed)

Sits in subfolders that represent distinct work areas or stages. Not every folder needs one — only folders where the agent needs specific instructions.

**What it does**: Defines the contract for working in this specific area. Based on the MWP stage contract pattern: **Inputs → Process → Outputs**.

**Max**: 200-500 tokens (~15-30 lines).

**Format** (for folders where agent does work):
```markdown
# [Folder Purpose]

## Inputs
- Reference: [path to rule or convention file]
- Reference: [path to another stable reference]
- Working: [path to artifacts from previous step, if applicable]

## Process
[What the agent should do when working here. Plain English.]

## Outputs
[What the agent should produce and where to put it.]

## Constraints
[Key rules specific to this folder — not general project rules.]
```

**Format** (for folders that are just organized storage):
```markdown
# [Folder Name]

[1-2 sentences: what this folder contains]

## What belongs here
- [Type of content, with examples]

## What does NOT belong here
- [Common mistake → goes in X instead]

## Navigation
| File/Folder | Purpose |
|-------------|---------|
| [name] | [what it covers — one line] |

## Before working here
- [Key rule or reference link specific to this folder]
```

**Why Navigation is required**: CONTEXT.md exists to route agents. A CONTEXT.md without Navigation is a gatekeeper that doesn't point anywhere. Every CONTEXT.md — Layer 1 or 2 — must tell agents what's inside and where to go next.

**Which folders get Layer 2 CONTEXT.md files**:
- `docs/01-system-architecture/` — distinguishes from 03-features
- `docs/03-features/` — distinguishes from 05-implementation
- `docs/05-implementation/` — lifecycle rules (active → completed → archived)
- Folders where agents regularly create or modify files

**Which folders do NOT get them**:
- Individual feature subfolders (`docs/03-features/invoicing/` etc.)
- Standard library folders (`src/components/ui/`, `src/pages/`)
- Any folder with fewer than 3 files
- Folders where agents only read, never write

### Layer 3: Reference Material — "The Factory"

Stable knowledge that persists across every task. Set up once, updated when conventions change. The agent should **internalize these as constraints**.

| Location | Contains | Example |
|----------|----------|---------|
| `.claude/rules/` | Detailed code patterns, do/don't lists | `rls-policy.md`, `timezone.md` |
| `docs/01-system-architecture/` | How systems work | `DATABASE_POLICY.md`, `MODULE_SYSTEM.md` |
| `docs/03-features/` | How features behave | `QUOTATION_SYSTEM.md` |
| `supabase/MIGRATION_TEMPLATE.md` | Migration structure | Template for new migrations |

**Key property**: Does not change between tasks. Same reference material applies whether you're fixing a bug or building a feature.

**Analogy**: The recipe. The factory configuration. The style guide.

### Layer 4: Working Artifacts — "The Product"

Per-task content that changes every time. The agent should **process these as input to transform**.

| Location | Contains | Example |
|----------|----------|---------|
| `docs/05-implementation/active/` | Plans being executed | `PEOPLE_NORMALIZATION_PLAN.md` |
| Current code files being modified | The actual work | `src/features/people/pages/PeopleManagement.tsx` |
| Agent outputs | Results of previous steps | Migration files, generated types |

**Key property**: Changes with every task. Unique to each run.

**Analogy**: The ingredients. The raw materials. The current work-in-progress.

### Why the Layer 3/4 Distinction Matters

Mixing reference and working material in one undifferentiated context forces the model to sort them itself. Separating them gives clearer signals:

- **Reference** says: "here are the rules, follow them"
- **Working** says: "here is the input, transform it"

The CONTEXT.md files in Layers 1-2 make this separation explicit through their Inputs section, which labels each file as either `Reference` or `Working`.

---

## 2. Routing Table Standard

The Layer 0 routing table tells the agent: "For this type of task, go to this workspace, and optionally use this skill."

### Format

```markdown
## Routing

| Task | Read first | Reference (Layer 3) | Skill |
|------|-----------|-------------------|-------|
| Write/edit code | src/CONTEXT.md | .claude/rules/ (auto) | — |
| Database migration | supabase/CONTEXT.md | .claude/rules/migrations.md | — |
| Write documentation | docs/CONTEXT.md | .claude/rules/documentation.md | — |
| Review docs health | docs/CONTEXT.md | — | /check-docs |
| Git workflow | — | — | /git-sync |
| Fix code issues | src/CONTEXT.md | — | /code-hygiene |
| Plan a new feature | docs/05-implementation/CONTEXT.md | — | — |
| Check system health | — | — | /health-check |
```

### Rules

1. **Every slash command appears in the routing table.** Unrouted commands are invisible.
2. **"Read first" points to a CONTEXT.md**, not a specific doc. The CONTEXT.md tells the agent what else to load.
3. **Reference column is optional** — for cases where a specific rule file should always load for this task type.
4. **Max 12 rows.** More = workspaces too granular.
5. **Review quarterly.** Remove unused commands. Add new ones.

---

## 3. Documentation Folder Structure

### Current problems

1. `03-features/` mixes feature descriptions (how it works) with implementation plans (how to build it). Historically dozens of files across many subfolders with no lifecycle.
2. `05-implementation/` has completed plans sitting alongside active ones.
3. No distinction between Layer 3 (permanent reference) and Layer 4 (temporary working artifacts).

### Revised structure

```
docs/
├── CONTEXT.md                         # Layer 1: What's in docs, navigation
├── DOCUMENTATION_INDEX.md             # Lightweight manifest (see section 4)
│
├── 01-system-architecture/            # LAYER 3: How systems work (permanent)
│   ├── CONTEXT.md                     # What belongs here vs 03-features
│   └── *.md
│
├── 02-security/                       # LAYER 3: Security policies (permanent)
│   └── *.md
│
├── 03-features/                       # LAYER 3: Feature specifications (permanent)
│   ├── CONTEXT.md                     # What belongs here: descriptions, NOT plans
│   ├── invoicing/
│   ├── quotation/
│   └── ...
│
├── 04-integrations/                   # LAYER 3: External integrations (permanent)
│   └── *.md
│
├── 05-implementation/                 # LAYER 4: Implementation plans (temporary)
│   ├── CONTEXT.md                     # Lifecycle rules (active → completed → archived)
│   ├── active/                        # Plans currently being executed
│   └── completed/                     # Done plans (archive, don't delete)
│
├── 06-operations/                     # LAYER 3: Ops, maintenance, SOPs (permanent)
│   └── *.md
│
└── 99-meta/                           # Standards and meta-docs
    └── *.md
```

### The Layer 3/4 split in docs/

| Folder | Layer | Contains | Lifecycle |
|--------|-------|----------|-----------|
| `01-system-architecture/` | 3 (Reference) | How systems work NOW | Permanent, updated when system changes |
| `03-features/` | 3 (Reference) | What features do and how they behave | Permanent, updated when feature changes |
| `05-implementation/` | 4 (Working) | Plans for building something new | Temporary: active → completed → archived |

**Rule**: Describes how something works today → Layer 3 (`01-system-architecture/` or `03-features/`).
Describes how to build or change something → Layer 4 (`05-implementation/`).

### Implementation plan lifecycle

```
New plan created → 05-implementation/active/PLAN_NAME.md
  ↓ (all phases complete)
Move to → 05-implementation/completed/PLAN_NAME.md
  ↓ (6+ months old, no longer referenced)
Delete or archive outside repo
```

Plans in `active/` must have a progress section:

```markdown
## Progress
- [x] Phase 1: Database schema — completed 2026-03-01
- [x] Phase 2: Service layer — completed 2026-03-10
- [ ] Phase 3: UI components — in progress
- [ ] Phase 4: Testing — not started
```

---

## 4. DOCUMENTATION_INDEX.md — Simplified Role

### Problem

The index historically grew to hundreds of entries with descriptions. If folders also have CONTEXT.md files, this creates duplication.

### New role

`DOCUMENTATION_INDEX.md` becomes a **lightweight manifest**:
1. **Completeness check**: Does every .md file in docs/ appear?
2. **Status dashboard**: Quick 🟢/🔵/🔴 view
3. **Search target**: Agents grep this to find which folder a topic lives in

### Format

```markdown
## 01 — System Architecture
| Document | Status |
|----------|--------|
| [DATABASE_POLICY.md](01-system-architecture/DATABASE_POLICY.md) | 🟢 |
| [MODULE_SYSTEM.md](01-system-architecture/MODULE_SYSTEM.md) | 🟢 |
```

No descriptions in the index. The folder CONTEXT.md handles "what belongs here." The doc's own header handles "what this doc is about."

---

## 5. CONTEXT.md Standard

All CONTEXT.md files share these properties:

- **Tool-agnostic**: No Claude-specific instructions. Any AI agent can read them.
- **Plain English**: No personality instructions. Describe the work, not the AI.
- **Short**: Layer 1 = ~300 tokens. Layer 2 = 200-500 tokens. If longer, split.
- **No code examples**: Code patterns belong in `.claude/rules/` (Layer 3 reference material).
- **No duplication**: Don't repeat what's in other CONTEXT.md files or rules. Point to them.
- **Updated when folder changes**: Part of `/check-docs` checklist.

### The 80/20 rule (from MWP Section 3.3, Mistake #4)

Spend 80% of a CONTEXT.md describing **the work**: what the project is, who the audience is, what good output looks like, what to avoid. Spend 20% or less on behavioral instructions. If a CONTEXT.md reads like a personality quiz, rewrite it. If it reads like a project brief a new team member could pick up, it's correct.

---

## 6. .claude/ Directory Standard

`.claude/` is the Claude Code-specific tooling directory. This is the one area that is tool-specific by design — other tools have their own equivalents (`.cursor/rules/`, `.github/instructions/`).

```
.claude/
├── CONTEXT.md             # How commands, rules, and agents relate
├── settings.json          # Claude Code configuration
├── commands/              # Slash commands (user-invoked workflows)
│   └── *.md
├── rules/                 # LAYER 3: Auto-loaded reference knowledge
│   └── *.md
└── agents/                # Autonomous task definitions
    └── *.md
```

### The three tool types

| Type | Layer | Loaded when | Purpose |
|------|-------|-------------|---------|
| **Rules** | 3 (Reference) | Auto-loaded when filename matches task context | Detailed patterns, code examples, do/don't |
| **Commands** | N/A (workflow) | User invokes with `/command-name` | Multi-step workflows |
| **Agents** | N/A (autonomous) | Orchestrator delegates, or run via CLI | Autonomous task definitions |

**Decision tree**:
```
Multi-step workflow triggered manually?        → .claude/commands/
Detailed pattern for a category of work?       → .claude/rules/
Autonomous task on a schedule or delegation?   → .claude/agents/
Project-wide rule applying to every task?      → CLAUDE.md (if <1 line) or .claude/rules/ (if detailed)
```

### Rules files (Layer 3 reference)

- Named by topic: `rls-policy.md`, `timezone.md`, `query-compliance.md`
- Structure: Summary → Patterns (with code) → Common Violations → References
- Max 80 lines per file. Longer = split by subtopic.
- Can include `paths:` frontmatter for glob-based scoping (Claude Code feature)

### Commands (workflows)

- Named as verb or verb-noun: `git-sync.md`, `prd-write.md`
- Must appear in Layer 0 routing table
- Self-contained — all instructions needed to execute
- Audit quarterly: unused for 3 months → archive or delete

### Agents (autonomous)

- Named by slug: `health-checker.md`, `docs-monitor.md`, `appbase-advisor.md`
- Define WHAT and WHEN, not personality
- Specify: trigger, schedule, inputs, outputs, what it reads/writes

---

## 7. Layer 0 Rewrite Standard

### Target structure (~800 tokens, ~50-60 lines)

```markdown
# Project Name
[1 sentence] — [tech stack]

## Commands
[5-8 most-used, one line each]

## Routing
| Task | Read first | Reference | Skill |
|------|-----------|-----------|-------|
[8-12 rows max]

## Hard Rules (apply to ALL tasks)
1. [One-liner, e.g., "All RLS: minimal authenticated policy"]
2. [One-liner, e.g., "FK refs public.users(id), never auth.users(id)"]
3. [One-liner, e.g., "Supabase queries: .range(), .limit(), or .single()"]
4. [One-liner, e.g., "Dates: timezoneUtils only, never raw date-fns"]
5. [One-liner, e.g., "Toast: showSuccess/showError only, no useToast"]
[Max 7. If it only applies to specific tasks, it's a rule file, not here.]

## Structure
[10-line tree, major folders, one-word descriptions]

## MCP
[Project ID, available MCPs — 3 lines max]
```

### What moves out

| Current CLAUDE.md section | Moves to |
|--------------------------|----------|
| Detailed rules with code examples | `.claude/rules/` (already there — remove from CLAUDE.md) |
| Troubleshooting guides | `docs/06-operations/` |
| Architecture descriptions (People, Workflow) | `docs/01-system-architecture/` or `docs/03-features/` |
| Development Workflows | `src/CONTEXT.md` |
| Code style, naming, libraries | `src/CONTEXT.md` |
| Documentation Standards (detailed) | `docs/CONTEXT.md` + `.claude/rules/documentation.md` |
| Workspace memory (lessons/decisions) instructions | `.claude/rules/lessons-logging.md` (already there) |

---

## 8. How Agents Find Context — The Chain

### Interactive agents (VS Code, terminal)

```
Layer 0: CLAUDE.md (auto-loaded)
  ↓ reads routing table → "for this task, read src/CONTEXT.md"
Layer 1: src/CONTEXT.md
  ↓ "Layer 3 references" → routes to docs/ for feature specs, architecture
Layer 3: docs/03-features/quotation/ + .claude/rules/ (reference, internalize as constraints)
  ↓
Layer 4: The actual files being modified (working artifacts, process as input)
  ↓
Agent works with: identity + workspace context + domain knowledge + relevant rules + target files
```

**Tokens loaded**: ~800 (L0) + ~300 (L1) + ~1,000-2,000 (L3 docs + rules) + varies (L4 files) = **~2,000-8,000** tokens of context instead of the tens of thousands the pre-refactor monolith loaded.

### Cross-workspace routing (CRITICAL)

Workspaces must NOT be siloed. The `docs/` workspace is the project's knowledge layer — every other workspace should route to it for domain knowledge:

```
src/CONTEXT.md  ──→  docs/03-features/CONTEXT.md   (feature business logic)
                ──→  docs/01-system-architecture/   (design system, query standards)
                ──→  .claude/rules/                 (code patterns)

docs/CONTEXT.md ──→  src/                          (where implementations live)
                ──→  supabase/                      (where schema lives)
                ──→  .claude/rules/                 (where conventions are enforced)
```

**The pattern**: `docs/` describes WHAT and WHY. `src/` contains HOW. `supabase/` contains WHERE (data). `.claude/rules/` contains CONSTRAINTS. Cross-references between these workspaces are what make the routing chain work end-to-end.

**Layer 2 CONTEXT.md files** should include an "Implementation in" column in their Navigation tables, pointing from documentation back to the code that implements it, and vice versa. This is the MWP paper's footnote 4 in practice: "the routing pattern from Layer 1 applied recursively within Layer 3."

### Autonomous agents (cron, Mac Mini)

```
Agent definition: .claude/agents/health-checker.md
  ↓ specifies which CONTEXT.md files and rules to read
Layer 1-3: Reads specified context
  ↓
Executes task with scoped context
```

### The principle

**No agent reads everything.** Each task loads only the layers and files relevant to it. This keeps token cost low, context focused, and avoids the degradation documented when models process long contexts full of irrelevant material.

**Every CONTEXT.md routes somewhere.** A CONTEXT.md that only says "what belongs here" without pointing to specific files, subfolders, or cross-workspace references is a dead end. The entire point of CONTEXT.md is routing — answering "where do I go next?"

---

## 9. Configure the Factory, Not the Product

This principle from MWP (Section 3.1) maps directly to how this project should evolve.

**The factory** = Layer 3 reference material (rules, conventions, CONTEXT.md files, system architecture docs). Set up once. Stable across tasks.

**The product** = Layer 4 working artifacts (implementation plans, code changes, migration files). Changes every task.

### The edit-source principle

When output is wrong, there are two responses:
1. **Edit the output** — fix this task. (Necessary sometimes.)
2. **Edit the source** — fix every future task. (Always ask if this applies.)

If you consistently make the same correction to agent output, that's a signal to update a Layer 3 reference file (a rule, a CONTEXT.md, a convention doc). Workspace memory captures this:

```
Recurring correction / non-obvious failure
  → Append to the workspace's lessons.md / decisions.md
  → If it recurs across 2+ workspaces, promote to parent lessons.md or a CLAUDE.md Hard Rule
  → The factory improves; all future tasks benefit
```

**This is the self-improvement loop the MWP paper describes as a future direction (Section 6.3).** The lessons/decisions logging → rule-promotion pipeline (`.claude/rules/lessons-logging.md`) is exactly "editing the source, not the product." It replaces the retired `agent_corrections` table loop.

### Closing the Loop — Context Audit

The `/context-audit` command completes this loop by operating at the architecture level. While lessons-logging captures rule updates from recurring corrections, the context audit traces corrections back to their **upstream cause** — was the right context reachable when the error happened?

```
health-checker finds violation
  → lesson logged in workspace lessons.md
    → /context-audit traces to context gap (missing route, wrong scoping, weak rule)
      → improvement applied to CONTEXT.md or rule file
        → health-checker finds fewer violations next cycle
```

This is the MWP paper's "semantic debugging" concept (Section 6.2) applied to the context architecture: output provenance through the routing chain, cross-stage trace verification, and source integrity improvement.

**Three gap types the context audit identifies:**
- **Context routing gap** — relevant rule exists but isn't reachable from the CONTEXT.md chain
- **Rule gap** — no rule covers this correction pattern yet
- **Rule quality gap** — rule exists and is reachable, but isn't clear enough to prevent errors

---

## 10. The /check-docs Command — Updated Role

After this standard is implemented, `/check-docs` gains these responsibilities:

### Existing (keep)
- Check for broken links in docs
- Verify all docs appear in DOCUMENTATION_INDEX.md
- Flag stale documents (not updated in 90+ days)

### New checks
1. **CONTEXT.md completeness**: Every folder in section 3 has a CONTEXT.md
2. **CONTEXT.md freshness**: Content matches actual folder contents
3. **Routing table accuracy**: Every command in `.claude/commands/` appears in CLAUDE.md routing table
4. **Plan lifecycle**: Flag completed plans still in `05-implementation/active/`
5. **Layer 0 length**: Warn if CLAUDE.md exceeds ~800 tokens / 60 lines
6. **No orphaned files**: Every .md in docs/ reachable from DOCUMENTATION_INDEX.md or a CONTEXT.md
7. **Layer 3/4 separation**: Flag implementation plans sitting in `03-features/` (should be in `05-implementation/`)

### Run frequency
- Automatically during `/git-sync`
- Manually via `/check-docs`
- Nightly via docs-monitor agent
- Periodically via **`/context-audit`** (deeper analysis: traces corrections to routing gaps, checks rule effectiveness)

---

## 11. Migration Plan — How to Get There

Do NOT rewrite everything at once. Build the minimum, start working, grow from use.

### Phase 1: Foundation
1. Rewrite CLAUDE.md to ~60 lines with routing table
2. Create `src/CONTEXT.md` (move code conventions from CLAUDE.md)
3. Create `supabase/CONTEXT.md` (move migration rules from CLAUDE.md)
4. Create `docs/CONTEXT.md` (update existing README.md → CONTEXT.md format)
5. Create `.claude/CONTEXT.md` (decision tree for commands/rules/agents)

### Phase 2: Docs restructure
1. Create `05-implementation/active/` and `05-implementation/completed/`
2. Move completed plans to `completed/`
3. Audit `03-features/` — move implementation plans to `05-implementation/`
4. Create CONTEXT.md for `docs/01-system-architecture/`, `docs/03-features/`, `docs/05-implementation/`
5. Simplify DOCUMENTATION_INDEX.md to manifest format

### Phase 3: Tool cleanup
1. Audit all 12 slash commands — archive unused ones
2. Remove duplication between CLAUDE.md and `.claude/rules/` (CLAUDE.md is now slim)
3. Update `/check-docs` command with new checks
4. Add `paths:` frontmatter to rule files where useful

### Phase 4: Validate
1. Run `/check-docs` — should pass all new checks
2. Run `/health-check` — should pass
3. Test: new conversation → coding task → verify agent reads `src/CONTEXT.md`, not full CLAUDE.md
4. Test: docs task → verify agent reads `docs/CONTEXT.md`
5. Compare token usage before/after (rough estimate from context loaded)

---

## 12. Honest Tradeoffs

**What this improves**:
- Token efficiency: ~2,000-5,000 per task instead of the tens of thousands the pre-refactor monolith loaded
- Clarity: agent knows exactly where to look
- Tool-agnostic: CONTEXT.md works with any AI agent
- Self-improving: correction logging → rule updates = "configure the factory"

**What this costs**:
- Migration effort: moving content, creating CONTEXT.md files
- More files to maintain: ~8 new CONTEXT.md files
- Risk of stale CONTEXT.md files (mitigated by `/check-docs`)
- Learning curve: routing chain instead of "dump everything in CLAUDE.md"

**What this does NOT fix**:
- Code quality — this is organization, not better code
- Agent intelligence — same model, less distracted
- Autonomous reliability — agents still fail, just with better context

**Open questions** (from MWP paper Section 5.4):
- As context windows grow larger, does selective loading become less important? The human-interaction arguments (observability, editability) remain even if the token argument weakens.
- How sensitive is output quality to ordering of context within a layer? Unknown at MWP's typical context sizes.

---

## 📚 Related Documentation

- **MWP Paper**: [INTERPRETABLE_CONTEXT_METHODOLOGY.md](./INTERPRETABLE_CONTEXT_METHODOLOGY.md) — "Interpretable Context Methodology: Folder Structure as Agent Architecture" (Van Clief & McDermott, 2026) — The academic foundation for this standard
- **Context audit**: `/context-audit` ([.claude/commands/context-audit.md](../../.claude/commands/context-audit.md)) — Audits this standard, traces corrections to context gaps, checks routing/rule effectiveness
- **Workspace memory rule**: [.claude/rules/lessons-logging.md](../../.claude/rules/lessons-logging.md) — lessons/decisions logging that feeds the self-improvement loop
- [CONTEXT_ARCHITECTURE_ROLLOUT.md](../05-implementation/active/CONTEXT_ARCHITECTURE_ROLLOUT.md) — Incremental rollout plan implementing this standard
- [DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md](./DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md) — Original doc standards (this document supersedes folder structure sections)
- [CODE_HYGIENE_STRATEGY.md](../06-operations/CODE_HYGIENE_STRATEGY.md) — Hygiene practices that complement this standard
- [.claude/rules/documentation.md](../../.claude/rules/documentation.md) — Detailed documentation naming/header rules
- CLAUDE.md — The Layer 0 file this standard governs
