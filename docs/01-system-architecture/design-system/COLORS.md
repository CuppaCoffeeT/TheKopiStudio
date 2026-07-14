# Colors

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-14 SGT
**Status**: 🟢 Production

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

Always-dark navy/gold system (2026-07-14 reversal — see [PHILOSOPHY.md](./PHILOSOPHY.md)). Runtime source: [src/index.css](../../../src/index.css) `:root` (`.dark` mirrors it — the app never renders light).

## Core palette

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

## Semantic CTA tokens (LOCKED_PICKS v3.1, retuned 2026-07-14)

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

## Text hierarchy (v4 cream scale)

| Token | Hex | Use |
|---|---|---|
| `--fg` | `#F0EAD6` cream | Body text, titles |
| `--fg-dim` | `#D6CCB4` dim cream | Secondary content |
| `--fg-muted` | `#8A8070` warm muted | Labels, meta, placeholders |

## Surfaces + borders (v4)

| Token | Value | Role |
|---|---|---|
| `--surface` | `#12202F` | Card / table body (== `--card`) |
| `--surface-subtle` | `#182638` | Filter bar, pagination bg |
| `--border-soft` | `hsl(210 25% 24%)` | Filter bar, row-hover separator |
| `--border-faint` | `hsl(210 25% 20%)` | Per-row hairline divider |
| `--row-hover` | cream @ 4% | Table row :hover wash |
| `--row-selected` | gold @ 10% | Selected row tint |
| `--skeleton` / `--skeleton-hi` | `#182638` / `#21324A` | Loading shimmer |

## Status palette (v4 — translucent tints on navy)

Hue semantics preserved from the AppBase lock; values retuned to translucent tints + lifted fg for navy contrast. Tokens: `--status-<tone>-bg/-fg/-border/-dot` in `src/index.css`. Consumed by `StatusBadge`.

| Status | Bg | Fg | Dot |
|---|---|---|---|
| **draft** | cream @ 8% | `#B8AE96` | `#8A8070` |
| **sent** | blue @ 15% | `#7EB3F5` | `#3B82F6` |
| **accepted** | green @ 15% | `#4ADE80` | `#16A34A` |
| **rejected** | DISC-D red @ 15% | `#E8836F` | `#C0392B` |
| **expired** | orange @ 15% | `#FB923C` | `#EA580C` |
| **revised** | purple @ 15% | `#C084FC` | `#9333EA` |

## Chart palette

| Role | Hex | Token |
|---|---|---|
| Primary series | `#C9A84C` gold | `--chart-pipeline` |
| Secondary / positive series | `#4ADE80` green-400 | `--chart-accepted` |
| Grid dashes | dash-array `2 4` | `--chart-grid-dasharray` |

## Delta badge (KpiTile)

| Direction | Bg | Fg |
|---|---|---|
| Positive | green @ 15% | `#4ADE80` |
| Negative | DISC-D red @ 15% | `#E8836F` |

Tokens: `--delta-positive-bg/fg`, `--delta-negative-bg/fg`.

## Glass surface (AppHeader)

| Property | Value | Token |
|---|---|---|
| Background | navy `rgb(13 27 42 / 0.72)` | `--surface-translucent-bg` / `--glass-bg` |
| Backdrop blur | `8px` | `--surface-translucent-blur` |
| Border | navy hairline @ 60% | `--surface-translucent-border` |

## Zinc + red Radix scales (legacy, still defined)

The `@theme` block still exposes `--color-zinc-1..12` and `--color-red-1..12` (AppBase-era). They remain for any lingering utility references but are **not** part of the navy/gold vocabulary — do not use them in new code; use the semantic tokens above.

## 📚 Related

- [TOKENS.md](./TOKENS.md) — full token value table
- [TYPOGRAPHY.md](./TYPOGRAPHY.md) — text-color pairings
- [DARK_MODE.md](./DARK_MODE.md) — always-dark surface contract
- [src/index.css](../../../src/index.css) — runtime tokens
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — 2026-07-14 reversal entry
