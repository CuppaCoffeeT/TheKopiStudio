# Primitives — Design-System Components (READ FIRST)

**Before building anything new, grep here.** Canonical matrix: [DESIGN_CATALOG.md](../../../docs/99-refactor/_system/DESIGN_CATALOG.md).

**96 `.tsx` files across 8 groups** — counted from the filesystem on 2026-10-28 (the 2026-10-28 dead-code cleanup deleted `charts/` and ~70 unused files; see [DEPRECATIONS.md](../../../docs/99-refactor/_system/DEPRECATIONS.md)). Reproduce with:

```sh
find src/components/primitives -name '*.tsx' | wc -l                 # total
for d in dashboard detail form overlays shell tools ui; do    # per group
  printf '%-10s %s\n' "$d" "$(find src/components/primitives/$d -name '*.tsx' | wc -l)"
done
```

The table below counts **every `.tsx` under the group directory, including nested
folders** (`shell/cells`, `detail/dossier`). That is a file count, not an export count — several
files are internal splits that the barrel does not re-export, and several files
export more than one component. **The barrel `index.ts` is the authoritative
import surface**; when in doubt read it rather than this table. `detail/` and `ui/`
have **no barrel** — import those files by deep path.

All primitives consume Tailwind v4 `@theme` tokens from [src/index.css](../../index.css) —
Instrument Serif (`--font-pixel`, headings ≥18px only) + IBM Plex Sans (`--font-sans`),
both loaded in [index.html](../../../index.html) — over shadcn/Radix/vaul.
Promotion + registration history: [CHANGELOG.md](./CHANGELOG.md).

> **Brand**: The Kopi Studio, direction 2a — light-pinned cream/brown. Cards are
> **RAISED (lighter) than the cream page**. There is no dark mode, no theme toggle,
> and every `dark:` utility is inert dead code. Contract:
> [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md).

## Scope

**Belongs**: design-system primitives — stateless, spec-backed, feature-agnostic.
**Doesn't**: shadcn raw (`../ui/` — only `sheet.tsx` survives); feature-specific components (`src/features/<x>/components/`).

## Core rule

**Never rebuild what exists.** See [DESIGN_REUSE_PRINCIPLES.md](../../../docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — rule 1 (reuse first) · rule 11 (feedback on every interactive element).

## Inventory

| Group | `.tsx` | Import pattern | What's inside |
|---|---|---|---|
| **root atoms** | 2 | `@/components/primitives/IconButton` (deep) | IconButton · StatusBadge |
| **[shell/](./shell/)** | 34 | `@/components/primitives/shell` | AppSidebar · AppSidebarNav · AppNavDrawer · AppSidebarFooter · AppHeaderShell · AppHeaderLogo · AppHeaderMobileBar · AppHeaderUserMenu · Wordmark · Badge · Breadcrumb · Button · Card · Chip · FilterBar · FloatingCTA · ImpersonationBanner · LoadingSkeleton · LoadingSpinner · ErrorState · NoResultsState · NotificationsBell · PageDescription · PageTitle · SearchInput · SEO · ViewAsSelector · cells/DateCell · internal split (not barrel-exported): ErrorStateHero |
| **[overlays/](./overlays/)** | 13 | `@/components/primitives/overlays` | Alert · ChoiceCards · CommandPalette · DropdownMenu · Kbd · Modal · Popover · SearchableMultiSelect · SelectMenu · Tabs · Toaster · Tooltip · internal split: CommandPaletteAtoms · [RECIPES.md](./overlays/RECIPES.md) |
| **[dashboard/](./dashboard/)** | 5 | `@/components/primitives/dashboard` | DailyQuoteCard · GreetingHeader · KpiDeltaBadge · KpiTile · NumberTicker |
| **[detail/](./detail/)** | 10 | `@/components/primitives/detail/<File>` (deep; no barrel) | DestructiveConfirmDialog · DetailPageFrame · PageShell · PageShellStatusPill · TabNav · dossier/{DossierPanel · DossierStatGrid · DossierRampBar · DossierKeyValueList · DossierLoadingPanel} |
| **[form/](./form/)** | 11 | `@/components/primitives/form` | Input · Textarea · Checkbox · Radio · Switch · DatePicker (+ .trigger/.panel/.dropdown splits) · Field · Progress |
| **[ui/](./ui/)** | 15 | `@/components/primitives/ui/<File>` (deep; no barrel) | DataTable · DataRow · TableHeader · SortIcon · TableCheckbox · Pagination · PageBtn · MobileListCard · StatusTabs · ListPageFrame · internal splits: DataTableRows · DataTableStates · DataRowCells · ListPageHeader · ListPageTable |
| **[tools/](./tools/)** | 6 | `@/components/primitives/tools` | The chrome behind every numbered tool in `src/lib/toolRoutes` — ToolPageShell · ToolPageHeader · ToolCustomerBar (presentational) · ToolPanel · ToolFigures (ToolStatGrid · SummaryRow) · ToolSelect (+ ToolNote). See [tools/CONTEXT.md](./tools/CONTEXT.md) |

## Adoption tracker

Per-primitive adoption + spec status: [DESIGN_CATALOG_PRIMITIVES.md](../../../docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md).

⚠️ [PRIMITIVES_MANIFEST.json](../../../docs/99-refactor/_system/PRIMITIVES_MANIFEST.json) is **stale** — generated 2026-05-30, before the 2a redesign, and its builder script no longer exists in `scripts/`. Treat it as history, not as the live count; derive counts with the `find` commands above.

Visual verification: [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) (palette / surface / type contract + pre-commit checklist).

## 📚 Related

- [COMPOSITION.md](./COMPOSITION.md) — page composition + edit/create protocols
- [CHANGELOG.md](./CHANGELOG.md) — promotion history
- [DESIGN_CATALOG.md](../../../docs/99-refactor/_system/DESIGN_CATALOG.md) — canonical matrix
- [.claude/rules/ui-components.md](../../../.claude/rules/ui-components.md) — use-primitive-over-shadcn rule (auto-loaded on `primitives/**` edits)
- [.claude/rules/light-theme.md](../../../.claude/rules/light-theme.md) — the light brand contract (auto-loaded)
- [KOPI_2A_SPEC.md](../../../docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — the live brand authority
- [src/index.css](../../index.css) — v4 `@theme` tokens
