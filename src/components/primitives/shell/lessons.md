# Lessons — src/components/primitives/shell

Last Updated: 2026-08-19

## 2026-08-19 — `ring-*` utilities cannot paint on `Card` — use `outline`

**Origin**: src/features/profiler/lib/lessons.md (2026-08-19 — hero "See how it works")

**What happened**: a temporary highlight on the profiler's How-it-works `Card` was written as `ring-2 ring-ring ring-offset-2`. The class applied and the element was correct, but the computed `box-shadow` stayed `none` — nothing rendered.

**Root cause**: `Card` pins `shadow-[var(--card-shadow-rest)]`, and that token is `none` by design (2a cards lift by the cream-on-cream colour step, not a shadow). Tailwind v4 composes `box-shadow` as a comma list of `--tw-*` slots; a `none` in that list invalidates the whole declaration, so the ring slot dies with it. This is a property of `Card` itself, not of any one adopter.

**Fix**: use `outline` for rings/highlights on a `Card` — it is independent of `box-shadow` and is already what `index.css` uses for focus. Toggle the full `[outline:2px_solid_hsl(var(--ring))]` shorthand between states; do NOT pair it with `outline-none`, which wins on `outline-style` (stylesheet utility order decides, not class order) and leaves a phantom `outline-style: none` with the width and colour still applied.
