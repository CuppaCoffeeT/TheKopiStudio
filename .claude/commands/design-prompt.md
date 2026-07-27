# /design-prompt — Write a prompt to paste into Claude Design

Generate a focused prompt the user can paste into Claude Design (claude.ai/design) to edit the published AppBase design system. The user then re-handoffs back via `/design-import`.

## Invocation

User describes what they want changed — either free-text (`/design-prompt change the KPI card hover state to glass`), or no args (then ask: "What do you want Claude Design to change?").

## Protocol

### 1. Gather repo context

Before writing the prompt, read:

- [docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md](../../docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — **the live brand: The Kopi Studio, direction 2a "Kopi House", light-pinned cream/brown. Read this first.**
- [.claude/rules/light-theme.md](../rules/light-theme.md) — the enforceable surface/type contract
- [docs/99-refactor/_system/LOCKED_PICKS.md](../../docs/99-refactor/_system/LOCKED_PICKS.md) — locked visual decisions
- [docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md](../../docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md) — primitive inventory
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — current state
- [docs/99-refactor/_system/DEPRECATIONS.md](../../docs/99-refactor/_system/DEPRECATIONS.md) — **check before naming a primitive in the reuse inventory; deleted names must never be enumerated**
- Any specific primitive the user named — `Grep` for it

### 2. Emit the prompt

Output a single fenced block the user copy-pastes. Structure:

```
## Context
[2–4 lines: what the user currently has in repo — component name, file path, current visual behavior. Pull from step 1.]

## Reuse inventory — USE THESE AS-IS, DO NOT REBUILD
This is a COMPOSITION task, not a redesign. The AppBase Design System already publishes 82+ primitives across 8 groups. Use them by name; never invent a second copy.

**Primitives in scope for this feature:**
- shell: [enumerate — e.g. AppSidebar, AppSidebarFooter, AppHeaderShell, AppHeaderMobileBar, Wordmark, Card, Button, IconButton, Chip, SearchInput, FloatingCTA, LoadingSkeleton, NoResultsState, ErrorState, DateTimeCell, …]
- overlays: [enumerate — e.g. Modal, Drawer (vaul bottom-sheet · v2 lock), Popover, Tooltip, DropdownMenu, Alert, …]
- form: [enumerate — e.g. Input, Textarea, Select, Checkbox, Switch, Field, Label, DatePicker, …]
- ui: [enumerate — e.g. DataTable, DataRow, MobileListCard, Pagination, StatusTabs, …]
- detail / dashboard / charts / root atoms: [enumerate only those plausibly relevant]

**Hard bans (failure mode observed 2026-04-23):**
- Do NOT rebuild `Drawer` — the v2-locked vaul bottom-sheet is canonical. Mobile = reuse `Drawer`, desktop = reuse `Modal`. Never both, never new.
- Do NOT rebuild `Modal`, `Card`, `Badge`, `Button`, `Input`, `Select`, `Textarea`, `AppSidebar` — all published and locked.
- Do NOT reintroduce a horizontal top masthead, a module-launcher grid, or the primitives that built them (`AppHeader`, `AppHeaderDesktopBar`, `ModuleCard`, `CategoryHeader`, `ModuleSearch`) — all deleted 2026-07-25, see DEPRECATIONS.md. Desktop chrome is the 200px `AppSidebar` rail; module jump is ⌘K `CommandPalette`.
- Any `.<feature>-*` CSS class in the preview is page-scoped styling for the spec sheet ONLY — it must compose to an existing primitive at promote time. Don't export such classes as new primitives.

## Change request
[Verbatim user ask, tightened. Say what should change, not how to implement. For composition tasks, describe the page layout + states; name the primitives that fill each slot.]

## Constraints (do not break)
- Tokens stay as published (unless the change IS a token change — call it out)
- Locked picks: [paste the 2–3 LOCKED_PICKS lines relevant to this change]
- Keep the component API stable — this is a visual/token edit, not a structural rewrite
- **The app is LIGHT-PINNED — do NOT produce dark-mode rules.** There is one `:root` token block and no `.dark` counterpart; `ThemeProvider` resolves `'light'` permanently. A `.dark` rule in the preview is dead code that will be stripped at promote time. No `prefers-color-scheme`, no theme toggle.
- **Palette is Kopi Studio 2a** — page `#F0E6D6` · card `#FAF6EE` (raised LIGHTER than page) · raised/modal `#FFFFFF` · border `#D9CCC0` · text `#3A2E24` · muted `#7D6B5B` · brown `#8B6A47` (CTA/focus/active-nav) · sage `#5A7A5E` (positive) · terracotta `#D97551` (negative). Under 18px use the AA variants `#806241` / `#526F56` / `#AB4925`. No navy, no gold, no cool greys.
- **Type**: Instrument Serif for headings/numerals, **never below 18px**; IBM Plex Sans for everything else.
- **All 5 states required on every interactive element** — default / hover / active / focus-visible / disabled.
- [Any other constraint from UNIVERSAL_COMPONENTS.md this change touches]

## Deliverable
Update the `AppBase Design System` project in Claude Design. Re-publish. I will re-handoff.
If this needs a new preview page, add it under `project/preview/` with the naming convention `component-<slug>.html`.
Do NOT add a new `.jsx` under `project/ui_kits/appbase/src/` unless a genuinely new primitive shape is required (confirm by checking the reuse inventory above first). Composition pages are preview-HTML only.

## Out of scope
[Anything explicitly NOT to touch — adjacent components, unrelated tokens, page-level layouts]
- Do NOT produce new primitive `.jsx` files for shapes already in the reuse inventory.
- Do NOT invent new tokens for glass / accent colors — use the published `--surface-translucent-*` / `--accent-*` families.
```

### 2b. Historical — dark-mode-only variant (zinc dark era, retired 2026-07-25)

> ⛔ **DO NOT EMIT THIS TEMPLATE.** The app is light-pinned on the Kopi Studio cream/brown palette; a preview with zero `.dark` rules is now *correct*, not a gap. Kept verbatim below as the record of what the dark era asked for — and as the reason the `grep -c "dark"` heuristic must never be re-armed.

When a preview exists but has no dark mode (`grep -c "dark" project/preview/component-<slug>.html` = 0), emit this tighter template instead of the full one:

```
## Context
`project/preview/component-<slug>.html` exists in the published AppBase Design System but has no dark-mode rules (`grep -c "dark"` = 0). Every other preview in the bundle honors dark tokens.

## Change request
Add dark-mode styling to the `<slug>` surfaces only. Every `.<feature>-*` class in the preview's `<style>` block needs its dark counterpart. Surfaces in scope: [enumerate the specific class clusters — e.g. appbar, sidebar, rail, thread-row, right-pane, AI panels, compose modal, mobile drawer].

## Constraints
- Reuse dark tokens already defined for other previews — `zinc-900/80`, `fg`/`fg-dim`/`fg-muted` (already dark-aware), `border`/`border-soft` (already dark-aware), glass `rgba(9,9,11,0.72)`, `--surface-translucent-*` family, etc. Do NOT invent new tokens.
- Do NOT restructure markup. Pure token/class-swap pass.
- All 5 interactive states must still work in both modes.

## Deliverable
Re-publish the affected preview file(s) with dark rules in the `<style>` block. No other previews touched.

## Out of scope
Markup / layout / states / other previews / new tokens.
```

### 3. No tool calls after emitting

Just print the block and stop. The user drives the rest:

1. Paste into Claude Design
2. Iterate there visually
3. Export the bundle → get handoff URL
4. Run `/design-import <url>` here (STAGE mode) — lands in `docs/05-implementation/design-handoffs/<YYYY-MM-DD>-<short-hash>/` (the `99-refactor/_system/design/` tree it used to write to no longer exists)
5. When happy, run `/design-import --promote <staged-file>` per file to apply into `src/`

**Why staging, not direct to src/**: lets you iterate visually and rollback per-primitive. Especially important for shared primitives that fan out to multiple pages.

## Rules

- **Keep the prompt tight** — Claude Design works better with scoped asks than essays. Aim < 250 words.
- **Never** describe React/Tailwind implementation in the prompt. Claude Design thinks in HTML/CSS prototypes; leave the code translation to `/design-import`.
- **Always** quote the LOCKED_PICKS lines verbatim — don't paraphrase locked decisions.
- If the user's ask conflicts with a locked pick, flag it and ask whether to unlock before writing the prompt.

## Scope

**Belongs**: outbound prompts to Claude Design for visual/token/primitive edits.
**Doesn't**: new-feature page design (that's `/explore-module` + Claude Design session kickoff per CLAUDE_DESIGN_GAME_PLAN); importing the result (→ `/design-import`).
