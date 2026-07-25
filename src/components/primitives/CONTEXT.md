# Primitives — Design-System Components (READ FIRST)

**Before building anything new, grep here.** Canonical matrix: [DESIGN_CATALOG.md](../../../docs/99-refactor/_system/DESIGN_CATALOG.md).

**136 primitives across 8 groups** (per `build-primitives-manifest.mjs` scan, one row per top-level `.tsx`, excluding `index.ts`/`CONTEXT.md`/`.test`/`.spec`/`.stories` — authoritative count in [PRIMITIVES_MANIFEST.json](../../../docs/99-refactor/_system/PRIMITIVES_MANIFEST.json), regenerated 2026-05-30: shell/39 · overlays/20 · detail/21 · form/22 · ui/12 · dashboard/10 · charts/8 · atoms(root)/4). The lower-level export names listed per group below (e.g. shell `cells/*`, `AIInboxRail` sub-exports) are individual exports, not separate files, so hand-counting them inflates past the file count. All consume Tailwind v4 `@theme` tokens from [src/index.css](../../index.css) + Instrument Serif / IBM Plex Sans (Google Fonts, see [index.html](../../../index.html)) + shadcn/Radix/vaul under the hood. Promotion + registration history: [CHANGELOG.md](./CHANGELOG.md).

## Scope

**Belongs**: primitives produced by W08 Claude Design sessions + targeted promotions.
**Doesn't**: shadcn raw (`../ui/`); feature-specific components; legacy DOM like `DashboardHeader.tsx` (shim over `shell/AppHeader`).

## Core rule

**Never rebuild what exists.** See [DESIGN_REUSE_PRINCIPLES.md](../../../docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — rule 1 (reuse first) · rule 11 (feedback on every interactive element).

## Inventory

| Group | Count | Import pattern | What's inside |
|---|---|---|---|
| **root atoms** | 4 | `@/components/primitives/Avatar` (deep) | Avatar · IconButton · IconGlyph · StatusBadge |
| **[shell/](./shell/)** | 40+4 | `@/components/primitives/shell` | AppHeader · AppHeaderShell · Badge · Breadcrumb · Button · Card · Chip · DrawingStatusBar · EmailCategoryBadge · EmailSidebar · ExpandableDataTable · FilterBar · FilterCard · FilterDropdown · FilterPill · FloatingCTA · ImpersonationBanner · ImageTile · LinkedEntityPill · LoadingSkeleton · LoadingSpinner · ErrorState · NoResultsState · NotificationsBell · PageDescription · PageTitle · PhotoGallery · SanitizedHtmlProse · MarkdownProse · ScrollArea · SearchInput · SEO · TruncatedText · ViewAsSelector · cells/{DateCell · DateTimeCell · CurrencyCell · NumberCell} · AIInboxRail (InboxChip · SituationBar · InboxRailPanel) · AttachmentChip · ImpersonationMenu |
| **[overlays/](./overlays/)** | 23 | `@/components/primitives/overlays` | Alert · ChoiceCards · Collapsible · CommandPalette · ContextMenu · DialogCompat · Drawer · DropdownMenu · Kbd · Modal · Popover · RecipientPickerDialog · SearchableMultiSelect · SelectMenu · Tabs · Toaster · Tooltip · WizardShell · WizardMobileDrawer · WizardStepperHeader · WizardFooter · XeroContactPicker · XeroContactResolveModal · [RECIPES.md](./overlays/RECIPES.md) |
| **[dashboard/](./dashboard/)** | 9 | `@/components/primitives/dashboard` | AttentionHeader · CategoryHeader · CountBadge · GreetingHeader · KpiTile · ModuleCard · ModuleSearch · NeedsAttentionPill · NumberTicker |
| **[detail/](./detail/)** | 21 | `@/components/primitives/detail` | ActivityLogTimeline · DestructiveConfirmDialog · DetailPageFrame · LineItemsEditor · PageShell · QuotationReferencePanel · RecordPaymentModal · RelatedRecordsCard · SendEmailDialog · StatusTransitionModal · TabNav · Timeline · EmailDetailHeader · EmailMessageCard · AIPanel · AIClassificationPanel · AIOverrideClassificationPanel · AIDraftReplyPanel · HistoryTrailList · WhatsAppThreadPanel · WorkItemMappingSelector |
| **[form/](./form/)** | 17 | `@/components/primitives/form` | Input · Textarea · Select · Checkbox · Radio · RadioGroup · Switch · DatePicker · TimePicker · FileUpload · Field · Label · Progress · RichTextEditor · Stepper · EmailComposeForm · StarredMultiSelect |
| **[ui/](./ui/)** | 12 | `@/components/primitives/ui` | DataTable · DataRow · TableHeader · SortIcon · TableCheckbox · Pagination · PageBtn · MobileListCard · EditableListCard · StatusTabs · ListPageFrame · EmailThreadRow |
| **[charts/](./charts/)** | 8 | `@/components/primitives/charts` | ChartShell · AreaChart · BarChart · HBarChart · ChartTooltip · ChartLoading · ChartError · LegendRow |

## Adoption tracker

Per-primitive adoption + spec status: [DESIGN_CATALOG_PRIMITIVES.md](../../../docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md). Visual-verify protocol: [.claude/rules/design-system.md](../../../.claude/rules/design-system.md).

## 📚 Related

- [COMPOSITION.md](./COMPOSITION.md) — page composition + edit/create protocols
- [CHANGELOG.md](./CHANGELOG.md) — promotion history
- [DESIGN_CATALOG.md](../../../docs/99-refactor/_system/DESIGN_CATALOG.md) — canonical matrix
- [.claude/rules/universal-components.md](../../../.claude/rules/universal-components.md) — use-over-shadcn cheat (auto-loaded)
- [.claude/rules/design-system.md](../../../.claude/rules/design-system.md) — visual-verify protocol
- [src/index.css](../../index.css) — v4 `@theme` tokens
