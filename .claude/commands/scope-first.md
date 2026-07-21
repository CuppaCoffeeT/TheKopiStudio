# /scope-first — Brain-Dump → Research → Design → Approve → Execute

Multi-stage scoping workflow for AppBase. Use when a task is bigger than it looks, has cross-system dependencies, or the requirements are fuzzy and a redesign is on the table. Adapted from [/Volumes/YourVolume/.claude/commands/create-workflow.md](/Volumes/YourVolume/.claude/commands/create-workflow.md) for web-app / UI / cross-repo AppBase work.

## When to use

- Task spans AppBase + Mac Mini orchestrator + Supabase schema
- User says "let's re-understand this / re-do this / pause and rethink"
- Proposed change will affect other in-flight work (W05b, another migration, a shipped primitive)
- Current mess is surface-level but the root cause isn't clear
- Multiple overlapping UI surfaces render the same state
- A new workflow category (like the Pending* cards were) is about to be added organically

## When to skip

- Single-file edit with clear intent → just do it
- User asked for a specific known change → just do it
- Bug fix with a reproducible repro → just fix it
- Already in the middle of an approved plan → stay in it

## Invocation

```
/scope-first <topic-slug>                          # fresh rethink
/scope-first <topic-slug> --continue <stage>       # resume at 1_RESEARCH / 2_DESIGN / 3_IMPLEMENT
```

Slug is the workspace name (kebab-case). Example: `/scope-first quotation-ux-rethink`.

## Invariants

1. **Every stage produces documented output** — .md files, no verbal-only deliverables.
2. **No code edits before 3_IMPLEMENT** — stages 0-2 are paper. The pause is the feature.
3. **User approves between stages** — 0→1 (brain-dump confirmed), 1→2 (findings + answered Qs), 2→3 (plan approved).
4. **Token budget honored** per [docs/99-meta/TOKEN_BUDGET.md](../../docs/99-meta/TOKEN_BUDGET.md) — each stage file ≤ 8000 chars / 200 lines. Split if needed.
5. **No surprises, no scope creep** — if a finding expands scope, raise it explicitly and wait for approval before absorbing.

## Workspace layout

```
docs/99-refactor/_system/design/<topic-slug>/
├── README.md                       # workspace index + stage table
└── _planning/
    ├── 0_INTAKE/
    │   ├── 00_BRAIN_DUMP.md        # user's ask + my structured reading (N threads)
    │   ├── 01_CURRENT_PAIN.md      # documented mess · incidents · overlaps · root causes
    │   └── 02_QUESTIONS_BACK.md    # C1-Cn confirm + D1-Dn design questions w/ defaults
    ├── 1_RESEARCH/
    │   ├── CONTEXT.md              # what this stage produces · what to read · tools
    │   ├── ORCHESTRATOR_AUDIT.md   # if cross-repo, map Python side
    │   ├── INCIDENT_POSTMORTEM.md  # Qxxxxx root causes
    │   ├── CONTRACT_GAPS.md        # where cross-system contract has holes
    │   └── FINDINGS.md             # top-line findings + residual Qs for user
    ├── 2_DESIGN/
    │   ├── CONTEXT.md
    │   ├── MODEL.md                # new data model / state model / type model
    │   ├── SURFACES.md             # UI surface inventory (what stays/goes/new)
    │   ├── PRIMITIVE_SPECS.md      # new primitives if any
    │   ├── CONTRACT.md             # cross-system invariants
    │   └── MIGRATION_PLAN.md       # commit-by-commit path
    └── 3_IMPLEMENT/
        └── CONTEXT.md              # ready-for-code marker · lists plan · baseline capture
```

Place under `docs/99-refactor/_system/design/` by default. User may redirect to another parent (e.g. `docs/05-implementation/active/`) at invocation.

## Protocol

### Stage 0 — INTAKE (verbal with user)

Produces 3 files in `_planning/0_INTAKE/`:

1. **00_BRAIN_DUMP.md** — verbatim (paraphrased) user request + my structured reading (5-10 numbered threads). Flag anything I'm NOT reading from their message so they can correct. End with "success criteria when we're done".

2. **01_CURRENT_PAIN.md** — documented mess. Include: incident table (IDs + root cause + surface implication), state-model confusion (old vs new world), UI overlap matrix, visibility gaps, what works (don't-break list), root causes (my reading, to confirm).

3. **02_QUESTIONS_BACK.md** — two sections: **Confirmation questions** (C1-Cn, quick yes/no w/ `[default]`) and **Design questions** (D1-Dn, multiple choice w/ `[default]`). Every question has a default so user can `[default]` anything they don't care about.

Stop. Wait for user answers. Do not proceed to 1_RESEARCH until user confirms 00 + 01 + answers 02.

### Stage 1 — RESEARCH

Agent reads + writes to `_planning/1_RESEARCH/`. Scope driven by D-answers. Typical deliverables: `ORCHESTRATOR_AUDIT.md` · `INCIDENT_POSTMORTEM.md` · `CONTRACT_GAPS.md` · `FEATURE_PREVIEW.md` · `FINDINGS.md`. Common reads: JLCode orchestrator repo · `docs/99-refactor/` · Supabase MCP · git log · per-workspace `lessons.md` · named incidents.

Stop after FINDINGS.md. Report to user, ask residuals, wait for sign-off.

### Stage 2 — DESIGN

Agent writes to `_planning/2_DESIGN/`: `MODEL.md` (state/data model + ownership) · `SURFACES.md` (UI keep/remove/new/shrink + LOC deltas) · `PRIMITIVE_SPECS.md` · `CONTRACT.md` (cross-system invariants) · `MIGRATION_PLAN.md` (ordered commits + rollback + risk).

Stop. User approves plan explicitly before 3.

### Stage 3 — IMPLEMENT

Per-commit: baseline (tsc + build + browser spot-check) → edit (one logical change) → verify (tsc + build + browser + manifest) → commit → repeat. For UI work, reuse existing shared components (`primitives/`, `ui/`, `shared/`) per `MODULE_COMPLIANCE_CHECKLIST.md` import hygiene — a new design system from Claude Design will replace the old primitive mandates. Maintain a test ledger with per-WF before/after checkmarks.

### Stage 4 — TEST

Runs inside 3 (one ledger row per commit), not after. Workflow-level tests via `/write-workflow-test` when surface stabilizes.

### Stage 5 — DEPLOY

Push to main. Capture: DB migrations via Supabase MCP · Python-side deltas flagged for JLCode repo · related docs synced (`CONTEXT.md` files) · rollback SHA.

## Hard rules

- **No code edits in 0/1/2** — violations abandon the scoping discipline. If you catch yourself about to edit source, stop and write the plan instead.
- **No Supabase writes in 0/1** — read-only research. Writes only in 3_IMPLEMENT with user approval.
- **No mock data** — use real Q-numbers, real incidents, real screenshots.
- **Surface the two-repo edge** — if findings suggest Python-side changes, surface them, don't silently absorb or ignore.
- **Every file carries the standard header** — Created/Last Updated/Status/Priority/Overview/Related Documentation per `.claude/rules/documentation.md`.
- **Cross-link bidirectionally** — every new file links to parent README; parent README lists every new file.

## Scope

**Belongs**: cross-system rethinks · pre-refactor scoping · incident-driven redesigns · first-principles state-model work.

**Doesn't**: routine bug fixes → just fix · approved plans → just execute · single-page migrations → `MODULE_CREATION_SOP` · one-off components → just build.

## Related

- [/Volumes/YourVolume/.claude/commands/create-workflow.md](/Volumes/YourVolume/.claude/commands/create-workflow.md) — original pattern (Python-side)
- [/Volumes/YourVolume/META_FOLDER_STRUCTURE/WORKFLOW_DEVELOPMENT_LIFECYCLE.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/WORKFLOW_DEVELOPMENT_LIFECYCLE.md) — stage playbook reference
- [.claude/rules/documentation.md](../rules/documentation.md) — file header standard
- [.claude/rules/code-hygiene.md](../rules/code-hygiene.md) — 4-checks-when-touching-a-file
- [docs/99-meta/TOKEN_BUDGET.md](../../docs/99-meta/TOKEN_BUDGET.md) — per-file ceilings
- [docs/99-refactor/_system/design/pages/quotationdetail/p3/rethink/](../../docs/99-refactor/_system/design/pages/quotationdetail/p3/rethink/) — first real consumer of this skill
