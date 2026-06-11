Audit and improve the context architecture based on the MWP standard. Reviews layer routing, contract completeness, and rule freshness.

**MWP Standard**: `docs/99-meta/INTERPRETABLE_CONTEXT_METHODOLOGY.md`
**Applied Standard**: `docs/99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md`

## What This Command Does

Runs a 5-phase audit interactively:

1. **Layer 0 audit** — Is CLAUDE.md within token budget? Are all commands routed? Any noise?
2. **Layer 1 audit** — Do workspace CONTEXT.md files route correctly? Any dead ends?
3. **Layer 2 audit** — Are subfolder contracts complete and accurate?
4. **Layer 3 audit** — Are rules effective? Any gaps? Any stale references?
5. **Lessons scan** — Surface recurring patterns from per-workspace `lessons.md` files that hint at context routing gaps.

## Step 1: Read the Standard

Read these files to understand what "correct" looks like:
- `docs/99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md` (sections 1-8)
- `docs/CONTEXT_MAP.md` (current state)

## Step 2: Layer 0 — CLAUDE.md

1. Read `CLAUDE.md`
2. Count lines and estimate tokens (~15 tokens per line)
3. Check: every `.claude/commands/*.md` → is it in the routing table or slash list?
4. Check: every hard rule → does it point to its `.claude/rules/` detail file?
5. Flag lines that are noise (only relevant to specific task types)
6. **Report**: token count, unrouted commands, noise lines

## Step 3: Layer 1 — Workspace Routers

For each of `src/CONTEXT.md`, `docs/CONTEXT.md`, `supabase/CONTEXT.md`, `.claude/CONTEXT.md`:

1. Read the file
2. Verify every Navigation entry points to something that exists
3. Verify cross-workspace references resolve
4. Check token budget (~300 tokens / ~20-30 lines)
5. Apply 80/20 rule: mostly about the work, not behavioral instructions
6. **Report**: dead routes, coverage gaps, budget violations

## Step 4: Layer 2 — Subfolder Contracts

For each CONTEXT.md listed in `docs/CONTEXT_MAP.md` Layer 2:

1. Read the file
2. Check standard sections exist
3. Verify Navigation table matches actual folder contents
4. **Report**: incomplete contracts, stale navigation

## Step 5: Layer 3 — Reference Material

For each `.claude/rules/*.md`:

1. Check if it has `paths:` frontmatter — is it scoped correctly?
2. Check "Known Patterns" sections — are recorded entries still relevant or superseded?
3. Spot-check: do code examples reference functions/components that still exist?
4. **Report**: rules with stale examples, sections worth promoting to CLAUDE.md

## Step 6: Lessons scan — surface routing gaps

Find every `lessons.md` in the repo (`find . -name lessons.md -not -path '*/_archive/*'`) and scan recent entries. For each entry where the same lesson appears in 2+ workspaces, OR a single lesson references "missing rule / missing CONTEXT.md / wrong routing" as root cause:

1. Identify the workspaces / files affected
2. Trace the routing chain: CLAUDE.md → workspace CONTEXT.md → applicable rules
3. Was the relevant rule/convention reachable from the entry point?
4. Classify: context routing gap / rule gap / rule quality gap / not context-related

**Report**: show the trace for each pattern and the suggested fix (add a route, expand a rule, promote a lesson to a CLAUDE.md rule).

## Step 7: Present & Apply

Show all findings organized by layer, then by priority (highest-impact first).

For each improvement suggestion, ask: **"Apply this?"**

- **Yes** → make the edit (add route to CONTEXT.md, update rule file, etc.)
- **Skip** → move to next
- **Stop** → end the audit

After applying changes, summarize what was changed and why — this is the report Agent J forwards.
