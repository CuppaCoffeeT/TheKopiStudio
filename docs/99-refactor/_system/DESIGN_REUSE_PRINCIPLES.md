# AppBase_REFACTOR — Design Reuse Principles

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-07-27 SGT — every live instruction re-verified against the filesystem; dead component/asset/font references corrected for The Kopi Studio 2a redesign
**Status**: 🟢 Production (active rules — future agents MUST read)
**Priority**: 🔴 Critical

> **Reading contract**: the numbered rules and the two workflows are **live instructions** —
> every path in them was `ls`-verified on 2026-07-27. Sections explicitly titled
> **Historical** are preserved verbatim for their lesson; the component names inside them
> may no longer exist. Never implement from a Historical block.

## 📋 Overview

The whole point of the design system is **component reuse**. When user sees "the design needs to do X", the default answer is almost never "build a new component" — it is:

1. **Does a primitive already do this?** Use it.
2. **Does a legacy component do this?** Restyle it; keep the behavior.
3. Only if neither exists → build new, and add it to `DESIGN_CATALOG.md`.

User has designed extensively in Claude Design for this exact reason. Every button, dropdown, dialog, field, pattern has been laid out. Building a new one is wasted effort — and worse, it creates inconsistency (user sees "huh that's different from the rest").

## 📚 Related

- [DESIGN_CATALOG.md](DESIGN_CATALOG.md) — the inventory of every primitive. First stop before building anything.
- [LOCKED_PICKS.md](LOCKED_PICKS.md) — visual-language rationale
- [CLAUDE_DESIGN_GAME_PLAN.md](CLAUDE_DESIGN_GAME_PLAN.md) — session-by-session plan

---

## The rules (hard)

### 1. Reuse first — never reinvent
Before writing a new component, grep `src/components/` and read [DESIGN_CATALOG.md](DESIGN_CATALOG.md). If the flow already exists, restyle the existing component. Don't rewrite behaviour.

**Historical — Example (AppHeader/ImpersonationSelector era, retired 2026-07-25)**. *The lesson stands; the file names do not. `AppHeader.tsx` was deleted in the 2a redesign and `ImpersonationSelector.tsx` became `src/components/primitives/shell/ViewAsSelector.tsx`. Text kept verbatim:*

- I built a 4-role hardcoded dropdown ("Admin / Engineer / Drafter / Supervisor") inside AppHeader's user menu.
- `src/components/admin/ImpersonationSelector.tsx` already existed — full user search, fetches all users via RPC, handles `startImpersonation(userId)` with a real user ID.
- Correct move: slot `<ImpersonationSelector />` into the AppHeader via a `viewAsSlot` prop. Behaviour preserved. Visual inherits the new design via the primitive it consumes.
- Fixed in commit [TBD] — 4-role block removed from `AppHeader.tsx`; Dashboard now passes `viewAsSlot={<ImpersonationSelector />}`.

**The same mistake today** would be rebuilding a "view as" control instead of importing `ViewAsSelector` from `@/components/primitives/shell/ViewAsSelector` — which `ListPageFrame` and `DetailPageFrame` already slot in via `viewAsSlot`.

### 2. Design primitives stay in `src/components/primitives/`
- `primitives/shell/` — chrome (AppSidebar, AppSidebarFooter, AppHeaderShell, AppHeaderMobileBar, AppHeaderLogo, AppHeaderUserMenu, Wordmark, Breadcrumb, ImpersonationBanner, ViewAsSelector, Button, Card, Chip, Badge, FilterBar, FloatingCTA, LoadingSkeleton, ErrorState, NoResultsState, PageTitle, PageDescription)
- `primitives/overlays/` — system-level floating UI (Modal, Drawer, Popover, Tooltip, DropdownMenu, ContextMenu, Alert, Toaster, SearchableMultiSelect, SelectMenu, Tabs, Collapsible, CommandPalette, Kbd)
- `primitives/dashboard/` — dashboard-surface specific (GreetingHeader, KpiIndexCard, KpiTile, KpiDeltaBadge, NeedsAttentionPill, AttentionHeader, CountBadge, NumberTicker, CDWProgressTimeline)
- also `primitives/ui/` (DataTable kit + ListPageFrame), `primitives/form/`, `primitives/detail/` (DetailPageFrame), `primitives/charts/`

**Deleted 2026-07-25 by the Kopi Studio 2a redesign — do not cite as live**: `AppHeader`, `AppHeaderDesktopBar` (top masthead; desktop chrome is now the `AppSidebar` rail, `< lg` is `AppHeaderMobileBar`) and the dashboard launcher trio `ModuleCard`, `CategoryHeader`, `ModuleSearch`. See [DEPRECATIONS.md](./DEPRECATIONS.md). Note the surviving `AppHeader*` files listed above are **not** deprecated — match exact filenames, not the `AppHeader` prefix.

These are the canonical building blocks. A new page **composes** them. **The only authoritative inventory is the directory listing itself** — `ls src/components/primitives/*/` before you cite a primitive. (As of 2026-07-27, `src/components/primitives/CONTEXT.md` still lists four names that no longer exist — `AppHeader`, `ImageTile`, `PhotoGallery`, `ImpersonationMenu` — so do not treat it as the source of truth for existence.)

### 3. Working components stay where they are until their migration
A component that works, has tests and is production-proven does NOT get rebuilt — you slot it into the new layout, or restyle its internals in place if a migration decides to upgrade it.

The W09-era examples this rule was written around (`src/components/admin/ImpersonationSelector.tsx`, `src/components/LogoutButton.tsx`, `src/components/DashboardHeader.tsx`) have all since been migrated or deleted — `src/components/` now holds only `primitives/`, `shared/` and `ui/`. The rule is unchanged; apply it to whatever is live when you read this. The "view as" flow, for instance, survives every reskin as `src/components/primitives/shell/ViewAsSelector.tsx`.

### 4. `slot` pattern for injecting an existing flow
When a chrome primitive needs to host an existing flow (e.g. "view as"), expose a **slot prop** (`viewAsSlot?: React.ReactNode`, not `onImpersonate: (role) => void`). The slot preserves the existing component's entire flow — no reinvention needed.

This is live today: `AppHeaderShell`, `AppHeaderMobileBar` and `AppHeaderUserMenu` each take `viewAsSlot`, and `ListPageFrame` / `DetailPageFrame` fill it.

```tsx
// ✅ CORRECT — slot-based (this is the shipped call in ListPageFrame.tsx)
<AppHeaderMobileBar viewAsSlot={<ViewAsSelector {...chrome.viewAs} />} ... />

// ❌ WRONG — rebuilds the flow inside the chrome primitive
<AppHeaderMobileBar
  showViewAs
  impersonationRoles={['Admin', 'Engineer', 'Drafter', 'Supervisor']}
  onImpersonate={(role) => { /* fake logic */ }}
  ...
/>
```

### 5. If you must restyle an existing component, do it in place
Don't fork. Don't create a new file. Edit the existing file (e.g. `src/components/primitives/shell/ViewAsSelector.tsx`) and swap its internals to consume new primitives (e.g. replace a bespoke select → `SearchableMultiSelect` from `overlays/`). The component's **public API stays the same** — consumers don't change.

### 6. Check `DESIGN_CATALOG.md` first (always)
Every row in the catalog tells you:
- **Design status**: 🔴 no spec · 🟡 designed in Claude Design · 🟢 spec locked
- **Impl status**: 🔴 not built · 🟡 built · 🟢 built + tested
- **File path**: exactly where the primitive lives in `src/`
- **Adopted count**: which modules use it

If a primitive's Impl is 🟡 or 🟢 — it exists. Import and use it. Do not rebuild.

### 7. Font rule (locked 2026-07-25 — The Kopi Studio 2a)

Two families only. Verified against `src/index.css`:

| Use | Token | Family |
|---|---|---|
| Body · UI · forms · labels · buttons · nav · table body | `--font-sans` (and `--font-subheader` for h2–h6) | **IBM Plex Sans** |
| Headings · KPI/table numerals · empty-state + loading lines · wordmark | `--font-pixel` (`--font-pixel-display`, `--font-prose` are the same family) | **Instrument Serif** |
| `code` · `kbd` · `pre` · `samp` · tabular numerics | `--font-mono` | system `ui-monospace` stack (SFMono → Menlo) |

**HARD FLOOR: Instrument Serif is never used below 18px.** Anything under 18px is IBM Plex Sans, no exceptions.

The previous lock (Roboto body · Geist Mono · Geist Pixel Square/Grid display) is **retired** — the Geist Pixel shape aliases and the self-hosted woff2 are gone from the repo. See [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) → Typography.

### 8. Page composition pattern (locked 2026-07-25 — sidebar shell)
Every signed-in page follows this structure:

```
<AppSidebar>                          ← ≥ lg: the 200px rail, the whole desktop chrome
<AppHeaderMobileBar>                  ← < lg: the mobile bar (carries viewAsSlot)
<ImpersonationBanner>                 ← only when actively impersonating
<page content container max-w-*>      ← page-specific
  <GreetingHeader> or <PageTitle>    ← optional page hero
  <content sections...>
</container>
```

In practice you rarely hand-assemble this: compose `ListPageFrame` (`primitives/ui/`) or `DetailPageFrame` (`primitives/detail/`), which wire the chrome for you. Breadcrumb is page **content** (quiet inline text above the H1), not chrome — the top masthead that used to carry it was deleted 2026-07-25.

See [DESIGN_CATALOG.md](DESIGN_CATALOG.md) for details.

### 9. Brand assets
Identity is **rendered, not shipped as an image**. There is no logo file: the brand lockup is the `Wordmark` component at `src/components/primitives/shell/Wordmark.tsx` ("The Kopi *Studio*", second word italic + brown), and the user-facing product name is the single constant `PRODUCT_NAME` in [src/lib/product.ts](../../../src/lib/product.ts). Import those — never re-type the name or re-draw the lockup.

`Wordmark` is consumed by `AppSidebar` (22px), `AppHeaderLogo` (18px — the serif floor) and `WizardTopBar` (the public `/profiler` route). Size and the roman words' colour are the caller's, via `className`.

If a genuine raster asset is ever needed, it goes in `public/images/` and is referenced as `/images/<file>` in JSX (Vite strips the `public/` prefix). As of 2026-07-27 `public/` holds only `placeholder.svg` and `robots.txt` — the old `JlCompanyLogo.png` / `JlCompanyLogoPre.png` were removed with the JL-branded era.

### 10. Never build speculative machinery
Don't design APIs for flows that don't exist yet ("let me add 4-role impersonation dropdown speculatively"). Build only what's wired to a real flow. If the real flow isn't ready, use a slot prop and let the caller pass the existing component.

### 11. Feedback on EVERY interactive element (locked 2026-04-19)
User said: *"everything need to have feedback — this is part of the design philosophy."*

Any element a user can click, hover, tap, or focus **must** signal its state. Silent buttons = broken-feeling UI. Concrete rules:

| Interaction | Required feedback |
|---|---|
| **Hover** (desktop) | Background shift · icon/text color shift · cursor: pointer · ≥ 120ms transition |
| **Active / press** | Stronger bg · scale-95 on CTAs · immediate (no transition) |
| **Focus-visible** (keyboard) | 2px **brown** ring (`--ring` / `--shadow-focus`) · 1-2px offset · never `outline: none` without a replacement · never terracotta |
| **Disabled** | 40% opacity · cursor: not-allowed · no hover response |
| **Loading / pending** | Spinner · skeleton · or `animate-pulse` · never a frozen-looking button |
| **Toggles (collapse/expand, pin/unpin)** | Chevron rotates · icon fills · color shifts — visible direction-of-change |

**Implementation pattern** (uses Tailwind `group` for parent-scoped hover). Warm tokens only — no `zinc-`/`slate-`/`gray-`, and **no `dark:` pairs** (the app is light-pinned; `dark:` is dead code):

```tsx
<button
  className={cn(
    'group w-full flex items-center gap-2 px-2 py-2 rounded-md',
    'transition-colors',
    'cursor-pointer hover:bg-secondary',        // #F3EDE3 tint — or var(--row-hover) brown wash
    'active:bg-accent/15',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',  // brown
    'disabled:opacity-40 disabled:cursor-not-allowed'
  )}
>
  <Icon className="text-muted-foreground group-hover:text-foreground transition-colors" />
  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
  <ChevronDown className="text-muted-foreground group-hover:text-[var(--brand-red)] transition-all" />
</button>
```

Icons + text + chevron ALL shift on hover — not just the background. Transitions smooth. Disabled state explicit.

**Brand accent on hover for active-action chevrons** (e.g. toggle-collapse): affirms "this does something on click". Use `var(--brand-red)` — a legacy token *name* that now holds the AA-safe brand **brown** `#806241`, which is also what links use. There is no red in this brand.

**⚠️ Hover-bg vs page-bg conflict — the principle (still binding)**:
Hover bg must VISUALLY differ from the container it sits on. On the Kopi Studio cream ladder the trap is the same shape as the original bug: the page is `#F0E6D6` and cards are `#FAF6EE`, so a hover fill that lands on either is invisible on that surface. Use `bg-secondary` (`#F3EDE3`) or the tint-based `var(--row-hover)` (brown @ 6%), which reads on page **and** card.

**Historical — the original bug (zinc/slate era, retired 2026-07-25)**. *Palette retired; the lesson is not. Text kept verbatim:*

> **⚠️ Hover-bg vs page-bg conflict (bug we hit 2026-04-19)**:
> The page bg is `--page-bg = zinc-100 (#f4f4f5)`. If a button uses `hover:bg-zinc-100`, the hover state **matches page bg and is invisible**.
>
> - ❌ `hover:bg-zinc-100 dark:hover:bg-zinc-900` — invisible on page bg (zinc-100) and dark-mode-page (zinc-900)
> - ✅ `hover:bg-zinc-200 dark:hover:bg-zinc-800` — one step darker, clearly visible
> - ✅ `hover:bg-white dark:hover:bg-zinc-800` + `hover:shadow-sm` — lifted card look (good for row-level toggles)
> - ✅ `hover:bg-zinc-700/10` — tint-based, works regardless of container
>
> **Rule**: hover bg must VISUALLY differ from the current container bg. If the surface is already `var(--page-bg)`, skip to zinc-200+ or white. If the surface is white/surface-card, zinc-50/100 is fine.

**Examples (recorded in the zinc/slate era — the palette is retired, the PRINCIPLE is not; `ModuleCard` and `CategoryHeader` were themselves deleted 2026-07-25, see [DEPRECATIONS.md](./DEPRECATIONS.md))**:
- `<ModuleCard>` — hover: -translate-y-px + shadow + border-slate-800 + bg shift
- `<Button variant='primary'>` — hover: slate-800 → slate-900 + focus ring red-700
- `<CategoryHeader>` — hover: bg-zinc-100 + icon/label/count shift to darker + chevron flips to red-700
- `<NeedsAttentionPill>` — hover: bg shift + border flip to slate-800
- `<Chip>` — hover: bg-zinc-100; active: slate-800 bg + white text

---

## Workflow: when to add a new primitive

```
1. USER: "I want [X]"
      ↓
2. CHECK: Does [X] already exist?
      • Grep `src/components/`
      • Read DESIGN_CATALOG.md
      • If yes → STOP. Use it. Maybe restyle.
      ↓
3. NEW: Does Claude Design have a spec for [X]?
      • Look in docs/05-implementation/design-handoffs/<date>-<slug>/
        (currently: 2026-07-21-visual-directions · 2026-07-25-kopi-studio-2a)
      • Check it against the CURRENT direction first — 2a supersedes everything
        staged before 2026-07-25
      • If yes → implement from the spec; add row to DESIGN_CATALOG.md
      ↓
4. NONE: Kick a Claude Design session
      • Don't build speculatively — let Claude Design produce the spec
      • Only then implement
```

## Workflow: when user says "update the design of X"

**Default interpretation**: restyle the existing component X, don't build a new Y that replaces X. Unless the user explicitly says "build a new component", the answer is always edit-in-place.

```
USER: "update the design of the view-as dropdown"
  ↓
1. Find it: src/components/primitives/shell/ViewAsSelector.tsx
2. Edit in place — swap its internals for the newer primitive
3. Public API unchanged (consumers don't change —
   ListPageFrame + DetailPageFrame slot it via viewAsSlot)
4. Catalog row: Impl 🟡 → 🟢 with adoption bump
```

---

## History of this rule

*Historical (AppHeader era, retired 2026-07-25) — `AppHeader.tsx` and `ImpersonationSelector` no longer exist; the account cluster now lives in `AppSidebarFooter` / `AppHeaderUserMenu` and the control is `ViewAsSelector`. Text kept verbatim:*

- **2026-04-19 (eod+15d)**: User called out that I had built a speculative 4-role impersonation dropdown inside `AppHeader.tsx` user menu, duplicating the existing `ImpersonationSelector` component's flow. User: *"i thought all the buttons design elements should be place some where then we can just reuse components?? then i design so much in the claude design for what... i thought is so that we can reuse the components."*
- **Fix**: AppHeader gained a `viewAsSlot?: React.ReactNode` prop; the speculative 4-role logic was removed; Dashboard renders `<ImpersonationSelector />` into the slot. Net effect: behaviour preserved (real user search, real RPC call, real impersonation), visual matches the new design because the primitives around it do.
- **This doc**: created so every future agent (+ my future self) sees this rule before reaching for "I'll just build a new version".
