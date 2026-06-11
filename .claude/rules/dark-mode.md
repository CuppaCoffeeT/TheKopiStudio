---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.ts'
  - 'src/index.css'
---

# Rule: Dark Mode (MANDATORY)

## Summary

Dark mode is class-based (`document.documentElement.classList.add('dark')`) and Tailwind's `dark:` variant is `@custom-variant dark (&:where(.dark, .dark *))`. **The cardinal rule**: in dark mode, the **page sits ONE STEP LIGHTER than the cards on it** (page `zinc-900` ← card `zinc-950`). If page bg equals card bg, every card on the page disappears. Always pair a light bg utility with a `dark:` variant. Authoritative spec lives in [DARK_MODE.md](../../docs/01-system-architecture/design-system/DARK_MODE.md).

## Detailed Patterns

### Surface contract (must be applied per surface)

| Surface | Light | Dark |
|---|---|---|
| Page bg | `bg-zinc-100` | `bg-zinc-900` |
| Card / tile / panel | `bg-white` | `bg-zinc-950` |
| Card hover (interactive) | `hover:bg-zinc-50` | `dark:hover:bg-zinc-900` |
| Subtle accent inside card (table header, row hover, badge) | `bg-zinc-50` / `bg-zinc-100` | `dark:bg-zinc-900` |
| Border | `border-zinc-200` | `dark:border-zinc-800` |
| Text primary | `text-zinc-900` | `dark:text-zinc-50` |
| Text secondary | `text-zinc-500/600` | `dark:text-zinc-400` |
| Primary CTA bg | `bg-slate-800` | `dark:bg-slate-100` (flipped) |
| Primary CTA text | `text-white` | `dark:text-slate-900` (flipped) |
| Focus ring | `ring-red-700` | `dark:ring-red-400` (flipped — red-700 reads as black on zinc-950) |
| Focus ring offset | `ring-offset-white` | `dark:ring-offset-zinc-950` |

### Token chain (`src/index.css`)

```
:root  --background: 0 0% 100%    → body bg light = white
       --card:       0 0% 100%
.dark  --background: 240 6% 10%   → body bg dark  = zinc-900 #18181b (== --page-bg)
       --card:       240 10% 4%   → card bg dark  = zinc-950 #09090b (recessed)
```

`body` reads `bg-background`. Primitive Card paints `bg-white dark:bg-zinc-950` directly (does NOT read `--card` — Tailwind class wins). Both layers must stay in sync with the cardinal rule.

### Activation

```ts
// Canonical — owned by ThemeProvider
import { ThemeProvider } from '@/lib/design/ThemeProvider';
<ThemeProvider>{children}</ThemeProvider>
```

Do NOT bypass with `prefers-color-scheme` media queries. Do NOT toggle the class outside `ThemeProvider`. State must remain reactive across the app.

### Verification checklist (run before commit on any UI change)

1. Toggle the `dark` class on `<html>` in DevTools.
2. Every card-shaped surface is **visibly darker** than the page around it.
3. Every interactive surface has a visible hover state in dark.
4. Every focusable element shows a `red-400` ring on Tab, never silent.
5. Primary CTA buttons flip light-on-dark (`slate-100` bg, `slate-900` text).

## Anti-patterns (will be caught in review)

- ❌ `bg-white` without `dark:bg-zinc-950` on a card-shaped surface
- ❌ `dark:bg-zinc-900` on a card-shaped surface (matches page bg → invisible)
- ❌ Hover that stays the same color in dark (`hover:bg-zinc-50` without `dark:hover:bg-zinc-900`)
- ❌ Focus ring without `dark:ring-red-400` (red-700 alone reads as black)
- ❌ Hardcoded hex (`#18181b`) when a zinc class exists
- ❌ Using `(prefers-color-scheme: dark)` media query — class-based only

## Known Patterns

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
