# Lessons — src/components/primitives/shell

Last Updated: 2026-08-19

## 2026-08-19 — `ring-*` utilities cannot paint on `Card` — use `outline`

**Origin**: src/features/profiler/lib/lessons.md (2026-08-19 — hero "See how it works")

**What happened**: a temporary highlight on the profiler's How-it-works `Card` was written as `ring-2 ring-ring ring-offset-2`. The class applied and the element was correct, but the computed `box-shadow` stayed `none` — nothing rendered.

**Root cause**: `Card` pins `shadow-[var(--card-shadow-rest)]`, and that token is `none` by design (2a cards lift by the cream-on-cream colour step, not a shadow). Tailwind v4 composes `box-shadow` as a comma list of `--tw-*` slots; a `none` in that list invalidates the whole declaration, so the ring slot dies with it. This is a property of `Card` itself, not of any one adopter.

**Fix**: use `outline` for rings/highlights on a `Card` — it is independent of `box-shadow` and is already what `index.css` uses for focus. Toggle the full `[outline:2px_solid_hsl(var(--ring))]` shorthand between states; do NOT pair it with `outline-none`, which wins on `outline-style` (stylesheet utility order decides, not class order) and leaves a phantom `outline-style: none` with the width and colour still applied.

## 2026-08-19 — A twice-mounted nav cannot carry a hard-coded `id`

**What happened**: `AppSidebarOthers` paired its toggle to its panel with a
literal `aria-controls="app-sidebar-others"` / `id="app-sidebar-others"`. Below
lg that id is in the document TWICE — the rail is `hidden`, not unmounted, while
`AppNavDrawer` mounts the same `AppSidebarNav` — so `aria-controls` resolved to
whichever copy came first, which is not necessarily the toggle's own panel.

**Root cause**: the component was written as if it mounted once. The `toggleTestId`
prop already existed precisely because a shared testid matches two nodes and trips
Playwright strict mode — the same duplication, spotted for tests but not for ARIA.

**Fix**: `useId()` per instance for both the "Others" panel and the new Tools band
heading. Any id inside `AppSidebarNav` or its children must be generated, never
literal — and the `toggleTestId` prop stays, since a testid must be stable.
