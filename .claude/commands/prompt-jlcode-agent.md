# /prompt-jlcode-agent — Intent-Based Prompts for the JLCode Session

Generate a copy-paste-ready prompt for a parallel Claude session working in the JLCode repo at `/Volumes/YourVolume/`. Use when AppBase work requires changes on the JLCode side: guide amendments, system-doc updates, workflow adjustments, or reference lookups.

The JLCode agent runs under strict tenets (see `/Volumes/YourVolume/CLAUDE.md` + `META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md`). Describe **intent + verified facts**; let the JLCode agent format prose, apply its hooks (forbid-tool-leak, forbid-hedging), and honour its token budgets.

## When to Use

- A AppBase migration changed a table / column / enum → JLCode guides must be updated to match
- New AppBase feature shipped → JLCode agents need to know about it
- AppBase work exposed a bug or gap in a JLCode workflow or guide
- You need to reference / look up a JLCode system doc to answer a user question
- You need a scheduling / cron / dispatcher behaviour change on the Mac Mini side
- User says "tell JLCode to…", "prompt the JLCode agent", "update the guide on the JLCode side"

## When to Skip

- Pure AppBase changes (React, Supabase, your-app.example.com) — do those here
- Reading JLCode files you have direct access to — just Read them
- Architecture discussions / questions that don't require a file change

## Process

### 1. Identify what JLCode should do

Narrow to one of:
- Amend a specific guide (e.g. `JLCD_COMPANY/DEVELOPER/QUOTATION/OBSERVE_QUOTATION/OBSERVE_QUOTATION.md` Step 3)
- Amend a reasoning prompt reference (`references/REASONING_PROMPT.md`)
- Update a state doc (`_system/SYSTEM_STATE.md`, `WORKFLOW_STATE.md`, root `STATE.md`)
- Add a lesson / decision (`lessons.md`, `decisions.md`)
- Change a dispatcher / cron script (`scripts/run.sh`, Cron Manager config)
- Reference-only lookup (no change; just explanation)

Bundle related changes into one prompt.

### 2. Draft the prompt

Wrap in triple backticks. Use this template:

```
<ONE-PARAGRAPH CONTEXT — what happened here on AppBase that triggered this, with commit hashes / migration names. Include facts the JLCode agent needs (column names, schema, UI changes).>

=== What we want ===

<Intent-based. Examples:
- "Update OBSERVE_QUOTATION.md Step 3 so the INSERT writes to <table> with columns <list>"
- "Mention <new AppBase column> in the reasoning prompt so the agent can factor it in"
- "Update SYSTEM_STATE.md to reflect that bundle #N landed at HH:MM SGT">

<Verified facts only:
- Table name: <exact, from the migration>
- Column names: <exact>
- PostgREST endpoint: <exact URL path>
- Behaviour change: <describe>>

=== Constraints ===

Respect JLCode tenets (/Volumes/YourVolume/CLAUDE.md + META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md):
- Guides speak in abstract verbs — NO raw tool names (mcp__*, ghost_*, browser_*, page.locator, getByRole)
- No hardcoded /Volumes/YourVolume paths in guide BODY — use $JLCODE_ROOT (exception: inside code fences that document the path)
- Tenet 10: NO hedging words (see banned list in /Volumes/YourVolume/.claude/hooks/config.json → forbid_hedging.banned_words) without a `verified: <file:line>` cite — blocked by the forbid-hedging.py hook
- Verify claims by reading the actual file; state unknowns as "cause unknown — no error in <file:lines>" not as uncertainty words
- Token budgets: Guide ≤8000 chars, Reference ≤15000 chars, CONTEXT.md ≤1600 chars

=== Verification ===

After the edit, please:
- Run /check-docs (scoped to the edited workspace) or /check-guide (if a guide changed)
- Confirm no hook violations (forbid-tool-leak, forbid-hedging)
- If the change affects runtime (curl URL, column name, etc.), spot-check against live API

=== Report back with ===

1. Exact file(s) + line ranges edited
2. Before/after of the critical change (diff or new content)
3. Downstream effects on AppBase side we need to know (e.g. "new column name is X, so display should now pull X not Y")
4. Tenet violations you caught + fixed in the process
5. Gaps in my brief that you had to fill — flag for me to correct

<CLOSING — what happens on AppBase side once JLCode confirms>
```

### 3. Guardrails — what NOT to include

| Anti-pattern | Why it breaks |
|---|---|
| Writing guide markdown verbatim | JLCode has specific structure + budget conventions — let their agent format |
| Naming exact file paths you haven't verified | Folder structure shifts; use descriptions if unsure |
| Prescribing internal JLCode code (bash, python) | Wrapper / adapter / guide split has rules |
| Omitting the migration name or commit hash that triggered this | JLCode tenet 10 requires verified cites — give them the source |
| Forgetting the tenet constraints | Their hooks will block the edit |
| Asking them to modify AppBase files | Their scope is JLCode only; handle AppBase work in this session |

**Do:**
- Provide **verified facts** (exact names, hashes, before/after state here)
- Describe **intent** (what the change should accomplish)
- Flag **constraints** (tenets, budgets, verification script)
- Always include **report-back** so the handoff loop stays tight

### 4. Output

Produce ONE copy-paste-ready prompt block inside triple backticks. Before the block: `Copy-paste into a new JLCode session (working directory /Volumes/YourVolume).`. After the block: list what you'll update here on AppBase once JLCode confirms.

## Rules

- **Verified facts only.** JLCode tenet 10 requires `verified:` citations — save them a round-trip by giving facts up front.
- **Respect tenets.** Workflows are assets, load on demand, decouple verbs from tools, verify before claiming. Don't ask for edits that would violate these.
- **Always report-back.** Without it, downstream drift on the AppBase side.
- **Don't write their prose.** Describe intent; let the JLCode agent write in JLCode style.
- **Bundle related changes.** One session per bundle.

## Related

- `/Volumes/YourVolume/CLAUDE.md` — JLCode tenets + workspace map
- `/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md` — full tenet doc
- `/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/TOKEN_BUDGET_REFERENCE.md` — file-type char limits
- Sibling (JLCode side): `/Volumes/YourVolume/.claude/commands/prompt-appbase-agent.md` — the reverse skill
