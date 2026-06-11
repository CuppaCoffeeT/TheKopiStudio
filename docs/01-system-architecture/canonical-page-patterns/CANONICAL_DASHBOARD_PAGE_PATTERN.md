# Canonical Dashboard Page Pattern

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The **single canonical pattern** for any DASHBOARD page in AppBase (one of 6 page archetypes). A dashboard opens with the app header chrome, a row of KPI tiles, then sections of charts / grouped stats / shortcut cards.

**Read this first** if your task is: "build a role dashboard", "add a KPI tile", or "migrate a dashboard to primitives".

Router-style doc — links to real adopters + primitives. Does not duplicate code.

## The Canonical Stack

| Layer | Use | Never |
|-------|-----|-------|
| Page frame / header | `DashboardHeader` (`@/components/DashboardHeader`) — AppHeader chrome shim · or `AppHeaderShell` (`@/components/primitives/shell`) | hand-rolled `<h1>` + greeting block |
| Greeting block | `GreetingHeader` (`@/components/primitives/dashboard`) | bespoke welcome text |
| KPI tile | `KpiTile` (`@/components/primitives/dashboard`) — `prefix/suffix/delta/subtitle/icon/alert/sparkline`, count-up via bundled `NumberTicker` | ad-hoc `<Card>` + big number + hand-rolled delta badge |
| Count-up number | `NumberTicker` (`@/components/primitives/dashboard`) | hand-rolled `useEffect` + `setInterval` |
| Section / category header | `CategoryHeader` · `AttentionHeader` (`@/components/primitives/dashboard`) | bare `<section>` + `<h2>` |
| Module shortcut card | `ModuleCard` (`@/components/primitives/dashboard`) | bespoke link card |
| KPI row layout | Tailwind grid (`grid grid-cols-2 md:grid-cols-4 gap-*`) wrapping `KpiTile`s | a bespoke metric-box grid |
| Charts | `ChartShell` + `AreaChart`/`BarChart`/`HBarChart` (`@/components/primitives/charts`) | raw recharts in the page |
| Empty / error state | `NoResultsState` · `ErrorState` (`@/components/primitives/shell`) | inline "nothing here" text |

Full inventory: [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md).

## Shape

```tsx
<DashboardHeader title="…" subtitle="…">            {/* AppHeader chrome */}
  <GreetingHeader name={user.name} />
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <KpiTile value={pending} label="Pending" delta={…} icon={…} />
    <KpiTile value={open}    label="Open"    sparkline={…} />
    {/* … */}
  </div>
  <CategoryHeader title="This week" />
  <ChartShell><BarChart data={…} /></ChartShell>
</DashboardHeader>
```

## Adopter references

| Adopter | File |
|---------|------|
| Drafter dashboard | `src/features/drafterdashboard/pages/DrafterDashboard.tsx` |
| Supervisor home KPIs | `src/features/fieldops/work-entry/components/SupervisorKpiSection.tsx` (+ `SupervisorUI.tsx`) |
| Client-profiles KPI strip | `src/features/clientprofiles/components/ClientProfilesKpis.tsx` |
| Company stats strip | `src/features/companies/components/CompanyStatsStrip.tsx` |
| Competitor KPI strip | `src/features/competitoranalysis/components/CompetitorKpiStrip.tsx` |

Start from **DrafterDashboard.tsx** — full header + KPI grid + section example.

## Rules

- KPI numbers load via dedicated count hooks (e.g. `useDashboardCounts`); the page is presentation only.
- One `KpiTile` per metric; group related tiles in a single Tailwind grid. Don't nest grids.
- Header chrome (notifications, view-as) comes from `DashboardHeader` / `AppHeaderShell` defaults — don't re-mount data-coupled `@/components/*` slot fillers (W09 grep 6b lesson). Override with `NotificationsBell` + `ViewAsSelector` primitives + their connector hooks (`useNotificationsBell` / `useViewAs`) if needed.
- Charts import from `primitives/charts`; never drop raw recharts/visx into the page.
- Keep the dashboard component under 200 LOC; extract each section body (KPI strip, chart block) to a child component (see `SupervisorKpiSection`).

## Anti-patterns

- ❌ Bespoke metric card with inline `bg-*-100` → `KpiTile`.
- ❌ Manual count-up with `setInterval` → `KpiTile` (bundles `NumberTicker`).
- ❌ Hand-rolled `<svg>` charts → `primitives/charts`.

## 📚 Related Documentation

- [CANONICAL_DETAIL_PAGE_PATTERN.md](./CANONICAL_DETAIL_PAGE_PATTERN.md) — DETAIL archetype
- [CANONICAL_SETTINGS_PAGE_PATTERN.md](./CANONICAL_SETTINGS_PAGE_PATTERN.md) — SETTINGS archetype
- [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) — full primitive inventory
- [.claude/rules/universal-components.md](../../.claude/rules/universal-components.md) — Need → Import matrix
- [.claude/rules/code-hygiene.md](../../.claude/rules/code-hygiene.md) — slot-filler / data-coupling lesson
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
