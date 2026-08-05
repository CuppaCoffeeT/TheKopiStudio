# Typography

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-08-05 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md)

**Instrument Serif headings over IBM Plex Sans body** (The Kopi Studio, direction 2a "Kopi House", locked 2026-07-25). Two webfonts, both served from Google Fonts via the `<link>` in [index.html](../../../index.html) — **not** `@fontsource`, nothing self-hosted:

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Instrument Serif ships **weight 400 only** (roman + italic) — never ask it for bold. IBM Plex Sans carries 400/500/600/700.

> ## The hard floor: Instrument Serif never renders below 18px.
> Anything smaller is IBM Plex Sans, no exceptions. The rule holds without exception across the whole 2a comp. Georgia survives only as the serif's offline fallback *inside* the font stack — an inline `fontFamily: 'Georgia, serif'` anywhere in the app is a bug, not a fallback.

## Font families (actual stacks)

| Role | CSS var | Stack | When to use |
|---|---|---|---|
| **Body / UI sans** | `--font-sans` (alias `--font-subheader`) | `'IBM Plex Sans', system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif` | Body, labels, form inputs, buttons, nav, breadcrumbs, table body, h2–h6, toasts, prose |
| **Serif display** | `--font-pixel` | `'Instrument Serif', Georgia, "Times New Roman", serif` | `<h1>` / page titles, section heads, KPI + numeric table cells, wordmark, empty-state + loading lines |
| **Serif prose** | `--font-prose` | same as above | Serif headings *inside* prose containers — **not** the prose body |
| **Serif giant display** | `--font-pixel-display` | same as above | 110px+ moments: 404 / route-error codes, splash. `.font-pixel-display` utility class exists for these |
| **Mono** | `--font-mono` | `ui-monospace, SFMono-Regular, Menlo, monospace` | `<code>` / `<kbd>` / `<pre>` only |

Source: [src/index.css](../../../src/index.css) `@theme` font block.

## The `--font-pixel` alias situation (read this honestly)

The var **names** are frozen — ~130 src files reference them — so they no longer describe their value. Today they simply mean "the serif":

- `--font-pixel` · `--font-pixel-display` · `--font-prose` → **Instrument Serif**
- `--font-sans` · `--font-subheader` → **IBM Plex Sans**

Consequences:

- `--font-pixel` ≠ pixel font. It is the **serif display token**. Treat the name as a frozen compat alias.
- **Never set `--font-pixel*` on anything under 18px** — the one rule the alias cannot protect you from.
- New code relies on the global `h1` rule plus per-component serif opt-ins at their spec'd size; reach for `--font-pixel` directly only when matching an existing primitive's pattern.
- The retired shape aliases (`--font-pixel-{square,grid,circle,triangle,line}`) were **deleted 2026-07-25** — nothing referenced them.

## The 2a type scale

**Serif slots** — all ≥ 18px, all `--fg` unless stated:

| Role | Spec |
|---|---|
| Detail page title | Instrument Serif 38px · lh 1.1 · tracking `-0.018em` |
| Greeting (masthead) | Instrument Serif **fluid `clamp(38px, 2.2vw + 22px, 50px)`** · lh 1.05 · tracking `-0.02em` — supersedes the comp's fixed 36px (2026-08-05 hero step; see the 2a handoff decisions.md) |
| KPI numeral | Instrument Serif 32px (unit is IBM Plex Sans 13px `--fg-muted`) |
| List page title | Instrument Serif 30px (inline count IBM Plex Sans 14px `--fg-muted`) |
| Stat numeral (detail) | Instrument Serif 24px |
| Section head · sidebar wordmark | Instrument Serif 22px (wordmark lh 1.15, second word *italic* in brown) |
| Empty-state line | Instrument Serif 20px *italic* |
| Loading verb | Instrument Serif 19px *italic* |
| Numeric / money table cell | Instrument Serif 18px · right-aligned |
| Index numeral | Instrument Serif 18px · `--brand-brown` (raw brown is sanctioned at the threshold — it is decorative) |

**Sans slots** — all under the floor, all IBM Plex Sans:

| Role | Spec |
|---|---|
| Dateline / kicker | 600 11px · uppercase · tracking `.14em` · `--fg-muted` on card, **`--fg-dim` on the page ground** |
| Card / panel label | 600 11px · uppercase · tracking `.12em` · `--fg-muted` |
| Table header | 600 10.5px · uppercase · tracking `.1em` · `--fg-muted` |
| Table body | 13px `--fg-dim`; primary cell `--fg` 500; meta cell `--fg-muted` (card) / `--fg-dim` (bare, on the page) |
| Inline row meta (email) | 12px · `--fg-muted` |
| Prose / notes | 13.5px / 1.6 · `--fg-dim` |
| Nav item | 13px · idle `--fg-muted` · hover `--brown-text` · current `--fg` 600 |
| Button label | 600 12.5px |
| Input text | 400 13px · `--fg` |
| Breadcrumb | 12px · earlier segments `--fg-dim` · current `--fg` |
| KPI meta line | 12.5px · `--fg-muted` |
| Stat label (detail) | 11px · `--fg-muted` |
| Status pill | 600 11.5px (own tuned colour pairs — see [COLORS.md](./COLORS.md)) |
| Plain-text status | 600 12px — `--sage-text` "Generated" · `--fg-muted` "Pending" |
| Legend / caption | 11.5px · `--fg-muted` |

**Every row in the sans table is under 18px**, which is why colour matters there: a brand hue needs its AA variant, and `--fg-muted` on the page ground must step to `--fg-dim`. See [COLORS.md](./COLORS.md).

## Heading scale (`@layer base`)

The ladder steps ×1.25 off the 16px body (16 → 20 → 25, then 31 → 39 → 49 at the hero end); the 2a role stops (30 list / 38 detail) sit on the same curve. Retuned 2026-08-05 — weight 600 above the 400 body for real subheading contrast, tight leading + negative tracking at display sizes, `text-wrap: balance` on all headings, `text-wrap: pretty` on `p`.

| Element | Size | Font | Notes |
|---|---|---|---|
| h1 | fluid `clamp(2.4375rem, 1.2vw + 2rem, 3.0625rem)` (39→49px), lh 1.06, 400, tracking `-0.02em` | Instrument Serif (`--font-pixel`) | The only heading level the serif claims globally — the 39px clamp floor clears the 18px serif floor |
| h2 | 1.5625rem (25px), lh 1.25, 600, tracking `-0.012em` | IBM Plex Sans | Section heads |
| h3 | 1.25rem, lh 1.3, 600, tracking `-0.01em` | IBM Plex Sans | Card titles |
| h4 | 1.125rem, lh 1.4, 600, tracking `-0.005em` | IBM Plex Sans | Inline breaks |
| h5 | 1rem, lh 1.5, 500 | IBM Plex Sans | Inline breaks |
| h6 | 0.71875rem (11.5px), lh 1.5, 600, uppercase, tracking `.12em` | IBM Plex Sans | The kicker voice as an element default |

**h2–h6 are sans by design**: h5 (16px) and h6 (11.5px) land under the floor, so a blanket serif rule would break it. Serif section heads are opted into per component at their spec'd 22px. The detail H1 takes its 38px step **at the archetype**, not in `PageTitle`.

**Utility optics (2026-08-05)**: every Tailwind `text-*` step carries tuned leading/tracking in `@theme` — sizes stay Tailwind's, but `text-xs`/`text-sm` read at 1.5/1.55 leading with a hair of positive tracking, and `text-xl`+ tighten progressively (`-0.01em` → `-0.02em`, lh 1.35 → 1.05). Long-form copy caps its measure with `max-w-measure` (65ch token). `font-synthesis-weight: none` is set on `body` so a stray bold on Instrument Serif renders honest 400 instead of a faux bold.

Body default: `line-height: 1.6`, `font-family: var(--font-sans)`. Prose containers (`.prose`, `[data-font="prose"]`) are explicitly forced to sans — body prose is 13.5px, below the floor, so the serif is reserved for headings inside them.

Prefer the [`PageTitle`](../../../src/components/primitives/shell/PageTitle.tsx) / [`PageDescription`](../../../src/components/primitives/shell/PageDescription.tsx) primitives over a raw `<h1>`.

## Links

Global `a` rule: `color: var(--brand-red)` — a **legacy name now holding the AA-safe brand brown** `#806241` — hover → `--cta-primary-bg-hover` `#7D5F3D`. Link text is body-sized, which is why it takes the AA-safe variant rather than raw brown. Only `:focus-visible` is styled, so mouse users never see a ring; that ring is 2px **raw** brown (`--ring`) at 2px offset, because it is a mark, not type.

## Numerals

Serif numerals are the product's texture: KPI figures, stat values, money columns and index numbers are all Instrument Serif. **The mono stack left the list surfaces in 2a** — `--font-mono` survives for `<code>`/`<kbd>`/`<pre>` and as a tabular-figures alias. Where columns need alignment, use the `tabular-nums` utility on IBM Plex Sans rather than swapping to mono.

## Historical — pre-Kopi font eras

<details>
<summary>Which name held which family in which era. Kept so a future reader can date a stale reference. Do not use these.</summary>

- **2026-04-19 → 2026-07-07 (AppBase era)**: `--font-pixel` = Geist Pixel Square, `--font-pixel-display` = Geist Pixel Grid, plus `-square` / `-grid` / `-circle` / `-triangle` / `-line` shape aliases. Body was Geist Sans / Roboto.
- **2026-07-07 → 2026-07-25 (Editorial navy/gold era)**: every `--font-pixel*` variant was repointed to **Georgia serif** so existing consumers rendered serif without a rename sweep; body was `system-ui`. No webfonts were loaded.

### What NOT to try again

- The old **"Square ≤48px / Grid ≥140px"** pixel-size rule is obsolete twice over.
- The self-hosted Geist Pixel `@font-face` blocks, the `public/fonts/` binaries and the shape aliases were **deleted**. Do not reintroduce them.
- The `.font-pixel-crisp` / `.font-pixel-bold` antialiasing hacks were deleted too — **disabling antialiasing wrecks Instrument Serif.** Never re-add `-webkit-font-smoothing: none` or `image-rendering: pixelated` to a text class.
- Compliance gates 6a–6e (the primitive-coverage greps that once policed raw `<h1>`) were **retired 2026-07-21**; do not cite them.

</details>

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — authoritative type scale
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — enforcement (incl. the 18px serif floor)
- [COLORS.md](./COLORS.md) — the colour half of every row above
- [PHILOSOPHY.md](./PHILOSOPHY.md) — why serif/sans contrast carries the hierarchy
- [src/index.css](../../../src/index.css) — runtime font vars + heading rules
- [src/components/primitives/shell/Wordmark.tsx](../../../src/components/primitives/shell/Wordmark.tsx) — the one brand lockup
