# AppBase_REFACTOR — Execution Plan

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-16 SGT
**Status**: 🔵 Planning
**Priority**: 🔴 Critical

> How we actually do this — not the theory (DAG, tenets, patterns) but the week-by-week + card-by-card execution.

## The arc (5 phases)

Every system goes through the same arc. We're already past Phase 0 and Phase 1. The rest is mostly Phase 2 → Phase 4.

| Phase | What happens | Output | Status |
|---|---|---|---|
| **0. Brain dump** | You describe the vision, the pain, the constraints, in your own words | `RAW_REQUIREMENTS.md` | ✅ done (2026-04-16) |
| **1. Research** | Parallel agents: what does the repo already look like + what do industry best practices say | `research/REPO_AUDIT.md` + `research/REFACTOR_BEST_PRACTICES.md` | ✅ done (2026-04-16) |
| **2. Planning** | Translate findings → backlog of cards + open decisions + dependency map | `SYSTEM_OVERVIEW.md` (DAG + backlog + X1..X11) + 13 W## cards | ✅ done (this conversation) |
| **3. Design** | Per card: resolve open questions (Q-W##-*), lock scope, draw schemas/interfaces, write failing tests | Each card's `workflows/W##_*.md` + a `WORKFLOW_STATE.md` alongside | 🔴 next — starts after you accept X1..X11 |
| **4. Execute** | Per card: build the code, write the tests, merge the PRs, soak, archive | Actual `src/` changes + merged PRs + green CI | 🔴 starts week 2 |
| **5. Harden** | Skills + dashboard lock the new shape in so it can't drift | `/create-module` skill + `/refactor-status` page | 🔴 week 5 |

## Per-card lifecycle (the same 6 steps inside each W##)

When we `/create-workflow` on a card, the card expands into 6 stages. This mirrors JLCode's workflow lifecycle. Every card gets this treatment — nothing skips.

| Stage | What happens inside a single card | How long | Who drives |
|---|---|---|---|
| **0. Intake** | Re-read the card. Answer Q-W##-*. Accept defaults or override. Write tighter scope to the card. | 15 min | you + Claude |
| **1. Research** | Just-in-time — only if this card needs evidence not already in `research/`. Usually skipped because the system research covers most cards. | 0–30 min | Claude |
| **2. Design** | Write the schema, the interface, the test list. For UI: a wireframe sketch. For code: the signatures of new files. | 30 min – 2 hr | you + Claude |
| **3. Implement** | Claude writes code, you review. Small PRs (≤300 LOC). No commits without passing CI. | hours to days | Claude (code) + you (review) |
| **4. Test** | Playwright (W04 onwards). Manual smoke before W04 lands. Real path, not CLI mocks. | ~20% of implement time | Claude runs, you validate |
| **5. Deploy + soak** | Merge to main. Feature flag on (if risky). Soak 1–7 days depending on risk. Watch for bug reports. Flip flag off, archive old code. | 1–7 days wall-clock | you |

## Per-card deliverables

Every card ends with these artifacts:

| Artifact | Where |
|---|---|
| Code PR(s) | GitHub |
| Playwright tests | `tests/workflows/` |
| Updated `WORKFLOW_STATE.md` | alongside the card |
| Updated `SYSTEM_STATE.md` recent-changes | `_system/SYSTEM_STATE.md` |
| Lessons learned (if any) | `_system/lessons.md` (created on first lesson) |
| Archived old code (if replacing) | `archive/<card-slug>` branch |

## 5-week calendar

Assumes you work on this as primary focus. Pad ±1 week for real life.

| Week | Stage | Cards in flight | Merge gate target |
|---|---|---|---|
| **Week 1** | S1 FOUNDATION | W01 · W02 · W06 · W11 · W12 · W14 · **W18** (docs audit) | G1: baseline ∧ audit_done ∧ purged ∧ sweeps_done ∧ auth_audited ∧ docs_audited |
| **Week 2** | S2 SEATBELT+MAP | W04 · W03 · W05 · W15.01 · W17 · W19 · **W21** (cache fix) | G2: seatbelt ∧ wf_map ∧ drift_on ∧ components_chosen ∧ context_refreshed ∧ cache_fixed |
| **Week 3** | S3 DESIGN | W07 · W08 · W15.02–03 — 🛑 HITL gate: accept X1..X12 before starting | G3: prims ∧ tokens |
| **Week 4** | S4 MIGRATION begins | W13 · W09.01..03 · W15.04+ · W16 MFA | partial G4 |
| **Week 5** | S4 finishes + S5 | W09.04..N · W15 finish · W10 skills · **W20** (cron watchdog) | G4 + G5 → terminal |

**5 tracks running in parallel**:

| Track | Cards | Purpose |
|---|---|---|
| CODE | W01 · W02 · W04 · W07 · W13 · W09 · W10 · W21 | Structure refactor + cache correctness |
| SECURITY | W14 → W15.## → W16 | RLS + MFA |
| VISIBILITY | W11 (from Day 2) | Live status page |
| QUALITY | W18 → W19 → W20 | Docs clean → MWP context → cron watchdog |
| DESIGN | W17 → W07/W08 | Component library → primitives + tokens |

If W09 has more modules than 5 weeks allows, Week 5 becomes "W09 continues" and S5 slips to Week 6. **W01–W08 + W17–W19 in 5 weeks is the hard target**; W09 + W15 + W20 tail can stretch.

## Weekly rhythm (makes the plan a habit, not a prayer)

| When | What |
|---|---|
| **Monday 9am** | Review `SYSTEM_STATE.md`. Pick this week's 2–4 active cards. Update statuses to 🟡. |
| **Mid-week** | Drive each active card through its 0→5 stages. Mark blockers in `SYSTEM_STATE.md`. |
| **Friday 5pm** | Merge-gate review. Did we hit this week's target merge gate? If no, move remaining cards to next week, update the DAG if a sequence turned out non-parallel. Append week summary to `SYSTEM_STATE.md` recent changes. |

## How Claude helps per stage

| Stage | Claude's role |
|---|---|
| 0. Intake | Re-read card aloud with you. Flag contradictions with other cards. Propose default answers to Q-W##-*. |
| 1. Research | Run targeted Agent scans if needed (e.g. "find every caller of `useProjectDetail`"). |
| 2. Design | Propose schema, write type signatures, sketch tests first. Ask for your approval before Stage 3. |
| 3. Implement | Write code in small PRs. Run `/simplify` and `/code-hygiene` skills on the diff. Never commit without your look. |
| 4. Test | Run Playwright, paste failures inline, fix until green. Never "looks fine to me" without a run log. |
| 5. Deploy | Open the PR with a TEST PLAN checklist. You merge. I watch for CI red, flag on bug reports. |

## Risk register (top 5)

| # | Risk | Mitigation |
|---|---|---|
| 1 | Supabase branching fix fails (X4) — can't safely test | W01 has fallback: live-DB + weekly pg_dump snapshot. No refactor merges without a rollback path. |
| 2 | Playwright seatbelt (W04) takes longer than 1 week | W12 compliance sweeps + W06 purge don't need seatbelt — they're mechanical. Keep them moving while W04 settles. |
| 3 | You hit a production fire during refactor week | Cards pause cleanly — each PR is small and independently revertable. Firefight, then resume. |
| 4 | Scope creep — "while we're in there, let's also…" | Research flagged this as #1 post-mortem killer. Hard rule: new work goes to a new W## card, not into the current one. |
| 5 | Drift detector misses new features shipped to main | W05 runs on every PR + weekly digest. If it misses, log as correction, tighten the check. |

## Definition of done for the whole system

- All 5 merge gates (G1..G5) satisfied
- All 13 W## cards at 🟢 PRODUCTION
- `src/features/` houses every module; `src/pages/` is only route shells
- 0 Supabase query violations, 0 hardcoded role checks, 0 raw `date-fns` imports in feature code
- `/refactor-status` page green (all lights)
- `/create-module` skill exists and has scaffolded ≥1 real module end-to-end
- Design tokens + Geist fonts + Motion primitives live across every feature
- Tag `post-refactor-baseline` on `main`

## Related

- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) — vision, DAG, backlog, X-decisions
- [SYSTEM_STATE.md](SYSTEM_STATE.md) — today's status
- [RAW_REQUIREMENTS.md](RAW_REQUIREMENTS.md) — your words
- [workflows/](workflows/) — 13 W## cards
- [research/REPO_AUDIT.md](research/REPO_AUDIT.md) + [research/REFACTOR_BEST_PRACTICES.md](research/REFACTOR_BEST_PRACTICES.md) — evidence base
