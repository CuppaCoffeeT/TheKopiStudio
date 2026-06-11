# Typography

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

## Font families

| Family | CSS var | When to use | Examples |
|---|---|---|---|
| **Roboto** | `--font-sans` | Body text, UI labels, form inputs, paragraphs | `<p>`, `<label>`, form fields, toast text |
| **Geist Mono** | `--font-mono` (alias `--font-subheader`) | Table headers, numeric labels, keyboard chips, code | `<kbd>`, `<code>`, column names, tabular numbers, KPI value |
| **Geist Pixel Square** | `--font-pixel` | Display headings ≤48px (h1–h6) | `<h1>` page titles, section heroes |
| **Geist Pixel Grid** | `--font-pixel-display` | Oversized displays ≥140px | 404 hero, error codes, full-page stats |

Source: [src/index.css](../../../src/index.css) `@font-face` block (lines ~483–540). Geist Pixel font files live in `public/fonts/`.

## The pixel-size rule (LOCKED)

Per [DESIGN_REUSE_PRINCIPLES.md](../../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) rule 7:

| Size | Font | Why |
|---|---|---|
| ≤48px | **Geist Pixel Square** (`--font-pixel`) | Crisp pixel shapes at UI sizes; never pixelated-look |
| ≥140px | **Geist Pixel Grid** (`--font-pixel-display`) | Grid shows off at hero scale only |
| 49–139px | **Avoid** — redesign the hierarchy | This gap is a deliberate anti-pattern |

**Common mistake**: using Grid for the dashboard greeting (~32px) — produces a "retro game" feel the user didn't want. Square renders clean at that size.

## Heading scale

Defaults set in `src/index.css`; primitives apply them via `PageTitle` / `PageDescription`. Avoid raw `<h1>` (blocked by the primitives-only compliance gate 6e — see [MODULE_COMPLIANCE_CHECKLIST.md](../../06-operations/MODULE_COMPLIANCE_CHECKLIST.md)).

| Element | Size | Line-height | Font | Used by |
|---|---|---|---|---|
| h1 | 30–36px | 1.1 | Geist Pixel Square | `PageTitle` · `DetailPageFrame` hero |
| h2 | 24–28px | 1.15 | Geist Pixel Square | `CategoryHeader` · section heads |
| h3 | 20–22px | 1.2 | Geist Pixel Square | Card titles · sub-sections |
| h4–h6 | 16–18px | 1.25 | Roboto medium | Inline section breaks |

## Body + label

| Role | Size | Font | Color token |
|---|---|---|---|
| Body | 14–15px | Roboto 400 | `--fg-dim` (zinc-800) |
| Label | 13px | Geist Mono 500 uppercase | `--fg-muted` (zinc-500) |
| Caption / hint | 12px | Roboto 400 | `--fg-muted` |
| KPI value | 28–48px | Geist Mono 600 tabular-nums | `--fg` (zinc-900) |
| Kbd chip | 11px | Geist Mono 500 | `--fg-dim` on zinc-100 bg |

## Preview references

- [`type-families.html`](../../99-refactor/_system/design/) — all four families side-by-side
- [`type-headings.html`](../../99-refactor/_system/design/) — h1–h6 scale with line-heights
- [`type-body.html`](../../99-refactor/_system/design/) — paragraph + label examples
- [`type-pixel.html`](../../99-refactor/_system/design/) — Square vs Grid at all sizes (the 48px cutoff demo)

Full handoff catalog: [DESIGN_LAB_CATALOG.md](./DESIGN_LAB_CATALOG.md).

## 📚 Related

- [COLORS.md](./COLORS.md) — text-color tokens
- [PHILOSOPHY.md](./PHILOSOPHY.md) rule 7 — font roles
- [src/index.css](../../../src/index.css) — runtime `@font-face` + CSS variables
- [src/components/primitives/shell/PageTitle.tsx](../../../src/components/primitives/shell/PageTitle.tsx) — heading primitive
