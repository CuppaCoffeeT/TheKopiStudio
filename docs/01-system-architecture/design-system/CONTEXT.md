# Design System — Workspace Router

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

Every design sub-guide for the app (**The Kopi Studio, direction 2a "Kopi House" — light-pinned cream/brown, locked 2026-07-25**). Scoped routers — each file covers one slice. Read the parent router first for the topic matrix.

⚠️ **Several files here are era-marked.** The 2026-07-14 Editorial navy/gold system and the AppBase zinc system before it are both retired — there is no navy and no gold in this brand. Live authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) · enforcement: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) · runtime: [src/index.css](../../../src/index.css). Files below marked ⛔ are kept for archaeology only.

## Scope

**Belongs**: tokens, fonts, colors, spacing, motion, primitives inventory, archetype patterns, design-lab handoff catalog.
**Doesn't**: runtime implementation (`src/index.css`, `src/lib/design/tokens.ts`) · W-card refactor state (`docs/99-refactor/_system/`) · shadcn-adjacency rules (`.claude/rules/universal-components.md`). Router links to those; does not duplicate.

## Navigation

| File | Purpose |
|---|---|
| [PHILOSOPHY.md](./PHILOSOPHY.md) | **Current** — quiet-broadsheet direction (2026-07-25 Kopi 2a), what it supersedes, 11 reuse principles |
| [TYPOGRAPHY.md](./TYPOGRAPHY.md) | **Current** — Instrument Serif / IBM Plex Sans stacks, the 18px serif floor, `--font-pixel` alias situation, h1-h6 scale |
| [COLORS.md](./COLORS.md) | ⛔ Superseded — navy/gold palette, kept for archaeology. Live palette: KOPI_2A_SPEC.md |
| [SPACING_MOTION.md](./SPACING_MOTION.md) | **Current** — spacing scale, radii, shadow variants, motion durations + easings (shadow + hover rule re-cut for cream) |
| [TOKENS.md](./TOKENS.md) | 🟡 Names current, **values superseded** — all `@theme` token groups. Read values from `src/index.css` |
| [PRIMITIVES.md](./PRIMITIVES.md) | 79-primitive inventory by group, import paths, adoption state |
| [DARK_MODE.md](./DARK_MODE.md) | ⛔ Superseded — the retired always-dark contract. The app is light-pinned; see `.claude/rules/light-theme.md` |
| [ARCHETYPES.md](./ARCHETYPES.md) | 6 page archetypes (list · detail · form · dashboard · settings · tool) with folder shape |
| [DESIGN_LAB_CATALOG.md](./DESIGN_LAB_CATALOG.md) | Handoff HTML preview catalog — how to open, what's inside each session |

## Before working here

- **Sub-guide budget**: aim ≤4,000c. Split proactively at 6,000c (per [TOKEN_BUDGET.md](../../99-meta/TOKEN_BUDGET.md)).
- **Never duplicate runtime**: tokens in `src/index.css`, primitives in `src/components/primitives/`, matrix in `.claude/rules/universal-components.md`. Link, don't copy.
- **Bidirectional links**: every sub-guide has `👉 Parent:` at top + `## Related` at bottom.

## 📚 Related

- [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — parent router
- [../CONTEXT.md](../CONTEXT.md) — category router (01-system-architecture)
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — runtime inventory
- [docs/99-refactor/_system/LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — component locks
