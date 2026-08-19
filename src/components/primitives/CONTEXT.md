# Primitives — Design-System Components (READ FIRST)

**Before building anything new, grep here.** Canonical matrix: [DESIGN_CATALOG.md](../../../docs/99-refactor/_system/DESIGN_CATALOG.md).

**164 `.tsx` files across 9 groups** — counted from the filesystem on 2026-08-19. Reproduce with:

```sh
find src/components/primitives -name '*.tsx' | wc -l                 # total
for d in charts dashboard detail form overlays shell tools ui; do    # per group
  printf '%-10s %s\n' "$d" "$(find src/components/primitives/$d -name '*.tsx' | wc -l)"
done
```

The table below counts **every `.tsx` under the group directory, including nested
folders** (`shell/cells`, `overlays/wizard`, `detail/dossier`,
`detail/LineItemsEditor`). That is a file count, not an export count — several
files are internal splits that the barrel does not re-export, and several files
export more than one component. **The barrel `index.ts` is the authoritative
import surface**; when in doubt read it rather than this table.

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
**Doesn't**: shadcn raw (`../ui/`); feature-specific components (`src/features/<x>/components/`).

## Core rule

**Never rebuild what exists.** See [DESIGN_REUSE_PRINCIPLES.md](../../../docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — rule 1 (reuse first) · rule 11 (feedback on every interactive element).

## Inventory

| Group | `.tsx` | Import pattern | What's inside |
|---|---|---|---|
| **root atoms** | 3 | `@/components/primitives/Avatar` (deep) | Avatar · IconButton · StatusBadge |
| **[shell/](./shell/)** | 46 | `@/components/primitives/shell` | AppSidebar · AppSidebarNav · AppNavDrawer · AppSidebarFooter · AppHeaderShell · AppHeaderLogo · AppHeaderMobileBar · AppHeaderUserMenu · Wordmark · Badge · Breadcrumb · Button · Card · Chip · DrawingStatusBar · EmailCategoryBadge · EmailSidebar · ExpandableDataTable · FilterBar · FilterCard · FilterDropdown · FilterPill · FloatingCTA · ImpersonationBanner · LinkedEntityPill · LoadingSkeleton · LoadingSpinner · ErrorState · NoResultsState · NotificationsBell · PageDescription · PageTitle · SanitizedHtmlProse · MarkdownProse · ScrollArea · SearchInput · SEO · TruncatedText · ViewAsSelector · AttachmentChip · AIInboxRail (exports InboxChip · SituationBar · InboxRailPanel) · cells/{DateCell · DateTimeCell · CurrencyCell · NumberCell} · internal split (not barrel-exported): ErrorStateHero |
| **[overlays/](./overlays/)** | 22 | `@/components/primitives/overlays` | Alert · ChoiceCards · Collapsible · CommandPalette · ContextMenu · DialogCompat · Drawer · DropdownMenu · Kbd · Modal · Popover · RecipientPickerDialog · SearchableMultiSelect · SelectMenu · Tabs · Toaster · Tooltip · wizard/{WizardShell · WizardMobileDrawer · WizardStepperHeader · WizardFooter} · internal split: CommandPaletteAtoms · [RECIPES.md](./overlays/RECIPES.md) |
| **[dashboard/](./dashboard/)** | 9 | `@/components/primitives/dashboard` | AttentionHeader · CDWProgressTimeline · CountBadge · GreetingHeader · KpiDeltaBadge · KpiIndexCard · KpiTile · NeedsAttentionPill · NumberTicker |
| **[detail/](./detail/)** | 27 | `@/components/primitives/detail` | ActivityLogTimeline · DestructiveConfirmDialog · DetailPageFrame · PageShell · PageShellStatusPill · QuotationReferencePanel · RelatedRecordsCard · SendEmailDialog · StatusTransitionModal · TabNav · Timeline · EmailDetailHeader · EmailMessageCard · AIPanel · AIClassificationPanel · AIOverrideClassificationPanel · AIDraftReplyPanel · HistoryTrailList · dossier/{DossierPanel · DossierStatGrid · DossierRampBar · DossierKeyValueList · DossierLoadingPanel} · LineItemsEditor/{index · LineItemRow · cells/DescriptionCell · cells/NumberCell} |
| **[form/](./form/)** | 22 | `@/components/primitives/form` | Input · Textarea · Select · Checkbox · Radio · RadioGroup · Switch · DatePicker (+ .trigger/.panel/.dropdown splits) · TimePicker (+ .trigger/.panel splits) · FileUpload · Field · Label · Progress · RichTextEditor · Stepper · EmailComposeForm · StarredMultiSelect |
| **[ui/](./ui/)** | 17 | `@/components/primitives/ui` | DataTable · DataRow · TableHeader · SortIcon · TableCheckbox · Pagination · PageBtn · MobileListCard · EditableListCard · StatusTabs · ListPageFrame · EmailThreadRow · internal splits (not barrel-exported): DataTableRows · DataTableStates · DataRowCells · ListPageHeader · ListPageTable |
| **[charts/](./charts/)** | 8 | `@/components/primitives/charts` | ChartShell · AreaChart · BarChart · HBarChart · ChartTooltip · ChartLoading · ChartError · LegendRow |
| **[tools/](./tools/)** | 4 | `@/components/primitives/tools` | The chrome behind every numbered tool in `src/lib/toolRoutes` — ToolPageShell · ToolPageHeader · ToolCustomerBar (presentational) · ToolAtoms (exports ToolPanel · ToolStatGrid · SummaryRow · ToolSelect · ToolNote). See [tools/CONTEXT.md](./tools/CONTEXT.md) |

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
