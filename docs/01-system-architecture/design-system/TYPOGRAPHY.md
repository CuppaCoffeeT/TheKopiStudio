# Typography

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-14 SGT
**Status**: 🟢 Production

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

Serif-display + system-sans stack (2026-07-07 de-AppBase, confirmed by the 2026-07-14 Editorial lock). No webfonts are required — everything resolves to system-installed families.

## Font families (actual stacks)

| Role | CSS var | Stack | When to use |
|---|---|---|---|
| **Body / UI sans** | `--font-sans` (alias `--font-subheader`) | `system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif` | Body text, labels, form inputs, h2–h6, toasts |
| **Serif display** | `--font-pixel` (see alias note) | `Georgia, "Times New Roman", serif` | `<h1>` / page titles — the editorial signature |
| **Serif prose** | `--font-prose` | `Georgia, "Times New Roman", serif` | Long-form text (`.prose`, `[data-font="prose"]`) |
| **Serif giant display** | `--font-pixel-display` | `Georgia, "Times New Roman", serif` | Oversized displays (404, splash) — same face as `--font-pixel` now |
| **Mono** | `--font-mono` | `ui-monospace, SFMono-Regular, Menlo, monospace` | `<code>`/`<kbd>`/`<pre>`, tabular numbers, KPI values |

Source: [src/index.css](../../../src/index.css) `@theme` font block.

## The `--font-pixel` alias situation (read this honestly)

The var **names** date from the AppBase era, when `--font-pixel` = Geist Pixel Square and `--font-pixel-display` = Geist Pixel Grid. On 2026-07-07 (de-AppBase) every `--font-pixel*` variant — including `-square/-grid/-circle/-triangle/-line` — was **repointed to Georgia serif** so all existing consumers (the global `h1` rule, `PageTitle`, `.font-pixel-display` utility) render serif without a rename sweep.

Consequences:
- `--font-pixel` ≠ pixel font. It is the **serif display token**. Treat the name as a frozen compat alias.
- The Geist Pixel `@font-face` declarations + `public/fonts/` files + `.font-pixel-crisp` / `.font-pixel-bold` utilities still exist in `index.css` but are dead weight for the current design — don't add new usages.
- New code should prefer `--font-prose` for serif prose and rely on the global `h1` / heading rules for display; only reach for `--font-pixel` when matching an existing primitive's pattern.
- The old "Square ≤48px / Grid ≥140px" pixel-size rule is **obsolete** — both vars are Georgia now.

## Heading scale

Defaults in `src/index.css` `@layer base`; primitives apply them via `PageTitle` / `PageDescription`. Avoid raw `<h1>` (compliance gate 6e).

| Element | Size | Font | Notes |
|---|---|---|---|
| h1 | 2.75rem (44px), lh 1 | Georgia serif (`--font-pixel`) | Global rule; ships with legacy crisp-render props (harmless on serif) |
| h2 | 1.5rem, lh 1.2, 500 | system sans (`--font-subheader`) | Section heads |
| h3 | 1.25rem, lh 1.25, 500 | system sans | Card titles |
| h4–h5 | 1.125–1rem, 500 | system sans | Inline breaks |
| h6 | 0.875rem, 500, uppercase | system sans | Micro-labels |

## Body + label

| Role | Size | Font | Color token |
|---|---|---|---|
| Body | 14–15px | system sans 400 | `--fg` (cream) |
| Secondary | 13–14px | system sans 400 | `--fg-dim` |
| Label / meta | 12–13px | system sans 500 | `--fg-muted` |
| Prose | 15–16px | Georgia serif (`--font-prose`) | `--fg` |
| KPI value | 28–48px | mono 600 tabular-nums | `--fg` |
| Kbd chip | 11px | mono 500 | `--fg-dim` |

## Links

Global `a` rule: gold (`--brand-red` — legacy name, gold value), hover → `--cta-primary-bg-hover` (lighter gold). Focus-visible outline = 2px gold.

## 📚 Related

- [COLORS.md](./COLORS.md) — text-color tokens
- [PHILOSOPHY.md](./PHILOSOPHY.md) — the 2026-07-14 direction
- [src/index.css](../../../src/index.css) — runtime font vars + heading rules
- [src/components/primitives/shell/PageTitle.tsx](../../../src/components/primitives/shell/PageTitle.tsx) — heading primitive
