# Tokens — Full Reference

> ⛔ **VALUES SUPERSEDED 2026-07-25** — token **names** below are still correct and still frozen, but every **value** was re-pointed from navy/gold to The Kopi Studio cream/brown palette. Read the values from [src/index.css](../../../src/index.css) `:root`; the spec is [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md).

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟡 Transitional — names current, values historical
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

**Runtime source of truth**: [src/index.css](../../../src/index.css) `:root` block + [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts). Always consume CSS vars in components — never copy a hex out of a doc table.

**2026-07-25**: LOCKED_PICKS v1–v4 var **names** stayed frozen through a second retune; **values** moved navy/gold → Kopi cream/brown. The app is light-pinned: `:root` is the only block, there is no `.dark` counterpart, and every `dark:` utility is inert.

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

## Historical value tables — navy/gold era (locked 2026-07-14, retired 2026-07-25)

> The token names in every table below are current. The **values** are not — they record the navy/gold tuning. For live values read [src/index.css](../../../src/index.css). Kept so a future reader can tell which name held which value in which era.

### v1 — Card

| Token | Value |
|---|---|
| `--card-radius` | 1rem |
| `--card-border` | navy hairline `hsl(210 25% 24% / 0.8)` |
| `--card-shadow-rest` | `0 1px 2px rgb(0 0 0 / 0.25)` |
| `--card-shadow-hover` | `0 4px 16px rgb(0 0 0 / 0.35)` |
| `--card-padding` | 1.25rem |

### v1 — DataTable

| Token | Value |
|---|---|
| `--row-hover-bg` | lighter navy `hsl(209 32% 18% / 0.6)` |
| `--row-enter-duration` | 180ms |
| `--sort-icon-opacity-rest` | 0.4 |

### v1 — KpiTile

| Token | Value |
|---|---|
| `--kpi-radius` | 1rem |
| `--delta-positive-bg` / `-fg` | green @ 15% / `#4ADE80` |
| `--delta-negative-bg` / `-fg` | DISC-D red @ 15% / `#E8836F` |
| `--ticker-spring-stiffness` / `-damping` | 100 / 60 |

### v2 — Drawer

| Token | Value |
|---|---|
| `--drawer-radius` | 1rem (top corners) |
| `--drawer-handle-w` / `-h` | 40px / 6px |
| `--drawer-overlay` | `rgb(0 0 0 / 0.6)` — deeper scrim over navy |
| `--handle-pulse-duration` | 1.6s |

### v2 — Stepper

| Token | Value |
|---|---|
| `--chip-size` / `--chip-size-compact` | 28px / 24px |
| `--chip-active` | `#C9A84C` gold |
| `--chip-done` | `#4ADE80` green-400 |
| `--chip-spring-stiffness` / `-damping` | 320 / 24 |

### v2 — Timeline

| Token | Value |
|---|---|
| `--timeline-rail-color` | `hsl(210 25% 24%)` navy rail |
| `--timeline-beam` | gold → transparent gradient |
| `--timeline-dot-size` | 28px |
| `--timeline-step-gap` | 20px |

### v2 — Chart

| Token | Value |
|---|---|
| `--chart-pipeline` | `#C9A84C` gold |
| `--chart-accepted` | `#4ADE80` green-400 |
| `--chart-grid-dasharray` | `2 4` |
| `--chart-anim-duration` / `-stagger` | 800ms / 200ms |

### v3.1 — CTA

| Token | Value |
|---|---|
| `--cta-primary-bg` / `-hover` | `#C9A84C` gold / `#D9BC6A` lighter gold |
| `--cta-primary-fg` | `#1A1200` near-black brown |
| `--cta-destructive-bg` | `#C0392B` DISC-D red — only solid red allowed |
| `--brand-red` | `#C9A84C` — **legacy NAME, gold value** |
| `--accent-red-soft-bg` / `-fg` | gold @ 12% / gold — legacy names |
| `--ring` (shadcn) | gold `43 55% 55%` |

### v3.2 — Glass / page

| Token | Value |
|---|---|
| `--surface-translucent-bg` / `--glass-bg` | navy `rgb(13 27 42 / 0.72)` |
| `--surface-translucent-blur` | 8px |
| `--surface-translucent-border` | navy hairline @ 60% |
| `--page-bg` | `#0D1B2A` navy — flat, always dark |
| `--page-gradient-light` / `-dark` | `#0D1B2A` — back-compat aliases, both navy |

### v3.3 — Mobile

| Token | Value |
|---|---|
| `--mobile-page-padding` | 12px |
| `--row-card-gap` | 6px |
| `--row-card-border` | navy hairline `hsl(210 25% 24%)` |

### v4 — List/table archetype semantics

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

### v4 — Status palette

`--status-<tone>-bg/-fg/-border/-dot` × 6 tones. Live values in [src/index.css](../../../src/index.css); 2a collapses the six tones to three meanings — sage positive, brown in-progress, terracotta error, with muted neutrals for the inert states.

### Motion

| Token | Value |
|---|---|
| `--motion-duration-instant` | 80ms |
| `--motion-duration-quick` | 180ms |
| `--motion-duration-smooth` | 400ms |
| `--motion-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--shadow-focus` | `0 0 0 3px rgb(201 168 76 / 0.35)` — gold @ 35% |

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — **current** value authority
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — enforcement + anti-patterns
- [src/index.css](../../../src/index.css) — canonical runtime block
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — lock rationale + reversal history (values superseded)
- [COLORS.md](./COLORS.md) · [SPACING_MOTION.md](./SPACING_MOTION.md) · [TYPOGRAPHY.md](./TYPOGRAPHY.md)
