# Dark Mode

**Created**: 2026-05-13 SGT
**Last Updated**: 2026-05-22 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Sibling: [COLORS.md](./COLORS.md) · [TOKENS.md](./TOKENS.md)

## 📋 Overview

Dark mode is opt-in via a `dark` class on the document root (`document.documentElement.classList.add('dark')`). Activation is owned by [`ThemeProvider`](../../../src/lib/design/ThemeProvider.tsx). The visual contract below lives across three layers — runtime CSS variables, primitive Tailwind classes, and a small set of unwritten conventions. This doc consolidates all three into the single source of truth.

## The cardinal rule

**In dark mode, the page sits ONE STEP LIGHTER than the cards on it.** Cards (zinc-950) are recessed against a slightly lifted page (zinc-900). This is the inverse of the human intuition "dark mode = everything black" and is the most common drift cause — see "Known failures" below.

```
LIGHT:  page zinc-100  ←  card white     (page darker, card lighter)
DARK:   page zinc-900  ←  card zinc-950  (page lighter, card darker)
```

If page bg and card bg are equal, cards become invisible. Every new card-shaped surface MUST honor this.

## Token contract

### Runtime HSL variables ([`src/index.css`](../../../src/index.css))

| Token | Light (`:root`) | Dark (`.dark`) | Reads via |
|---|---|---|---|
| `--background` | `0 0% 100%` (white) | `240 6% 10%` (zinc-900 `#18181b`) | `body { bg-background }` |
| `--card` | `0 0% 100%` (white) | `240 10% 4%` (zinc-950 `#09090b`) | `bg-card` |
| `--popover` | `0 0% 100%` | `222 84% 4.9%` | `bg-popover` |
| `--foreground` | `222 47% 11%` | `210 40% 98%` | `text-foreground` |
| `--border` | `214 32% 91%` | `217 33% 17%` | `border-border` |
| `--page-bg` (legacy) | `#f4f4f5` | `#18181b` | `bg-[var(--page-bg)]` |

### Tailwind class convention (primitive Cards bypass `--card` and use literal classes)

| Surface | Light | Dark |
|---|---|---|
| **Page background** | `bg-zinc-100` | `bg-zinc-900` |
| **Card / module tile / KPI tile** | `bg-white` | `bg-zinc-950` |
| **Card hover (interactive)** | `hover:bg-zinc-50` | `hover:bg-zinc-900` (toward page bg, never `zinc-800`) |
| **Subtle accent inside a card** (table header, hover row, badge bg) | `bg-zinc-50` or `bg-zinc-100` | `bg-zinc-900` (matches page — looks recessed inside the card) |
| **Borders** | `border-zinc-200` | `border-zinc-800` |
| **Hover border on card** | `hover:border-slate-800` | `dark:hover:border-zinc-600` |
| **Text primary** | `text-zinc-900` | `text-zinc-50` |
| **Text secondary** | `text-zinc-500` / `text-zinc-600` | `text-zinc-400` |
| **Text tertiary / meta** | `text-zinc-400` | `text-zinc-500` |
| **Primary CTA bg** | `bg-slate-800 hover:bg-slate-900` | `bg-slate-100 hover:bg-white` (flipped) |
| **Primary CTA text** | `text-white` | `text-slate-900` (flipped) |
| **Destructive CTA bg** | `bg-red-700 hover:bg-red-800` | unchanged (red-700 stays legible on both) |
| **Focus ring** | `ring-red-700` | `ring-red-400` (flipped — red-700 is too dark on zinc-950) |
| **Focus ring offset** | `ring-offset-white` | `ring-offset-zinc-950` |
| **Disabled** | `opacity-40 cursor-not-allowed` | unchanged (opacity flip is symmetric) |

## Page archetypes

| Archetype | Page bg | Frame component | Notes |
|---|---|---|---|
| Detail | `bg-background` (= `--background`) | `DetailPageFrame` | Inherits `body` bg |
| List | `bg-background` | `ListPageFrame` | Inherits `body` bg; tables internally use `bg-zinc-100 dark:bg-zinc-900` headers |
| Dashboard | `bg-background` | `DashboardHeader` + composition | Module/KPI cards must be `dark:bg-zinc-950` |
| Form / Settings / Tool | `bg-background` | bespoke | Same rule |
| **Pre-auth (Login, PasswordReset, EmailVerification, EmailVerified)** | `bg-zinc-200 dark:bg-zinc-900` | `AuthShell` | Explicit because there is no `body { bg-background }` chrome around it; the centered card must visibly recess |

## Mode activation

```ts
// src/lib/design/ThemeProvider.tsx (canonical)
import { ThemeProvider } from '@/lib/design/ThemeProvider';
<ThemeProvider>{children}</ThemeProvider>

// Imperative toggling
document.documentElement.classList.toggle('dark');
```

The `@custom-variant dark (&:where(.dark, .dark *))` directive in [`src/index.css`](../../../src/index.css) means Tailwind's `dark:` modifier matches when ANY ancestor has the `dark` class. This is class-based, not media-query-based — system preference does not auto-toggle.

## How to verify a new surface

1. Open dev server, toggle the `dark` class on `<html>` via DevTools.
2. Page bg should be **noticeably lighter** than any card surface on the page. If they look identical → bug.
3. Hover over every interactive surface. The hover bg must **visibly differ** from the surface's resting bg. Going `dark:hover:bg-zinc-900` on a `dark:bg-zinc-950` card is correct (toward the page). Going `dark:hover:bg-zinc-800` on a `dark:bg-zinc-900` card lifts AWAY from the page, which is also fine if the surface is non-card (chips, pills).
4. Focus on every interactive element with Tab. Focus ring must be `red-400` in dark, never silent.
5. Primary CTA buttons should flip: in dark, they read **light** (`slate-100`) against the dark surface.

## Known failures (and their fixes)

| Symptom | Root cause | Where it bit us | Fix |
|---|---|---|---|
| Cards invisible against page in dark mode | `--background` and `--card` both set to `222 84% 4.9%` (`#020617`) — equal | Dashboard, lists, every page (2026-04-29) | Lifted `--background` to `240 4% 10%` (zinc-900). [index.css:365](../../../src/index.css#L365) |
| Module cards / KPI tiles / search input blend with page | Primitives hardcoded `dark:bg-zinc-900` — equal to the now-lifted page bg | `ModuleCard` · `ModuleSearch` · `KpiTile` · `NeedsAttentionPill` · `GreetingHeader` role chip (2026-04-29) | Bumped each to `dark:bg-zinc-950` |
| `/login` card blends with page in dark | `AuthShell` was `dark:bg-zinc-950` outside, primitive `Card` was `dark:bg-zinc-950` inside — equal | Pre-auth pages (2026-05-13) | `AuthShell` page bg → `dark:bg-zinc-900` |
| Hover invisible on a button | `hover:bg-zinc-100` matches `bg-zinc-100` page bg in light mode | Buttons over the page bg | Use `hover:bg-zinc-200` or `hover:bg-white` + shadow |
| Focus ring invisible in dark | Inherited `ring-red-700` from `:root` — too dark on zinc-950 | Any primitive that didn't flip the ring | Always pair `focus-visible:ring-red-700 dark:focus-visible:ring-red-400` |
| Detail-page cards invisible + two-tone page (near-black content band over grey fill) | `PageShell` + `PageShellHero` painted the page surface `dark:bg-zinc-950` — same token as `Card` (cards vanish) and darker than `DetailPageFrame`'s `--page-bg` zinc-900; `PageShell`'s `min-h-full` is inert so the grey `--page-bg` shows below the content | Every `DetailPageFrame` page in dark mode (2026-05-22) | `PageShell.tsx:49` + `:116` → `dark:bg-zinc-900`. [PageShell.tsx:49](../../../src/components/primitives/detail/PageShell.tsx#L49) |

## Anti-patterns

- ❌ Page bg = card bg (most common failure)
- ❌ Picking a dark surface color by "vibes" instead of from the zinc scale → drift
- ❌ Setting only `bg-white` (missing `dark:bg-zinc-950`) on a card-shaped surface
- ❌ `dark:bg-zinc-900` on a card-shaped surface inside a `dark:bg-zinc-900` page
- ❌ Skipping `dark:` variants on hover/active/focus states (only handling default)
- ❌ Hardcoding raw hex when a token exists (`#18181b` → use `bg-zinc-900` or `var(--page-bg)`)
- ❌ Using media-query `(prefers-color-scheme: dark)` directly — we are class-based; bypassing `ThemeProvider` breaks state

## 📚 Related

- [COLORS.md](./COLORS.md) — full zinc + red scales + brand semantics
- [TOKENS.md](./TOKENS.md) — every `@theme` token group
- [PHILOSOPHY.md](./PHILOSOPHY.md) — 11 design-reuse principles
- [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — design-system router
- [.claude/rules/dark-mode.md](../../../.claude/rules/dark-mode.md) — auto-loaded enforcement rule
- [.claude/rules/design-system.md](../../../.claude/rules/design-system.md) — visual-verification protocol
- [src/index.css](../../../src/index.css) — runtime tokens (`:root` + `.dark`)
- [src/lib/design/ThemeProvider.tsx](../../../src/lib/design/ThemeProvider.tsx) — mode activation
