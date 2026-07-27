# Design Philosophy — The Kopi Studio

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## North star

**Quiet broadsheet — a light, warm, printed-page aesthetic.** Warm cream canvas, ink-brown text, Instrument Serif headings over IBM Plex Sans body. Brown is *punctuation*, not authority-by-volume: it carries the CTA, the focus ring, the active-nav marker and index numerals, and nothing else. Hierarchy comes from serif/sans contrast, a three-step ink ladder and hairline rules — never from a coloured header band. The app reads like a well-set newspaper: calm, legible, unhurried.

## The direction shift (2026-07-25)

Supersedes the **Editorial navy/gold/serif** direction (locked 2026-07-14, itself superseding the AppBase slate/zinc/Geist lock of 2026-04-19 and 2025-Q4 Tadao-Ando minimalism). The Kopi Studio brand card, direction 2a "Kopi House", is now the system of record — spec: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md), enforcement: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md).

| Was (navy/gold, retired 2026-07-25) | Is (locked 2026-07-25) |
|---|---|
| **Always dark** — navy `#0D1B2A` canvas; `:root` == `.dark` | **Light-pinned** — cream `#F0E6D6` canvas; single `:root`, no `.dark` block, every `dark:` utility inert |
| Gold `#C9A84C` CTA + accent + focus ring | **Brown `#8B6A47`** CTA + focus ring + active-nav marker · terracotta `#D97551` destructive only |
| Georgia serif display · system-ui sans body | **Instrument Serif** headings (hard floor 18px) · **IBM Plex Sans** everything smaller |
| Card `#12202F` raised lighter than the navy page | Card `#FAF6EE` **still raised lighter** than the cream page — the cardinal rule survives the inversion |
| 6-tone status palette as translucent tints on navy | Status collapses to **three meanings** — sage positive, brown in-progress, terracotta error — plus muted neutrals for inert states |

**What survives every reversal**: the primitive library, the archetype system, the locked token NAMES (LOCKED_PICKS v1–v4 var names are frozen — only their values move), the reuse principles below, and the cardinal surface rule (page → card → raised, each step lighter).

**AA is a hard gate.** The raw brand hexes are tuned as fills and miss 4.5:1 as small type, so any text under 18px in a brand hue takes its darkened sibling: `--brown-text` `#806241` · `--sage-text` `#526F56` · `--negative-text` `#AB4925`.

## 11 reuse principles (hard rules)

Canonical source: [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md). Summarized:

1. **Reuse first** — grep `primitives/CONTEXT.md` + `DESIGN_CATALOG.md` before building
2. **Place in primitive folders** — `shell / overlays / dashboard / detail / form / ui / charts`
3. **Legacy stays put** — don't fork; wrap via slot pattern
4. **Slot pattern for legacy** — pass as `<prop>Slot`, not callback
5. **No forking** — copy = tech debt
6. **Check `DESIGN_CATALOG.md` first** — design ≠ impl ≠ adopted
7. **Font rule** — IBM Plex Sans for body/UI/prose · Instrument Serif for display headings only, never under 18px (see [TYPOGRAPHY.md](./TYPOGRAPHY.md))
8. **Page composition** — no page builds its own chrome. `AppSidebar` (mounted once by `DashboardLayout`) is the desktop chrome; pages wrap in `ListPageFrame` · `DetailPageFrame` · `AppHeaderShell`. The `AppHeader` masthead was deleted 2026-07-25
9. **Brand assets in `/public/images/`** — no inline SVG duplication
10. **No speculative machinery** — only build what's in the current design spec
11. **Feedback on every interactive** — 5 states (default · hover · active · focus-visible · disabled). Hover must visually differ from the cream page bg (brown wash @ 6% or the `#F3EDE3` tint). Focus-visible = brown ring, 2px at 2px offset. Disabled = 40% opacity. Loading states required.

## Why this design exists

The Kopi Studio is an advisor-facing tool — client profiling, portfolio review, follow-ups. The design must:

- **Feel trustworthy and editorial** — serif display type on a warm cream ground signals "printed broadsheet", not "admin panel"
- **Stay coherent everywhere** — one permanent light theme; no light/dark drift, no toggle-state bugs
- **Scale without per-page debate** — locked tokens + locked primitives inherited from AppBase
- **Signal status at a glance** — three status meanings (sage positive · brown in-progress · terracotta error) as tint fills with darkened same-hue text, never saturated fills
- **Pass AA without a second pass** — small text in a brand hue uses the AA-safe variant by default

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — palette, type scale, states, archetypes
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — enforcement + anti-patterns
- [TYPOGRAPHY.md](./TYPOGRAPHY.md) · [COLORS.md](./COLORS.md) · [TOKENS.md](./TOKENS.md) · [SPACING_MOTION.md](./SPACING_MOTION.md)
- [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — principles source-of-truth
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — component locks + aesthetic-reversal history
- [DARK_MODE.md](./DARK_MODE.md) — the light-pinning contract (legacy filename; **there is no dark mode**)
- [ARCHETYPES.md](./ARCHETYPES.md) · [PRIMITIVES.md](./PRIMITIVES.md) — the shapes and parts these principles govern
- [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md) — components removed in the migration
