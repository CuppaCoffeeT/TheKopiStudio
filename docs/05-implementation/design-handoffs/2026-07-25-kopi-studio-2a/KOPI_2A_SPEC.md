# 2a "Kopi House" — applied direction spec

Source: `Kopi Studio Directions.dc.html` (Claude Design canvas, turn 2, option **2a**, user-picked 2026-07-25). Brand authority: [`kopi-studio-brand-card.html`](./kopi-studio-brand-card.html). Supersedes the 2026-07-21 1a Masthead navy/gold direction — see [decisions.md](./decisions.md).

Comp's own one-liner: *"quiet broadsheet. Brown reserved for CTA, focus and index numerals; hairline borders carry the layout. Viz is a single brown ramp. Signature: dateline greeting."*

**Where the comp and the brand card disagree, the comp wins on layout; the brand card wins on palette.** Conflicts are listed explicitly below rather than silently resolved.

## Palette — brand base

page `#f0e6d6` · card `#faf6ee` · raised/modal `#ffffff` · border `#d9ccc0` · text `#3a2e24` · muted `#7d6b5b` · brown `#8b6a47` (hover `#7d5f3d`) · sage `#5a7a5e` (hover `#4a6a4e`) · terracotta `#d97551`.

Extended palette (grey `#e8e6e0`, green box `#d9e8e0`) is **reports only** — never app chrome. The one exception the comp makes is the positive status pill, which borrows `#d9e8e0` as a tint; see [Status pills](#status-pills).

## Accessibility override — three text-only variants

The raw brand hexes are tuned as *fills*, not as *type*. Measured against the two surfaces they actually sit on:

| Token | Hex | on page `#f0e6d6` | on card `#faf6ee` | Replaces (raw ratios) |
|---|---|---|---|---|
| `--brown-text` | `#806241` | **4.54** | **5.21** | `#8b6a47` — 4.00 / 4.58 |
| `--sage-text` | `#526f56` | **4.51** | **5.17** | `#5a7a5e` — 3.88 / 4.45 |
| `--negative-text` | `#ab4925` | **4.58** | **5.25** | `#d97551` — 2.57 / **2.95** |

**Why they exist.** Raw sage and raw terracotta miss AA (4.5:1) on both surfaces — terracotta by a wide margin, and the comp uses it for live text (the "Overdue · 12 Jul" cell, 13px). Raw brown is the subtler trap: it *passes* on card (4.58) and *fails* on page (4.00), so using it for small text would make legality depend on which surface a component lands on. One variant per hue removes the surface-dependent rule entirely.

**Scope of the override — text under 18px only.** The raw brand hexes stay correct and unchanged for fills, borders, icons, chart marks, and display type ≥ 18px. Concretely: a primary button keeps `background:#8b6a47`; a secondary button's *label* becomes `--brown-text`. The comp's serif index numeral (18px brown) stays raw — it is at the threshold and is decorative.

Never use `#5a7a5e` or `#d97551` for small text under any circumstance.

**Open item — muted on page.** `#7d6b5b` measures 4.72 on card but **4.12 on page** (and 4.37 on the `#f3ede3` hover fill). The comp puts muted text directly on the page colour in several places — the dashboard dateline, KPI meta lines, table meta cells. This is a real AA gap that the three variants above do not cover. No fourth hex is specified here because none appears in the comp or brand card; resolve before build by either darkening the muted token or confining muted text to card surfaces.

## Derived neutrals (in the comp, not in the brand card)

| Hex | Role |
|---|---|
| `#f3ede3` | nav hover + active-item fill; secondary button hover (brand card names this as secondary hover) |
| `#ebe2d4` | pressed fill — nav `:active`, secondary button `:active` |
| `#6d5233` | primary button `:active` (one step past the brand card's `#7d5f3d` hover) |
| `#e0d3c3` | table row hairline — deliberately lighter than `--color-border` |
| `#c0a68c` | hover border on interactive cards and secondary buttons |
| `#c9b9a5` | outer frame border; dashed border on the loading placeholder |
| `#5d4f3f` | table row body text and long-form prose (7.34 on card) |
| `#a58868` `#c0a68c` `#dccbb6` | brown viz ramp, steps 2–4 |

## Brown discipline (the 2a rule)

Brown is **punctuation, not authority-by-volume**. It appears ONLY as:

- primary CTA fill (`#8b6a47`)
- the focus ring — 2px, on every interactive element
- the active nav item's 2px left border
- index numerals (Instrument Serif 18px, KPI card top-right: `01`, `02`)
- the viz ramp anchor and the loading bar fill
- small-text accents via `--brown-text`: secondary button labels, form labels, the wordmark's italic second word

Brown is **NOT**:

- a page-header gradient. The brand card offers `linear-gradient(135deg, #8b6a47 → #7d5f3d)` for page headers; **2a does not use it.** The masthead is a serif greeting on the page background over a single hairline.
- a filled nav pill. The brand card specifies active nav as brown fill + cream text; **2a uses a 2px brown left border + `#f3ede3` fill + `#3a2e24` text.**
- section-title colour. The brand card puts section titles in brown; **2a renders every section head `#3a2e24`.** Brown never carries a heading in this direction.
- table headers, body copy, icons, or decorative fills.

Hierarchy is carried by serif/sans contrast, text-colour steps (`#3a2e24` → `#5d4f3f` → `#7d6b5b`), and hairlines.

## Type scale

Instrument Serif never appears below 18px anywhere in the comp — the rule holds without exception. Everything else is IBM Plex Sans.

| Role | Spec |
|---|---|
| Dateline / kicker | 600 11px · uppercase · tracking `.14em` · `#7d6b5b` |
| Greeting (masthead) | Instrument Serif 36px · `#3a2e24` · line-height 1.1 |
| Detail page title | Instrument Serif 38px · `#3a2e24` · line-height 1.1 |
| List page title | Instrument Serif 30px · `#3a2e24` · inline count IBM Plex Sans 14px `#7d6b5b` |
| Section head | Instrument Serif 22px · `#3a2e24` |
| Sidebar wordmark | Instrument Serif 22px · `#3a2e24` · line-height 1.15 · second word italic `#8b6a47` |
| KPI numeral | Instrument Serif 32px · `#3a2e24` · unit IBM Plex Sans 13px `#7d6b5b` |
| Stat numeral (detail) | Instrument Serif 24px · `#3a2e24` |
| Numeric table cell | Instrument Serif 18px · `#3a2e24` · right-aligned |
| Index numeral | Instrument Serif 18px · `#8b6a47` |
| Empty-state line | Instrument Serif 20px *italic* · `#3a2e24` |
| Loading verb | Instrument Serif 19px *italic* · `#3a2e24` |
| Card / panel label | 600 11px · uppercase · tracking `.12em` · `#7d6b5b` |
| Table header | 600 10.5px · uppercase · tracking `.1em` · `#7d6b5b` |
| Table body | 13px · `#5d4f3f`; primary cell `#3a2e24` 500; meta cell `#7d6b5b` |
| Inline row meta (email) | 12px · `#7d6b5b` |
| Prose / notes | 13.5px / 1.6 · `#5d4f3f` |
| Nav item | 13px · idle `#7d6b5b` · active `#3a2e24` 600 |
| Button label | 600 12.5px |
| Input text | 400 13px · `#3a2e24` |
| Breadcrumb | 12px · `#7d6b5b` · current segment `#3a2e24` |
| KPI meta line | 12.5px · `#7d6b5b` |
| Stat label (detail) | 11px · `#7d6b5b` |
| Status pill | 600 11.5px |
| Legend / caption | 11.5px · `#7d6b5b` |
| Report-status cell | 600 12px |

## Layout language

**Shell.** Sidebar 206px (fixed, `flex:none`) + fluid content pane. The sidebar is the **lighter** surface — `#faf6ee` card cream against the `#f0e6d6` page — separated by `border-right: 1px solid #d9ccc0`. It is not a dark rail. Sidebar padding `22px 0`, item gap 2px. Content pane padding `34px 40px`, sitting on the page colour with no card wrapper.

**Sidebar items.** Padding `9px 22px`, 13px, `border-left: 2px solid transparent` on every item so nothing shifts when the active marker appears.

| State | Spec |
|---|---|
| Idle | `#7d6b5b` · transparent border-left · no fill |
| Hover | `--brown-text` · fill `#f3ede3` |
| Active (pressed) | fill `#ebe2d4` |
| Current | `#3a2e24` 600 · `border-left: 2px solid #8b6a47` · fill `#f3ede3` |
| Focus | `outline: 2px solid #8b6a47; outline-offset: -2px` (inset — an outer ring collides with the rail edge) |

**Hairlines do the layout work — two tiers.** `#d9ccc0` for structure: section-header underlines, the sidebar edge, card borders, the empty-state divider. `#e0d3c3` for repetition: table row separators, applied as `border-top` so the header rule and first row rule do not double. `#c9b9a5` is the outer frame and the dashed loading placeholder only. Never nest boxed sub-cards — use a grid plus a hairline.

**Cards.** `#faf6ee`, `1px solid #d9ccc0`, radius 12px. Padding `20px 22px` (KPI tiles) or `22px` (detail panels). **Rest state has no shadow** — the lift comes from the cream-on-page step. Interactive cards only: hover adds `box-shadow: 0 2px 8px rgba(58,46,36,.1)` and `border-color: #c0a68c`. Note the shadow is warmed — the brand card's `rgba(0,0,0,0.1)` becomes `rgba(58,46,36,.1)` in the comp; use the comp's.

**Rhythm.** Section spacing 22–26px. Radius 8px small (buttons, inputs), 12px large (cards, panels), 99px pills, 5px on the viz bar, 2px on the loading bar.

## Archetype — dashboard

Sidebar + content pane, min-height 640px.

1. **Masthead block** — dateline (600 11px, `.14em`, uppercase, muted) over the serif 36px greeting (`margin-top: 8px`). Closed by `border-bottom: 1px solid #d9ccc0`, `padding-bottom: 22px`, `margin-bottom: 26px`. The dateline carries one live context stat: `Saturday · 25 July 2026 · 4 reviews due this week`.
2. **KPI grid** — `1fr 1fr`, gap 18px, `margin-bottom: 26px`. Each tile: uppercase module label left / serif index numeral right on a baseline-aligned flex row, then the serif 32px figure (`margin: 8px 0 2px`) with its unit inline in 13px sans, then a 12.5px muted meta line. Whole tile is clickable.
3. **Section head** — flex row, baseline-aligned, serif 22px title left and the primary CTA right, closed by `border-bottom: 1px solid #d9ccc0`, `padding-bottom: 10px`.
4. **Table** — sits directly under the section head with **no card wrapper**. TH padding `12px 8px 8px 0`; TD padding `11px 8px 11px 0`. Last column right-aligned, padding `12px 0 8px 0` / `11px 0`.

## Archetype — list

One card, padding `34px 40px`.

- **Header** — flex, baseline-aligned, `border-bottom: 1px solid #d9ccc0`, `padding-bottom: 16px`. Left: kicker (600 11px, `.14em`, uppercase) over serif 30px title with the row count inline in 14px sans muted. Right: search input (220px) + primary CTA, gap 10px, centre-aligned.
- **Table** — full-bleed inside the card. TH padding `14px 8px 10px 0`; TD padding `12px 8px 12px 0`; last column `12px 0`, right-aligned.
- **Money column** — right-aligned, Instrument Serif 18px `#3a2e24`. Serif numerals are the list's texture; do not substitute a mono stack.
- **Primary cell** — name `#3a2e24` 500 with the email trailing inline at 12px muted, same cell.
- **Empty state** — lives *below* the table behind `border-top: 1px solid #d9ccc0`, `padding: 40px 0 8px`, centred.

**Rows are interactive.** `border-top: 1px solid #e0d3c3`, body `#5d4f3f`, `cursor: pointer`, `tabindex="0"`. Hover `#faf6ee`, active `#f3ede3`, focus `outline: 2px solid #8b6a47; outline-offset: -2px`. Row focus is inset so the ring does not overlap the hairlines above and below.

## Archetype — detail

One card, padding `34px 40px`.

- **Breadcrumb** — 12px muted, trailing segment `#3a2e24`, `margin-bottom: 16px`.
- **Header** — flex, `align-items: flex-end`, `border-bottom: 1px solid #d9ccc0`, `padding-bottom: 20px`. Left: serif 38px name (line-height 1.1) over a 13px muted subtitle (`margin-top: 6px`) that concatenates role · tenure · risk. Right: action pair, gap 10px — secondary then primary, in that order.
- **Body** — `grid-template-columns: 1.4fr 1fr`, gap 22px, `margin-top: 22px`. Each column is a flex column, gap 22px. Wide column carries the data-dense panels; narrow column carries reference data and transient states.
- **Panels** — `#faf6ee`, 1px `#d9ccc0`, radius 12px, padding 22px. Every panel opens with the uppercase 11px `.12em` muted label; label bottom margin 16px (stat panel) / 14px (list panel) / 12px (prose panel).
- **Stat panel** — `repeat(4, 1fr)`, gap 14px; each cell is an 11px muted label over a serif 24px value (`margin-top: 2px`). The ramp bar follows at `margin-top: 20px`.
- **Reference panel** — flex column, gap 10px, 13px; each row `justify-content: space-between` with a muted label left and `#3a2e24` value right. No hairlines between rows — the gap alone separates them.

## States

- **Empty** — serif 20px *italic* line naming the actual query (`No clients match "kelvin".`), a 12.5px muted explanatory line (`margin-top: 6px`), then **one** quiet secondary action (`margin-top: 14px`). No illustration, no icon, no primary CTA.
- **Loading** — a placeholder panel with `1px dashed #c9b9a5`, centred: serif 19px *italic* verb (`Generating report…`), then the bar (`margin: 12px auto 0`, width 70%, height 4px, track `#e0d3c3`, radius 2px, fill `#8b6a47`), then an 11.5px muted caption. The bar fill is the only brown in the panel. Skeleton rows, where used, keep the `#e0d3c3` hairline rhythm.
- **Error** — errors are **row-level, never card-flooding**. 2a shows an overdue date as an inline cell in terracotta at weight 500 and a missing-field condition as a pill. No red panel fills, no tinted card backgrounds, no red borders on containers. The surrounding row keeps its normal `#5d4f3f` body colour. **AA override applies**: the comp's raw `#d97551` cell text at 13px measures 2.57 on page — ship it as `--negative-text` `#ab4925`.

## Status pills

Radius 99px, padding `3px 10px`, 600 11.5px. Tint fill + darkened text of the same hue — never a saturated fill.

| Meaning | Fill | Text | Ratio |
|---|---|---|---|
| Complete / positive | `#d9e8e0` | `#4a6a54` | 4.76 ✅ |
| In progress (`Step 4 / 7`) | `#f0e2cf` | `#7d5f3d` | 4.61 ✅ |
| Error (`Missing email`) | `#fae0d6` | `#ab4925` | 4.50 ✅ |

The first two are the comp's own values and pass as-is — **do not** substitute the page-tuned text variants, which score *worse* on these tints (`#526f56` on `#d9e8e0` = 4.40, `#806241` on `#f0e2cf` = 4.41). The error pill is the one correction: the comp's `#b04f2c` on `#fae0d6` measures 4.17 and fails, so it takes `--negative-text` `#ab4925`.

Status shown as **plain text** rather than a pill (the list's Report column) uses 600 12px — `--sage-text` for "Generated", `#7d6b5b` for "Pending".

## Data-viz

**One brown ramp, four steps, nothing else**: `#8b6a47` → `#a58868` → `#c0a68c` → `#dccbb6`. Steps are assigned by series order, not by value, so the same series keeps the same step across renders.

Stacked bar: height 10px, radius 5px, `overflow: hidden`, segments butted with no gap and no stroke. Legend below at `margin-top: 10px`, gap 16px, 11.5px muted, each entry a `■` glyph in the series colour followed by the label.

No sage, no terracotta, no categorical hues in charts — those colours stay semantic (status, deltas) so a green mark always means "good" and never "series 2". No gridlines appear in the 2a comp.

**Contrast constraint**: ramp steps 2–4 measure 3.08 / 2.15 / 1.47 against card cream. They are decorative and must never be the sole carrier of meaning — every ramp segment needs its legend label, and any figure encoded in the ramp must also appear as text.

## Buttons

All five states are mandatory on every control. Shared: radius 8px, padding `10px 20px`, 600 12.5px.

| State | Primary | Secondary |
|---|---|---|
| Default | bg `#8b6a47` · text `#faf6ee` · no border | bg `#faf6ee` · text `--brown-text` · 1px `#d9ccc0` |
| Hover | bg `#7d5f3d` | bg `#f3ede3` · border `#c0a68c` |
| Active | bg `#6d5233` | bg `#ebe2d4` |
| Focus | `outline: 2px solid #8b6a47; outline-offset: 2px` | same |
| Disabled | not in the comp — per the brand card, muted `#7d6b5b` is the disabled colour | same |

Primary label contrast: `#faf6ee` on `#8b6a47` = 4.58, on hover 5.45, on active 6.71 — the resting state is the tightest and passes.

**Success button** appears in the brand card but not in the 2a comp: bg `#5a7a5e`, text `#faf6ee`, hover `#4a6a4e`. Its resting label contrast is **4.45 — below AA** for a 12.5px label. If a success button ships, use `#4a6a4e` as the resting fill (5.63) and darken the hover further. Flagged, not resolved.

Ordering is fixed: secondary sits left of primary, gap 10px.

## Inputs

bg `#ffffff` (the raised token — inputs are the only place white appears in the comp), `1px solid #d9ccc0`, radius 8px, padding `10px 14px`, 400 13px, colour `#3a2e24`. List search width 220px.

Focus: `outline: none; border-color: #8b6a47; box-shadow: 0 0 0 3px rgba(139,106,71,.12)`. The brand card specifies `0.1` alpha; the comp uses `.12` — **use the comp's**. This is the one sanctioned exception to "focus is always a visible outline": the input's ring is the box-shadow, and it must never be removed without a replacement.

Labels: `--brown-text`, weight 600 (brand card `#8b6a47` + the AA override, since labels are body-sized).

Hover, active, and disabled input states are not shown in the comp — derive them from the neutral ladder (`#c0a68c` hover border, muted text when disabled) rather than inventing new hues.

## Theme

**Light-pinned. No dark mode.** The brand is defined as a warm cream system; there is no dark counterpart in the brand card or in any of the three directions. Do not emit `prefers-color-scheme` variants or a theme toggle.

## Fonts

Load both families from Google Fonts via a `<link>` in `index.html` — do **not** add `@fontsource` packages.

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

`Instrument Serif` weight 400 only (roman + italic). `IBM Plex Sans` weights 400/500/600/700.
