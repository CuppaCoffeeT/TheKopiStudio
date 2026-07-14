# Tokens — Full Reference

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-14 SGT
**Status**: 🟢 Production

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

**Runtime source of truth**: [src/index.css](../../../src/index.css) `:root` block + [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts). Table mirrors for reference; always consume CSS vars in components.

**2026-07-14**: LOCKED_PICKS v1–v4 var **names** are frozen (primitives consume them); **values** were retuned to the navy/gold system per the user-approved reversal ([LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md)). `.dark` carries no overrides — `:root` already holds the dark-tuned values (the app is always dark).

## Token groups

| Group | TS export | Primary consumer |
|---|---|---|
| Card | `cardTokens` | `Card` |
| DataTable | `dataTableTokens` | `DataTable` / `DataRow` |
| KpiTile | `kpiTileTokens` | `KpiTile` + `NumberTicker` |
| Drawer | `drawerTokens` | `DrawerRoot` (vaul) |
| Stepper | `stepperTokens` | `Stepper` |
| Timeline | `timelineTokens` | `Timeline` |
| Chart | `chartTokens` | chart primitives |
| CTA | `ctaTokens` | `Button variant="primary/destructive"` |
| Glass | `glassTokens` | `AppHeader` sticky |
| Mobile | `mobileTokens` | `MobileListCard` · `FloatingCTA` |
| Motion | `motionTokens` | all animated primitives |

## v1 — Card

| Token | Value |
|---|---|
| `--card-radius` | 1rem |
| `--card-border` | navy hairline `hsl(210 25% 24% / 0.8)` |
| `--card-shadow-rest` | `0 1px 2px rgb(0 0 0 / 0.25)` |
| `--card-shadow-hover` | `0 4px 16px rgb(0 0 0 / 0.35)` |
| `--card-padding` | 1.25rem |

## v1 — DataTable

| Token | Value |
|---|---|
| `--row-hover-bg` | lighter navy `hsl(209 32% 18% / 0.6)` |
| `--row-enter-duration` | 180ms |
| `--sort-icon-opacity-rest` | 0.4 |

## v1 — KpiTile

| Token | Value |
|---|---|
| `--kpi-radius` | 1rem |
| `--delta-positive-bg` / `-fg` | green @ 15% / `#4ADE80` |
| `--delta-negative-bg` / `-fg` | DISC-D red @ 15% / `#E8836F` |
| `--ticker-spring-stiffness` / `-damping` | 100 / 60 |

## v2 — Drawer

| Token | Value |
|---|---|
| `--drawer-radius` | 1rem (top corners) |
| `--drawer-handle-w` / `-h` | 40px / 6px |
| `--drawer-overlay` | `rgb(0 0 0 / 0.6)` — deeper scrim over navy |
| `--handle-pulse-duration` | 1.6s |

## v2 — Stepper

| Token | Value |
|---|---|
| `--chip-size` / `--chip-size-compact` | 28px / 24px |
| `--chip-active` | `#C9A84C` gold |
| `--chip-done` | `#4ADE80` green-400 |
| `--chip-spring-stiffness` / `-damping` | 320 / 24 |

## v2 — Timeline

| Token | Value |
|---|---|
| `--timeline-rail-color` | `hsl(210 25% 24%)` navy rail |
| `--timeline-beam` | gold → transparent gradient |
| `--timeline-dot-size` | 28px |
| `--timeline-step-gap` | 20px |

## v2 — Chart

| Token | Value |
|---|---|
| `--chart-pipeline` | `#C9A84C` gold |
| `--chart-accepted` | `#4ADE80` green-400 |
| `--chart-grid-dasharray` | `2 4` |
| `--chart-anim-duration` / `-stagger` | 800ms / 200ms |

## v3.1 — CTA

| Token | Value |
|---|---|
| `--cta-primary-bg` / `-hover` | `#C9A84C` gold / `#D9BC6A` lighter gold |
| `--cta-primary-fg` | `#1A1200` near-black brown |
| `--cta-destructive-bg` | `#C0392B` DISC-D red — only solid red allowed |
| `--brand-red` | `#C9A84C` — **legacy NAME, gold value** |
| `--accent-red-soft-bg` / `-fg` | gold @ 12% / gold — legacy names |
| `--ring` (shadcn) | gold `43 55% 55%` |

## v3.2 — Glass / page

| Token | Value |
|---|---|
| `--surface-translucent-bg` / `--glass-bg` | navy `rgb(13 27 42 / 0.72)` |
| `--surface-translucent-blur` | 8px |
| `--surface-translucent-border` | navy hairline @ 60% |
| `--page-bg` | `#0D1B2A` navy — flat, always dark |
| `--page-gradient-light` / `-dark` | `#0D1B2A` — back-compat aliases, both navy |

## v3.3 — Mobile

| Token | Value |
|---|---|
| `--mobile-page-padding` | 12px |
| `--row-card-gap` | 6px |
| `--row-card-border` | navy hairline `hsl(210 25% 24%)` |

## v4 — List/table archetype semantics

| Token | Value | Role |
|---|---|---|
| `--surface` | `#12202F` | Card / table bg (== `--card`) |
| `--surface-subtle` | `#182638` | Filter bar / pagination bg |
| `--border-soft` / `--border-faint` | `hsl(210 25% 24%)` / `hsl(210 25% 20%)` | Divider tiers |
| `--fg` / `--fg-dim` / `--fg-muted` | `#F0EAD6` / `#D6CCB4` / `#8A8070` | Text hierarchy |
| `--row-hover` | cream @ 4% | Row :hover |
| `--row-selected` | gold @ 10% | Row :selected |
| `--red-soft` | DISC-D red @ 18% | Error bg / badge bg |
| `--skeleton` / `--skeleton-hi` | `#182638` / `#21324A` | Shimmer |
| `--card-shadow` / `--floating-shadow` | deep black layered shadows | Card / floating elevation |

## v4 — Status palette

`--status-<tone>-bg/-fg/-border/-dot` × 6 tones — see [COLORS.md](./COLORS.md#status-palette-v4--translucent-tints-on-navy).

## Motion

| Token | Value |
|---|---|
| `--motion-duration-instant` | 80ms |
| `--motion-duration-quick` | 180ms |
| `--motion-duration-smooth` | 400ms |
| `--motion-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--shadow-focus` | `0 0 0 3px rgb(201 168 76 / 0.35)` — gold @ 35% |

## 📚 Related

- [src/index.css](../../../src/index.css) — canonical runtime block
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — lock rationale + 2026-07-14 reversal entry
- [COLORS.md](./COLORS.md) · [SPACING_MOTION.md](./SPACING_MOTION.md) · [TYPOGRAPHY.md](./TYPOGRAPHY.md)
