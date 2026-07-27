# Design System — Workspace Router

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

Every design sub-guide for the app — **The Kopi Studio, direction 2a "Kopi House": light-pinned warm cream/brown, locked 2026-07-25**. Scoped routers, one slice each. Read the parent router first for the topic matrix.

Live authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) · enforcement: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) · runtime: [src/index.css](../../../src/index.css).

⚠️ **There is no navy, no gold and no dark mode.** The 2026-07-14 Editorial navy/gold system and the AppBase zinc system before it are both retired. Their values survive only inside collapsed `Historical` sections at the bottom of individual files — never in the body of a guide.

## Scope

**Belongs**: tokens, fonts, colors, spacing, motion, the theming contract, primitives inventory, archetype patterns.
**Doesn't**: runtime implementation (`src/index.css`, `src/lib/design/tokens.ts`) · W-card refactor state (`docs/99-refactor/_system/`) · the deletion log (`DEPRECATIONS.md`) · shadcn-adjacency rules (`.claude/rules/ui-components.md`). Router links to those; does not duplicate.

## Navigation

| File | Purpose |
|---|---|
| [PHILOSOPHY.md](./PHILOSOPHY.md) | Quiet-broadsheet direction, what it supersedes, 11 reuse principles |
| [COLORS.md](./COLORS.md) | Palette with measured contrast, the **mandatory AA text variants** under 18px, the page-ground trap (`--fg-muted` is 4.72 on card / 4.12 on page), status · delta · viz · DISC colour |
| [TYPOGRAPHY.md](./TYPOGRAPHY.md) | Instrument Serif / IBM Plex Sans stacks, the **hard 18px serif floor**, the full 2a type scale, `--font-pixel` alias situation, h1–h6 |
| [TOKENS.md](./TOKENS.md) | Every `@theme` + `:root` token with its **current** value, grouped by consumer |
| [SPACING_MOTION.md](./SPACING_MOTION.md) | Spacing, 2a rhythm, radii **as shipped** (two documented deviations from the comp), shadow, motion, the hover rule |
| [DARK_MODE.md](./DARK_MODE.md) | Theming — the light-pinning contract. **Legacy filename**; the app has no dark mode. Preserves the surface-contrast known-failure history |
| [PRIMITIVES.md](./PRIMITIVES.md) | Verified 135-file inventory by group, import paths, the 2a shell diagram, adoption state, **and the deleted list** (`AppHeader` · `AppHeaderDesktopBar` · `ModuleCard` · `CategoryHeader` · `ModuleSearch`) |
| [ARCHETYPES.md](./ARCHETYPES.md) | 6 page archetypes (dashboard · list · detail · form · settings · tool) + the sidebar shell they sit in |
| [DESIGN_LAB_CATALOG.md](./DESIGN_LAB_CATALOG.md) | ⛔ Archival — indexes AppBase-era Claude Design handoff bundles that are **no longer in the repo**. A record of what was designed when, never a build list |

## Before working here

- **Verify before you write.** Every path, component and token name in these files was checked against the filesystem on 2026-07-25. Keep it that way — a doc pointing at a deleted file is the failure mode this set exists to prevent. Check [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) before naming a component.
- **Never duplicate runtime**: tokens in `src/index.css`, primitives in `src/components/primitives/`, shadcn-adjacency in `.claude/rules/ui-components.md`. Link, don't copy.
- **History is preserved, not deleted.** Retired eras live in collapsed `<details>` blocks headed `Historical — <era> (retired <date>)`. Never remove a "What NOT to try again" or known-failure section.
- **Bidirectional links**: every sub-guide has `👉 Parent:` at top + `## 📚 Related` at bottom.
- **Budget**: aim ≤4,000c of live body text per sub-guide; collapsed historical blocks sit outside that target ([TOKEN_BUDGET.md](../../99-meta/TOKEN_BUDGET.md)).

## 📚 Related

- [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — parent router
- [../CONTEXT.md](../CONTEXT.md) — category router (01-system-architecture)
- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) + [decisions.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md) — brand + rationale
- [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) — what was deleted and when
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — runtime inventory (⚠️ last regenerated 2026-05-30, pre-Kopi)
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — why the token names are frozen
