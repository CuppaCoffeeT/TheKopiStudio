# W05 — Drift detector

**Goal**: Detect new modules / components / hooks added to `src/` after the refactor starts so parallel-shipped features don't silently slip past the audit.
**Tier**: Next · **Status**: 🟡 IN PROGRESS (flips 🟢 after first Friday digest confirms baseline works) · **Automation**: 🤖 auto
**Blocked by**: W02 (needs baseline inventory) · **Blocks**: nothing

## Why this exists

User can't freeze features during the 5-week refactor. Without drift detection, new code silently bypasses shared primitives and the design system — undoing the work the moment it lands.

## Scope

**In (research-aligned — REFACTOR_BEST_PRACTICES §7):**
- Git tag `pre-refactor-baseline` on current `main`
- **dependency-cruiser** config enforcing feature-boundary rules (e.g. `src/features/<A>` can't import from `src/features/<B>`; only `src/components/`, `src/hooks/`, `src/lib/` allowed as cross-feature deps). Fails CI on violation.
- `git ls-tree` weekly diff vs baseline → list of new files + files modified outside their module
- PR bot comment: "New file(s) detected — confirm they use shared primitives (`src/components/`, `src/hooks/`, `src/lib/`) and don't cross feature boundaries"
- Weekly digest to you: what's been added, what re-introduced dead patterns

**Out:**
- Blocking PRs on drift (too noisy — comment only)
- Auto-fixing drift (manual review)

## Dependencies on other cards

- Reads baseline from W02 output
- Runs in parallel with all other cards once baseline exists

## Open workflow questions

- **Q-W05-a** ✅ **file-tree v1, AST later if needed (2026-04-19, default accepted)**.
- **Q-W05-b** ✅ **every push to main + weekly digest via GH Actions (2026-04-19)**. Adjusted from default (no PR workflow — user pushes direct to main). Cron digest weekly; push check on every commit.

## Done-when

- `pre-refactor-baseline` tag exists ✅ (2026-04-19, local at `9201024`; push blocked by pre-existing eslint plugin/eslint@9 mismatch — pre-push hook. Tag pushes on next successful `git push` from main.)
- CI job runs + comments on ≥1 real PR — deferred to W22 (per card guardrail "do NOT add to CI/Husky yet")
- First weekly digest generated ✅ (2026-04-19, zero drift at baseline: [research/W05_DRIFT_WEEKLY_2026-04-19.md](../research/W05_DRIFT_WEEKLY_2026-04-19.md))

## Implementation notes (2026-04-19)

**Files shipped:**
- [.dependency-cruiser.cjs](../../../../.dependency-cruiser.cjs) — 4 forbidden rules + 4 allowed lanes. Rule list concise by design.
- [scripts/drift_weekly_digest.sh](../../../../scripts/drift_weekly_digest.sh) — manual Friday run; writes `research/W05_DRIFT_WEEKLY_<YYYY-MM-DD>.md`.
- [research/W05_DRIFT_BASELINE.md](../research/W05_DRIFT_BASELINE.md) — frozen baseline snapshot.
- `package.json` scripts: `drift:check`, `drift:graph`.

**Baseline numbers** (992 modules, 5,394 edges):
- 5 total violations (5 errors, 0 warnings) — all `no-circular`. Well under the 500 guardrail.
- 0 cross-feature leaks (features/ only has 3 pilot workspaces).
- 0 page→feature imports; 0 out-of-pages imports from `src/pages/`.
- 16 non-`ui/` components with >3 dependents (advisory; feeds W07 prioritisation).

**Rule-set deviations from the card:**
- Rule (d) "warn on overshared components" lives in the weekly-digest script, not in dep-cruiser — dep-cruiser's schema rejects `numberOfDependentsMoreThan` under `forbidden.to` and rejects module-only rules inside `forbidden`. Detection logic is identical; output appears under "Oversharing watch" in every weekly digest.

**Deferred to W22 CI gates:**
- Pre-push / pre-commit enforcement of `drift:check`.
- GH Actions job to post PR comments.
- Advisory today; blocking after W22 wires it.

**Next user action:** run `bash scripts/drift_weekly_digest.sh` every Friday; feed oversharing list into W07 primitive prioritisation.
