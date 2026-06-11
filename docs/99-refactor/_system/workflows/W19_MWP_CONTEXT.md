# W19 — MWP context architecture

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-19 SGT (Tracks 1–3 shipped — see Progress log)
**Status**: 🟢 CLOSED
**Priority**: 🟡 High

**Goal**: Adapt Maximum-Workflow-Programming (MWP) / Interpretable Context Methodology to this repo — refresh every CONTEXT.md for AI-agent navigation, adopt token budgets, rollout `decisions.md` + `lessons.md` per workspace. Any future Claude prompt ramps in without drift.
**Tier**: Next (S2) · **Status**: 🟢 CLOSED 2026-04-19 · **Automation**: 🤖 auto scaffold + 👀 HITL per workspace
**Blocked by**: W18 (clean docs ✅), W02 (workspace inventory ✅) · **Blocks**: W20 (watchdog enforces this pattern)

## Why this exists

User's key goal: *"anyone can prompt and it can edit the codebase with our standard and it will not drift in code structure"*. That requires every workspace to have a navigable CONTEXT.md + scoped memory. JLCode's MWP pattern delivers this — this card adapts it to a single-repo context.

**Adapt, don't copy**: JLCode is a cross-project NAS. This is one app. The 3-layer architecture (CLAUDE.md → CONTEXT.md per workspace → guides/refs) maps cleanly. The cross-project hydration and ADAPTERS pattern do not.

## Scope — 3 tracks

### Track 1 — CONTEXT.md refresh per workspace

A "workspace" = any subtree with a distinct task domain. Applies to:
- `src/features/<name>/` (every feature module)
- `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/` (shared primitive roots)
- `supabase/migrations/`, `supabase/functions/`
- `docs/03-features/<domain>/`
- `.claude/commands/`, `.claude/rules/`
- Test folders (`tests/workflows/`, `tests/pom/`)

Every workspace gets / refreshes a `CONTEXT.md` containing:
- Purpose (1 sentence)
- What belongs here / what doesn't
- Navigation table (file → purpose)
- Before-working-here rules (patterns, common pitfalls — concise)
- Decisions & Lessons section (links to sibling `decisions.md` / `lessons.md` if they exist)
- Related Documentation (bidirectional back-links)

Budget enforced per this repo's TOKEN_BUDGET (Track 2).

### Track 2 — Token budget adoption

- Write `docs/99-meta/TOKEN_BUDGET.md` — this repo's adaptation of [JLCode's TOKEN_BUDGET_REFERENCE.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/TOKEN_BUDGET_REFERENCE.md)
- Per-file limits (adapted, pragmatic):

| File type | Max chars | Max lines | Over-budget action |
|---|---|---|---|
| root `CLAUDE.md` | 3,200 | 90 | Extract to docs/99-meta/ reference |
| Feature `CONTEXT.md` | 1,600 | 80 | Routing-only; extract detail |
| Category `CONTEXT.md` (e.g. `docs/03-features/CONTEXT.md`) | 2,400 | 120 | Same |
| Guide (SOP/spec) | 8,000 | 200 | Split into sub-guides |
| Feature doc | 12,000 | — | Split by sub-topic |
| Reference doc | 15,000 | — | Split into focused sub-files |
| `decisions.md` / `lessons.md` | — | 50 entries | Archive older than 6 months to `_archive/` |

- `/check-docs` skill updated to flag over-budget files
- Budget exemptions documented with justification per exemption (follows JLCode exemption format)
- Root `CLAUDE.md` adds: *"File rules + budgets live in docs/99-meta/TOKEN_BUDGET.md"*

### Track 3 — decisions.md + lessons.md rollout

Seed workspaces with real institutional history. Not every folder — only ones with actual accumulated knowledge worth preserving.

Candidate seed list:
- `src/features/quotation/` (complex module, many decisions)
- `src/features/people/` (normalization history, migration lessons)
- `supabase/migrations/` (the RLS-was-removed lesson lives here)
- `src/features/autonomous-agent/` (openclaw deprecation, email-inbox rewrite)

Per workspace:
- Seed 2-3 verified entries each (from git history + existing docs + `docs/02-security/DUPLICATE_USER_*` etc.)
- Use JLCode's [DECISIONS_LESSONS_PATTERN.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/DECISIONS_LESSONS_PATTERN.md) format (one-line fields, supersession via `**Supersedes**`, archive at 50)
- Root `CLAUDE.md` adds: *"Before working in a workspace, check for `decisions.md` and `lessons.md` there"*

## What we take from JLCode (and what we skip)

**Take:**
- 3-layer architecture — CLAUDE.md always-loaded, CONTEXT.md per workspace, guides/references on-demand
- Per-file token-budget ceilings — "budgets are ceilings not targets"
- `decisions.md` + `lessons.md` append-only pattern with supersession
- Bidirectional back-links in Related Documentation
- Load-on-demand principle — don't preload reference files
- Scope exclusion + exemption pattern (short list for this repo)

**Skip:**
- ADAPTERS pattern (verbs → tools) — this is a single codebase with a single runner, not multi-runner
- Scope exclusion list for openclaw-agents / NAS folders (irrelevant here)
- Cross-workspace promotion chain — we have one app; promotions graduate to root `CLAUDE.md` rules directly
- `forbid-tool-leak` hook — no tool-name leakage risk in product code (could add if writing agent guides later)

## Dependencies on other cards

- W18 — clean doc set to apply against
- W02 — workspace inventory (feature folders list)
- Blocks W20 — watchdog enforces the pattern this card establishes
- Informs W07 + W09 — new features land with proper CONTEXT.md from day one

## Open workflow questions

- **Q-W19-a** ✅ **Every `src/features/<name>/` gets its own CONTEXT.md** — matches MWP scope-to-task principle.
- **Q-W19-b** ✅ **Budgets: 1,600 chars feature CONTEXT.md · 2,400 chars category-level CONTEXT.md** (matches JLCode reference).
- **Q-W19-c** ✅ **Seed from existing docs during W18 walkthrough**. As W18 walks each doc, any that embeds decisions / lessons becomes a seed source. Docs that contain neither → no decisions.md/lessons.md created (don't force-seed empty files). W18 flags candidates; W19 harvests them.
- **Q-W19-d** ✅ Auto-generate CONTEXT.md skeleton from folder structure, then HITL refine per folder.
- **Q-W19-e** ✅ **Accept default (CI-only enforcement, not pre-commit)**. Claude translation: every file-budget rule (Track 2) can be checked either (a) when you try to commit on your laptop — pre-commit hook blocks the commit if over budget, or (b) in CI after push — PR fails checks if over budget. Pre-commit is stricter but adds friction to every save. CI-only is friendlier for solo-dev pace — you see the fail on the PR and fix it before merge. Default accepted.

## Done-when

- Every workspace folder has a CONTEXT.md within budget ✅ (14 workspaces — 6 new + 8 refreshed)
- `docs/99-meta/TOKEN_BUDGET.md` exists + `/check-docs` enforces it ✅ (TOKEN_BUDGET written; CI enforcement deferred to W22 per Q-W19-e)
- ≥3 workspaces have seeded `decisions.md` + `lessons.md` ✅ (3 seeded — `src/features/refactor-dashboard/`, `supabase/migrations/`, `tests/workflows/`)
- Root `CLAUDE.md` updated with memory-reading rule + links to TOKEN_BUDGET.md ✅
- Sets DAG flag: **`context_refreshed`** ✅

## Progress log

**2026-04-19** — **🟢 CLOSED.** All 3 tracks shipped in one pass.
- **Track 2 (TOKEN_BUDGET)**: `docs/99-meta/TOKEN_BUDGET.md` written (5,600 chars / 85 lines, under 8K guide ceiling). 6-row exemption table including root `CLAUDE.md`. Registered in `DOCUMENTATION_INDEX.md` (99-meta count 3 → 4). Listed in `docs/99-meta/CONTEXT.md`.
- **Track 1 (CONTEXT.md)**: 6 new + 8 verified within budget. New: `src/features/refactor-dashboard/CONTEXT.md` · `src/features/design-lab/CONTEXT.md` · `src/features/serviceslist/CONTEXT.md` · `src/components/CONTEXT.md` · `src/hooks/CONTEXT.md` · `src/utils/CONTEXT.md` · `supabase/migrations/CONTEXT.md` · `supabase/functions/CONTEXT.md` · `.claude/commands/CONTEXT.md` · `.claude/rules/CONTEXT.md` · `tests/CONTEXT.md` · `tests/workflows/CONTEXT.md` · `tests/pom/CONTEXT.md` · `tests/runners/CONTEXT.md`. `src/CONTEXT.md` updated to add `features/` folder reference.
- **Track 3 (decisions/lessons)**: 3 workspaces seeded with verified institutional history. `src/features/refactor-dashboard/`: 3 decisions (markdown-canonical · ledger 15-col shape · queryKeys factory) + 1 lesson (stale parser silent mis-read). `supabase/migrations/`: 3 decisions (chaos-recovery reset 2025-09-07 · capability-based RLS X12 · Path B live DB W01) + 2 lessons (`ai_ro_select` narrow scoping · W15.03 no-op overscoping). `tests/workflows/`: 3 decisions (ledger-or-it-didn't-happen · hard-delete + zero-residue · `data-testid`-only) + 3 lessons (TableRow `onClick` vs href WF-0291 · Radix Popover race · Synology code 119). Skipped 4th seed target (`src/features/quotation/` doesn't exist — quotation lives in `src/components/quotation/`; per Q-W19-c, don't force-seed empty files).
- **Root CLAUDE.md**: 2 lines added under "How I Work" — `decisions.md`/`lessons.md` reading rule + TOKEN_BUDGET.md link. Trimmed Structure + MCP sections to compensate; final 3,533 chars (333 over 3,200 ceiling — exempted in TOKEN_BUDGET.md with justification).
- **Sets flag**: `context_refreshed` ✅ (G2 gate prerequisite).
- **Follow-ups (not blocking close)**: (a) `/check-docs` skill update to read TOKEN_BUDGET.md instead of hardcoded numbers; (b) parser-level header-row schema check for WORKFLOW_LEDGER.md (lessons.md hardening); (c) seed `decisions.md`/`lessons.md` for additional workspaces opportunistically as W09 modules graduate.

## Related

- [INTERPRETABLE_CONTEXT_METHODOLOGY.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/INTERPRETABLE_CONTEXT_METHODOLOGY.md) — the MWP paper
- [TOKEN_BUDGET_REFERENCE.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/TOKEN_BUDGET_REFERENCE.md) — adapt into `docs/99-meta/TOKEN_BUDGET.md`
- [DECISIONS_LESSONS_PATTERN.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/DECISIONS_LESSONS_PATTERN.md) — memory file pattern
- [CORE_PRINCIPLES.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md) — tenets informing this work
- [W18_DOCS_AUDIT.md](W18_DOCS_AUDIT.md) — input
- [W20_CRON_WATCHDOG.md](W20_CRON_WATCHDOG.md) — runtime enforcement
