---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.ts'
  - 'src/**/*.css'
---

# Rule: Light Theme — The Kopi Studio (MANDATORY)

> **`src/**/*.css` is deliberate, not a typo.** It covers `src/index.css` **and** the two palette-bearing
> feature stylesheets — `src/features/crm/lib/report-print.css` and `src/features/profiler/lib/print.css`
> — which hardcode literal Kopi hexes (no `var(--…)`, on purpose, so a future token shuffle can't silently
> repaint a client-facing PDF). `report-print.css` shipped a 3.42:1 contrast failure precisely because this
> rule did not auto-load into it. Do not narrow this glob back to `src/index.css`.
>
> **Length exemption (deliberate).** `.claude/CONTEXT.md` and `.claude/rules/CONTEXT.md` set an ≤80-line
> target for rule files. This one runs longer and is exempt: splitting it would let an agent load the surface
> ladder without the AA text variants (or vice versa) — the exact half-context that produced the failures in
> the Historical block. The overflow is the preserved history section, which must never be deleted.

## Summary

**The app is permanently LIGHT (Kopi Studio, direction 2a "Kopi House", locked 2026-07-25).** `src/index.css` holds a single `:root` token block with **no `.dark` counterpart**, and `ThemeProvider` pins `resolved='light'` and keeps the `dark` class OFF `<html>` — so every `dark:` utility is inert dead code. **The cardinal rule holds, in light**: cards are **RAISED — one step LIGHTER than the cream page** (page `#F0E6D6` → card `#FAF6EE` → raised white `#FFFFFF`). If page bg equals card bg, every card disappears. There is no navy and no gold in this brand. Authoritative spec: [KOPI_2A_SPEC.md](../../docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md).

## Detailed Patterns

### Surface contract (must be applied per surface — always-light)

| Surface | Use | Value |
|---|---|---|
| Page bg | `bg-background` / `var(--page-bg)` | page cream `#F0E6D6` |
| Card / tile / panel | `bg-card` / `var(--surface)` | card cream `#FAF6EE` (LIGHTER than page) |
| Modal / popover / input | `bg-popover` | raised white `#FFFFFF` (another step lighter) |
| Filter bar / pagination tint | `var(--surface-subtle)` | `#F3EDE3` |
| Hover fill | `var(--row-hover)` (brown @ 6%) or `bg-secondary` `#F3EDE3` | must contrast resting bg |
| Border | `border-border` | warm hairline `#D9CCC0` |
| Text primary / body / muted | `text-foreground` / `var(--fg-dim)` / `text-muted-foreground` | ink `#3A2E24` / `#5D4F3F` / `#7D6B5B` |
| Primary CTA | `--cta-primary-bg` / `--cta-primary-fg` | brown `#8B6A47` bg + card cream `#FAF6EE` text (4.58:1) — never flips |
| Destructive CTA | `--cta-destructive-bg` | AA-safe terracotta `#AB4925` (raw `#D97551` fails under cream) |
| Focus ring | `--ring` / `--shadow-focus` | brown — never terracotta, never silent |

### Brand colours + their jobs

| Colour | Hex | Job |
|---|---|---|
| Brown | `#8B6A47` (hover `#7D5F3D`) | primary CTA, focus ring, active-nav 2px left border, index numerals, viz ramp anchor |
| Sage | `#5A7A5E` (hover `#4A6A4E`) | secondary / positive / success fills + dots |
| Terracotta | `#D97551` | negative / error fills + dots only |

**Brown is punctuation, not authority-by-volume.** Brown never carries a heading, a page-header gradient, a filled nav pill, table headers, body copy or decorative fills. Hierarchy comes from serif/sans contrast, the text-colour ladder (`#3A2E24` → `#5D4F3F` → `#7D6B5B`) and hairlines.

Extended greys (`#E8E6E0`) and the green box (`#D9E8E0`) are **print/report surfaces only** — not app chrome.

### WCAG AA text variants — MANDATORY under 18px

Raw brand hexes are tuned as **fills**; as small type they fail 4.5:1. Any text below 18px in these hues MUST use the darkened sibling:

| Raw fill | Small-text token | Value |
|---|---|---|
| brown `#8B6A47` (4.00 on page) | `var(--brown-text)` | `#806241` |
| sage `#5A7A5E` (3.88 / 4.45 — FAILS) | `var(--sage-text)` | `#526F56` |
| terracotta `#D97551` (2.57 / 2.95 — FAILS) | `var(--negative-text)` | `#AB4925` |

Raw hexes stay correct for fills, borders, icons, chart marks and display type ≥ 18px. Status-pill text is the documented exception — pills carry their own tuned pairs (see KOPI_2A_SPEC.md → "Status pills"); do not substitute the page-tuned variants there.

**The variants are ground-specific.** Each is calibrated for the two flat cream grounds. On a tint of its own hue it can fall back under the gate, so two deeper siblings exist — use them and don't re-derive: `var(--brown-text-on-wash)` `#6D5233` for brown text on a brown wash (`bg-accent/10`–`/15`), and `var(--negative-text-on-tint)` `#8F3D1F` for terracotta text on the error tint `#FAE0D6` (`--red-soft`), where `--negative-text` measures only 4.499.

### Typography

- `var(--font-pixel)` (+ `--font-pixel-display` / `--font-prose`) = **Instrument Serif** — headings, KPI/table numerals, empty-state + loading lines, wordmark. **HARD FLOOR: never below 18px.**
- `var(--font-sans)` (+ `--font-subheader`) = **IBM Plex Sans** — all body, UI, forms, labels, buttons, nav, table body.
- Anything under 18px is IBM Plex Sans, no exceptions.

### Token chain (`src/index.css`)

```
:root  --background: 37 46% 89%   → body bg = page cream #F0E6D6 (== --page-bg)
       --card:       40 55% 96%   → card bg = #FAF6EE (RAISED lighter)
       --popover:    0 0% 100%    → modal / menu / input = #FFFFFF
       (no .dark block exists — :root is the single source of truth)
```

`body` reads `bg-background`. Cards must paint `bg-card` (or `var(--surface)`), never the page token — the raised-lighter contract depends on it.

### Activation

```ts
// ThemeProvider still wraps the app but resolves 'light' permanently.
import { ThemeProvider } from '@/lib/design/ThemeProvider';
<ThemeProvider>{children}</ThemeProvider>
```

The `@custom-variant dark (&:where(.dark, .dark *))` declaration stays in `src/index.css` **on purpose** — deleting it would hand `dark:` back to Tailwind's default `prefers-color-scheme` media query and let a viewer's OS repaint the brand. Do NOT build dark-mode variants. Do NOT bypass with `prefers-color-scheme`. Do NOT add a theme toggle.

### Verification checklist (run before commit on any UI change)

1. Open the dev server — no toggle needed; the app is always the cream theme.
2. Every card-shaped surface is **visibly LIGHTER** than the cream page around it.
3. Every interactive surface has a visible hover state (brown wash / `#F3EDE3` tint).
4. Every focusable element shows a **brown** ring on Tab, never silent.
5. Primary CTA buttons read brown with cream text — no light/dark flipping anywhere.
6. No serif under 18px; no raw sage/terracotta on small text.

## Anti-patterns (will be caught in review)

- ❌ Page bg == card bg (cards must be RAISED lighter than the cream page)
- ❌ **New or surviving `dark:` variants** — dead code; the app is light-pinned and nothing sets the `dark` class. Delete them, don't repaint them.
- ❌ **Cool neutrals on the warm ground** — `zinc-*` / `slate-*` / `gray-*`, `#ececee`, `#e4e4e7`, `#18181b`. Move to the warm tokens.
- ❌ **Saturated Tailwind defaults** — `red-*` / `blue-*` / `green-*` / `amber-*` / `violet-*` / `orange-*`. Map onto the `--status-*` families in `src/index.css` or the brown ramp.
- ❌ Navy / gold leftovers (`#0D1B2A`, `#12202F`, `#C9A84C`) — that era is retired
- ❌ Instrument Serif (`--font-pixel`) under 18px
- ❌ Raw `#5A7A5E` / `#D97551` as text under 18px — use `--sage-text` / `--negative-text`
- ❌ Hover that matches the resting bg (invisible on cream)
- ❌ Terracotta focus rings — focus accent is brown (`--ring`)
- ❌ Card-flooding error states (red panel fills, tinted card bgs, red container borders) — errors are row-level
- ❌ Hardcoded hex (`#f0e6d6`) when a token utility or `var(--…)` exists
- ❌ Using `(prefers-color-scheme: dark)` or building light/dark pairs

## Historical (navy/gold era, retired 2026-07-25)

> Values below are stale twice over — recorded in the zinc light/dark era (retired 2026-07-07) and kept through the navy/gold era (retired 2026-07-25). The **LESSONS** still apply verbatim: page == card ⇒ invisible cards; trace which element actually paints before blaming a token.

### Same-color page/card bug (2026-04-29 sweep)

**Pattern**: `--background` and `--card` were both `222.2 84% 4.9%` (`#020617`). Page bg and Card bg rendered identical in dark mode → every card across the app disappeared. Recurred in primitives that hardcoded `dark:bg-zinc-900` after `--background` lifted to `zinc-900`.

**Cycle of recurrence**:
1. Lift `--background` to lighter shade in dark.
2. Primitives that previously matched it become "the new card color."
3. Sweep affected primitives to `dark:bg-zinc-950`.

**Affected primitives swept on 2026-04-29 → 2026-05-13**:
- `primitives/dashboard/ModuleCard.tsx`
- `primitives/dashboard/ModuleSearch.tsx`
- `primitives/dashboard/KpiTile.tsx`
- `primitives/dashboard/NeedsAttentionPill.tsx`
- `primitives/dashboard/GreetingHeader.tsx` (role chip)
- `features/auth/components/AuthShell.tsx` (page bg lifted to `zinc-900`)

**Fix recipe**: when adding a card-shaped primitive, copy from `Card` (which has the correct `bg-white dark:bg-zinc-950` already). Never start from a `dark:bg-zinc-900` baseline.

### Detail-page cards invisible + two-tone page — `PageShell` painted `dark:bg-zinc-950` (2026-05-22)

**Pattern**: every `DetailPageFrame` page (e.g. `/peoplemanagement/:id`) in dark mode — cards had zero contrast against the page, and the page showed a horizontal seam: a near-black content band over a grey fill.

**Root cause**: `PageShell.tsx:49` + `PageShellHero` `:116` painted the page surface `dark:bg-zinc-950` — the *same* token as the `Card` primitive (cards vanish), and *darker* than `DetailPageFrame`'s `--page-bg` (zinc-900). `PageShell`'s `min-h-full` is inert (a `%` min-height needs an explicit parent height; `min-h-screen` only sets `min-height`), so it is content-tall and the grey `--page-bg` shows below it.

**Fix**: `PageShell` + `PageShellHero` → `dark:bg-zinc-900`. Page surface now equals `--page-bg` (no seam) and zinc-950 cards recess against it. Separately, `.dark` `--background`/`--card` were both legacy slate `222 84% 4.9%` (a latent same-color bug) — lifted to zinc-900/zinc-950 the same day; not the visible cause since `<body>` is covered by `min-h-screen`.

**Lesson**: on a `DetailPageFrame`/`ListPageFrame` page the visible page surface is `PageShell`, NOT `<body>`. `bg-background` rarely shows. Trace which element actually paints before blaming a token.

## References

- [docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md](../../docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — authoritative palette, type scale, states, archetypes
- [docs/01-system-architecture/design-system/COLORS.md](../../docs/01-system-architecture/design-system/COLORS.md) — colour scales
- [docs/01-system-architecture/design-system/TOKENS.md](../../docs/01-system-architecture/design-system/TOKENS.md) — every `@theme` token
- Source: [src/index.css](../../src/index.css) — runtime tokens (single `:root`, no `.dark`)
- Source: [src/lib/design/ThemeProvider.tsx](../../src/lib/design/ThemeProvider.tsx) — light pinning
