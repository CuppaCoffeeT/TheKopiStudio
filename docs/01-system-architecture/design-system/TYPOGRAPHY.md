# Typography

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md)

**Instrument Serif headings over IBM Plex Sans body** (The Kopi Studio, direction 2a "Kopi House", locked 2026-07-25). Two webfonts, both served from Google Fonts via the `<link>` in [index.html](../../../index.html) — **not** `@fontsource`, nothing self-hosted.

> **The hard floor: Instrument Serif never renders below 18px.** Anything smaller is IBM Plex Sans, no exceptions. Georgia survives only as the serif's offline fallback *inside* the font stack — an inline `fontFamily: 'Georgia, serif'` anywhere in the app is a bug, not a fallback.

## Font families (actual stacks)

| Role | CSS var | Stack | When to use |
|---|---|---|---|
| **Body / UI sans** | `--font-sans` (alias `--font-subheader`) | `'IBM Plex Sans', system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif` | Body, labels, form inputs, buttons, nav, breadcrumbs, table body, h2–h6, toasts |
| **Serif display** | `--font-pixel` (see alias note) | `'Instrument Serif', Georgia, "Times New Roman", serif` | `<h1>` / page titles, section heads, KPI + numeric table cells, wordmark |
| **Serif prose** | `--font-prose` | `'Instrument Serif', Georgia, "Times New Roman", serif` | Serif headings inside prose containers — **not** the prose body (13.5px is under the floor) |
| **Serif giant display** | `--font-pixel-display` | `'Instrument Serif', Georgia, "Times New Roman", serif` | Oversized displays (404 / route-error codes, splash) |
| **Mono** | `--font-mono` | `ui-monospace, SFMono-Regular, Menlo, monospace` | `<code>`/`<kbd>`/`<pre>`, tabular numbers, error chips |

Source: [src/index.css](../../../src/index.css) `@theme` font block.

## The `--font-pixel` alias situation (read this honestly)

The var **names** are frozen — ~130 src files reference them — so they no longer describe their value. Today they simply mean "the serif":

- `--font-pixel` · `--font-pixel-display` · `--font-prose` → **Instrument Serif**
- `--font-sans` · `--font-subheader` → **IBM Plex Sans**

Consequences:
- `--font-pixel` ≠ pixel font. It is the **serif display token**. Treat the name as a frozen compat alias.
- **Never set `--font-pixel*` on anything under 18px** — that is the one rule the alias cannot protect you from.
- New code should rely on the global `h1` rule and per-component serif opt-ins at their spec'd sizes; reach for `--font-pixel` directly only when matching an existing primitive's pattern.
- The `.font-pixel-display` utility class survives because components key off it for the giant 404 / route-error moments.

## Type scale (2a)

Full table: [KOPI_2A_SPEC.md → Type scale](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md). The serif slots, all ≥ 18px:

| Role | Spec |
|---|---|
| Detail page title | Instrument Serif 38px · `--fg` · lh 1.1 |
| Greeting (masthead) | Instrument Serif 36px · `--fg` · lh 1.1 |
| KPI numeral | Instrument Serif 32px · `--fg` (unit is IBM Plex Sans 13px `--fg-muted`) |
| List page title | Instrument Serif 30px · `--fg` (inline count IBM Plex Sans 14px `--fg-muted`) |
| Stat numeral (detail) | Instrument Serif 24px · `--fg` |
| Section head · wordmark | Instrument Serif 22px · `--fg` |
| Empty-state line | Instrument Serif 20px *italic* · `--fg` |
| Loading verb | Instrument Serif 19px *italic* · `--fg` |
| Numeric table cell | Instrument Serif 18px · `--fg` · right-aligned |
| Index numeral | Instrument Serif 18px · `--brand-brown` |

## Heading scale

Defaults in `src/index.css` `@layer base`; primitives apply them via `PageTitle` / `PageDescription`. Avoid raw `<h1>` (compliance gate 6e).

| Element | Size | Font | Notes |
|---|---|---|---|
| h1 | 2.75rem (44px), lh 1.1, 400 | Instrument Serif (`--font-pixel`) | The only heading level the serif claims globally — 44px clears the floor |
| h2 | 1.5rem, lh 1.2, 500 | IBM Plex Sans (`--font-subheader`) | Section heads |
| h3 | 1.25rem, lh 1.25, 500 | IBM Plex Sans | Card titles |
| h4–h5 | 1.125–1rem, 500 | IBM Plex Sans | Inline breaks |
| h6 | 0.875rem, 500, uppercase | IBM Plex Sans | Micro-labels |

**h2–h6 are sans by design**: h5/h6 land under 18px, so a blanket serif rule would break the floor. Serif section heads are opted into per component at their spec'd 22px.

## Body + label

All IBM Plex Sans — every row here is under the 18px serif floor.

| Role | Size | Font | Color token |
|---|---|---|---|
| Body | 14–15px | sans 400 | `--fg` (ink `#3A2E24`) |
| Secondary | 13–14px | sans 400 | `--fg-dim` |
| Label / meta | 12–13px | sans 500 | `--fg-muted` |
| Prose / notes | 13.5px / 1.6 | sans 400 | `--fg-dim` |
| Table header | 10.5px 600 uppercase, tracking `.1em` | sans | `--fg-muted` |
| Card / panel label | 11px 600 uppercase, tracking `.12em` | sans | `--fg-muted` |
| Dateline / kicker | 11px 600 uppercase, tracking `.14em` | sans | `--fg-muted` |
| Button label | 12.5px 600 | sans | per variant |
| Nav item | 13px | sans | idle `--fg-muted` · active `--fg` 600 |
| KPI value | 32px | **Instrument Serif** 400 | `--fg` |
| Kbd chip | 11px | mono 500 | `--fg-dim` |

## Links

Global `a` rule: `--brand-red` (legacy NAME, now the AA-safe brand brown `#806241`), hover → `--cta-primary-bg-hover` (`#7D5F3D`). Link text is body-sized, which is why it takes the AA-safe variant rather than the raw brown. Focus-visible outline = 2px **raw** brown (`--ring`) at 2px offset — it is a mark, not type.

## Historical — Georgia serif era (retired 2026-07-25)

> Values below are stale. Kept so a future reader can tell which name held which value in which era. Do not use them.

- **2026-04-19 → 2026-07-07 (AppBase era)**: `--font-pixel` = Geist Pixel Square, `--font-pixel-display` = Geist Pixel Grid, plus `-square/-grid/-circle/-triangle/-line` shape aliases. Body was Geist Sans / Roboto.
- **2026-07-07 → 2026-07-25 (Editorial navy/gold era)**: every `--font-pixel*` variant was repointed to **Georgia serif** so existing consumers rendered serif without a rename sweep; body was `system-ui`. No webfonts were loaded.
- **What NOT to try again**: the old "Square ≤48px / Grid ≥140px" pixel-size rule is obsolete twice over. The self-hosted Geist Pixel `@font-face` blocks, the `public/fonts/` binaries, the shape aliases and the `.font-pixel-crisp` / `.font-pixel-bold` antialiasing hacks were all **deleted** — disabling antialiasing wrecks Instrument Serif. Do not reintroduce them.

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — authoritative type scale
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — enforcement (incl. the 18px serif floor)
- [COLORS.md](./COLORS.md) — text-color tokens (⛔ values superseded)
- [PHILOSOPHY.md](./PHILOSOPHY.md) — the 2026-07-25 direction
- [src/index.css](../../../src/index.css) — runtime font vars + heading rules
- [src/components/primitives/shell/PageTitle.tsx](../../../src/components/primitives/shell/PageTitle.tsx) — heading primitive
