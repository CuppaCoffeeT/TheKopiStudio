# Tokens — Full Reference

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Spec: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md)

**Runtime source of truth**: [src/index.css](../../../src/index.css) — one `@theme` block plus one `:root` block. [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) is a TS mirror that holds only `var(--…)` strings, never literal values, so repointing a colour stays a one-file change. **Always consume the CSS var in components — never copy a hex out of a doc table.**

**Two frozen facts.** (1) The LOCKED_PICKS v1–v4 var **names** are frozen — primitives consume them, so a rename is a sweep. Several read as misnomers today: `--brand-red` holds the brand *brown*, `--font-pixel` holds a *serif*, `--delta-negative-*` is terracotta. (2) The app is **light-pinned**: `:root` is the only colour block, there is no `.dark`, and every `dark:` utility is inert dead code. See [DARK_MODE.md](./DARK_MODE.md).

## Token groups → TS export → consumer

| Group | TS export | Primary consumer |
|---|---|---|
| Card | `cardTokens` | `shell/Card` |
| DataTable | `dataTableTokens` | `ui/DataTable` · `ui/DataRow` |
| KpiTile | `kpiTileTokens` | `dashboard/KpiTile` · `KpiDeltaBadge` · `NumberTicker` |
| Drawer | `drawerTokens` | `overlays/Drawer` (vaul) |
| Stepper | `stepperTokens` | `form/Stepper` |
| Timeline | `timelineTokens` | `detail/Timeline` |
| Chart | `chartTokens` | `charts/*` |
| CTA | `ctaTokens` | `Button variant="primary" / "destructive"` |
| Glass | `glassTokens` | translucent surfaces + the flat page backdrop |
| Mobile | `mobileTokens` | `ui/MobileListCard` · `shell/FloatingCTA` |
| Motion | `motionTokens` | all animated primitives |

## shadcn HSL base (`:root`)

| Token | HSL | Hex | Reads via |
|---|---|---|---|
| `--background` | `37 46% 89%` | `#F0E6D6` page cream | `bg-background`, `--page-bg` |
| `--foreground` | `27 23% 18%` | `#3A2E24` ink | `text-foreground` |
| `--card` | `40 55% 96%` | `#FAF6EE` card cream | `bg-card`, `--surface` |
| `--popover` | `0 0% 100%` | `#FFFFFF` raised | `bg-popover` — modals, menus, inputs |
| `--primary` / `--accent` / `--ring` | `31 32% 41%` | `#8B6A47` brown | CTA fill, focus ring |
| `--primary-foreground` | `40 55% 96%` | `#FAF6EE` | Label on brown (4.58:1) |
| `--secondary` / `--muted` | `38 40% 92%` | `#F3EDE3` tint | Hover, secondary surface |
| `--muted-foreground` | `28 16% 42%` | `#7D6B5B` | Labels, meta — **card surfaces only** |
| `--destructive` | `16 64% 41%` | `#AB4925` AA-safe terracotta | Destructive CTA (cream label 5.25:1) |
| `--border` / `--input` | `29 25% 80%` | `#D9CCC0` hairline | `border-border` |
| `--radius` | — | `0.75rem` (12px) | Cards, panels |

### Sidebar

`--sidebar-background` `40 55% 96%` (card cream — the rail is the **lighter** surface, never a dark rail) · `--sidebar-foreground` ink · `--sidebar-primary` brown (active marker) · `--sidebar-accent` `#F3EDE3` (hover / current fill) · `--sidebar-border` `#D9CCC0` · `--sidebar-ring` brown.

## AA text variants (mandatory under 18px)

| Token | Hex | Replaces |
|---|---|---|
| `--brown-text` | `#806241` | raw `#8B6A47` |
| `--sage-text` | `#526F56` | raw `#5A7A5E` |
| `--negative-text` | `#AB4925` | raw `#D97551` |
| `--brown-text-on-wash` | `#6D5233` | `--brown-text` when the ground is a brown wash |
| `--negative-text-on-tint` | `#8F3D1F` | `--negative-text` when the ground is the error tint `#FAE0D6` |

Measured ratios + the page-ground trap: [COLORS.md](./COLORS.md).

## Brand fills + derived neutrals

| Token | Value | Role |
|---|---|---|
| `--brand-brown` | `#8B6A47` | Index numerals, viz anchor, non-CTA brown fills |
| `--brand-sage` | `#5A7A5E` | Positive fills, dots, accent lines |
| `--brand-terracotta` | `#D97551` | Negative fills + dots — never small text |
| `--tint-hover` | `#F3EDE3` | Nav hover, secondary-button hover, row active |
| `--tint-pressed` | `#EBE2D4` | Nav `:active`, secondary-button `:active` |
| `--border-hover` | `#C0A68C` | Hover border on interactive cards + buttons |
| `--hairline-frame` | `#C9B9A5` | Outer frame + dashed loading placeholder |

## v1 — Card · DataTable · KpiTile

| Token | Value |
|---|---|
| `--card-radius` · `--kpi-radius` | `0.75rem` (12px) |
| `--card-border` | `#D9CCC0` |
| `--card-shadow-rest` | **`none`** — 2a cards rest flat; the lift is the cream-on-page colour step |
| `--card-shadow-hover` | `0 2px 8px rgb(58 46 36 / 0.1)` — warm ink, not neutral black |
| `--card-padding` | `1.25rem` |
| `--row-hover-bg` / `--row-hover` | `rgb(139 106 71 / 0.06)` — translucent so it reads on **both** page and card |
| `--row-selected` | `rgb(139 106 71 / 0.12)` |
| `--row-enter-duration` | `180ms` |
| `--sort-icon-opacity-rest` | `0.4` |
| `--delta-positive-bg` / `-fg` | sage @ 10% / `#526F56` — 4.60 on card |
| `--delta-negative-bg` / `-fg` | terracotta @ 12% / `#AB4925` — 4.68 on card |
| `--ticker-spring-stiffness` / `-damping` | `100` / `60` |

A solid `#FAF6EE` row hover would be invisible on the card; that is why the wash is translucent.

## v2 — Drawer · Stepper · Timeline · Charts

| Token | Value |
|---|---|
| `--drawer-radius` | `1rem` |
| `--drawer-handle-w` / `-h` | `40px` / `6px` |
| `--drawer-overlay` | `rgb(58 46 36 / 0.4)` — warm ink scrim over cream |
| `--handle-pulse-duration` | `1.6s` |
| `--chip-size` / `-compact` | `28px` / `24px` |
| `--chip-active` / `--chip-done` | `#8B6A47` brown / `#5A7A5E` sage |
| `--chip-spring-stiffness` / `-damping` | `320` / `24` |
| `--timeline-rail-color` | `#D9CCC0` |
| `--timeline-beam` | `linear-gradient(to bottom, #8B6A47, transparent)` |
| `--timeline-dot-size` / `--timeline-step-gap` | `28px` / `20px` |
| `--chart-ramp-1..4` | `#8B6A47` · `#A58868` · `#C0A68C` · `#DCCBB6` |
| `--chart-pipeline` / `--chart-accepted` | ramp 1 / ramp 2 |
| `--chart-grid-dasharray` | `2 4` |
| `--chart-anim-duration` / `-stagger` | `800ms` / `200ms` |
| `--disc-d` / `-i` / `-s` / `-c` | `#C0392B` · `#D4680A` · `#1A7A40` · `#1A5F8A` |

`--disc-*` is **domain data**, the one sanctioned categorical set — see [COLORS.md](./COLORS.md).

## v3 — cross-cutting patterns

| Token | Value |
|---|---|
| `--cta-primary-bg` / `-hover` / `-active` | `#8B6A47` / `#7D5F3D` / `#6D5233` |
| `--cta-primary-fg` | `#FAF6EE` |
| `--cta-destructive-bg` / `-hover` | `#AB4925` / `#8F3D1F` |
| `--brand-red` | `#806241` — **legacy NAME, AA-safe brown value** (links, badges, glyphs) |
| `--accent-red-soft-bg` / `-fg` | brown @ 10% / `#806241` |
| `--accent-red-soft-fg-strong` | `#6D5233` — same chip on a translucent panel (5.76 there; `-fg` is only 4.47) |
| `--surface-translucent-bg` / `--glass-bg` | `rgb(250 246 238 / 0.85)` cream glass |
| `--surface-translucent-blur` | `8px` |
| `--surface-translucent-border` | `rgb(217 204 192 / 0.7)` |
| `--page-bg` | `#F0E6D6` — flat warm cream canvas |
| `--page-gradient-light` / `-dark` | `#F0E6D6` — same-value back-compat aliases; **neither implies a gradient nor a theme branch** |
| `--mobile-page-padding` | `12px` |
| `--row-card-gap` / `--row-card-border` | `6px` / `#D9CCC0` |

## v4 — List/table archetype semantics

| Token | Value | Role |
|---|---|---|
| `--surface` | `#FAF6EE` | Card body (== `--card`) |
| `--surface-subtle` | `#F3EDE3` | Filter bar, pagination, tooltip tint |
| `--border-soft` | `#D9CCC0` | Structure hairline |
| `--border-faint` | `#E0D3C3` | Table row dividers |
| `--fg` / `--fg-dim` / `--fg-muted` | `#3A2E24` / `#5D4F3F` / `#7D6B5B` | Ink ladder |
| `--red-soft` | `#FAE0D6` | Error pill / badge bg |
| `--skeleton` / `--skeleton-hi` | `#E0D3C3` / `#F3EDE3` | Shimmer |
| `--card-shadow` | **`none`** | Cards are flat in 2a |
| `--floating-shadow` | `0 2px 8px rgb(58 46 36 / 0.1), 0 8px 24px rgb(58 46 36 / 0.08)` | Only genuinely floating surfaces |

### Status palette

`--status-<tone>-bg` / `-fg` / `-border` / `-dot` across six tones (draft · sent · accepted · rejected · expired · revised), consumed by `StatusBadge`. Plus `--status-revised-fg-on-page` `#6D5233` for surfaces painting the page ground. All pairs are tuned on **card** cream — values + ratios in [COLORS.md](./COLORS.md).

## Motion + focus

| Token | Value |
|---|---|
| `--motion-duration-instant` | `80ms` |
| `--motion-duration-quick` | `180ms` |
| `--motion-duration-smooth` | `400ms` |
| `--motion-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--shadow-focus` | `0 0 0 3px rgb(139 106 71 / 0.12)` — brown @ 12% (the comp's alpha, not the brand card's `.10`) |

`motionTokens` also exports the numeric `durationInstantMs` / `durationQuickMs` / `durationSmoothMs` (80 / 180 / 400) for JS animation configs.

## Fonts (`@theme`)

| Var | Family |
|---|---|
| `--font-sans` · `--font-subheader` | IBM Plex Sans → system-ui → -apple-system → Segoe UI → Helvetica → Arial |
| `--font-pixel` · `--font-pixel-display` · `--font-prose` | Instrument Serif → Georgia → Times New Roman |
| `--font-mono` | ui-monospace → SFMono-Regular → Menlo |

Names frozen (~130 src files); the "pixel" names now simply mean "the serif". Never set them under 18px — [TYPOGRAPHY.md](./TYPOGRAPHY.md).

## Historical — navy/gold era (locked 2026-07-14, retired 2026-07-25)

<details>
<summary>Which name held which value in the always-dark era. Names current, values dead.</summary>

| Token | Navy/gold value |
|---|---|
| `--card-radius` · `--kpi-radius` | `1rem` |
| `--card-border` | navy hairline `hsl(210 25% 24% / 0.8)` |
| `--card-shadow-rest` / `-hover` | `0 1px 2px rgb(0 0 0 / 0.25)` / `0 4px 16px rgb(0 0 0 / 0.35)` |
| `--row-hover-bg` | lighter navy `hsl(209 32% 18% / 0.6)` |
| `--delta-positive-bg` / `-fg` | green @ 15% / `#4ADE80` |
| `--delta-negative-bg` / `-fg` | DISC-D red @ 15% / `#E8836F` |
| `--drawer-overlay` | `rgb(0 0 0 / 0.6)` |
| `--chip-active` / `--chip-done` | `#C9A84C` gold / `#4ADE80` |
| `--timeline-rail-color` / `--timeline-beam` | `hsl(210 25% 24%)` / gold → transparent |
| `--chart-pipeline` / `--chart-accepted` | `#C9A84C` / `#4ADE80` |
| `--cta-primary-bg` / `-hover` / `-fg` | `#C9A84C` / `#D9BC6A` / `#1A1200` |
| `--cta-destructive-bg` | `#C0392B` |
| `--brand-red` | `#C9A84C` — legacy NAME, gold value |
| `--accent-red-soft-bg` / `-fg` | gold @ 12% / gold |
| `--surface-translucent-bg` / `--glass-bg` | navy `rgb(13 27 42 / 0.72)` |
| `--page-bg` · `--page-gradient-light` / `-dark` | `#0D1B2A` — flat, always dark |
| `--row-card-border` | navy hairline `hsl(210 25% 24%)` |
| `--surface` / `--surface-subtle` | `#12202F` / `#182638` |
| `--border-soft` / `--border-faint` | `hsl(210 25% 24%)` / `hsl(210 25% 20%)` |
| `--fg` / `--fg-dim` / `--fg-muted` | `#F0EAD6` / `#D6CCB4` / `#8A8070` |
| `--row-hover` / `--row-selected` | cream @ 4% / gold @ 10% |
| `--red-soft` | DISC-D red @ 18% |
| `--skeleton` / `--skeleton-hi` | `#182638` / `#21324A` |
| `--card-shadow` / `--floating-shadow` | deep black layered shadows |
| `--shadow-focus` | `0 0 0 3px rgb(201 168 76 / 0.35)` gold @ 35% |
| `--ring` (shadcn) | gold `43 55% 55%` |

Motion tokens (80 / 180 / 400ms + both easing curves) are unchanged across all three eras.

</details>

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — value authority
- [COLORS.md](./COLORS.md) — measured ratios + AA rules · [TYPOGRAPHY.md](./TYPOGRAPHY.md) · [SPACING_MOTION.md](./SPACING_MOTION.md)
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — enforcement + anti-patterns
- [src/index.css](../../../src/index.css) — canonical runtime block
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror (`var(--…)` refs only)
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — why the names are frozen (values superseded)
