# W10 — Scaffolding skills

**Goal**: Ship `.claude/commands/create-module.md`, `create-workflow-test.md`, `create-appbase-system.md` so the new shape is the path of least resistance.
**Tier**: Later · **Status**: 🔴 PLANNED · **Automation**: 🤖 auto
**Blocked by**: W07, W08 (need the final shape) · **Blocks**: nothing

## Why this exists

Without skills, the shared-primitives pattern rots within 2 months — next-feature-pressure drives people back to "just copy the last module". Skills make the new shape the default. Mirror of JLCode `/create-system`, `/create-workflow`, `/create-guide` triad, scoped to this repo.

## Scope

**In:**
- `/create-module` — scaffolds `src/modules/<name>/` with folders, barrel `index.ts`, route entry, test stub, README
- `/create-workflow-test` — scaffolds a Playwright spec with page-object boilerplate, auth setup
- `/create-appbase-system` — this-repo analog of JLCode `/create-system` (system-of-workflows pattern, scoped to AppBase)
- Each skill references `src/shared/README.md` + design tokens
- One real module scaffolded end-to-end as proof

**Out:**
- Porting all JLCode skills wholesale (only the 3 needed)

## Dependencies on other cards

- W07 defines the module shape the skill enforces
- W08 defines the tokens the skill references

## Open workflow questions

- **Q-W10-a** ✅ **CRUD first, multi-file MWP structure (2026-04-19)**. Accept default (CRUD first for 90% of cases; generic fallback later). **Override on shape**: per MWP token-budget discipline, the skill is split across multiple `.md` files with backlinks, NOT one monolith. Proposed layout: `.claude/commands/create-module.md` (router — short, within CONTEXT.md budget) → backlinks to `docs/06-operations/module-creation/*.md` sub-guides (schema · routes · component shell · testids · seatbelt). Same pattern as JLCode `ADD_JOB.md` multi-file skills.
- **Q-W10-b** ✅ **repo-scoped `.claude/commands/` (2026-04-19, default accepted)**. Versioned with the shape they enforce.

## Done-when

- 3 skills committed in `.claude/commands/`
- One real module scaffolded via `/create-module` end-to-end
- Docs updated (root CLAUDE.md routing table)
