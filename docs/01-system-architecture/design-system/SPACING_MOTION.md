# Spacing · Radius · Shadow · Motion

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🟢 Medium

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Palette authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md)

Spacing, radius and motion survived the 2026-07-25 Kopi migration nearly intact; **shadow** and the **hover rule** were re-cut for the cream ground and are current as written below.

## Spacing scale

Tailwind v4 default — no custom additions. Locked primitives settle at these common steps.

| rem | px | Typical use |
|---|---|---|
| 0.25 | 4 | Icon offset, chip inner padding |
| 0.5 | 8 | Button gap, chip padding |
| 0.75 | 12 | Form field padding-y |
| 1 | 16 | Standard padding (button, input, card) |
| 1.25 | 20 | Card padding · `--card-padding` |
| 1.5 | 24 | Section spacing |
| 2 | 32 | Major layout gap |
| 3 | 48 | Page section gap |

## Radius

Re-cut 2026-07-25 to the 2a rhythm: **8px small · 12px large · 99px pills**.

| Element | Value | Token |
|---|---|---|
| Card · DataTable · KpiTile | 0.75rem (12px) | `--card-radius`, `--kpi-radius`, `--radius` |
| Drawer | 1rem (16px, top corners) | `--drawer-radius` |
| Modal | 1.25rem (20px) | (Radix default) |
| Button · Badge · Input | 0.5rem (8px) | Tailwind `rounded-lg` |
| Filter pill · Chip | 9999px full | Tailwind `rounded-full` |
| Viz bar / loading bar | 5px / 2px | (per-component, KOPI_2A_SPEC) |

## Shadow

Retuned 2026-07-25 for the Kopi cream canvas. **2a cards rest FLAT** — the lift is the cream-on-cream colour step (`#F0E6D6` page → `#FAF6EE` card), not a shadow. Only genuinely floating surfaces cast one, and the tint is warm ink `rgb(58 46 36 / …)`, never neutral black.

| Name | CSS | Token | Usage |
|---|---|---|---|
| Card rest | `none` | `--card-shadow-rest` | Default surface — the colour step carries the lift |
| Card hover | `0 2px 8px rgb(58 46 36 / 0.1)` | `--card-shadow-hover` | Interactive card :hover |
| Card (v4 layered) | `none` | `--card-shadow` | List/table card elevation — flat in 2a |
| Floating | `0 2px 8px rgb(58 46 36 / 0.1), 0 8px 24px rgb(58 46 36 / 0.08)` | `--floating-shadow` | Popovers, floating panels |
| Focus ring | `0 0 0 3px rgb(139 106 71 / 0.12)` brown @ 12% | `--shadow-focus` | a11y focus-visible outline |
| Elevation (modal / popover) | Tailwind `shadow-2xl` | — | Floating surfaces only |

**Rule**: shadows are used sparingly — the surface ladder and hairline borders carry most of the depth signal. Never stack shadow layers.

## Motion

| Duration token | Value | Easing | When |
|---|---|---|---|
| `--motion-duration-instant` | 80ms | linear | Tooltip fade, icon flip — "instant" feedback |
| `--motion-duration-quick` | 180ms | `--motion-ease-out-expo` | Row enter / exit, hover-to-active |
| `--motion-duration-smooth` | 400ms | `--motion-ease-spring` | Modal / drawer open, count-up, tab swap |

### Easing curves

| Token | Value |
|---|---|
| `--motion-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--motion-ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |

### Spring configs (for Motion-library primitives)

| Primitive | Stiffness | Damping | Token |
|---|---|---|---|
| `NumberTicker` (KpiTile count-up) | 100 | 60 | `--ticker-spring-stiffness/damping` |
| `Stepper` chip transition | 320 | 24 | `--chip-spring-stiffness/damping` |

### Hover rule (DESIGN_REUSE_PRINCIPLES rule 11)

Hover bg **must** visually differ from `--page-bg` (cream `#F0E6D6`). Common failure: hover fill equal to the page/card resting bg = invisible. Use the brown wash `var(--row-hover)` (brown @ 6% — deliberately translucent so it reads on BOTH the page and the lighter card), `bg-secondary` (tint `#F3EDE3`), or a shadow lift.

## Preview references

- [`spacing-scale.html`](../../99-refactor/_system/design/) · [`spacing-radii.html`](../../99-refactor/_system/design/) · [`spacing-shadows.html`](../../99-refactor/_system/design/) · [`spacing-motion.html`](../../99-refactor/_system/design/)

## 📚 Related

- [TOKENS.md](./TOKENS.md) — all values in one table
- [src/index.css](../../../src/index.css:263-268) — runtime motion vars
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror (`motionTokens`, `cardTokens`, etc.)
