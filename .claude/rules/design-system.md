---
paths:
  - 'src/components/primitives/**/*.tsx'
  - 'src/components/primitives/**/*.ts'
  - 'src/features/**/*.tsx'
  - 'src/pages/**/*.tsx'
---

# Rule: Design System — Visual Verification Before Commit (MANDATORY)

**Last Updated**: 2026-05-30 SGT

## Summary

Any edit to a design primitive (`src/components/primitives/**`) OR a W09 page migration MUST be visually verified against the Claude Design spec in `docs/99-refactor/_system/design/session-*/export/` BEFORE commit. `tsc` + `build` green is not enough — they don't catch hover-bg / page-bg conflicts, missing focus rings, wrong fonts, or drift from the design bundle.

## Detailed Patterns

### Before writing code

1. **Find the design spec.** Grep `docs/99-refactor/_system/design/session-*/export/appbase/project/` for the component name. Read the `.jsx` file top-to-bottom — note every prop, every variant, every state.
2. **Read [primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md)** — if the component exists there, reuse it (per `design-reuse-principles`).
3. **Read [DESIGN_REUSE_PRINCIPLES.md](../../docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md)** — 11 hard rules incl. feedback on every interactive element + hover-bg vs page-bg conflict.

### Create-a-new-primitive protocol (7 steps)

Before writing a new primitive:

1. **Grep first** — check `primitives/CONTEXT.md` + `DESIGN_CATALOG_PRIMITIVES.md`; a half-built version probably exists.
2. **Require a spec** — no Claude Design spec, no build. Run `/design-prompt` → export → THEN implement.
3. **Place in group** — `shell/` · `overlays/` · `dashboard/` · `detail/` · `form/` · `ui/` · `charts/` · root atom. Barrel-export from group's `index.ts`.
4. **Consume v4 tokens** — no raw hex. Fonts `--font-*`, CTA slate-800, focus red-700, per-primitive tokens in `src/index.css` + `src/lib/design/tokens.ts`.
5. **All 5 states** — default / hover / active / focus-visible / disabled (see table below).
6. **Register in 3 places** — (a) `primitives/CONTEXT.md` inventory, (b) `DESIGN_CATALOG_PRIMITIVES.md` row (flip Impl) + `DESIGN_CATALOG_MATRIX.md` column if module adoption changed, (c) group's `index.ts`. Bonus: add row to [universal-components.md](./universal-components.md) "Need → Import" matrix.
7. **JSDoc header** cites the spec path so future agents can grep it in one shot.

### While writing code

For every interactive element, explicitly implement **all 5 states**:

| State | What to check |
|---|---|
| **Default** | Correct fg/bg/border for the container context |
| **Hover** | Must VISUALLY differ from container bg. If parent is `var(--page-bg)` (= zinc-100), use `hover:bg-zinc-200` or `hover:bg-white` + shadow — NOT `hover:bg-zinc-100` (invisible) |
| **Active / press** | Stronger bg · scale-95 on CTAs · immediate (no transition) |
| **Focus-visible** | `focus-visible:ring-2 ring-red-700` + offset · never silent |
| **Disabled** | `opacity-40 cursor-not-allowed` · no hover response |

### Before commit — visual verify

Do these FIVE checks. Document completion in the commit message with a `Visual verify:` line.

1. **Open dev server** — `npm run dev` must be running.
2. **Open the design spec HTML** — in a browser tab, file:// the bundled HTML (e.g. `docs/99-refactor/_system/design/session-03-dashboard/export/appbase/project/Dashboard Density.html`). That's the source-of-truth visual.
3. **Open the live page** — the page that consumes the primitive (e.g. `http://localhost:8080/dashboard`). Side-by-side with the design spec.
4. **Exercise every state** — hover each button, focus with Tab, press Enter, try disabled flows, trigger loading/error. Compare pixel-by-pixel against the design spec.
5. **Take screenshots** — if deviating from the design (with reason), capture before/after + note the deviation in the commit message.

### Design spec locations (verified 2026-05-30 SGT)

| Session | Spec bundle | Key files |
|---|---|---|
| S1 List/Table | `design/session-01-list-table/export/` | `DataTable Archetype.html` + `datatable/DataTable.jsx` |
| S2 Overlays | `design/session-02-overlays/export/appbase/project/` | `Overlay System.html` + `overlays/OverlayPrimitives.jsx` + `overlays/SearchableMultiSelect.jsx` |
| S-shell | `design/session-shell-app-header/export/appbase/project/` or `session-03-dashboard/export/.../shell/` | `Session Shell.html` + `shell/AppHeader.jsx` + `shell/ListAtoms.jsx` + `shell/StateAtoms.jsx` |
| S3 Dashboard | `design/session-03-dashboard/export/appbase/project/` | `Dashboard Density.html` + `Dashboard Responsive.html` + `dashboard/*.jsx` (GreetingHeader · ModuleCard · CategoryHeader · DensityVariants · DashboardSections · DashStates) |

The bundles are gzipped tarballs — already unpacked in `export/` so you can grep directly.

### Common visual drift failures (seen in this project)

| Failure | Root cause | Fix |
|---|---|---|
| Hover appears broken — no highlight on buttons | `hover:bg-zinc-100` matches `--page-bg` (zinc-100) — invisible | `hover:bg-zinc-200` or `hover:bg-white` + shadow |
| Greeting uses pixelated look I didn't want | `--font-pixel-display` (Grid) used for ≤ 48px text | Use `--font-pixel` (Square) for h1 ≤ 48px. Grid only for ≥ 140px (404 hero, ErrorState code) |
| Description text clipped in ModuleCard | Fixed `h-[92px]` can't grow | Use `min-h-[92px]` instead |
| Subsection doesn't look clickable | Static button — no hover/active/cursor feedback | Add `group` utility + `hover:bg-*` + `hover:shadow-sm` + `active:*` + `cursor-pointer` + `transition-all` |
| View-as dropdown too big | Rebuilt inline instead of reusing existing primitive | Use slot pattern (`viewAsSlot` prop) — pass `<ViewAsSelector {...useViewAs()} />` from `@/components/primitives/shell` |
| New feature duplicates an existing component | Didn't grep `src/components/admin/` etc. before building | Always check `primitives/CONTEXT.md` + grep first |

## Visual Anti-Patterns (every page)

Rules observed across CompanyDetail and subsequent migrations. Catch before writing.

| # | Rule |
|---|---|
| 1 | **No cards-in-cards** — `<DetailPageFrame>` is the outer container; never wrap sections in additional `<Card>`. |
| 2 | **Single hero action bar** — all primary actions (Edit · Save · Deactivate) go in `<DetailPageFrame actions={…}>` only; no floating `<Button>` inside sections. |
| 3 | **Title once** — record name in `<DetailPageFrame title>` only; strip any `<h2>{name}</h2>` inside body. |
| 4 | **Replace legacy wrappers** — check `primitives/CONTEXT.md` before keeping a legacy sub-component; use the primitive equivalent unless it genuinely can't express the workflow. |
| 5 | **No shadow-md/lg on body** — body sections: `border border-zinc-200 rounded-lg` at most; `<DetailPageFrame>` provides hero elevation. |
| 6 | **Color tokens only** — `bg-background` / `text-foreground` / `border-border`; never `bg-gray-50`, `bg-[#fafafa]`, or inline `style={{ color: '#…' }}`. |
| 7 | **Hover-bg must differ from page-bg** — `var(--page-bg)` = zinc-100; `hover:bg-zinc-100` is invisible; use `hover:bg-zinc-200` or `hover:bg-white + shadow-sm`. _(also in 5-states table above)_ |
| 8 | **No duplicate activity display** — if `<ActivityLogTimeline>` is in main, omit any "Recent changes" card elsewhere. |
| 9 | **Side-rail = supporting context; main = primary workflow** — contacts/stats in `<DetailPageFrame sideRail>`; line-item editors in main. Don't invert. |
| 10 | **No "Back to X" button** — breadcrumb is the only back-nav affordance across all archetypes. Never pass `showBack={true}` to `<DashboardHeader>` or render an inline `<ArrowLeft>` button. |

### Known Patterns (observed 2026-04-19)

Recurring pattern: **shipping a primitive without visual verification** leads to user flagging (a) invisible hover states, (b) wrong font (Grid vs Square), (c) clipped content, (d) duplicated flows. All four happened on the /dashboard W09 migration.

**Fix**: every primitive commit message MUST include a `Visual verify:` line specifying (1) the design spec file consulted, (2) states exercised (default/hover/active/focus/disabled), (3) any deviations with reason.

## References

- [docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md](../../docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — 11 hard rules (READ FIRST)
- [docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md](../../docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md) — primitive inventory with Design/Impl/Adopted status (sections A–N) · [DESIGN_CATALOG_MATRIX.md](../../docs/99-refactor/_system/DESIGN_CATALOG_MATRIX.md) — module × primitive matrix · [DESIGN_CATALOG.md](../../docs/99-refactor/_system/DESIGN_CATALOG.md) — router
- [docs/99-refactor/_system/ARCHITECTURE_BLUEPRINT.md](../../docs/99-refactor/_system/ARCHITECTURE_BLUEPRINT.md) — target codebase shape
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — primitive-level index with import paths
- [.claude/rules/code-hygiene.md](./code-hygiene.md) — the 4-checks-when-touching-a-file baseline
