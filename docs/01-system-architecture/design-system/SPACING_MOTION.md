# Spacing · Radius · Shadow · Motion

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-14 SGT
**Status**: 🟢 Production

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

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

| Element | Value | Token |
|---|---|---|
| Card · DataTable · KpiTile · Drawer | 1rem (16px) | `--card-radius`, `--kpi-radius`, `--drawer-radius` |
| Modal | 1.25rem (20px) | (Radix default) |
| Button · Badge · Input | 0.5rem (8px) | Tailwind `rounded-lg` |
| Filter pill · Chip | 9999px full | Tailwind `rounded-full` |

## Shadow

Retuned 2026-07-14 for the always-dark navy canvas — deeper blacks so elevation still reads on `#0D1B2A`.

| Name | CSS | Token | Usage |
|---|---|---|---|
| Card rest | `0 1px 2px rgb(0 0 0 / 0.25)` | `--card-shadow-rest` | Default surface |
| Card hover | `0 4px 16px rgb(0 0 0 / 0.35)` | `--card-shadow-hover` | Interactive card :hover |
| Card (v4 layered) | `0 1px 2px rgb(0 0 0 / 0.3), 0 8px 24px rgb(0 0 0 / 0.25)` | `--card-shadow` | List/table card elevation |
| Floating | `0 8px 24px rgb(0 0 0 / 0.45), 0 1px 3px rgb(0 0 0 / 0.3)` | `--floating-shadow` | Popovers, floating panels |
| Focus ring | `0 0 0 3px rgb(201 168 76 / 0.35)` gold @ 35% | `--shadow-focus` | a11y focus-visible outline |
| Elevation (modal / popover) | Tailwind `shadow-2xl` | — | Floating surfaces only |

**Rule**: shadows are used sparingly — glass surfaces + tokens carry most of the depth signal. Never stack shadow layers.

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

Hover bg **must** visually differ from `--page-bg` (navy `#0D1B2A`). Common failure: hover fill equal to the navy page/card resting bg = invisible. Use the cream wash `var(--row-hover)` (cream @ 4%), `bg-secondary` (lighter navy), or a shadow lift.

## Preview references

- [`spacing-scale.html`](../../99-refactor/_system/design/) · [`spacing-radii.html`](../../99-refactor/_system/design/) · [`spacing-shadows.html`](../../99-refactor/_system/design/) · [`spacing-motion.html`](../../99-refactor/_system/design/)

## 📚 Related

- [TOKENS.md](./TOKENS.md) — all values in one table
- [src/index.css](../../../src/index.css:263-268) — runtime motion vars
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror (`motionTokens`, `cardTokens`, etc.)
