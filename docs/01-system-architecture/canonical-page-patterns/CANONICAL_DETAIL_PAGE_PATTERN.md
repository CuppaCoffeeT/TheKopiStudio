# Canonical Detail Page Pattern

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The **single canonical pattern** for any DETAIL page in AppBase (one of 6 page archetypes). A detail page shows one record: a hero summary, an optional tab strip, a main column, and an optional side-rail. Build it by passing **flat props** to `DetailPageFrame` — the frame composes the mobile bar, impersonation banner, inline breadcrumb, hero, tabs and the two-column dossier layout for you. Since the 2a redesign (2026-07-25) the detail body is a **1.4fr / 1fr cream dossier grid** built from `detail/dossier/*`, and desktop chrome comes from the `AppSidebar` rail, not from the frame.

**Read this first** if your task is: "build a record detail page", "add a tab to a detail view", or "migrate a detail page to primitives".

Router-style doc — links to real adopters + primitives. Does not duplicate code.

## The Canonical Stack

| Layer | Use | Never |
|-------|-----|-------|
| Page frame + hero + tabs + side-rail | `DetailPageFrame` (`@/components/primitives/detail`) | hand-rolled `<div>` + back button + bespoke title block |
| Tab strip (standalone) | `TabNav` (`@/components/primitives/detail`) — already bundled by `DetailPageFrame` via `tabs` prop | raw button row + manual active state |
| Related-records side card | `RelatedRecordsCard` | ad-hoc aside `<div>` |
| Activity / audit timeline | `ActivityLogTimeline` · `Timeline` · `HistoryTrailList` | ordered `<ol>` + arrow spans |
| Card surface inside a tab | `Card` (`@/components/primitives/shell`) | `@/components/ui/card` |
| AI-annotation panel | `AIPanel` · `AIClassificationPanel` | hand-rolled `<Card>` with a coloured strip |
| Stored HTML body | `SanitizedHtmlProse` (`@/components/primitives/shell`) | inline `dangerouslySetInnerHTML` |

Full inventory: [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md).

## Shape — flat props, not nested slots

`DetailPageFrame` takes flat props (no slot-rendering). Canonical usage:

```tsx
<DetailPageFrame
  breadcrumb={['Workspace', 'Projects', project.file_number]}
  title={`Project ${project.file_number} — ${project.name}`}
  recordId={`PRJ-${project.id.slice(0, 6)}`}
  status={{ tone: 'success', label: 'ACTIVE' }}
  meta={['Singapore', `${entries.length} entries`, `Updated ${rel}`]}
  actions={<><Button variant="ghost">Edit</Button><Button variant="primary">Log</Button></>}
  tabs={TABS}
  activeTab={tab}
  onTabChange={setTab}
  variant="withSideRail"           // or 'fullWidth'
  sideRail={<RelatedRecordsCard ... />}
>
  {activeTabBody}                   {/* main column (2/3) */}
</DetailPageFrame>
```

Two layout variants (both via the `variant` prop):
- **`withSideRail`** (default) — 2/3 main + 1/3 `sideRail`. Use for one primary surface + secondary metadata.
- **`fullWidth`** — no rail. Use for a tab-heavy record with no persistent metadata column.

## Adopter references

| Adopter | File |
|---------|------|
| Client detail (`/clients/:id`) | `src/features/crm/pages/ClientDetailPage.tsx` — the 2a cream dossier reference |
| Profiler result detail (`/profiler-results/:id`) | `src/features/profiler/pages/ResultDetailPage.tsx` |

Start from **ClientDetailPage.tsx** — it is the page the 2a Detail comp was built against. The AppBase-era adopters (quotation · company · project · person · invoice detail) were never merged into this repo; those paths do not exist.

## Rules

- Tab state is **controlled** by the page (`useState` for `activeTab`) and passed via `activeTab` + `onTabChange`. `DetailPageFrame`/`TabNav` do not own it.
- Page chrome (inline breadcrumb, impersonation banner, `AppHeaderMobileBar` below `lg`) lives inside `DetailPageFrame` — never re-implement a back button in the body. Desktop navigation and account controls are the `AppSidebar` rail, mounted once by `DashboardLayout`. The old `AppHeader` masthead was deleted 2026-07-25 ([DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md)).
- Data loads via a single `use<Entity>` / `use<Entity>Detail` hook in the feature's `hooks/`; the page is presentation only.
- Mutations use `showSuccess`/`showError` (never `useToast`) and invalidate the detail query key (`queryKeys.<entity>.detail(id)` + `.all`).
- Keep the page component under 200 LOC. Extract each tab body into `components/detail/` when a tab grows (see `ProjectDetailTabsBody`).

## Anti-patterns

- ❌ Hand-rolled `<Card>` with a coloured left strip for AI/annotation surfaces → use `AIPanel` / `AIClassificationPanel`.
- ❌ Inline `dangerouslySetInnerHTML` for stored HTML bodies → use `SanitizedHtmlProse`.
- ❌ Re-implementing hero/title/status outside the frame → pass `title`/`recordId`/`status`/`meta`/`actions` props instead.

## 📚 Related Documentation

- [CANONICAL_LIST_TABLE_PATTERN.md](./CANONICAL_LIST_TABLE_PATTERN.md) — LIST archetype
- [CANONICAL_FORM_PAGE_PATTERN.md](./CANONICAL_FORM_PAGE_PATTERN.md) — FORM/CREATE archetype
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [.claude/rules/ui-components.md](../../../.claude/rules/ui-components.md) — Need → Import matrix
- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md)
