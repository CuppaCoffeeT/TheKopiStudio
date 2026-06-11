# Colors

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## Brand + semantic

| Role | Hex | Token | Used for |
|---|---|---|---|
| **Primary CTA bg** | `#1e293b` slate-800 | `--cta-primary-bg` | Primary button bg — the everyday clickable |
| **Primary CTA hover** | `#0f172a` slate-900 | `--cta-primary-bg-hover` | Button :hover |
| **Primary CTA fg** | `#ffffff` white | `--cta-primary-fg` | Text on primary CTA (10.7:1 AAA contrast) |
| **Destructive bg** | `#b91c1c` red-700 | `--cta-destructive-bg` / `--brand-red` | Delete · confirm-danger buttons |
| **Focus ring** | `#b91c1c` red-700 + `#fecaca` red-200 offset | `--ring-color` + `--shadow-focus` | `focus-visible` outline (3px offset) |

**Locked 2026-04-19** (v3): CTA is slate-800, not solid black and not red. Red is reserved — destructive actions, focus ring, critical alert dots, timeline beam, brand accent only. See [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md).

## Zinc scale (neutral foundation)

Radix zinc 1–12, defined in `src/index.css:73–102`. Used for surfaces, borders, text, disabled states.

| Token | Hex | Typical use |
|---|---|---|
| `--zinc-1` / `--surface-subtle` | `#fafafa` | Page bg, subtle card |
| `--zinc-2` / `--page-bg` | `#f4f4f5` | Main page background, row :hover |
| `--zinc-3` / `--border-faint` | `#f1f1f3` | Barely-there dividers |
| `--zinc-4` / `--border-soft` | `#ececee` | Card edges, table rows |
| `--zinc-5` | `#e4e4e7` | Input borders |
| `--zinc-8` | `#52525b` | Muted text :hover |
| `--zinc-9` / `--fg-muted` | `#71717a` | Placeholders, tertiary text |
| `--zinc-11` / `--fg-dim` | `#27272a` | Body text |
| `--zinc-12` / `--fg` | `#18181b` | Primary text, title |

## Red scale (Radix red 1–12)

Defined same block. Pale tints (`--red-1` `#fef2f2`) for backgrounds; mid-tones (`red-6` `#ef4444`) for icons; deep (`red-7` `#b91c1c`) for brand / destructive.

## Status palette (LOCKED v4, Session 1)

6-tone status vocabulary. Every status badge across the app draws from this table only.

| Status | Bg | Fg | Meaning |
|---|---|---|---|
| **draft** | `#fef3c7` amber-100 | `#92400e` amber-900 | In progress, unsent, unsaved |
| **sent** | `#dbeafe` blue-100 | `#1e3a8a` blue-900 | Dispatched, awaiting response |
| **accepted** | `#dcfce7` green-100 | `#166534` green-900 | Approved, signed off |
| **rejected** | `#fee2e2` red-100 | `#991b1b` red-900 | Declined, failed |
| **expired** | `#f3e8ff` purple-100 | `#6b21a8` purple-900 | Out of window, stale |
| **revised** | `#fce7f3` pink-100 | `#9d174d` pink-900 | Updated, superseded |

Token names: `--status-<tone>-bg` + `--status-<tone>-fg`. Defined `src/index.css:248–260`. Consumed by `StatusBadge` + `Chip kind="status"`.

## Chart palette

| Role | Hex | Token |
|---|---|---|
| Pipeline / primary series | `#b91c1c` red-700 | `--chart-pipeline` |
| Accepted / secondary series | `#16a34a` green-600 | `--chart-accepted` |
| Grid dashes | zinc-300, dash-array `2 4` | `--chart-grid-dasharray` |

## Delta badge (KpiTile)

| Direction | Bg | Fg |
|---|---|---|
| Positive (up) | `#dcfce7` green-50 | `#15803d` green-700 |
| Negative (down) | `#fee2e2` red-50 | `#b91c1c` red-700 |
| Neutral | zinc-100 | zinc-600 |

Tokens: `--delta-positive-bg/fg`, `--delta-negative-bg/fg`.

## Glass surface (AppHeader)

| Property | Value | Token |
|---|---|---|
| Background | `rgba(255,255,255,0.72)` | `--surface-translucent-bg` |
| Backdrop blur | `8px` | `--surface-translucent-blur` |
| Border | `rgba(255,255,255,0.6)` | `--surface-translucent-border` |

Applied to sticky `AppHeader` — gives the Linear / Vercel-style frosted feel.

## Dark mode

Overrides live at `src/index.css:359–476`. Inverted zinc (fg ↔ bg), status palette intensifies (bg-900/40 + fg-300). Red / green accents hold constant for legibility. Currently scoped behind ThemeProvider; W08 Phase 2 plan.

## Preview references

- [`color-zinc.html`](../../99-refactor/_system/design/) · [`color-red.html`](../../99-refactor/_system/design/) · [`color-semantic.html`](../../99-refactor/_system/design/) · [`color-status.html`](../../99-refactor/_system/design/)

## 📚 Related

- [TOKENS.md](./TOKENS.md) — full token value table
- [TYPOGRAPHY.md](./TYPOGRAPHY.md) — text-color pairings
- [src/index.css](../../../src/index.css) — runtime `@theme`
- [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md) — v3 CTA + v4 status locks
