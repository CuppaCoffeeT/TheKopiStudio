# Page Archetypes

**Created**: 2026-04-22 SGT
**Last Updated**: 2026-07-25 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

👉 Parent: [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) · Layout authority: [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md)

Six canonical page shapes. Every page is one of these. **2a mocked three of them** — dashboard, list, detail — and the other three are derived from that language rather than invented.

## The shell every archetype sits in

There is **no top masthead**. `DashboardLayout` mounts `AppSidebar` (fixed 200px rail, ≥ lg) plus the ⌘K `GlobalCommandPalette`, and the content pane carries the offset itself (`SIDEBAR_OFFSET_CLASS`, dropped in print). Below `lg` the rail is hidden and `AppHeaderMobileBar` carries navigation + account.

Content pane sits directly on the page cream with **no card wrapper**. Sidebar padding `22px 0`, item gap 2px; content pane padding `34px 40px`.

## 1. Dashboard

Two shapes: the **Home Overview** (`/dashboard`) and **role/operational dashboards**.

**Home Overview** — bespoke composition, no frame primitive. Top to bottom, per the 2a comp:

1. **Masthead** — uppercase dateline (600 11px, tracking `.14em`) carrying one live context stat, over the Instrument Serif 36px greeting, closed by a `--border-soft` hairline.
2. **KPI grid** — `1fr 1fr`, gap 18px. Each `KpiIndexCard`: uppercase module label left / brown serif index numeral right, then the serif 32px figure with its unit inline in 13px sans, then a 12.5px meta line. Whole tile clickable.
3. **Section head** — baseline-aligned flex row, serif 22px title left + primary CTA right, closed by a hairline.
4. **Feed table** — sits directly under the section head with **no card wrapper**.

**Primitives**: `GreetingHeader` · `KpiIndexCard` · `DataRow`. The module-launcher composition it replaced (`CategoryHeader` · `ModuleCard` · `ModuleSearch`) was **deleted 2026-07-25** — module navigation is the sidebar rail plus ⌘K. `NeedsAttentionPill` · `AttentionHeader` · `CountBadge` survive with no current adopter.

**Role dashboard**: `AppHeaderShell` + `KpiTile` (bundles `NumberTicker` + `KpiDeltaBadge`) + `ChartShell` with `AreaChart` / `BarChart` / `HBarChart` + `ChartTooltip` / `LegendRow`.

**Live**: `/dashboard` (`crm/pages/DashboardHomePage.tsx`) · `/crm` (`crm/pages/CrmDashboardPage.tsx`).
Full rules: [CANONICAL_DASHBOARD_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_DASHBOARD_PAGE_PATTERN.md).

## 2. List

Scannable tabular data — the default for any entity index.

**Primary**: `ui/ListPageFrame` composes `ImpersonationBanner` · `ListPageHeader` · `StatusTabs` · `FilterBar` · `ListPageTable` (bare `DataTable` + `Pagination`) · `FloatingCTA` (mobile).

2a specifics:

- **Header** — kicker (600 11px, `.14em`, uppercase) over the Instrument Serif 30px title with the row count inline at 14px sans muted. **Search input (220px) and the primary CTA sit on the title row**, right-aligned; `FilterBar` keeps only the filter popovers and the columns/export/clear controls, and is skipped when there are none. Closed by a `--border-soft` hairline.
- **Table** — **no card wrapper**; rows sit on the page cream. `border-top: 1px solid var(--border-faint)` per row so the header rule and first row rule do not double.
- **Money / numeric column** — right-aligned, Instrument Serif 18px. Serif numerals are the list's texture; do not substitute a mono stack.
- **Primary cell** — name at `--fg` 500 with the email trailing inline at 12px muted, same cell.
- **Rows are interactive** — `cursor: pointer`, `tabindex="0"`, hover card cream, active tint, focus `outline: 2px solid brown; outline-offset: -2px` (**inset**, so the ring does not overlap the hairlines above and below). Interactivity is derived from `onClick`, never assumed.
- **Empty state** — *below* the table behind a `border-top`, centred: Instrument Serif 20px italic line naming the actual query, a 12.5px `--fg-dim` explanation, then **one** quiet secondary action. No illustration, no icon, no primary CTA.
- **Pagination** — retained on every list (server-bounded `.range()` is a hard rule), restyled flush: `bg-transparent px-0`, IBM Plex Sans + `tabular-nums`.

**Live**: `/clients` · `/profiler-results` · `/manage-accounts`.
Full rules: [CANONICAL_LIST_TABLE_PATTERN.md](../canonical-page-patterns/CANONICAL_LIST_TABLE_PATTERN.md).

## 3. Detail

Single-record view — the 2a **dossier**.

**Primary**: `detail/DetailPageFrame` (deep import) owns `AppHeaderMobileBar` · `ImpersonationBanner` · `PageShell` (breadcrumb + hero + tabs + body grid).

2a specifics:

- **Breadcrumb is content, not chrome** — quiet inline 12px text above the H1, trailing segment at `--fg`. It renders only when a page passes one explicitly: a two-segment default would just repeat the H1 beneath it. Earlier segments take `--fg-dim` (not `--fg-muted`, which fails on the page cream).
- **Header** — `align-items: flex-end`, closed by a hairline. Left: Instrument Serif 38px name over a 13px muted subtitle. Right: action pair, secondary then primary, gap 10px.
- **Body** — `grid-template-columns: 1.4fr 1fr`, gap 22px. Wide column carries data-dense panels; narrow column carries reference data and transient states.
- **Panels** — fill with the `detail/dossier/` vocabulary, not ad-hoc cards: `DossierPanel` (opens with the uppercase 11px `.12em` muted label; density drives the label gap — 16px stat / 14px list / 12px prose) · `DossierStatGrid` (`repeat(4, 1fr)`, 11px label over serif 24px value) · `DossierRampBar` (10px stacked bar, radius 5px, single brown ramp + legend) · `DossierKeyValueList` (space-between rows, no hairlines — the gap separates them) · `DossierLoadingPanel`.

**Live**: `/clients/:id` · `/profiler-results/:id` · `/clients/:id/report`.
Full rules: [CANONICAL_DETAIL_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_DETAIL_PAGE_PATTERN.md).

## 4. Form (Create / Edit)

Data entry with validation, often multi-step. 2a never mocked one — derive from its parts.

**Primary**: `AppHeaderShell` · `Field`-wrapped `Input` · `Textarea` · `Select` · `Checkbox` · `Radio` · `RadioGroup` · `Switch` · `DatePicker` · `TimePicker` · `FileUpload` · `Progress` · `Stepper` · `Button` primary + secondary.

Inputs are the **only place white appears**: `bg-popover` `#FFFFFF`, 1px `#D9CCC0`, radius 8px, padding `10px 14px`, 400 13px. Focus is the one sanctioned exception to "focus is always a visible outline" — `border-color: brown` + `box-shadow: var(--shadow-focus)` (brown @ 12%); it must never be removed without a replacement. Labels are `--brown-text` weight 600.

**On touch, long multi-step forms go in a fullscreen `Dialog`, never a bottom drawer** — see [.claude/rules/mobile-web.md](../../../.claude/rules/mobile-web.md).

**Live**: the `/profiler` wizard (`overlays/wizard/WizardShell`, public, outside the app shell) · modal forms such as `ClientFormModal`.
Full rules: [CANONICAL_FORM_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_FORM_PAGE_PATTERN.md).

## 5. Settings

User / admin configuration — hairline-separated sections of grouped fields.

**Primary**: `AppHeaderShell` · `TabNav` (not `StatusTabs`) · `Card`-grouped `Field` sections · `Button` Save / Cancel · `Toaster` confirmation.

2a specifics: panels label themselves with the uppercase 11px `.12em` muted label, and the tab strip stays **inside** its panel rather than floating above the content.

**Live**: `/account-settings`.
Full rules: [CANONICAL_SETTINGS_PAGE_PATTERN.md](../canonical-page-patterns/CANONICAL_SETTINGS_PAGE_PATTERN.md).

## 6. Tool / Report

One-off utility — report generators, export tools. No fixed skeleton; intentionally bespoke. Must still compose primitives, not hand-roll UI.

**Primary kit**: `AppHeaderShell` as root (kicker + serif title + hairline) · form primitives for parameter entry · `DataTable` for tabular results · `ChartShell` + chart family for visual results · `Button variant="primary"` for run / export.

**Rules**:

1. `AppHeaderShell` is root — never a bespoke one-off header.
2. Input collection follows the form archetype (Field wrappers, no naked inputs).
3. Page-specific computation lives in `hooks/use<Tool>*.ts` as pure functions.
4. Heavy/async work shows `Progress` in the result slot, never a page-level spinner.
5. **Loading is a stated moment**, not a spinner: a `1px dashed var(--hairline-frame)` placeholder panel, centred, with an Instrument Serif 19px *italic* verb, then a 4px bar (track `#E0D3C3`, radius 2px, fill brown), then an 11.5px muted caption. The bar fill is the only brown in the panel.
6. Print CTAs sit on their own `.no-print` row.

**The report surfaces are the one place the extended palette is permitted** — grey `#E8E6E0` and green box `#D9E8E0`. Never app chrome.

**Anti-patterns**: no competing submit flows (live update OR explicit button, not both) · no page-scoped CSS files beyond the existing print stylesheets · no `@/components/ui/**` import to dodge a missing primitive.

**When to reclassify**: if a tool grows CRUD over saved records, it becomes a list + detail pair.

**Live**: `/crm-reports` (`crm/pages/PortfolioReportPage.tsx`, on `AppHeaderShell`). The per-client print report `/clients/:id/report` (`crm/pages/ClientReportPage.tsx`) is a detail-frame page that renders a report surface — its print contract is owned by `features/crm/lib/report-print.css`.

## Cross-archetype invariants

- **No page builds its own chrome.** `AppSidebar` is the desktop chrome; pages wrap in `ListPageFrame` · `DetailPageFrame` · `AppHeaderShell`. There is no `AppHeader` and no `DashboardHeader` — both were deleted.
- **`PageTitle` + `PageDescription`** — always the primitive, never a raw `<h1>`.
- **All five states on every control** — default · hover · active · focus-visible · disabled. Hover must visibly differ from the resting cream. Focus is a **brown** ring, 2px at 2px offset (inset `-2px` where an outer ring would collide with a hairline or a rail edge).
- **Errors are row-level, never card-flooding** — an inline terracotta cell or a pill. No red panel fills, no tinted card backgrounds, no red container borders. `ErrorState variant="compact"` is the in-layout block; `hero` is for full-viewport crashes only.
- **No Instrument Serif under 18px**; no raw sage/terracotta as small text.
- **Module-access via `useAuth().modules`** — never role-string comparison.
- **React Query keys via the `queryKeys` factory** · **timezone via `timezoneUtils`** · **toasts via `showSuccess`/`showError`**.
- **Every `.select()` needs `.range()`, `.limit()` or `.single()`.**

## 📚 Related

- [KOPI_2A_SPEC.md](../../05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md) — per-archetype pixel spec
- [PRIMITIVES.md](./PRIMITIVES.md) — full inventory behind each archetype
- [COLORS.md](./COLORS.md) · [TYPOGRAPHY.md](./TYPOGRAPHY.md) · [SPACING_MOTION.md](./SPACING_MOTION.md)
- [canonical-page-patterns/](../canonical-page-patterns/) — per-archetype rules. ⚠️ Most of these predate the 2026-07-25 Kopi migration; where they show `AppHeader` or navy values, this page and `KOPI_2A_SPEC.md` win.
- [MODULE_COMPLIANCE_CHECKLIST.md](../../06-operations/MODULE_COMPLIANCE_CHECKLIST.md) — primitive-coverage greps + compliance gate
