---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.ts'
  - 'src/index.css'
---

# Rule: Dark Mode (MANDATORY)

## Summary

**The app is permanently dark (navy/gold Editorial theme, locked 2026-07-14).** `:root` and `.dark` in `src/index.css` hold identical navy values and `ThemeProvider` pins `resolved='dark'` — the theme toggle is a no-op. The class-based `dark:` machinery (`@custom-variant dark (&:where(.dark, .dark *))`) remains for legacy compat only; new code should not need `dark:` variants. **The cardinal rule (INVERTED from the zinc era)**: cards are **RAISED — one step LIGHTER than the navy page** (page `#0D1B2A` → card `#12202F` → modal/popover `#182638`). If page bg equals card bg, every card disappears. Authoritative spec lives in [DARK_MODE.md](../../docs/01-system-architecture/design-system/DARK_MODE.md).

## Detailed Patterns

### Surface contract (must be applied per surface — always-dark)

| Surface | Use | Value |
|---|---|---|
| Page bg | `bg-background` / `var(--page-bg)` | navy `#0D1B2A` |
| Card / tile / panel | `bg-card` / `var(--surface)` | raised navy `#12202F` (LIGHTER than page) |
| Modal / popover / filter bar | `bg-popover` / `var(--surface-subtle)` | `#182638` (another step lighter) |
| Hover fill | `var(--row-hover)` (cream @ 4%) or `bg-secondary` | must contrast resting bg |
| Border | `border-border` | navy hairline `hsl(210 25% 24%)` |
| Text primary / secondary / muted | `text-foreground` / `var(--fg-dim)` / `text-muted-foreground` | cream `#F0EAD6` / `#D6CCB4` / `#8A8070` |
| Primary CTA | `--cta-primary-bg` / `--cta-primary-fg` | gold `#C9A84C` bg + near-black brown `#1A1200` text — never flips |
| Destructive CTA | `--cta-destructive-bg` | DISC-D red `#C0392B` — only solid red allowed |
| Focus ring | `--ring` / `--shadow-focus` | gold, 3px @ 35% — never red, never silent |

### Token chain (`src/index.css`)

```
:root  --background: 210 53% 11%   → body bg = navy #0D1B2A (== --page-bg)
       --card:       209 44% 13%   → card bg = #12202F (RAISED lighter)
       --popover:    213 42% 16%   → modal/popover = #182638
.dark  (identical values — no overrides needed; app is always dark)
```

`body` reads `bg-background`. Cards must paint `bg-card` (or `var(--surface)`), never the page token — the raised-lighter contract depends on it.

### Activation (legacy machinery)

```ts
// ThemeProvider still wraps the app but resolves 'dark' permanently.
import { ThemeProvider } from '@/lib/design/ThemeProvider';
<ThemeProvider>{children}</ThemeProvider>
```

Do NOT build light-mode variants. Do NOT bypass with `prefers-color-scheme` media queries. Do NOT toggle the class — there is no light mode to flip to.

### Verification checklist (run before commit on any UI change)

1. Open the dev server — no toggle needed; the app is always the navy theme.
2. Every card-shaped surface is **visibly LIGHTER** than the navy page around it.
3. Every interactive surface has a visible hover state (cream wash / secondary lift).
4. Every focusable element shows a **gold** ring on Tab, never silent.
5. Primary CTA buttons read gold with dark-brown text — no light/dark flipping anywhere.

## Anti-patterns (will be caught in review)

- ❌ Page bg == card bg (cards must be RAISED lighter than navy)
- ❌ `bg-white` / `bg-zinc-*` light-era classes on any surface — use token utilities
- ❌ New `dark:` variants (redundant — `:root` already holds the dark values)
- ❌ Hover that matches the resting bg (invisible on navy)
- ❌ Red focus rings — focus accent is gold (`--ring`)
- ❌ Hardcoded hex (`#0d1b2a`) when a token utility exists
- ❌ Using `(prefers-color-scheme: dark)` media query or building light-mode variants

## Known Patterns

> Historical — recorded during the zinc light/dark era (retired 2026-07-07). Values are stale; the LESSONS (page == card ⇒ invisible; trace which element actually paints) still apply.

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

- [docs/01-system-architecture/design-system/DARK_MODE.md](../../docs/01-system-architecture/design-system/DARK_MODE.md) — full spec + verification protocol
- [docs/01-system-architecture/design-system/COLORS.md](../../docs/01-system-architecture/design-system/COLORS.md) — zinc + red scales
- [docs/01-system-architecture/design-system/TOKENS.md](../../docs/01-system-architecture/design-system/TOKENS.md) — every `@theme` token
- Related: [design-system.md](./design-system.md) — visual-verification before commit
- Source: [src/index.css](../../src/index.css) — runtime tokens
- Source: [src/lib/design/ThemeProvider.tsx](../../src/lib/design/ThemeProvider.tsx) — mode activation
