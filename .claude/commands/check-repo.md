/check-repo — Audit the codebase against the 2026-05-31 refactor standard

# Check Repo

Runs the executable post-refactor drift checker and reports any deviation from the **2026-05-31 AppBase refactor target state**. Read-only — fixes nothing; it highlights what drifted so you can plan a fix pass.

## Run it

```bash
npm run check:repo            # fast checks (~30s + tsc)
npm run check:repo -- --full  # also runs the production build (slow)
```

(Wraps `scripts/check-repo.sh`. Exit code = number of BLOCKER deviations; 0 = clean.)

## What it checks (12 sections)

| # | Check | Standard |
|---|---|---|
| 1 | `src/components/` structure | ONLY `primitives/` · `ui/` · `shared/` — no domain folders, no loose root files (enforced by dep-cruiser `no-stray-domain-components`) |
| 2 | Drained residue folders | `src/{types,constants,styles,config}` removed |
| 3 | `src/pages/` | thin route shells only (`NotFound`, `RouteError`) |
| 4 | `src/hooks/` de-cycle invariant | **BLOCKER** if any root hook imports `@/features/*` (must move into the feature) |
| 5 | Architecture drift | `drift:check` 0 violations (cross-feature / circular / pages→features / stray-domain) |
| 6 | LOC ratchet | `loc:check` green + no >1000-LOC god-file (generated supabase types excluded) |
| 7 | Component import hygiene | shared UI imported only from `primitives/` · `ui/` · `shared/` — no cross-feature or stray-domain `@/components/*` imports. (The former 6a–6e primitive-coverage greps were retired 2026-07-21; a new Claude Design system replaces the primitive mandates.) |
| 8 | Feature CONTEXT.md | every `src/features/<x>/` has a `CONTEXT.md` |
| 9 | Token budget | `CLAUDE.md` ≤3200c + workspace/category routers ≤2400c (per-feature inventory CONTEXTs → `/context-check`) |
| 10 | Dead code | `knip` unused-files near the 2026-05-31 baseline of 2 |
| 11 | TypeScript | `tsc --noEmit` 0 errors |
| 12 | Build (`--full`) | `npm run build` passes |

## How to read the output

- **✅** = at standard. **⚠️** = non-blocking drift to tidy. **❌** = blocker — schedule a fix pass.
- For per-module depth (RLS, import hygiene, queryKeys, etc.) run **`/check-module <feature>`** — this command is the repo-wide structural sweep, not the per-module DoD.

## When to run

- Before a release or after a batch of feature work (drift creeps back).
- As the completion gate for any "bring it back to standard" refactor pass.
- Pairs with `/health-check` (broader) and `/check-module` (per-module depth).

## 📚 Related

- `docs/ONBOARDING.md` — the standard this checks, explained for humans + AI.
- `docs/99-refactor/_system/ARCHITECTURE_BLUEPRINT.md` — the target `src/` shape (single source of truth).
- `.dependency-cruiser.cjs` — the `no-stray-domain-components` + cross-feature rules.
- `.claude/commands/check-module.md` — per-module 9-gate audit.
