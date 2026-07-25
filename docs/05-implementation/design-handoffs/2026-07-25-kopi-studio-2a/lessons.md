# Lessons — Kopi Studio 2a handoff

**Last Updated**: 2026-07-25 SGT

## 2026-07-25 — `[color:var(--token)]` only works for the raw-value half of the token set
**What happened**: Repainting the overlay primitives, `text-[color:var(--card)]` was written for a cream glyph. It renders no colour at all.
**Root cause**: `src/index.css` holds two token families. The shadcn compat layer (`--card`, `--primary`, `--secondary`, `--border`, `--ring`, `--popover`, `--foreground`, `--sidebar-*`) stores bare **HSL triples** — `--card: 40 55% 96%` — which are only valid inside `hsl(var(--…))` or via the Tailwind semantic class (`bg-card`). The 2a layer (`--fg`, `--fg-dim`, `--row-hover`, `--row-selected`, `--cta-primary-*`, `--brown-text`, `--red-soft`, `--surface`, `--delta-*`, `--status-*`, `--drawer-overlay`) stores complete colour values and is the only half usable in an arbitrary `[color:var(--…)]` utility.
**Fix**: Use the semantic class for the shadcn half (`bg-card`, `text-foreground`, `border-border`) and `[color:var(--…)]` for the 2a half. `--surface` `#faf6ee` is the raw-value twin of `--card` when an arbitrary value is genuinely needed.

## 2026-07-25 — A flat tint is not a focus indicator on cream
**What happened**: `DropdownMenuItem`, `SelectMenuItem` and the `SearchableMultiSelect` option list all marked keyboard position with `bg-secondary` alone.
**Root cause**: `--secondary` `#F3EDE3` against the cream menu surface `#FAF6EE` measures 1.08:1 (1.16:1 on raised white). It was inherited from the navy era, where the same class was a light wash on a dark panel and therefore obvious.
**Fix**: Focus takes an inset brown ring (`focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`) plus the deeper `--row-selected` (brown 12%) fill, and hover drops to `--row-hover` (brown 6%) so the two states stay distinguishable. Any tint-only state carried over from the dark theme needs re-measuring, not just re-colouring.

## 2026-07-25 — The header's "Search records" button dispatched an event nobody listened for
**What happened**: Retiring the desktop masthead looked like it would cost the app its universal-search entry point. It cost nothing: both the desktop ⌘/ pill and the mobile search button fired `window.dispatchEvent(new Event('open-global-search'))`, and a repo-wide grep found **zero** `addEventListener('open-global-search')`. The button had never done anything.
**Root cause**: The affordance was built ahead of the search surface it was meant to open. `GlobalCommandPalette` — the only palette that exists — listens for `open-command-palette` (plus ⌘K).
**Fix**: `AppHeaderMobileBar`'s button now dispatches `open-command-palette`, which makes it the only touch route to module navigation below `lg` (⌘K has no touch equivalent, and the rail is hidden there). Before deleting chrome, grep for the *listener*, not just the dispatcher — a wired-looking control can be inert, and an inert one can be repointed at something real instead of rebuilt.
