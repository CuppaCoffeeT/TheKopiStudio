# W09 — Per-module migration (umbrella)

**Goal**: Migrate every module to `src/features/<name>/` using W07 shared primitives and W08 design tokens, one PR per module, all seat-belted by W04 tests.
**Tier**: Later · **Status**: 🟡 IN PROGRESS (pilot: /serviceslist) · **Automation**: hybrid
**Blocked by**: W02, W04, W07, W08 · **Blocks**: W11

> **Decision 2026-04-18**: Bulletproof React folder pattern confirmed. `src/features/<name>/` not `src/modules/`. Pilot is /serviceslist — recipe captured in [research/W09_RECIPE.md](../research/W09_RECIPE.md).

## Why this exists

The actual refactor. Everything before this is setup. Done right: one module at a time, tests green, feature-flag where risk is high, soak for a week, then archive the old shape.

## Scope

**In (umbrella — spawns child cards after W02 lands):**
- One child card per module: `W09.01_<MODULE>.md`, `W09.02_...`
- Per module per PR:
  1. Move to `src/features/<name>/`
  2. Rewire imports to `@/shared/*`
  3. Apply W08 tokens (no raw hex, no raw pixel)
  4. Update routes + lazy-load
  5. Run W04 tests — must stay green
  6. Feature-flag behind `VITE_FF_<MODULE>_V2` if risk is high
  7. Merge → soak 7 days → remove flag → archive old folder
- Order (per Q-W09-a default): 2 low-traffic modules first to validate shape, then high-duplication modules

**Out:**
- Net-new features — those go to their own cards outside this system

## Dependencies on other cards

- W02 feeds the module list
- W04 gates every merge
- W07 / W08 provide the shape + tokens
- W11 renders progress

## Open workflow questions

- **Q-W09-a** 🟡 **DEFERRED until S3 design stage complete (2026-04-19)**. Pilot (/serviceslist) done as shape validation. Next W09.NN modules wait until W07 primitives + W08 tokens land — then mass migration uses real primitives instead of moving code that gets rewritten anyway. Re-open this Q at S3 entry.
- **Q-W09-b** ✅ **one PR per module** (default accepted). Cleanest revert surface.
- **Q-W09-c** ✅ **risky-only flagging (2026-04-19)**. `VITE_FF_<MODULE>_V2` only for quotation, invoicing, work entries. Small modules merge direct.

## Done-when

- Every module lives under `src/features/<name>/`
- `src/pages/` reduced to thin route wrappers
- All W04 P0 tests green on `main`
- Pre-refactor folders archived + deleted
- No raw hex / pixel / `date-fns` imports remain outside `src/shared/`
