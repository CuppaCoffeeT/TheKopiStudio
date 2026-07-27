# Theming — Light-Pinned

> **There is no dark mode.** This file kept its `DARK_MODE.md` name only because other docs link to it; its subject is now the light-pinning contract. If you arrived here looking for a dark theme to implement or repair, stop — the app is permanently the warm cream Kopi Studio brand, and every `dark:` utility in the codebase is dead code.

**Created**: 2026-05-13 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Siblings: [COLORS.md](./COLORS.md) · [TOKENS.md](./TOKENS.md) · Enforcement: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md)

## 📋 Overview

**The app is permanently LIGHT** (The Kopi Studio, direction 2a "Kopi House", locked 2026-07-25). Two mechanisms hold it there:

1. [`src/index.css`](../../../src/index.css) ships a **single `:root` colour block**. There is no `.dark` block and no `prefers-color-scheme` branch.
2. [`ThemeProvider`](../../../src/lib/design/ThemeProvider.tsx) pins `resolved = 'light'` and runs an effect that **removes** the `dark` class from `<html>` on every render.

The provider deliberately keeps its full API intact — the `ThemePreference` / `ResolvedTheme` types, the `prefers-color-scheme` listener, and the `localStorage` key `w08:theme:v1` — so re-enabling a real toggle stays a one-line change. None of that machinery drives `resolved` today.

## Why the `dark` variant is still declared

[`src/index.css`](../../../src/index.css) keeps this line **on purpose**:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Deleting it would hand `dark:` back to Tailwind's default `prefers-color-scheme` media query and let a viewer's OS repaint the brand. Keeping it scopes `dark:` to a class that nothing ever sets, which makes those utilities inert.

**Consequence for new work**: surviving `dark:` variants are dead code. **Delete them; do not repaint them.**

## The cardinal rule (survives the inversion)

**Cards are RAISED — one step LIGHTER than the page.** This held in navy and holds in cream:

```
AppBase era (retired 2026-07-07):  page zinc-900 #18181b  ←  card zinc-950 #09090b   (card darker, recessed)
Navy era    (retired 2026-07-25):  page navy   #0D1B2A    →  card #12202F            (card lighter, raised)
Kopi era    (current):             page cream  #F0E6D6    →  card #FAF6EE            (card lighter, raised)
                                                             raised white #FFFFFF     (another step lighter)
```

If page bg equals card bg, every card disappears. That failure mode is theme-independent and has bitten this codebase three times — see the history below.

## Surface contract

| Surface | Use | Value |
|---|---|---|
| Page background | `bg-background` / `var(--page-bg)` | page cream `#F0E6D6` |
| Card / panel / KPI tile / **sidebar rail** | `bg-card` / `var(--surface)` | card cream `#FAF6EE` |
| Modal / popover / menu / input | `bg-popover` | raised white `#FFFFFF` |
| Filter bar / pagination tint | `var(--surface-subtle)` | `#F3EDE3` |
| Hover fill | `var(--row-hover)` (brown @ 6%) or `bg-secondary` | must differ from the resting bg |
| Border | `border-border` | warm hairline `#D9CCC0` |
| Text primary / body / muted | `text-foreground` / `var(--fg-dim)` / `text-muted-foreground` | `#3A2E24` / `#5D4F3F` / `#7D6B5B` |
| Primary CTA | `--cta-primary-bg` / `--cta-primary-fg` | brown `#8B6A47` + cream label — never flips |
| Destructive CTA | `--cta-destructive-bg` | AA-safe terracotta `#AB4925` |
| Focus ring | `--ring` / `--shadow-focus` | brown — never terracotta, never silent |
| Disabled | `opacity-40 cursor-not-allowed` | keeps `--fg-muted` (WCAG exempts inactive controls) |

`--fg-muted` is card-only: it measures 4.72 on card cream and **4.12 on the page cream**. Muted-role text on the page ground takes `--fg-dim`. Full detail: [COLORS.md](./COLORS.md).

## Page archetypes

| Archetype | Page surface | Frame |
|---|---|---|
| Dashboard / List / Detail / Form / Settings / Tool | page cream | `ListPageFrame` · `DetailPageFrame` · `AppHeaderShell` |
| Pre-auth (`/login`) | page cream — same canvas | [`src/pages/Login.tsx`](../../../src/pages/Login.tsx), composed from primitives (no dedicated shell) |
| Public profiler (`/profiler`) | page cream, outside the app shell | `overlays/wizard/WizardShell` |

Cards inside every archetype paint `bg-card`. `/login` is the documented exception on inputs: its fields step up to `bg-popover` (raised white) because the shared `Input` primitive paints card cream, which is the surrounding card's own colour there.

## How to verify a new surface

1. Open the dev server — no toggle exists; the app is always the cream theme.
2. Every card-shaped surface is **visibly LIGHTER** than the cream page around it. Identical → bug.
3. Hover every interactive surface — the hover bg must visibly differ from the resting bg (brown wash `--row-hover`, or the `#F3EDE3` tint).
4. Tab through every interactive element — the focus ring must be **brown**, never silent.
5. Primary CTAs read brown with a cream label; no light/dark flipping anywhere.
6. No Instrument Serif under 18px; no raw sage/terracotta on small text.

## Anti-patterns

- ❌ Page bg == card bg (most common failure)
- ❌ **New or surviving `dark:` variants** — dead code, delete them
- ❌ Using `(prefers-color-scheme: dark)`, building light/dark pairs, or adding a theme toggle
- ❌ Cool neutrals (`zinc-*` / `slate-*` / `gray-*`) or `bg-white` literals on the warm ground — use token utilities
- ❌ Navy/gold leftovers (`#0D1B2A`, `#12202F`, `#C9A84C`)
- ❌ Picking a surface by vibes instead of `--background` / `--card` / `--popover`
- ❌ Skipping hover/active/focus states
- ❌ Hardcoding raw hex where a token exists (`#f0e6d6` → `bg-background`)

---

## Historical — navy/gold always-dark era (locked 2026-07-14, retired 2026-07-25)

> The values below are dead. The **structure** is the point: `:root` and `.dark` held identical navy values, `ThemeProvider` pinned `resolved='dark'`, and the toggle was a no-op — the same pinning pattern the app uses today, inverted.

| Token | Value | Hex |
|---|---|---|
| `--background` | `210 53% 11%` | navy `#0D1B2A` |
| `--card` | `209 44% 13%` | raised navy `#12202F` |
| `--popover` | `213 42% 16%` | `#182638` |
| `--foreground` | `43 48% 89%` | cream `#F0EAD6` |
| `--border` / `--input` | `210 25% 24%` | navy hairline |
| `--primary` / `--accent` / `--ring` | `43 55% 55%` | gold `#C9A84C` |

Primary CTA was gold with near-black-brown (`#1A1200`) text; destructive was DISC-D red `#C0392B`; focus rings were gold.

## Historical — AppBase light/dark era (retired 2026-07-07)

> The class-toggled zinc light/dark system that preceded the always-dark navy theme. Values are historical; the failure **lessons** below still apply verbatim.

### Known failures (and their fixes)

> Line numbers in this table are from the file revisions of the era, not from today's files. Do not follow them into the current source.

| Symptom | Root cause | Where it bit us | Fix |
|---|---|---|---|
| Cards invisible against page in dark mode | `--background` and `--card` both set to `222 84% 4.9%` (`#020617`) — equal | Dashboard, lists, every page (2026-04-29) | Lifted `--background` to `240 4% 10%` (zinc-900). `index.css:365` (era line number) |
| Module cards / KPI tiles / search input blend with page | Primitives hardcoded `dark:bg-zinc-900` — equal to the now-lifted page bg | `ModuleCard` · `ModuleSearch` · `KpiTile` · `NeedsAttentionPill` · `GreetingHeader` role chip (2026-04-29) | Bumped each to `dark:bg-zinc-950` |
| `/login` card blends with page in dark | `AuthShell` was `dark:bg-zinc-950` outside, primitive `Card` was `dark:bg-zinc-950` inside — equal | Pre-auth pages (2026-05-13) | `AuthShell` page bg → `dark:bg-zinc-900` |
| Hover invisible on a button | `hover:bg-zinc-100` matches `bg-zinc-100` page bg in light mode | Buttons over the page bg | Use `hover:bg-zinc-200` or `hover:bg-white` + shadow |
| Focus ring invisible in dark | Inherited `ring-red-700` from `:root` — too dark on zinc-950 | Any primitive that didn't flip the ring | Always pair `focus-visible:ring-red-700 dark:focus-visible:ring-red-400` |
| Detail-page cards invisible + two-tone page (near-black content band over grey fill) | `PageShell` + `PageShellHero` painted the page surface `dark:bg-zinc-950` — same token as `Card` (cards vanish) and darker than `DetailPageFrame`'s `--page-bg` zinc-900; `PageShell`'s `min-h-full` is inert so the grey `--page-bg` shows below the content | Every `DetailPageFrame` page in dark mode (2026-05-22) | `PageShell.tsx:49` + `:116` → `dark:bg-zinc-900` (era line numbers) |

### What NOT to try again

- **Do not re-derive a surface colour from a sibling primitive.** The `dark:bg-zinc-900` cascade above recurred three times because each primitive copied whatever the page bg happened to be at the time. Copy from the `Card` primitive, which owns the correct surface token.
- **On a `DetailPageFrame` / `ListPageFrame` page the visible page surface is `PageShell`, NOT `<body>`.** `bg-background` rarely shows. Trace which element actually paints before blaming a token.
- **`min-h-full` is inert without an explicit parent height.** A `%` min-height needs one; `min-h-screen` only sets `min-height`. That is why a content-tall shell let the page fill show through below it.

## 📚 Related

- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — auto-loaded enforcement rule (supersedes the retired `dark-mode.md`)
- [COLORS.md](./COLORS.md) — palette, measured ratios, the page-ground trap
- [TOKENS.md](./TOKENS.md) — every token, current values
- [PHILOSOPHY.md](./PHILOSOPHY.md) — why the direction changed
- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — brand authority
- [src/index.css](../../../src/index.css) — runtime tokens (single `:root`, no `.dark`)
- [src/lib/design/ThemeProvider.tsx](../../../src/lib/design/ThemeProvider.tsx) — the light pinning
