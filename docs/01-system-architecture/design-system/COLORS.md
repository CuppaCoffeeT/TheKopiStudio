# Colors

> ⛔ **SUPERSEDED 2026-07-25** — the app is now light-pinned on The Kopi Studio cream/brown palette; every navy/gold value below is historical. Authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) · enforcement: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) · runtime: [src/index.css](../../../src/index.css) single `:root` block.

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🔴 Deprecated
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## Current palette — where to look instead

| Need | Read |
|---|---|
| Core palette, CTA, status pills, viz ramp | [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) |
| Surface contract + AA text variants + anti-patterns | [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) |
| Live token values | [src/index.css](../../../src/index.css) `:root` |

In one line: warm cream canvas `#F0E6D6` → card `#FAF6EE` → raised white `#FFFFFF`, warm ink `#3A2E24`, brown `#8B6A47` as punctuation (CTA, focus ring, active nav), sage `#5A7A5E` positive, terracotta `#D97551` negative, hairline `#D9CCC0`. Text under 18px in a brand hue takes its AA-safe sibling (`--brown-text` / `--sage-text` / `--negative-text`).

## Historical — navy/gold era (locked 2026-07-14, retired 2026-07-25)

> Everything below described the always-dark Editorial navy/gold system. Kept for archaeology — the token NAMES survived the migration, the values did not. Do not use these hexes.

### Core palette

| Role | Hex | HSL token | Used for |
|---|---|---|---|
| **Page canvas** | `#0D1B2A` navy | `--background: 210 53% 11%` | Body bg, `--page-bg` |
| **Card surface** | `#12202F` raised navy | `--card: 209 44% 13%` / `--surface` | Cards, tiles, sidebar — one step LIGHTER than page |
| **Modal / popover** | `#182638` | `--popover: 213 42% 16%` / `--surface-subtle` | Modals, popovers, filter bars, skeleton base |
| **Text** | `#F0EAD6` cream | `--foreground: 43 48% 89%` / `--fg` | Body + primary text |
| **Text muted** | `#8A8070` warm grey | `--muted-foreground: 38 12% 49%` / `--fg-muted` | Labels, meta, placeholders |
| **Primary / accent** | `#C9A84C` gold | `--primary` / `--accent` / `--ring: 43 55% 55%` | CTA bg, links, focus ring, brand accent |
| **On-gold text** | `#1A1200` near-black brown | `--primary-foreground: 40 100% 6%` | Text on gold CTAs |
| **Secondary surface** | lighter navy | `--secondary` / `--muted: 209 32% 18%` | Hover fills, secondary buttons |
| **Destructive** | `#C0392B` DISC-D red | `--destructive: 6 64% 47%` | Delete / danger only — never brand accent |
| **Border / input** | navy hairline | `--border` / `--input: 210 25% 24%` | All hairlines |

### Semantic CTA tokens (LOCKED_PICKS v3.1, retuned 2026-07-14)

| Role | Hex | Token |
|---|---|---|
| Primary CTA bg | `#C9A84C` gold | `--cta-primary-bg` |
| Primary CTA hover | `#D9BC6A` lighter gold | `--cta-primary-bg-hover` |
| Primary CTA fg | `#1A1200` | `--cta-primary-fg` |
| Destructive bg | `#C0392B` | `--cta-destructive-bg` — the only solid red allowed |
| Brand accent (links, badges, focus) | `#C9A84C` gold | `--brand-red` — **legacy NAME, now holds gold** (name frozen; 80+ consumers) |
| Soft accent tint | gold @ 12% | `--accent-red-soft-bg` / `-fg` — also legacy names, gold values |
| Focus ring shadow | gold @ 35% | `--shadow-focus` |

**Supersedes** slate-800 CTA / red-700 accent (2026-04-19 lock) — user reversal 2026-07-14, recorded in [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md).

### Text hierarchy (v4 cream scale)

| Token | Hex | Use |
|---|---|---|
| `--fg` | `#F0EAD6` cream | Body text, titles |
| `--fg-dim` | `#D6CCB4` dim cream | Secondary content |
| `--fg-muted` | `#8A8070` warm muted | Labels, meta, placeholders |

### Surfaces + borders (v4)

| Token | Value | Role |
|---|---|---|
| `--surface` | `#12202F` | Card / table body (== `--card`) |
| `--surface-subtle` | `#182638` | Filter bar, pagination bg |
| `--border-soft` | `hsl(210 25% 24%)` | Filter bar, row-hover separator |
| `--border-faint` | `hsl(210 25% 20%)` | Per-row hairline divider |
| `--row-hover` | cream @ 4% | Table row :hover wash |
| `--row-selected` | gold @ 10% | Selected row tint |
| `--skeleton` / `--skeleton-hi` | `#182638` / `#21324A` | Loading shimmer |

### Status palette (v4 — translucent tints on navy)

Hue semantics preserved from the AppBase lock; values retuned to translucent tints + lifted fg for navy contrast. Tokens: `--status-<tone>-bg/-fg/-border/-dot` in `src/index.css`. Consumed by `StatusBadge`.

| Status | Bg | Fg | Dot |
|---|---|---|---|
| **draft** | cream @ 8% | `#B8AE96` | `#8A8070` |
| **sent** | blue @ 15% | `#7EB3F5` | `#3B82F6` |
| **accepted** | green @ 15% | `#4ADE80` | `#16A34A` |
| **rejected** | DISC-D red @ 15% | `#E8836F` | `#C0392B` |
| **expired** | orange @ 15% | `#FB923C` | `#EA580C` |
| **revised** | purple @ 15% | `#C084FC` | `#9333EA` |

### Chart palette

| Role | Hex | Token |
|---|---|---|
| Primary series | `#C9A84C` gold | `--chart-pipeline` |
| Secondary / positive series | `#4ADE80` green-400 | `--chart-accepted` |
| Grid dashes | dash-array `2 4` | `--chart-grid-dasharray` |

### Delta badge (KpiTile)

| Direction | Bg | Fg |
|---|---|---|
| Positive | green @ 15% | `#4ADE80` |
| Negative | DISC-D red @ 15% | `#E8836F` |

Tokens: `--delta-positive-bg/fg`, `--delta-negative-bg/fg`.

### Glass surface (AppHeader)

| Property | Value | Token |
|---|---|---|
| Background | navy `rgb(13 27 42 / 0.72)` | `--surface-translucent-bg` / `--glass-bg` |
| Backdrop blur | `8px` | `--surface-translucent-blur` |
| Border | navy hairline @ 60% | `--surface-translucent-border` |

### Zinc + red Radix scales (deleted 2026-07-25)

The `@theme` block used to expose `--color-zinc-1..12` and `--color-red-1..12` (AppBase-era). Both scales were **deleted** in the Kopi migration — cool grey and pure red fight the warm cream ground, and no component, test or doc consumed them. Tailwind's own `zinc-*` / `red-*` defaults are a separate thing and are likewise not part of this brand.

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — **current** palette authority
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — enforcement + anti-patterns
- [TOKENS.md](./TOKENS.md) — full token value table
- [TYPOGRAPHY.md](./TYPOGRAPHY.md) — text-color pairings
- [DARK_MODE.md](./DARK_MODE.md) — superseded always-dark surface contract
- [src/index.css](../../../src/index.css) — runtime tokens
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — 2026-07-14 reversal entry (also superseded)
