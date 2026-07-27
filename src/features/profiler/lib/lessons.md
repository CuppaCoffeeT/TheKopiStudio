# Lessons — src/features/profiler

Last Updated: 2026-07-27

## 2026-07-27 — The result-detail axe failure was a NEUTRAL token on the page ground, not the DISC tints

**What happened**: `load-a11y.spec.ts` "legacy result detail (Bee zhen)" failed one serious `color-contrast` node on chromium-desktop while every other surface in the file passed. The DISC hues were the assumed cause — they are the loudest colour on the screen and had just been re-tinted. They were not it. The single failing node was `result-detail-readonly-hint` in `ResultDetailActions`: `text-muted-foreground` `#7D6B5B` at 10.5px, measured **4.12:1**. Fixed by moving both hint variants to `var(--fg-dim)` `#5D4F3F` (**6.40:1**).

**Root cause**: two independent traps.
1. **Ground, not hue.** The hint renders inside the `DetailPageFrame` hero, which paints the PAGE cream `#F0E6D6`, not the card cream `#FAF6EE`. `#7D6B5B` is 4.72:1 on card and passes everywhere it is used inside a `Card` — so the token looks safe in review and in every other component. `PageShellHero`'s own meta line, three lines above in the same file, had already made this exact call and carries the comment explaining it; the hint next to it did not inherit it.
2. **Viewport hid it.** mobile-safari passed the same test. The hero action row is `hidden md:inline-flex`, so the mobile project never scans the desktop hint, and the mobile copy rides `bg-popover/80` (white@80% over cream) where `#7D6B5B` reaches 4.71–4.89:1. A green mobile run is not evidence for the desktop surface, and vice versa.

**Fix**: `ReadOnlyHint` (both the profiler's and the CRM's mirrored `ClientDetailActions` copy — the same defect, not yet covered by a spec) takes `var(--fg-dim)`. Generally: **`text-muted-foreground` is a card-cream token.** Before using it, name the element that actually paints the background — on a `DetailPageFrame`/`ListPageFrame` page the hero and body are the page cream, and `#7D6B5B` fails AA there under 18px. Same trap the light-theme rule records for `PageShell`; it applies to text tokens, not just surfaces.

**Also verified (no change needed)**: the DISC tints were audited across all four quadrants on BOTH cream grounds, not just the one the spec happens to render. Hero band (14% fill): `--fg` 8.72–9.20 on page / 9.92–10.43 on card, `--fg-dim` 5.24–5.53 / 5.96–6.27. Opening line (7%): `--fg` 9.62–9.91 / 10.99–11.28, `--fg-dim` 5.78–5.95 / 6.60–6.78. Trait chips (13% over card): `--fg` 10.03–10.51. Worst case anywhere is 5.24:1 — every quadrant clears AA with margin. `--fg-muted` on those tints is 3.37–4.36 and stays banned, exactly as `decisions.md` records. When an axe failure appears on a screen that has a loud data colour, measure the boring neutrals first.
