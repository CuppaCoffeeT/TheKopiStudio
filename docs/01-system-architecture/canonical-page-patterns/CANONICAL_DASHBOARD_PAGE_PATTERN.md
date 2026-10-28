# Canonical Dashboard Page Pattern

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-10-28 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The **single canonical pattern** for any DASHBOARD page in AppBase (one of 6 page archetypes). Chrome is mounted once by `DashboardLayout` (the `AppSidebar` rail at ≥ lg, `AppHeaderMobileBar` below it) — the page itself opens with its own header block, then a row of KPI tiles, then sections of charts / grouped stats.

**Read this first** if your task is: "build a role dashboard", "add a KPI tile", or "migrate a dashboard to primitives".

Router-style doc — links to real adopters + primitives. Does not duplicate code.

## The Canonical Stack

| Layer | Use | Never |
|-------|-----|-------|
| Page frame / header | `AppHeaderShell` (`@/components/primitives/shell`) — page-bg backdrop + `ImpersonationBanner` + kicker/breadcrumb → H1 → description | hand-rolled `<h1>` + greeting block · `DashboardHeader` / `AppHeader` (**both deleted 2026-07-25** — see [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md)) |
| Greeting block | `GreetingHeader` (`@/components/primitives/dashboard`) | bespoke welcome text |
| KPI tile | `KpiTile` (`@/components/primitives/dashboard`) — `prefix/suffix/delta/subtitle/icon/alert/sparkline`, count-up via bundled `NumberTicker` | ad-hoc `<Card>` + big number + hand-rolled delta badge |
| Count-up number | `NumberTicker` (`@/components/primitives/dashboard`) | hand-rolled `useEffect` + `setInterval` |
| Module navigation | the `AppSidebar` rail + the ⌘K palette | a launcher grid on the page (removed 2026-07-25) |
| KPI row layout | Tailwind grid (`grid grid-cols-2 md:grid-cols-4 gap-*`) wrapping `KpiTile`s | a bespoke metric-box grid |
| Empty / error state | `NoResultsState` · `ErrorState` (`@/components/primitives/shell`) | inline "nothing here" text |

Full inventory: [PRIMITIVES.md](../design-system/PRIMITIVES.md) · [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md).

> **2026-10-28**: `KpiIndexCard`, `AttentionHeader` and the whole `primitives/charts` group (`ChartShell` · `AreaChart` · `BarChart` · `HBarChart` …) were deleted as unused — no dashboard imported them. There is no chart primitive today; re-create one (via `/design-prompt`) only when a real dashboard needs a chart. See [DEPRECATIONS.md](../../99-refactor/_system/DEPRECATIONS.md).

## Shape

```tsx
<AppHeaderShell title="…" description="…">          {/* page frame, no masthead */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <KpiTile value={pending} label="Pending" delta={…} icon={…} />
    <KpiTile value={open}    label="Open"    sparkline={…} />
    {/* … */}
  </div>
</AppHeaderShell>
```

The 2a Overview at `/dashboard` is the exception: it uses **no frame**, opening with `GreetingHeader` (dateline + serif greeting) followed by a hairline feed table.

## Adopter references

| Adopter | File |
|---------|------|
| 2a Overview (`/dashboard`) | `src/features/crm/pages/DashboardHomePage.tsx` — dateline masthead + hairline feed table |
| CRM role dashboard (`/crm`) | `src/features/crm/pages/CrmDashboardPage.tsx` — `AppHeaderShell` + `CrmKpiGrid` + `Card` sections |

Start from **DashboardHomePage.tsx** for the 2a Overview and **CrmDashboardPage.tsx** for a framed role dashboard. The AppBase-era adopters (drafter · supervisor · client-profiles · companies · competitor-analysis) were never merged into this repo — those paths do not exist.

## Rules

- KPI numbers load via dedicated count hooks (e.g. `useDashboardCounts`); the page is presentation only.
- One `KpiTile` per metric; group related tiles in a single Tailwind grid. Don't nest grids.
- Account chrome (notifications, view-as, sign-out) is mounted **once** by `AppSidebarFooter` at ≥ lg and by `AppHeaderMobileBar` below it, both wired through `useDashboardChrome` — a page must never re-mount it (W09 grep 6b lesson). Use the `NotificationsBell` / `ViewAsSelector` primitives directly only if a page genuinely needs a second instance.
- No chart primitive exists (deleted 2026-10-28). Don't drop raw recharts/visx into a page — build the primitive first.
- Keep the dashboard component under 200 LOC; extract each section body (KPI strip, chart block) to a child component (see `SupervisorKpiSection`).

## Anti-patterns

- ❌ Bespoke metric card with inline `bg-*-100` → `KpiTile`.
- ❌ Manual count-up with `setInterval` → `KpiTile` (bundles `NumberTicker`).
- ❌ Hand-rolled `<svg>` charts → build a chart primitive first (`primitives/charts` was deleted 2026-10-28).

## 📚 Related Documentation

- [CANONICAL_DETAIL_PAGE_PATTERN.md](./CANONICAL_DETAIL_PAGE_PATTERN.md) — DETAIL archetype
- [CANONICAL_SETTINGS_PAGE_PATTERN.md](./CANONICAL_SETTINGS_PAGE_PATTERN.md) — SETTINGS archetype
- [src/components/primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [.claude/rules/ui-components.md](../../../.claude/rules/ui-components.md) — Need → Import matrix
- [.claude/rules/code-hygiene.md](../../../.claude/rules/code-hygiene.md) — slot-filler / data-coupling lesson
- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md)
