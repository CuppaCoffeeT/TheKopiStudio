# Lessons — src/features/profiler

Last Updated: 2026-08-19

## 2026-07-27 — The result-detail axe failure was a NEUTRAL token on the page ground, not the DISC tints

**What happened**: `load-a11y.spec.ts` "legacy result detail (Bee zhen)" failed one serious `color-contrast` node on chromium-desktop while every other surface in the file passed. The DISC hues were the assumed cause — they are the loudest colour on the screen and had just been re-tinted. They were not it. The single failing node was `result-detail-readonly-hint` in `ResultDetailActions`: `text-muted-foreground` `#7D6B5B` at 10.5px, measured **4.12:1**. Fixed by moving both hint variants to `var(--fg-dim)` `#5D4F3F` (**6.40:1**).

**Root cause**: two independent traps.
1. **Ground, not hue.** The hint renders inside the `DetailPageFrame` hero, which paints the PAGE cream `#F0E6D6`, not the card cream `#FAF6EE`. `#7D6B5B` is 4.72:1 on card and passes everywhere it is used inside a `Card` — so the token looks safe in review and in every other component. `PageShellHero`'s own meta line, three lines above in the same file, had already made this exact call and carries the comment explaining it; the hint next to it did not inherit it.
2. **Viewport hid it.** mobile-safari passed the same test. The hero action row is `hidden md:inline-flex`, so the mobile project never scans the desktop hint, and the mobile copy rides `bg-popover/80` (white@80% over cream) where `#7D6B5B` reaches 4.71–4.89:1. A green mobile run is not evidence for the desktop surface, and vice versa.

**Fix**: `ReadOnlyHint` (both the profiler's and the CRM's mirrored `ClientDetailActions` copy — the same defect, not yet covered by a spec) takes `var(--fg-dim)`. Generally: **`text-muted-foreground` is a card-cream token.** Before using it, name the element that actually paints the background — on a `DetailPageFrame`/`ListPageFrame` page the hero and body are the page cream, and `#7D6B5B` fails AA there under 18px. Same trap the light-theme rule records for `PageShell`; it applies to text tokens, not just surfaces.

**Also verified (no change needed)**: the DISC tints were audited across all four quadrants on BOTH cream grounds, not just the one the spec happens to render. Hero band (14% fill): `--fg` 8.72–9.20 on page / 9.92–10.43 on card, `--fg-dim` 5.24–5.53 / 5.96–6.27. Opening line (7%): `--fg` 9.62–9.91 / 10.99–11.28, `--fg-dim` 5.78–5.95 / 6.60–6.78. Trait chips (13% over card): `--fg` 10.03–10.51. Worst case anywhere is 5.24:1 — every quadrant clears AA with margin. `--fg-muted` on those tints is 3.37–4.36 and stays banned, exactly as `decisions.md` records. When an axe failure appears on a screen that has a loud data colour, measure the boring neutrals first.

## 2026-08-19 — The hero's "See how it works" was dead because the page is shorter than the viewport

**What happened**: the intake hero's secondary CTA (`wizard-hero-how`) did nothing visible. The wiring was never broken — `howRef` was attached, `Card` forwards refs, `Button` forwards `onClick`, and `scrollIntoView` fired every time. The problem is that the How-it-works card is the LAST block on a 1228px-tall page. On a 1440x900 viewport the document has only 328px of scroll room, so `block: 'start'` clamps and the card lands at the bottom edge instead of the top; at a viewport ≥1228px tall `scrollTop` never leaves 0 and the click is a literal no-op. Measured both, before and after.

**Root cause**: `scrollIntoView` as the entire payload of a CTA. It can only ever move the page by `scrollHeight - clientHeight`, so a target near the document end has no way to signal that anything happened — and the taller the user's window, the deader the button. Nothing in the code looks wrong, which is why it reads as a wiring bug.

**Fix**: the scroll stays, but it is now the nicety, not the answer. The click also moves focus to the card (`tabIndex={-1}` + `focus({ preventScroll: true })`) and holds a 1.6s brown outline on it, both of which fire whether or not the page moved. Timer cleared on unmount and on re-click.

**The trap inside the fix — `ring-*` cannot paint on `Card`**: the highlight was first written as `ring-2 ring-ring ring-offset-2`. The class landed, `activeElement` was right, and the computed `box-shadow` was still `none`. `Card` pins `shadow-[var(--card-shadow-rest)]` and that token is `none` (2a cards lift by the cream-on-cream step, not a shadow) — in Tailwind v4 `none` inside the composed `box-shadow` list invalidates the whole declaration, taking the ring with it. **Use `outline`, not `ring`, for any highlight on a `Card`.** Second trap on the way: `outline-none` in the base className overrode `outline-style` back to `none` while leaving the arbitrary shorthand's width and colour applied (computed read `none 2px rgb(138,106,71)` — a real giveaway), because utility order in the stylesheet, not class order, decides. Toggle the whole `[outline:...]` shorthand between the two states instead of pairing it with `outline-none`.

**Verify a scroll CTA by measuring, not by looking**: assert `scrollTop` before/after AND `scrollHeight - clientHeight`. A 328px move on a page whose max scroll is 328px is not a working button — it is a button that hit the floor.
