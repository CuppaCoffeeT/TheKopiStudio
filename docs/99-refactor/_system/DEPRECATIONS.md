# Deprecations Log

**Created**: 2026-05-25 SGT
**Last Updated**: 2026-10-28 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Purpose

Single source of truth for routes, components, hooks, and services that have been **deleted from the codebase**. Older docs across the repo still reference these names — that is documentation drift, not a signal that the code still exists.

**Rule when you find a deprecated name in source or tests**: delete the reference immediately. Do not "preserve for backward compatibility" — the symbols are gone, not soft-deprecated. If the reference is inside a doc, either delete it or add a `> ⚠️ DEPRECATED <date>` line pointing at this file.

## 📚 Related Documentation

- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md) — full doc catalog
- [W09_MODULE_MIGRATIONS.md](./workflows/W09_MODULE_MIGRATIONS.md) — W09 program that drives most deprecations
- [.claude/rules/code-hygiene.md](../../../.claude/rules/code-hygiene.md) — "if you see stale references when touching a file, fix them"

---

## Active deprecations

### 2026-10-28 — Dead-code cleanup: 145 unreferenced src files + 2 edge functions

`knip` reported **zero importers** for every file below — inherited AppBase template surface and pre-2a primitives that no Kopi Studio page used. Deleted outright, not replaced. **Re-create one only when a real consumer needs it**; to see the old version, read it from history (`git show a39b275^:<path>` for whole files, `git show 49a7cc4^:<path>` for files orphaned by the unused-export strip).

| Area | Deleted |
|---|---|
| shadcn `src/components/ui/` | 53 of 54 files — everything except `sheet.tsx` (used by `AppNavDrawer`) |
| `primitives/` root + `charts/` | `Avatar.tsx` · all of `charts/*` (`ChartShell` · `AreaChart` · `BarChart` · `HBarChart` · `ChartTooltip` · `ChartLoading` · `ChartError` · `LegendRow`) |
| `primitives/dashboard/` | `AttentionHeader` · `CDWProgressTimeline` · `CountBadge` · `KpiIndexCard` · `NeedsAttentionPill` |
| `primitives/detail/` | everything except `DestructiveConfirmDialog` · `DetailPageFrame` · `PageShell` · `PageShellStatusPill` · `TabNav` · `dossier/*` — incl. the `detail/index.ts` barrel, `LineItemsEditor/*`, `Timeline`, `ActivityLogTimeline`, `HistoryTrailList`, `RelatedRecordsCard`, `SendEmailDialog`, `StatusTransitionModal`, `QuotationReferencePanel`, `Email*`, `AI*Panel` |
| `primitives/form/` | `EmailComposeForm` · `FileUpload` · `Label` · `RadioGroup` · `RichTextEditor` · `Select` · `StarredMultiSelect` · `Stepper` · `TimePicker*` |
| `primitives/overlays/` | `Collapsible` · `ContextMenu` · `DialogCompat` · `Drawer` · `RecipientPickerDialog` · `wizard/*` |
| `primitives/shell/` | `AIInboxRail` · `AttachmentChip` · `DrawingStatusBar` · `EmailCategoryBadge` · `EmailSidebar` · `ExpandableDataTable` · `FilterCard` · `FilterDropdown` · `FilterPill` · `LinkedEntityPill` · `MarkdownProse` · `SanitizedHtmlProse` · `ScrollArea` · `TruncatedText` · `cells/{CurrencyCell,DateTimeCell,NumberCell,index}` |
| `primitives/ui/` | `EditableListCard` · `EmailThreadRow` · the `ui/index.ts` barrel |
| hooks | `use-mobile` · `useEditableCard` · `useMediaQuery` · `usePendingUserCount` |
| lib | `pagination.ts` · `supabase/typed-client.ts` · `design/emailCategoryTones.ts` |
| utils | `databaseErrorHandler` · `resumableUpload` · `threadDateFormat` · `numberFormatter` · `textTruncation` |
| Edge functions | `supabase/functions/pdf-generation` · `supabase/functions/resend-webhook` (undeployed) |

**Sub-exports removed from surviving files**: `Card`'s `CardHeader`/`CardContent`/`CardFooter` · `SensitiveMoney`/`SensitiveCount` · `SelectMenuGroup`/`Label`/`Separator` + the shadcn-compat `Select*` aliases in `SelectMenu.tsx` · `DropdownMenuGroup`/`Sub`/`RadioGroup` · `PopoverAnchor` · `PageShellSideRail` · `mapStatusCodeToVariant` · `Tooltip`/`TooltipTrigger` from `primitives/overlays/Tooltip.tsx`.

**Surviving equivalents**: single-select → `overlays/SelectMenu` · bottom/side sheet → `@/components/ui/sheet` · `detail/` and `ui/` primitives → deep-import by file (no barrels).

**Commits**: `a39b275` (files + edge functions) · `49a7cc4` (unused exports + the files they orphaned).

**Doc sweep (same day)**: inventories (`primitives/CONTEXT.md`, `PRIMITIVES.md`, hooks/utils CONTEXT, `lib/README.md`), rules, commands and the canonical page patterns. Dated program history (`workflows/*`, `05-implementation/completed/*`, design catalogs, CHANGELOG / lessons / decisions) left verbatim.

**Verification** — zero import hits in `src/` + `tests/` (JSDoc prose mentions are history and may stay):

```bash
grep -rnE "from '@/(components/primitives/(charts|Avatar|overlays/(Drawer|wizard))|components/ui/[a-rt-z]|lib/supabase/typed-client)" src/ tests/ --include="*.ts" --include="*.tsx"
```

### 2026-07-25 — Top masthead + its desktop bar (Kopi Studio 2a redesign, P3)

Direction 2a puts **all** desktop chrome in a 200px sidebar rail, so the horizontal top masthead had nothing left to carry. Identity moved to the rail's wordmark, account/bell/view-as/sign-out to `AppSidebarFooter`, and breadcrumb became page *content* (quiet inline text above the H1) rather than chrome. Deleted:

| Type | Name | Replaced by |
|---|---|---|
| Primitive | `src/components/primitives/shell/AppHeader.tsx` | `AppSidebar` (>= lg, the whole chrome) + `AppHeaderMobileBar` (< lg) — both at `src/components/primitives/shell/` |
| Primitive | `src/components/primitives/shell/AppHeaderDesktopBar.tsx` | `AppSidebar` + `AppSidebarFooter` (account/bell/ViewAs/sign-out) |
| Shim | `src/components/DashboardHeader.tsx` | `ListPageFrame` (`primitives/ui`) · `DetailPageFrame` (`primitives/detail`) · `AppHeaderShell` (`primitives/shell`) — pick the archetype frame, per [.claude/rules/module-access.md](../../../.claude/rules/module-access.md) |

**Survivors with `AppHeader` in the name — these are NOT deprecated**: `AppHeaderShell.tsx` (page-shell wrapper: page-bg backdrop + `ImpersonationBanner` + content frame + `PageTitle`/`PageDescription`; kept its name because every tool page imports it), `AppHeaderMobileBar.tsx` (the < lg bar), `AppHeaderLogo.tsx`, `AppHeaderUserMenu.tsx`. Grep for the exact file names above, not the `AppHeader` prefix.

**Also renamed in the same change**: `src/hooks/useDashboardChrome.tsx` → **`src/hooks/useDashboardChrome.ts`**. It now returns connector prop *bags* instead of pre-rendered JSX slots (each home places its own overlays), so it no longer needs the `.tsx` extension. Consumers: `AppSidebarFooter`, `AppHeaderMobileBar`, `ImpersonationBanner`. Theme props are gone — `ThemeProvider` pins light (`.claude/rules/light-theme.md`).

**Driver**: [KOPI_STUDIO_REDESIGN_PRD.md](../../05-implementation/active/KOPI_STUDIO_REDESIGN_PRD.md) P3.

**Verification** — all three should return zero hits in `src/` + `tests/`:

```bash
grep -rn "shell/AppHeader'\|shell/AppHeader\"\|AppHeaderDesktopBar" src/ tests/ --include="*.tsx" --include="*.ts"
grep -rn "useDashboardChrome.tsx" src/ tests/
grep -rn "from '.*DashboardHeader'" src/ tests/ --include="*.tsx" --include="*.ts"   # imports only; prose mentions of the retired shim are fine
```

Surviving `.tsx` mentions in `docs/99-refactor/_system/` (`SYSTEM_STATE.md`, `RECENT_CHANGES.md`, `W07_SHARED_PRIMITIVES.md`, `PRIMITIVES_MANIFEST.json`) are **dated 2026-04-20 program history** and describe the file as it was then — left verbatim on purpose.

### 2026-07-25 — Module-launcher primitives (Kopi Studio 2a redesign, P4)

The `/dashboard` module-launcher grid was removed from `DashboardHomePage` — the sidebar rail and the ⌘K `CommandPalette` both route by module, so a third launcher was duplication. The three primitives that existed only to build that grid were **deleted** in the same change:

| Type | Name | Replaced by |
|---|---|---|
| Primitive | `src/components/primitives/dashboard/ModuleCard.tsx` | `KpiIndexCard` (index-numeral KPI card) for the surface; `CommandPalette` (⌘K) + sidebar rail for module navigation |
| Primitive | `src/components/primitives/dashboard/CategoryHeader.tsx` | — (no module categories to head; the 2a Overview is a masthead + KPI row + feed table) |
| Primitive | `src/components/primitives/dashboard/ModuleSearch.tsx` | `CommandPalette` at `src/components/primitives/overlays/CommandPalette.tsx` |

**Survivors in `primitives/dashboard/`**: `AttentionHeader` · `CDWProgressTimeline` · `CountBadge` · `GreetingHeader` · `KpiDeltaBadge` · `KpiIndexCard` · `KpiTile` · `NeedsAttentionPill` · `NumberTicker`. Only `GreetingHeader` (`DashboardHomePage`), `KpiIndexCard` (`OverviewKpiRow`) and `KpiTile` (`CrmDashboardPage`) have live adopters; the rest are unadopted, not deleted.

**Driver**: [KOPI_STUDIO_REDESIGN_PRD.md](../../05-implementation/active/KOPI_STUDIO_REDESIGN_PRD.md) P4.

**Doc rows are marked retired, not removed** — the design catalog is a history as well as an index, so `DESIGN_CATALOG_PRIMITIVES.md` / `DESIGN_CATALOG.md` / `DESIGN_CATALOG_MATRIX.md` keep struck-through rows pointing here. Prose lists that read as build instructions (`UNIVERSAL_COMPONENTS.md`, `MODULE_SYSTEM.md`, `PRIMITIVES.md`, `ARCHETYPES.md`, `DESIGN_REUSE_PRINCIPLES.md`) drop the names outright.

**Verification** — the only expected hit is the historical JSDoc line in `DashboardHomePage.tsx` recording that the launcher and these three went together; that one is intentional and may stay:

```bash
grep -rn "ModuleCard\|CategoryHeader\|ModuleSearch" src/ tests/ --include="*.tsx" --include="*.ts"
```

### 2026-05-25 — `/projects/create` standalone page (W09 #12)

Project creation moved from a standalone full-page form to a primitive-composed modal opened from `/projectlist` and from `AcceptQuotationDialog`. All of the following were **deleted** in the same commit:

| Type | Name | Replaced by |
|---|---|---|
| Route | `/projects/create` (`App.tsx`) | Modal on `/projectlist` ("New project" CTA) |
| Page | `src/pages/ProjectCreate.tsx` (1473 lines) | `src/features/projects/components/NewProjectDialog.tsx` |
| Hook | `src/hooks/useProjectCopyData.ts` | — (Copy-from-existing flow deleted entirely) |
| Service | `createProjectFromCopy` in `src/services/projectService.ts` | — |
| Service | `getCopyProjectData` in `src/services/projectService.ts` | — |
| QueryKey | `queryKeys.projects.copyData` | — |
| QueryKey | `queryKeys.projects.forCreationLinking` | — |
| URL param | `?copy=<id>` on `/projects/create` | — (Copy Project button on project detail page removed) |
| Button | "Copy Project" on `src/pages/ProjectDetailPage.tsx` | — |
| Component | `src/components/project-management/ClientContactMultiSelect.tsx` | `src/components/ui/client-contact-multi-select.tsx` (rebuilt on `StarredMultiSelect` primitive) |

**Workflows affected** (from the legacy `ProjectCreate` flow that are NOT carried over):
- `WF-0406` — "Copy project (clone)" affordance on `/projectlist`/project detail. Removed entirely.
- Link-Related-Project section in the old form. Moved to project detail edit mode.
- Multi-select Area Types / Work Types / Job Types on create. Auto-copied from the linked quotation; manual edit deferred to project detail edit mode.

**If you find any of these names in src/ or tests/, delete the reference.**

**If you find them in a doc**, either delete the line OR add a `> ⚠️ DEPRECATED 2026-05-25 — see DEPRECATIONS.md` callout above it.

**Verification once cleaned**:
```bash
# All three should return zero hits in src/ + tests/:
grep -rn "projects/create\|ProjectCreate\|createProjectFromCopy\|getCopyProjectData\|useProjectCopyData\|forCreationLinking" src/ tests/ --include="*.tsx" --include="*.ts"
grep -rn "project-management/ClientContactMultiSelect" src/ tests/ --include="*.tsx" --include="*.ts"
grep -rn "/projects/create" src/ tests/ --include="*.tsx" --include="*.ts"
```

(One historical JSDoc line in `NewProjectDialog.tsx` mentioning "Replaces the standalone `/projects/create` page" is intentional and may stay.)
