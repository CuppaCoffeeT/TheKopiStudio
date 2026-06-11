# Design System — Workspace Router

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

Every design sub-guide for AppBase. Scoped routers — each file covers one slice. Read the parent router first for the topic matrix.

## Scope

**Belongs**: tokens, fonts, colors, spacing, motion, primitives inventory, archetype patterns, design-lab handoff catalog.
**Doesn't**: runtime implementation (`src/index.css`, `src/lib/design/tokens.ts`) · W-card refactor state (`docs/99-refactor/_system/`) · shadcn-adjacency rules (`.claude/rules/universal-components.md`). Router links to those; does not duplicate.

## Navigation

| File | Purpose |
|---|---|
| [PHILOSOPHY.md](./PHILOSOPHY.md) | Design intent, direction shift (Tadao-Ando → shadcnblocks-clean + Linear/Vercel premium), 11 reuse principles |
| [TYPOGRAPHY.md](./TYPOGRAPHY.md) | Font families, when to use each, h1-h6 scale, locks |
| [COLORS.md](./COLORS.md) | Brand red, zinc scale, semantic tokens, 6-status palette, dark-mode plan |
| [SPACING_MOTION.md](./SPACING_MOTION.md) | Spacing scale, radii, shadow variants, motion durations + easings |
| [TOKENS.md](./TOKENS.md) | All 11 `@theme` token groups with exact values + source line numbers |
| [PRIMITIVES.md](./PRIMITIVES.md) | 79-primitive inventory by group, import paths, adoption state |
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
