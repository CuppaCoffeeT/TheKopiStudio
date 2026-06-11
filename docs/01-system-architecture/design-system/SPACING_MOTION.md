# Spacing · Radius · Shadow · Motion

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

| Name | CSS | Token | Usage |
|---|---|---|---|
| Card rest | `0 1px 2px rgba(0,0,0,0.04)` | `--card-shadow-rest` | Default surface |
| Card hover | `0 4px 12px rgba(0,0,0,0.08)` | `--card-shadow-hover` | Interactive card :hover |
| Focus ring | `0 0 0 3px #fecaca` red-200 | `--shadow-focus` | a11y focus-visible outline |
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

Hover bg **must** visually differ from `--page-bg` (zinc-100). Common failure: `hover:bg-zinc-100` on a zinc-100 page = invisible. Use `hover:bg-zinc-200` or `hover:bg-white` + soft shadow.

## Preview references

- [`spacing-scale.html`](../../99-refactor/_system/design/) · [`spacing-radii.html`](../../99-refactor/_system/design/) · [`spacing-shadows.html`](../../99-refactor/_system/design/) · [`spacing-motion.html`](../../99-refactor/_system/design/)

## 📚 Related

- [TOKENS.md](./TOKENS.md) — all values in one table
- [src/index.css](../../../src/index.css:263-268) — runtime motion vars
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror (`motionTokens`, `cardTokens`, etc.)
