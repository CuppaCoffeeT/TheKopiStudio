# Design System — The Kopi Studio (Router)

**Created**: 2026-04-22 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The single entry point for every design decision in the app. This file **routes**; detail lives in sub-guides so this page stays scannable.

The system is **The Kopi Studio, direction 2a "Kopi House"** — a light-pinned warm-cream brand locked 2026-07-25. Quiet broadsheet: cream canvas, ink-brown text, Instrument Serif headings over IBM Plex Sans body, brown as punctuation, hairlines doing the layout work. It supersedes the Editorial navy/gold always-dark direction (2026-07-14) and the AppBase zinc/Geist lock (2026-04-19) before it. **There is no navy, no gold, and no dark mode.**

## 🧭 Sub-guides

| Topic | Where | When to read |
|---|---|---|
| **Philosophy** + 11 reuse principles | [design-system/PHILOSOPHY.md](./design-system/PHILOSOPHY.md) | Before building anything new |
| **Colors** — palette, measured contrast, the AA rules | [design-system/COLORS.md](./design-system/COLORS.md) | Any colour decision |
| **Typography** — Instrument Serif · IBM Plex Sans · the 18px floor | [design-system/TYPOGRAPHY.md](./design-system/TYPOGRAPHY.md) | Any heading, label or numeral |
| **Tokens** — every `@theme` / `:root` value | [design-system/TOKENS.md](./design-system/TOKENS.md) | Authoring a primitive |
| **Spacing / radius / shadow / motion** | [design-system/SPACING_MOTION.md](./design-system/SPACING_MOTION.md) | Any layout or animation |
| **Theming** — the light-pinning contract | [design-system/DARK_MODE.md](./design-system/DARK_MODE.md) | Any surface question (legacy filename — the app is light) |
| **Primitives** — inventory + what was deleted | [design-system/PRIMITIVES.md](./design-system/PRIMITIVES.md) | Before building a component |
| **Archetypes** — 6 page shapes + the sidebar shell | [design-system/ARCHETYPES.md](./design-system/ARCHETYPES.md) | Starting a new page |
| ⛔ **Design-lab handoff catalog** | [design-system/DESIGN_LAB_CATALOG.md](./design-system/DESIGN_LAB_CATALOG.md) | Archival only — the AppBase-era bundles it indexes are no longer in the repo |

## 🧱 Authoritative sources (do not duplicate — read directly)

| What | Where |
|---|---|
| **Brand + layout spec** | [KOPI_2A_SPEC.md](../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) |
| Why each override exists | [handoff decisions.md](../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md) · [lessons.md](../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/lessons.md) |
| Runtime tokens | [src/index.css](../../src/index.css) — one `@theme` + one `:root` · [src/lib/design/tokens.ts](../../src/lib/design/tokens.ts) TS mirror |
| Light pinning | [src/lib/design/ThemeProvider.tsx](../../src/lib/design/ThemeProvider.tsx) |
| Enforcement rule (auto-loaded) | [.claude/rules/light-theme.md](../../.claude/rules/light-theme.md) · [.claude/rules/ui-components.md](../../.claude/rules/ui-components.md) |
| Primitive inventory | [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) (⚠️ last regenerated 2026-05-30, pre-Kopi) |
| What was deleted, and when | [DEPRECATIONS.md](../99-refactor/_system/DEPRECATIONS.md) |
| Use · edit · create rulebook | [UNIVERSAL_COMPONENTS.md](../99-refactor/_system/UNIVERSAL_COMPONENTS.md) |
| Design · Impl · Adopted matrix | [DESIGN_CATALOG.md](../99-refactor/_system/DESIGN_CATALOG.md) |
| 11 reuse principles | [DESIGN_REUSE_PRINCIPLES.md](../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) |
| Component locks (names frozen) | [LOCKED_PICKS.md](../99-refactor/_system/LOCKED_PICKS.md) — values superseded twice |

## 🔐 Hard rules

1. **New code imports from `@/components/primitives/**`** — never `@/components/ui/**`. Rulebook: [UNIVERSAL_COMPONENTS.md](../99-refactor/_system/UNIVERSAL_COMPONENTS.md).
2. **Tokens, not hex.** Consume the CSS var or the token utility; never copy a hex out of a doc.
3. **The app is light-pinned.** No `.dark` block, no `prefers-color-scheme`, no theme toggle. Surviving `dark:` variants are dead code — delete them, don't repaint them.
4. **Cards are RAISED** — page cream `#F0E6D6` → card cream `#FAF6EE` → raised white `#FFFFFF`. Page bg == card bg makes every card vanish.
5. **Fonts by role.** Instrument Serif (`--font-pixel`) = headings, KPI/table numerals, empty-state + loading lines, wordmark — **never below 18px**. IBM Plex Sans (`--font-sans`) = everything else.
6. **AA text variants are mandatory under 18px** — `--brown-text` · `--sage-text` · `--negative-text`. On the **page** ground, muted-role text takes `--fg-dim`, not `--fg-muted`.
7. **Brown is punctuation** — CTA fill, focus ring, active-nav marker, index numerals, viz ramp anchor. Never a heading, a header band, a filled nav pill or a decorative fill.
8. **5 states always** — default · hover · active · focus-visible · disabled. Focus is a brown ring; hover must visibly differ from the resting cream.
9. **Errors are row-level**, never card-flooding.

## 📚 Related

- [APPLICATION_ARCHITECTURE.md](./APPLICATION_ARCHITECTURE.md) — where the design system sits in the stack
- [MOBILE_WEB_STANDARDS.md](./MOBILE_WEB_STANDARDS.md) — touch rules (`dvh`, 44px targets, fullscreen-modal-not-drawer)
- [URL_STANDARDS.md](./URL_STANDARDS.md) — routing conventions
- [MODULE_SYSTEM.md](./MODULE_SYSTEM.md) — RBAC patterns behind the sidebar's nav list
- [SEARCHABLE_SELECT_COMPONENT.md](./SEARCHABLE_SELECT_COMPONENT.md) — dropdown pattern
- [SUPABASE_QUERY_STANDARDS.md](./SUPABASE_QUERY_STANDARDS.md) — server-side pagination
- [canonical-page-patterns/](./canonical-page-patterns/) — per-archetype rules (⚠️ mostly pre-Kopi; `KOPI_2A_SPEC.md` wins on conflict)
