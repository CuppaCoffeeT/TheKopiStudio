# Dark Mode

> ⛔ **SUPERSEDED 2026-07-25** — the app is now light-pinned on The Kopi Studio cream/brown palette; the navy/gold always-dark contract below is historical. Authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) · enforcement: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md).

**Created**: 2026-05-13 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🔴 Deprecated
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Sibling: [COLORS.md](./COLORS.md) · [TOKENS.md](./TOKENS.md)

## 📋 Overview

**The app is permanently dark (2026-07-07 de-AppBase, locked 2026-07-14).** The navy/gold Editorial theme is the only theme: `:root` and `.dark` in [`src/index.css`](../../../src/index.css) hold identical values, and [`ThemeProvider`](../../../src/lib/design/ThemeProvider.tsx) pins `resolved='dark'` — the theme toggle is a no-op. The `dark` class / `@custom-variant` machinery remains in place for compatibility, but there is no light mode to flip to. "Dark mode" work today means: keep every surface honoring the navy contrast contract below.

## The cardinal rule (INVERTED 2026-07-14)

**Cards are RAISED — one step LIGHTER than the navy page.** This inverts the AppBase-era rule ("cards recessed darker than a lifted page"):

```
AppBase era (retired):  page zinc-900 #18181b  ←  card zinc-950 #09090b  (card darker, recessed)
Navy era (current):     page navy #0D1B2A      →  card #12202F           (card lighter, raised)
                                                   modal/popover #182638  (another step lighter)
```

If page bg and card bg are equal, cards become invisible — that failure mode is unchanged. Every new card-shaped surface MUST be visibly lighter than `--background`.

## Token contract

### Runtime HSL variables ([`src/index.css`](../../../src/index.css)) — `:root` == `.dark`

| Token | Value (always) | Hex | Reads via |
|---|---|---|---|
| `--background` | `210 53% 11%` | navy `#0D1B2A` | `body { bg-background }`, `--page-bg` |
| `--card` | `209 44% 13%` | raised navy `#12202F` | `bg-card`, `--surface` |
| `--popover` | `213 42% 16%` | `#182638` | `bg-popover`, `--surface-subtle` |
| `--foreground` | `43 48% 89%` | cream `#F0EAD6` | `text-foreground` |
| `--border` / `--input` | `210 25% 24%` | navy hairline | `border-border` |
| `--primary` / `--accent` / `--ring` | `43 55% 55%` | gold `#C9A84C` | CTAs, focus ring |

### Class convention

Prefer token utilities (`bg-background`, `bg-card`, `bg-popover`, `border-border`, `text-foreground`, `text-muted-foreground`) over literal zinc classes — the zinc light/dark pairs of the AppBase era no longer apply. `dark:` variants are harmless (the `dark` class is always effectively on-brand) but new code should not need them.

| Surface | Use |
|---|---|
| **Page background** | `bg-background` (navy `#0D1B2A`) |
| **Card / module tile / KPI tile** | `bg-card` (raised `#12202F`) |
| **Modal / popover / filter bar** | `bg-popover` / `var(--surface-subtle)` (`#182638`) |
| **Hover fill** | `bg-secondary` / `var(--row-hover)` (cream @ 4%) — must contrast with resting bg |
| **Borders** | `border-border` (navy hairline) |
| **Text primary / secondary / muted** | `text-foreground` / `var(--fg-dim)` / `text-muted-foreground` |
| **Primary CTA** | gold bg + near-black-brown text (`--cta-primary-bg` / `--cta-primary-fg`) — never flips |
| **Destructive CTA** | `--cta-destructive-bg` DISC-D red `#C0392B` |
| **Focus ring** | gold (`--ring` / `--shadow-focus`) — never red, never silent |
| **Disabled** | `opacity-40 cursor-not-allowed` |

## Page archetypes

| Archetype | Page bg | Frame component |
|---|---|---|
| Detail / List / Dashboard / Form / Settings / Tool | `bg-background` (navy) | `DetailPageFrame` / `ListPageFrame` / composition |
| Pre-auth (Login etc.) | navy — same canvas | `AuthShell` |

Cards inside every archetype paint `bg-card` (raised).

## Mode activation (legacy machinery)

`ThemeProvider` still wraps the app and still owns the `dark` class, but it resolves to `dark` permanently — do not build light-mode variants, do not toggle the class, do not use `(prefers-color-scheme)` queries. The `@custom-variant dark` directive remains so legacy `dark:` utilities keep working.

## How to verify a new surface

1. Open dev server (no toggle needed — the app is always the navy theme).
2. Every card surface should be **noticeably lighter** than the navy page around it. Identical → bug.
3. Hover over every interactive surface. The hover bg must **visibly differ** from the resting bg (cream-wash `--row-hover` or `--secondary` lift both work).
4. Tab through every interactive element. Focus ring must be **gold**, never silent.
5. Primary CTAs read **gold with dark-brown text** — no light/dark flipping anywhere.

## Historical context — AppBase light/dark era (retired 2026-07-07)

The sections below record the class-toggled zinc light/dark system that preceded the always-dark navy theme. Values are historical; the failure LESSONS (page == card ⇒ invisible cards; trace which element actually paints) still apply.

## Known failures (and their fixes)

| Symptom | Root cause | Where it bit us | Fix |
|---|---|---|---|
| Cards invisible against page in dark mode | `--background` and `--card` both set to `222 84% 4.9%` (`#020617`) — equal | Dashboard, lists, every page (2026-04-29) | Lifted `--background` to `240 4% 10%` (zinc-900). [index.css:365](../../../src/index.css#L365) |
| Module cards / KPI tiles / search input blend with page | Primitives hardcoded `dark:bg-zinc-900` — equal to the now-lifted page bg | `ModuleCard` · `ModuleSearch` · `KpiTile` · `NeedsAttentionPill` · `GreetingHeader` role chip (2026-04-29) | Bumped each to `dark:bg-zinc-950` |
| `/login` card blends with page in dark | `AuthShell` was `dark:bg-zinc-950` outside, primitive `Card` was `dark:bg-zinc-950` inside — equal | Pre-auth pages (2026-05-13) | `AuthShell` page bg → `dark:bg-zinc-900` |
| Hover invisible on a button | `hover:bg-zinc-100` matches `bg-zinc-100` page bg in light mode | Buttons over the page bg | Use `hover:bg-zinc-200` or `hover:bg-white` + shadow |
| Focus ring invisible in dark | Inherited `ring-red-700` from `:root` — too dark on zinc-950 | Any primitive that didn't flip the ring | Always pair `focus-visible:ring-red-700 dark:focus-visible:ring-red-400` |
| Detail-page cards invisible + two-tone page (near-black content band over grey fill) | `PageShell` + `PageShellHero` painted the page surface `dark:bg-zinc-950` — same token as `Card` (cards vanish) and darker than `DetailPageFrame`'s `--page-bg` zinc-900; `PageShell`'s `min-h-full` is inert so the grey `--page-bg` shows below the content | Every `DetailPageFrame` page in dark mode (2026-05-22) | `PageShell.tsx:49` + `:116` → `dark:bg-zinc-900`. [PageShell.tsx:49](../../../src/components/primitives/detail/PageShell.tsx#L49) |

## Anti-patterns (current, navy era)

- ❌ Page bg = card bg (most common failure — cards must be RAISED lighter than navy)
- ❌ Picking a surface color by "vibes" instead of the navy tokens (`--background` / `--card` / `--popover`) → drift
- ❌ `bg-white` / `bg-zinc-*` light-era classes on any surface — use token utilities
- ❌ Skipping hover/active/focus states (only handling default)
- ❌ Hardcoding raw hex when a token exists (`#0d1b2a` → `bg-background` / `var(--page-bg)`)
- ❌ Building light-mode variants or using `(prefers-color-scheme: dark)` — the app is pinned dark via `ThemeProvider`

## 📚 Related

- [COLORS.md](./COLORS.md) — full zinc + red scales + brand semantics
- [TOKENS.md](./TOKENS.md) — every `@theme` token group
- [PHILOSOPHY.md](./PHILOSOPHY.md) — 11 design-reuse principles
- [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — design-system router
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — auto-loaded enforcement rule (supersedes the retired `dark-mode.md`)
- [src/index.css](../../../src/index.css) — runtime tokens (single `:root`, no `.dark`)
- [src/lib/design/ThemeProvider.tsx](../../../src/lib/design/ThemeProvider.tsx) — mode activation
