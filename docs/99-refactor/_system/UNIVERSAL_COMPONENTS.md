# Universal Components — Rulebook

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-04-19 SGT (eod+15g: overlays + list atoms confirmed aligned with Claude Design handoff — App root now uses primitive Toaster · `ui/sonner` is a shim)
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

A "universal component" is a primitive that is used across modules with a locked visual/behavior spec — changing it once changes the product everywhere. This doc is the rulebook for **using · editing · creating** these primitives.

All universal components live in [src/components/primitives/](../../../src/components/primitives/). The spec-of-record for each one is its Claude Design session bundle in [design/session-*/export/appbase/project/](design/).

## 📚 Related Documentation

- [primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — the inventory table + import paths (first stop)
- [DESIGN_CATALOG.md](DESIGN_CATALOG.md) — catalog router (sessions · W09 adoption · approval)
- [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md) — Design · Impl · Adopted status per primitive (sections A–N)
- [DESIGN_CATALOG_MATRIX.md](DESIGN_CATALOG_MATRIX.md) — Module × primitive matrix
- [DESIGN_REUSE_PRINCIPLES.md](DESIGN_REUSE_PRINCIPLES.md) — 11 hard rules that made these primitives exist
- [.claude/rules/design-system.md](../../../.claude/rules/design-system.md) — mandates visual verification before commit
- [.claude/rules/universal-components.md](../../../.claude/rules/universal-components.md) — auto-loads on any `primitives/**` edit

---

## Part 1 — How to USE a universal component

### The rule

**New code imports from `@/components/primitives/**`, never from `@/components/ui/**`** (unless the legacy screen still lives on shadcn and you're not migrating it in this PR).

### The import map

```tsx
// Shell (page chrome + atoms + states)
import {
  AppHeader, Breadcrumb, ImpersonationBanner,
  Button, Chip, FilterBar, FloatingCTA,
  LoadingSkeleton, ErrorState, NoResultsState,
} from '@/components/primitives/shell';

// Overlays (floating UI)
import {
  Modal, ModalPrimaryAction, ModalGhostAction,
  DrawerRoot, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter,
  Popover, PopoverTrigger, PopoverContent,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator,
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
    ContextMenuSeparator,
  Alert,
  Toaster, toast,                       // Toaster root-mounted in App.tsx
  SearchableMultiSelect, type SMSOption,
  Kbd,
} from '@/components/primitives/overlays';

// Dashboard (module-launcher composition)
import {
  GreetingHeader, ModuleCard, NeedsAttentionPill, AttentionHeader,
  CategoryHeader, ModuleSearch, CountBadge,
} from '@/components/primitives/dashboard';

// Atoms (root)
import { Avatar } from '@/components/primitives/Avatar';
import { IconButton } from '@/components/primitives/IconButton';
import { StatusBadge, mapStatusCodeToVariant } from '@/components/primitives/StatusBadge';

// Toasts (unchanged — uses the helper)
import { showSuccess, showError, showEnhancedToast } from '@/utils/toastHelper';
```

### Which primitive replaces which legacy?

| Legacy `@/components/ui/**` | Primitive replacement | Status |
|---|---|---|
| `sonner` | `Toaster` from `primitives/overlays` | 🟢 shimmed (re-exports — old imports still work, auto-benefit from glass styling) |
| `dialog` (Radix raw) | `Modal` + `ModalPrimaryAction` + `ModalGhostAction` | 🟡 coexist — W09 migrates per page |
| `alert` | `Alert` from `primitives/overlays` | 🟡 coexist |
| `popover` | `Popover` from `primitives/overlays` | 🟡 coexist |
| `tooltip` | `Tooltip` from `primitives/overlays` | 🟡 coexist |
| `dropdown-menu` | `DropdownMenu*` from `primitives/overlays` | 🟡 coexist |
| `context-menu` | `ContextMenu*` from `primitives/overlays` | 🟡 coexist |
| `searchable-select` | `SearchableMultiSelect` | 🟡 coexist (replaces ~19 call-sites once W09 runs) |
| `button` | `Button` from `primitives/shell` | 🟡 coexist (shadcn Button still valid for unmigrated screens) |
| `skeleton` | `LoadingSkeleton` from `primitives/shell` | 🟡 coexist |

**Rule of thumb**: if you're editing a file, prefer the primitive. If you're just reading one, don't opportunistically migrate — that's W09 work with its own testing cadence.

### Compose, don't stack

The primitives already compose inside each other safely:
- `<Popover>`, `<DropdownMenu>`, `<ContextMenu>`, `<Tooltip>` are all **Portal'd** → safe inside `<Modal>` and `<DrawerRoot>` (no clipping).
- `<SearchableMultiSelect>` auto-focuses its search input when opened inside a `<Modal>` (the bug that justified building it).
- `<Toaster>` is mounted once at app root → any `toast()` / `showSuccess()` call anywhere in the tree uses the glass styling.

If you hit a composition edge case, check the spec bundle's `OverlayPrimitives.jsx` — the states cover it (`withArrow`, `handlePulse`, `destructive`, `size`).

---

## Part 2 — How to EDIT a universal component

Editing a primitive touches every adopter. Treat each edit as a breaking change by default.

### The 5-step edit protocol

1. **Re-read the Claude Design spec** for that primitive (see spec-bundle locations below). The JSX is source-of-truth for props, variants, states.
2. **Check adoption count** in [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md). If `Adopted: 1/1` you can experiment. If `Adopted: 1/80 (+79 pending W09)` you need to preserve every existing prop.
3. **Backward-compatible first** — add props, don't rename or remove. If you *must* break, grep consumers across `src/` first and migrate all call-sites in the same commit.
4. **Visually verify** per [.claude/rules/design-system.md](../../../.claude/rules/design-system.md):
   - Open the spec HTML in a browser (`file://` → `design/session-*/export/appbase/project/*.html`).
   - open the real adopter page at the `npm run dev` URL and exercise the overlay component in context.
   - Side-by-side exercise default / hover / active / focus-visible / disabled states.
5. **Update the catalog**. Flip `Impl 🟢 → 🟡` if the change is mid-flight. Update the row description if a prop changed. Commit with `Visual verify:` line per the rule.

### Spec bundle locations

| Session | Bundle | Spec files |
|---|---|---|
| S1 List/Table | [design/session-01-list-table/export/appbase/project/](design/session-01-list-table/export/appbase/project/) | `DataTable Archetype.html` + `datatable/DataTable.jsx` |
| S2 Overlays | [design/session-02-overlays/export/appbase/project/](design/session-02-overlays/export/appbase/project/) | `Overlay System.html` + `overlays/OverlayPrimitives.jsx` + `overlays/SearchableMultiSelect.jsx` |
| S-shell | [design/session-shell-app-header/export/appbase/project/](design/session-shell-app-header/export/appbase/project/) | `Session Shell.html` + `shell/AppHeader.jsx` + `shell/ListAtoms.jsx` + `shell/StateAtoms.jsx` |
| S3 Dashboard | [design/session-03-dashboard/export/appbase/project/](design/session-03-dashboard/export/appbase/project/) | `Dashboard Density.html` + `dashboard/*.jsx` (7 files) |

The bundles are gzipped tarballs, already unpacked — grep them directly.

### Anti-patterns

- ❌ **Editing an adopter to work around a primitive bug**: fix the primitive instead. Workarounds drift across pages.
- ❌ **Renaming a prop**: adopters break silently (TypeScript catches literal rename, but `leadingIcon`→`startIcon` will hit every call-site).
- ❌ **Shipping without re-running `npm run build`**: overlay z-index + portal regressions don't surface until build-time tree-shake.
- ❌ **Adding a new variant without a spec**: go back to Claude Design first. Design-first workflow is locked (per `CLAUDE_DESIGN_GAME_PLAN.md`).

---

## Part 3 — How to CREATE a new universal component

Should you? Check first:

1. **Does a primitive already fit?** Re-grep [primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md). If `<Chip>` can be styled via props, don't build `<FilterPill>`.
2. **Does a feature-local component exist** in `src/components/admin/`, `dashboard/`, etc.? If 3+ pages already use it, it's a candidate for promotion to a primitive — but *promotion* means re-specifying in Claude Design first, not copy-paste.
3. **Is there a Claude Design spec?** If no, don't build. Prompt a new Claude Design session; export; then build.

### The 5-step create protocol

1. **Place it**: one file per primitive. Co-locate by group:
   - Page chrome / atoms / states → `shell/`
   - Floating UI → `overlays/`
   - Dashboard composition → `dashboard/`
   - Purely atomic (Avatar, IconButton, StatusBadge) → root of `primitives/`
2. **Wrap Radix / vaul / sonner** — don't write accessibility from scratch. Every primitive today wraps a battle-tested a11y library.
3. **Consume v4 tokens**, not raw hex:
   - Surfaces: `bg-white dark:bg-zinc-950` · borders: `border-zinc-200 dark:border-zinc-800`
   - Page bg: `var(--page-bg)` (zinc-100) · Hover must contrast with page-bg — use `hover:bg-zinc-200` or `hover:bg-white + shadow-sm` (see DESIGN_REUSE_PRINCIPLES rule 11, hover-bg vs page-bg).
   - CTA: slate-800 · destructive: red-700 · focus: `focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2`.
   - Fonts: `var(--font-sans)` · `var(--font-mono)` · `var(--font-pixel)` (h1 ≤ 48px) · `var(--font-pixel-display)` (≥ 140px).
4. **Implement ALL 5 interactive states** (per DESIGN_REUSE_PRINCIPLES rule 11): default · hover · active/press (scale-95 on CTAs) · focus-visible (red-700 ring) · disabled (opacity-40 cursor-not-allowed).
5. **Register it in 3 places**:
   - `src/components/primitives/CONTEXT.md` inventory table
   - `docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md` primitive inventory · `docs/99-refactor/_system/DESIGN_CATALOG_MATRIX.md` module × primitive matrix column
   - The group's `index.ts` barrel

### Top-of-file JSDoc

Every primitive starts with a comment pointing back to the spec:

```tsx
/**
 * <PrimitiveName> — one-sentence purpose.
 *
 * Spec: docs/99-refactor/_system/design/session-XX-topic/export/appbase/project/<File>.jsx
 * Adopters: tracked in DESIGN_CATALOG_PRIMITIVES.md `Adopted` column.
 *
 * Locked: slate-800 CTA · red-700 focus · <any primitive-specific locks>.
 */
```

This lets future agents find the source-of-truth spec in one grep.

---

## Part 4 — Governance

### Who owns the primitive layer?

The Claude Design sessions (S1, S2, S3, S-shell, S4+) produce the spec; W07 builds the primitive; W09 adopts it per page. Status tracked in [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md).

### When is a primitive "done"?

A primitive is `🟢` only when:
1. Every Claude Design state is implemented (default + hover + active + focus + disabled × all variants).
2. `tsc --noEmit` + `npm run build` both pass.
3. At least ONE page in production consumes it (not a preview route).
4. Adoption is tracked in `DESIGN_CATALOG_PRIMITIVES.md`.

### How do we prevent drift?

- [`.claude/rules/design-system.md`](../../../.claude/rules/design-system.md) auto-loads on any `src/components/primitives/**` edit → forces visual verification before commit.
- [`.claude/rules/universal-components.md`](../../../.claude/rules/universal-components.md) auto-loads on the same paths → enforces use-primitive-over-shadcn + reminds of the 5-step edit protocol.
- [`DESIGN_REUSE_PRINCIPLES.md`](DESIGN_REUSE_PRINCIPLES.md) captures the 11 recurring mistakes we've already made — don't repeat them.
- [`/check-repo`](../../../.claude/commands/check-repo.md) §5 covers drift between W## card status and `DESIGN_CATALOG_PRIMITIVES.md` adoption counts.

### Deprecation path for `src/components/ui/**`

- `ui/sonner.tsx` is already a shim pointing at the primitive — no migration needed at call-sites.
- `ui/dialog`, `ui/popover`, `ui/tooltip`, `ui/dropdown-menu`, `ui/context-menu`, `ui/alert`, `ui/button`, `ui/skeleton`, `ui/searchable-select` stay until W09 per-page migration sweeps them out. When a module migrates, swap its imports to `primitives/**` in the same PR.
- New code never imports from `ui/**` (except for primitives not yet re-homed: `date-picker`, `accessible-components`, `form` — these are on the W07 backlog).

---

## Quick reference for agents

**If asked to "use the new design"**:
→ Import from `@/components/primitives/**` (see import map above).

**If asked to "fix a primitive"**:
→ Follow the 5-step edit protocol. Re-read spec, check adoption, backward-compatible props, visual verify, update catalog.

**If asked to "build a new universal component"**:
→ STOP. Re-grep first. If it truly doesn't exist, require a Claude Design spec before writing code.

**If asked "where is `<X>`?"**:
→ `src/components/primitives/CONTEXT.md` has the inventory table. If not listed, it doesn't exist — don't guess a path.
