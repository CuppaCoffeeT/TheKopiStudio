# AppBase_REFACTOR — Design Reuse Principles

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-04-19 SGT
**Status**: 🟢 Production (active rules — future agents MUST read)
**Priority**: 🔴 Critical

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

**Example (what went wrong 2026-04-19 eod+15d)**:
- I built a 4-role hardcoded dropdown ("Admin / Engineer / Drafter / Supervisor") inside AppHeader's user menu.
- `src/components/admin/ImpersonationSelector.tsx` already existed — full user search, fetches all users via RPC, handles `startImpersonation(userId)` with a real user ID.
- Correct move: slot `<ImpersonationSelector />` into the AppHeader via a `viewAsSlot` prop. Behaviour preserved. Visual inherits the new design via the primitive it consumes.
- Fixed in commit [TBD] — 4-role block removed from `AppHeader.tsx`; Dashboard now passes `viewAsSlot={<ImpersonationSelector />}`.

### 2. Design primitives stay in `src/components/primitives/`
- `primitives/shell/` — chrome (AppHeader, Breadcrumb, ImpersonationBanner, Button, Chip, FilterBar, FloatingCTA, LoadingSkeleton, ErrorState, NoResultsState)
- `primitives/overlays/` — system-level floating UI (Modal, Drawer, Popover, Tooltip, DropdownMenu, ContextMenu, Alert, Toaster, SearchableMultiSelect, Kbd)
- `primitives/dashboard/` — module-launcher specific (GreetingHeader, ModuleCard, NeedsAttentionPill, etc.)

These are the canonical building blocks. A new page **composes** them.

### 3. Legacy components stay where they are until their migration
`src/components/admin/ImpersonationSelector.tsx`, `src/components/LogoutButton.tsx`, `src/components/DashboardHeader.tsx`, etc. — these work, have tests, are production-proven. Do NOT rebuild them; just slot them into new layouts OR restyle their internals if a W09 migration decides to upgrade them.

### 4. `slot` pattern for injecting legacy components
When a new primitive (e.g. `AppHeader`) needs to host a legacy flow (e.g. `ImpersonationSelector`), expose a **slot prop** (`viewAsSlot?: React.ReactNode`, not `onImpersonate: (role) => void`). The slot preserves the legacy component's entire flow — no reinvention needed.

```tsx
// ✅ CORRECT — slot-based
<AppHeader viewAsSlot={<ImpersonationSelector />} ... />

// ❌ WRONG — rebuilds the flow inside AppHeader
<AppHeader
  showViewAs
  impersonationRoles={['Admin', 'Engineer', 'Drafter', 'Supervisor']}
  onImpersonate={(role) => { /* fake logic */ }}
  ...
/>
```

### 5. If you must restyle a legacy component, do it in place
Don't fork. Don't create a new file. Edit the existing file (`src/components/admin/ImpersonationSelector.tsx`) and swap its internals to consume new primitives (e.g. replace `SearchableSelect` → `SearchableMultiSelect` from `overlays/`). The component's **public API stays the same** — consumers don't change.

### 6. Check `DESIGN_CATALOG.md` first (always)
Every row in the catalog tells you:
- **Design status**: 🔴 no spec · 🟡 designed in Claude Design · 🟢 spec locked
- **Impl status**: 🔴 not built · 🟡 built · 🟢 built + tested
- **File path**: exactly where the primitive lives in `src/`
- **Adopted count**: which modules use it

If a primitive's Impl is 🟡 or 🟢 — it exists. Import and use it. Do not rebuild.

### 7. Font rule (locked)

| Use | Token | Family |
|---|---|---|
| Body / UI / prose | `--font-sans` | Roboto |
| Labels · tabular-nums · kbd · mono codes · sub-headers | `--font-mono` | Geist Mono |
| h1 ≤ 48px (page headings incl. greeting) | `--font-pixel` | **Geist Pixel Square** (crisp) |
| Display ≥ 140px (404 hero, ErrorState code) | `--font-pixel-display` | **Geist Pixel Grid** |

### 8. Page composition pattern (locked)
Every page — including `/dashboard` — follows this top-to-bottom structure:

```
<AppHeader>                           ← Session Shell chrome, consistent across all pages
<ImpersonationBanner>                 ← only when actively impersonating
<page content container max-w-*>      ← page-specific
  <GreetingHeader> or <PageTitle>    ← optional page hero
  <content sections...>
</container>
```

See [DESIGN_CATALOG.md#page-composition-pattern-locked-2026-04-19](DESIGN_CATALOG.md) for details.

### 9. Brand assets go in `public/images/`
Referenced as `/images/<file>` in JSX (Vite strips the `public/` prefix). Organize by type: `public/images/logos/`, `public/images/illustrations/`, etc.

Current:
- `public/images/JlCompanyLogo.png` — main company logo (used in AppHeader + login page)
- `public/images/JlCompanyLogoPre.png` — pre-launch variant

### 10. Never build speculative machinery
Don't design APIs for flows that don't exist yet ("let me add 4-role impersonation dropdown speculatively"). Build only what's wired to a real flow. If the real flow isn't ready, use a slot prop and let the caller pass the existing component.

### 11. Feedback on EVERY interactive element (locked 2026-04-19)
User said: *"everything need to have feedback — this is part of the design philosophy."*

Any element a user can click, hover, tap, or focus **must** signal its state. Silent buttons = broken-feeling UI. Concrete rules:

| Interaction | Required feedback |
|---|---|
| **Hover** (desktop) | Background shift · icon/text color shift · cursor: pointer · ≥ 120ms transition |
| **Active / press** | Stronger bg · scale-95 on CTAs · immediate (no transition) |
| **Focus-visible** (keyboard) | 2px red-700 ring · 1-2px offset · never `outline: none` without a replacement |
| **Disabled** | 40% opacity · cursor: not-allowed · no hover response |
| **Loading / pending** | Spinner · skeleton · or `animate-pulse` · never a frozen-looking button |
| **Toggles (collapse/expand, pin/unpin)** | Chevron rotates · icon fills · color shifts — visible direction-of-change |

**Implementation pattern** (uses Tailwind `group` for parent-scoped hover):

```tsx
<button
  className={cn(
    'group w-full flex items-center gap-2 px-2 py-2 rounded-md',
    'transition-colors',
    'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80',
    'active:bg-zinc-200 dark:active:bg-zinc-800',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700',
    'disabled:opacity-40 disabled:cursor-not-allowed'
  )}
>
  <Icon className="text-zinc-400 group-hover:text-zinc-900 transition-colors" />
  <span className="text-zinc-500 group-hover:text-zinc-900 transition-colors">{label}</span>
  <ChevronDown className="text-zinc-400 group-hover:text-red-700 transition-all" />
</button>
```

Icons + text + chevron ALL shift on hover — not just the background. Transitions smooth. Disabled state explicit.

**Brand-red on hover for active-action chevrons** (e.g. toggle-collapse): affirms "this does something on click". Matches brand accent.

**⚠️ Hover-bg vs page-bg conflict (bug we hit 2026-04-19)**:
The page bg is `--page-bg = zinc-100 (#f4f4f5)`. If a button uses `hover:bg-zinc-100`, the hover state **matches page bg and is invisible**.

- ❌ `hover:bg-zinc-100 dark:hover:bg-zinc-900` — invisible on page bg (zinc-100) and dark-mode-page (zinc-900)
- ✅ `hover:bg-zinc-200 dark:hover:bg-zinc-800` — one step darker, clearly visible
- ✅ `hover:bg-white dark:hover:bg-zinc-800` + `hover:shadow-sm` — lifted card look (good for row-level toggles)
- ✅ `hover:bg-zinc-700/10` — tint-based, works regardless of container

**Rule**: hover bg must VISUALLY differ from the current container bg. If the surface is already `var(--page-bg)`, skip to zinc-200+ or white. If the surface is white/surface-card, zinc-50/100 is fine.

**Examples (what good feedback looks like in AppBase today)**:
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
      • Look in docs/99-refactor/_system/design/session-*/
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
1. Find it: src/components/admin/ImpersonationSelector.tsx
2. Edit in place — swap SearchableSelect → SearchableMultiSelect (new primitive)
3. Public API unchanged (consumers don't change)
4. Catalog row: Impl 🟡 → 🟢 with adoption bump
```

---

## History of this rule

- **2026-04-19 (eod+15d)**: User called out that I had built a speculative 4-role impersonation dropdown inside `AppHeader.tsx` user menu, duplicating the existing `ImpersonationSelector` component's flow. User: *"i thought all the buttons design elements should be place some where then we can just reuse components?? then i design so much in the claude design for what... i thought is so that we can reuse the components."*
- **Fix**: AppHeader gained a `viewAsSlot?: React.ReactNode` prop; the speculative 4-role logic was removed; Dashboard renders `<ImpersonationSelector />` into the slot. Net effect: behaviour preserved (real user search, real RPC call, real impersonation), visual matches the new design because the primitives around it do.
- **This doc**: created so every future agent (+ my future self) sees this rule before reaching for "I'll just build a new version".
