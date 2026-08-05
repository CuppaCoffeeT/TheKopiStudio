# Spacing · Radius · Shadow · Motion

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-08-05 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Layout authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md)

Spacing and motion survived the 2026-07-25 Kopi migration intact. **Shadow** and the **hover rule** were re-cut for the cream ground. **Radius** is the section to read carefully — the shipped values differ from the comp in two documented places.

## Spacing scale

Tailwind v4 default — no custom additions. Locked primitives settle at these common steps.

| rem | px | Typical use |
|---|---|---|
| 0.25 | 4 | Icon offset, chip inner padding |
| 0.5 | 8 | Button gap, chip padding |
| 0.75 | 12 | Form field padding-y |
| 1 | 16 | Standard padding (button, input) · mobile page gutter |
| 1.25 | 20 | Compact padding (dense tiles) — former card padding, retired 2026-08-05 |
| 1.5 | 24 | Card padding · `--card-padding` · detail stack gap |
| 2 | 32 | Major layout gap (title block → content) |
| 2.5 | 40 | Desktop content gutter (the comp's own 40px, restored) · hero room |
| 3 | 48 | Page section gap · desktop frame padding-y |

### Page rhythm (2026-08-05 retune)

Every archetype frame shares one container rhythm — mobile gets its own compact
scale rather than a shrunk desktop one, and no frame carries arbitrary px values:

- **Gutter / padding-y**: `px-4 py-6` mobile → `sm:px-6 sm:py-10` → `lg:px-10 lg:py-12`
  (`ListPageFrame` · `AppHeaderShell`; `PageShell` panes use the same `px-4 sm:px-6 md:px-10`).
- **Content cap**: `max-w-8xl` = **1480px** (retuned from 1650) on every frame,
  including the detail archetype, which previously had no cap at all.
- **Detail stack gap**: the comp's 22px ships as `gap-6` (24px, on-scale).
- **Section gaps inside frames**: banner/KPI `mb-8`, tabs/filter `mb-5`.
- **Heroes**: masthead block `pb-8` + `mb-10` below; dashboard/login pages
  `py-12` at desktop.

## Radius

`--radius` is **0.75rem (12px)** — the 2a "large" step. `@theme` derives `--radius-lg: var(--radius)`, `--radius-md: calc(var(--radius) - 2px)`, `--radius-sm: calc(var(--radius) - 4px)`, so **Tailwind's `rounded-lg` resolves to 12px in this app, not its stock 8px.** `rounded-xl` (12px) and `rounded-2xl` (16px) are Tailwind defaults and are *not* re-pointed.

**As shipped** (measured from the primitives, not from the spec):

| Element | Shipped | How |
|---|---|---|
| `Card` (and every `DossierPanel`) | **16px** | `rounded-2xl` |
| `KpiIndexCard` · `KpiTile` | **12px** | inline `var(--card-radius)` / `var(--kpi-radius)` |
| `Modal` | **12px** | `rounded-xl` |
| `Drawer` | **16px**, top corners | `rounded-t-2xl` (`--drawer-radius` is also 1rem) |
| `Button` · `Input` | **12px** | `rounded-lg` → `var(--radius)` |
| `Chip` · `Badge` · `StatusBadge` · filter pills | full | `rounded-full` |
| Viz bar / loading bar | 5px / 2px | per-component, per KOPI_2A_SPEC |

**Two knowing deviations from KOPI_2A_SPEC** — do not "fix" them without reading the rationale:

1. **`Card` is 16px, the comp says 12px.** `Card` is the app-wide locked card surface; a second card shape 4px tighter inside the detail archetype would put two card radii in one view (a KPI tile and a dossier panel can co-occur). One radius beat comp fidelity at this magnitude. If `--card-radius` is ever wired into `Card`, dossier panels follow automatically. ([decisions.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md), 2026-07-25)
2. **Buttons and inputs are 12px, the comp says 8px** — they inherit `--radius` through `rounded-lg`.

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
| `--motion-duration-hover` | 200ms | `--motion-ease-out-expo` | Colour/shadow hover on buttons + links (2026-08-05) |
| `--motion-duration-smooth` | 400ms | `--motion-ease-spring` | Modal / drawer open, count-up, tab swap |
| `--motion-duration-entrance` | 500ms (hero 600ms) | `--motion-ease-out-expo` | Block rise-in on mount (2026-08-05) |

### Entrance system (2026-08-05 — extends RESERVED)

Page-level blocks rise in **once per mount**: 10px up-fade, `ease-out-expo`,
staggered ~70ms via `motion-rise` / `motion-rise-hero` + `motion-rise-2…5`
(`src/index.css`). Wired centrally in `ListPageFrame` (header → chrome →
table) and `PageShell` (hero → tabs → columns), plus the dashboard, login and
profiler-intake heroes — pages composed from the frames inherit it for free.
Sticky bars (`AppHeaderMobileBar`, the wizard's sticky block) gain
`--card-shadow-hover` once scrolled past 8px via `useScrolled`, eased over
300ms. Nothing loops, springs or bounces in this system — `ease-spring`
stays reserved for the signature moments above. A global
`prefers-reduced-motion` block at the end of `src/index.css` collapses every
CSS animation/transition to instant; Motion-library springs must keep
checking `useReducedMotion` themselves.

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

## Rhythm (2a)

| Where | Value |
|---|---|
| Content pane padding | `34px 40px` |
| Sidebar rail | 200px fixed; padding `22px 0`; item gap 2px; item padding `9px 22px` |
| Card padding | `20px 22px` (KPI tiles) · `22px` (detail panels) |
| Section spacing | 22–26px |
| Masthead close | `padding-bottom: 22px` + hairline, `margin-bottom: 26px` |
| KPI grid | `1fr 1fr`, gap 18px |
| Detail body grid | `1.4fr 1fr`, gap 22px |
| Button padding | `10px 20px` · input padding `10px 14px` |
| Table cells | TH `12px 8px 8px 0` · TD `11px 8px 11px 0` (dashboard); TH `14px 8px 10px 0` · TD `12px 8px 12px 0` (list) |

**Touch floor**: 44×44px minimum on coarse pointers — primitives lift the comp's 36px rows with `pointer-coarse:min-h-11`. See [.claude/rules/mobile-web.md](../../../.claude/rules/mobile-web.md).

## Preview references

The AppBase-era `spacing-*.html` previews lived in `docs/99-refactor/_system/design/`, **which is no longer in the repo**. Verify against the 2a comp instead: [`Kopi Studio Directions.dc.html`](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/) (option 2a) plus [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md).

## 📚 Related

- [TOKENS.md](./TOKENS.md) — all values in one table
- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — "Layout language" + "Rhythm"
- [ARCHETYPES.md](./ARCHETYPES.md) — where each spacing rule lands
- [src/index.css](../../../src/index.css) — runtime motion vars (`--motion-*`, in the `:root` block)
- [src/lib/design/tokens.ts](../../../src/lib/design/tokens.ts) — TS mirror (`motionTokens`, `cardTokens`, etc.)
