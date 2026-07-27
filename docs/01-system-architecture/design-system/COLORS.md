# Colors — The Kopi Studio

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Spec: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) · Enforcement: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) · Runtime: [src/index.css](../../../src/index.css) (single `:root`, no `.dark`)

**Warm cream canvas, ink-brown text, brown as punctuation.** Light-pinned since 2026-07-25 — there is no navy, no gold, and no dark counterpart. Every ratio on this page was re-measured against the shipped hexes in `src/index.css`.

## Surface ladder — each step LIGHTER than the last

| Surface | Hex | HSL token | Utility | Use |
|---|---|---|---|---|
| Page | `#F0E6D6` | `--background: 37 46% 89%` | `bg-background` / `var(--page-bg)` | Body canvas, content pane, bare tables |
| Card | `#FAF6EE` | `--card: 40 55% 96%` | `bg-card` / `var(--surface)` | Cards, panels, KPI tiles, **the sidebar rail** |
| Raised | `#FFFFFF` | `--popover: 0 0% 100%` | `bg-popover` | Modals, menus, **inputs** — the only white in the comp |
| Tint | `#F3EDE3` | `--secondary` / `--muted` / `--surface-subtle` | `bg-secondary` | Hover fill, filter bar, pagination, active nav |
| Pressed | `#EBE2D4` | `--tint-pressed` | — | Nav `:active`, secondary-button `:active` |

**Cardinal rule (survives the navy→cream inversion): page bg ≠ card bg.** If they match, every card disappears.

## Text ladder

| Token | Hex | on page | on card | Use |
|---|---|---|---|---|
| `--fg` / `--foreground` | `#3A2E24` | **10.65** | **12.21** | Primary copy, titles, values |
| `--fg-dim` | `#5D4F3F` | **6.40** | **7.34** | Table body, prose, **anything muted-sized that sits on the page ground** |
| `--fg-muted` / `--muted-foreground` | `#7D6B5B` | **4.12 ❌** | **4.72 ✅** | Labels, meta, kickers — **card surfaces only** |

### ⚠️ The page-ground trap

`--fg-muted` `#7D6B5B` passes AA on card cream (4.72) and **fails on the page cream (4.12)**. It also measures 4.37 on the `#F3EDE3` tint. The 2a comp puts muted text straight on the page in several places (dateline, KPI meta, table meta cells) — that gap is real and is closed in code, not by a fourth hex:

> **On the page ground, muted-role text takes `--fg-dim`, not `--fg-muted`.** Card and panel surfaces keep `--fg-muted`.

Shipped consequences (see the handoff [decisions.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md)): `AppHeaderShell`'s `kicker`, `Breadcrumb`'s earlier segments, bare `DataRowCell` `muted` cells, `ErrorState` compact's explanation line and `/login`'s kicker are all `--fg-dim`. The meta step there is carried by **size**, not by a lighter ink. `AppSidebar` is the mirror case: the rail ships on card cream precisely so its idle `--fg-muted` items stay legal — move the rail to page cream and every idle nav label drops below AA.

## AA text variants — MANDATORY under 18px

The raw brand hexes are tuned as **fills**. As small type they miss 4.5:1, so each hue has one darkened text-only sibling.

| Raw fill | on page | on card | Small-text token | Hex | on page | on card |
|---|---|---|---|---|---|---|
| brown `#8B6A47` | 4.00 ❌ | 4.58 ✅ | `--brown-text` | `#806241` | **4.54** | **5.21** |
| sage `#5A7A5E` | 3.88 ❌ | 4.45 ❌ | `--sage-text` | `#526F56` | **4.51** | **5.17** |
| terracotta `#D97551` | 2.57 ❌ | 2.95 ❌ | `--negative-text` | `#AB4925` | **4.58** | **5.25** |

**Rule**: any text below 18px in a brand hue uses the variant. Raw hexes stay correct for fills, borders, icons, chart marks and display type ≥ 18px — a primary button keeps `background:#8B6A47` while a secondary button's *label* becomes `--brown-text`. Raw brown is the subtle trap: it passes on card and fails on page, so without the variant legality would depend on which surface a component landed on.

**Never** use `#5A7A5E` or `#D97551` as small text, on any surface.

### One step further — brown text on a brown wash

`--brown-text-on-wash` `#6D5233`. `--brown-text` is calibrated for the two flat cream grounds only; on brown @ 15% over card (`#E9E1D5`) it drops to **4.33** and fails. The wash variant measures **4.92** on brown@15%-over-page and **5.58** over-card. Use it for chips and phase tags painted on `bg-accent/10`–`/15`. Same value as the CTA pressed step, kept under its own name so retuning the button can't silently break text.

### One step further — terracotta text on the error tint

`--negative-text-on-tint` `#8F3D1F`. `--negative-text` `#AB4925` is page/card-tuned; on the error tint `#FAE0D6` (`--red-soft`, the deepest of the three status washes) it measures **4.499** — under the gate, and axe reports it as a serious `color-contrast` failure. The tint variant measures **5.85** there. Use it for any text below 18px painted on `#FAE0D6`: the `rejected`/`danger` status pills, the report health-card band labels and the report opportunity-cost row. Same value as `--cta-destructive-bg-hover`, kept under its own name for the same reason as the brown wash step.

## Brand hues + their jobs

| Colour | Token | Hex | Job |
|---|---|---|---|
| Brown | `--brand-brown` / `--primary` / `--accent` / `--ring` | `#8B6A47` | Primary CTA fill · focus ring · active-nav 2px left border · index numerals · viz ramp anchor · loading-bar fill |
| Sage | `--brand-sage` | `#5A7A5E` | Positive fills + dots (`--chip-done`, delta positive) |
| Terracotta | `--brand-terracotta` | `#D97551` | Negative fills + dots **only** |

**Brown is punctuation, not authority-by-volume.** It is never a header gradient, never a filled nav pill, never a heading colour, never a table header, never body copy, never a decorative fill. Hierarchy is carried by serif/sans contrast, the three-step ink ladder and hairlines.

`--brand-red` is a **legacy name holding the AA-safe brown** `#806241` (80+ consumers, name frozen) — it is what the global `a` rule paints links with, because link text is body-sized.

## CTA + destructive

| Token | Hex | Cream `#FAF6EE` label |
|---|---|---|
| `--cta-primary-bg` | `#8B6A47` | **4.58** — the tightest pass in the system |
| `--cta-primary-bg-hover` | `#7D5F3D` | 5.45 |
| `--cta-primary-bg-active` | `#6D5233` | 6.71 |
| `--cta-destructive-bg` | `#AB4925` | 5.25 |
| `--cta-destructive-bg-hover` | `#8F3D1F` | 6.82 |

Destructive is the **AA-safe** terracotta, not the raw one — cream on `#D97551` is 2.95. Ordering is fixed: secondary left of primary, gap 10px.

**Flagged, unresolved**: a sage success button would be cream on `#5A7A5E` = **4.45**, below AA at 12.5px. If one ships, use `#4A6A4E` as the resting fill and darken the hover further.

## Borders — two tiers plus a frame

| Token | Hex | Use |
|---|---|---|
| `--border` / `--input` / `--border-soft` / `--card-border` | `#D9CCC0` | Structure: card edges, section rules, sidebar edge, header underlines |
| `--border-faint` | `#E0D3C3` | Repetition: table row separators (as `border-top`, so header + first row don't double) |
| `--hairline-frame` | `#C9B9A5` | Outer frame + the dashed loading placeholder only |
| `--border-hover` | `#C0A68C` | Hover border on interactive cards + secondary buttons |

Hairlines do the layout work. Never nest boxed sub-cards — use a grid plus a hairline.

## Status pills — their own tuned pairs

Radius 99px, padding `3px 10px`, 600 11.5px. Tint fill + darkened same-hue text, never a saturated fill. **Do not substitute the page-tuned variants here** — they score *worse* on these tints (`#526F56` on `#D9E8E0` = 4.40; `#806241` on `#F0E2CF` = 4.41).

| Meaning | Fill | Text | Ratio |
|---|---|---|---|
| Positive / complete | `#D9E8E0` | `#4A6A54` | **4.76** |
| In progress | `#F0E2CF` | `#7D5F3D` | **4.61** |
| Error | `#FAE0D6` | `#8F3D1F` | **5.85** |

`#D9E8E0` is the one sanctioned use of the extended (report) palette in app chrome. The error pill is the comp's one correction — its own `#B04F2C` measures 4.17 and fails. `--negative-text` `#AB4925` was the first correction and was booked at "4.50"; it actually measures **4.499** on `#FAE0D6` and axe fails it, so the pill takes `--negative-text-on-tint` `#8F3D1F` (see below).

Full six-tone `--status-<tone>-bg/-fg/-border/-dot` set lives in [src/index.css](../../../src/index.css); 2a collapses it to three meanings plus muted neutrals for the inert states. **`--status-revised-fg` `#7D5F3D` is card-tuned**: over page cream the 14% brown tint composites to ~`#E2D5C2` where it drops below 4.5. Surfaces painting the page ground (`PageShellHero`) take `--status-revised-fg-on-page` `#6D5233` instead — **5.00** on page, **5.63** on card.

Status shown as plain text rather than a pill (the list's Report column) is 600 12px — `--sage-text` for "Generated", `--fg-muted` for "Pending".

## Delta badges (`KpiDeltaBadge`)

The badge paints its label at 12px and always sits inside a `KpiTile`, i.e. on card cream. **The tint alphas are set by that budget, not by taste** — sage @ .14 measured 4.39 and terracotta @ .16 measured 4.48, both failing, so each dropped one step.

| Direction | Bg token | Value | Fg | Ratio on card |
|---|---|---|---|---|
| Positive | `--delta-positive-bg` | sage @ 10% | `--delta-positive-fg` `#526F56` | **4.60** |
| Negative | `--delta-negative-bg` | terracotta @ 12% | `--delta-negative-fg` `#AB4925` | **4.68** |

Do not deepen these without re-measuring the pair.

## Data-viz — one brown ramp

`--chart-ramp-1..4` = `#8B6A47` → `#A58868` → `#C0A68C` → `#DCCBB6`. Steps assigned by **series order**, not by value, so a series keeps its step across renders. `--chart-pipeline` = ramp 1, `--chart-accepted` = ramp 2.

No sage, no terracotta, no categorical hues in charts — those stay semantic, so a green mark always means "good" and never "series 2".

**Contrast constraint**: steps 2–4 measure **3.08 / 2.15 / 1.47** on card cream. Decorative only — every ramp segment needs its legend label, and any figure encoded in the ramp must also appear as text.

### DISC — the one sanctioned categorical set

`--disc-d` `#C0392B` · `--disc-i` `#D4680A` · `--disc-s` `#1A7A40` · `--disc-c` `#1A5F8A`. **Domain data, exempt from brown discipline**: the D/I/S/C quadrants are an external psychometric instrument, so the encoding travels with the content. Repointing them onto the brown ramp was proposed twice and declined twice — the ramp is *sequential*, so a 4-way categorical encoding would land a selected-option border on `#DCCBB6` (~1.1:1 on cream) and destroy the wizard's selection affordance.

As solid marks on card cream they measure **5.05 / 3.37 / 4.99 / 6.39** — all clear the 3:1 floor for non-text UI. They **must not** be used as text: at 10–11px every one fails on its own tint, which is why every DISC pill puts its letter on `--fg`. On the 14% band over page cream, `--fg` reads 8.72–9.20 and `--fg-dim` 5.24–5.53; `--fg-muted` reads 3.37–3.56 and is **banned** from any DISC tint.

## Anti-patterns

- ❌ Page bg == card bg (cards vanish)
- ❌ `--fg-muted` on the page ground → use `--fg-dim`
- ❌ Raw `#5A7A5E` / `#D97551` as text under 18px
- ❌ Page-tuned variants substituted into status pills
- ❌ Cool neutrals (`zinc-*` / `slate-*` / `gray-*`) or saturated Tailwind defaults (`red-*` / `blue-*` / `green-*` / `amber-*`) on the warm ground
- ❌ Navy / gold leftovers (`#0D1B2A`, `#12202F`, `#C9A84C`)
- ❌ Terracotta focus rings — the focus accent is brown
- ❌ Card-flooding error states — 2a errors are row-level
- ❌ Hardcoded hex where a token utility or `var(--…)` exists

## Historical — navy/gold era (locked 2026-07-14, retired 2026-07-25)

<details>
<summary>The always-dark Editorial navy/gold palette. Kept for archaeology — the token NAMES survived the migration, the values did not. Do not use these hexes.</summary>

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
| Brand accent (links, badges, focus) | `#C9A84C` gold | `--brand-red` — **legacy NAME, then holding gold** (name frozen; 80+ consumers) |
| Soft accent tint | gold @ 12% | `--accent-red-soft-bg` / `-fg` — also legacy names, gold values |
| Focus ring shadow | gold @ 35% | `--shadow-focus` |

**Superseded** slate-800 CTA / red-700 accent (2026-04-19 lock) — user reversal 2026-07-14, recorded in [LOCKED_PICKS.md](../../99-refactor/_system/LOCKED_PICKS.md).

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

| Status | Bg | Fg | Dot |
|---|---|---|---|
| **draft** | cream @ 8% | `#B8AE96` | `#8A8070` |
| **sent** | blue @ 15% | `#7EB3F5` | `#3B82F6` |
| **accepted** | green @ 15% | `#4ADE80` | `#16A34A` |
| **rejected** | DISC-D red @ 15% | `#E8836F` | `#C0392B` |
| **expired** | orange @ 15% | `#FB923C` | `#EA580C` |
| **revised** | purple @ 15% | `#C084FC` | `#9333EA` |

### Chart palette · delta badge · glass

| Role | Hex | Token |
|---|---|---|
| Primary series | `#C9A84C` gold | `--chart-pipeline` |
| Secondary / positive series | `#4ADE80` green-400 | `--chart-accepted` |
| Delta positive | green @ 15% / `#4ADE80` | `--delta-positive-bg` / `-fg` |
| Delta negative | DISC-D red @ 15% / `#E8836F` | `--delta-negative-bg` / `-fg` |
| Glass background | navy `rgb(13 27 42 / 0.72)` | `--surface-translucent-bg` / `--glass-bg` |
| Glass border | navy hairline @ 60% | `--surface-translucent-border` |

### Zinc + red Radix scales (deleted 2026-07-25)

The `@theme` block used to expose `--color-zinc-1..12` and `--color-red-1..12` (AppBase-era). Both scales were **deleted** in the Kopi migration — cool grey and pure red both fight the warm cream ground, and no component, test or doc consumed them. Tailwind's own `zinc-*` / `red-*` defaults are a separate thing and are likewise not part of this brand.

</details>

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — palette + type scale + states authority
- [decisions.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md) — why each override exists
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — enforcement + anti-patterns
- [TOKENS.md](./TOKENS.md) — every token, current values
- [TYPOGRAPHY.md](./TYPOGRAPHY.md) — the 18px serif floor these variants pair with
- [DARK_MODE.md](./DARK_MODE.md) — theming + the light-pinning contract (file name is legacy)
- [src/index.css](../../../src/index.css) — runtime source of truth
