# Lessons — src/features/crm

Last Updated: 2026-07-27

## 2026-07-14 — getCurrentSingaporeTime() is browser-local; SGT display strings need an explicit timeZone

**What happened**: /dashboard's greeting ("Good morning") and date line claimed SGT but rendered in the browser's local timezone — `timeOfDayInSingapore()` called `getCurrentSingaporeTime().getHours()` and `getFormattedDate()` used raw `toLocaleDateString` with no `timeZone`.

**Root cause**: `getCurrentSingaporeTime()` (src/utils/timezoneUtils.ts) returns a plain `new Date()` — its NAME promises SGT, but `Date` getters (`getHours`, `getFullYear`, `toLocaleString` without `timeZone`) all read the browser's zone. It only "works" on SGT machines.

**Fix**: SGT display strings must go through a formatter with `timeZone: SINGAPORE_TIMEZONE` (`Intl.DateTimeFormat` or the `formatDisplay*` timezoneUtils helpers). The dashboard greeting now uses `getSingaporeGreeting()` (src/utils/dashboardHelpers.ts) — one SGT-aware helper returning `{ timeOfDay, dateText }`. Audit note: other crm callsites still call `getCurrentSingaporeTime().getHours()/.toLocaleString('en-SG')`-style patterns (ReportDisclaimer, ReportHero, finance.ts refYear) — same latent trap on non-SGT browsers.

## 2026-07-25 — A visual rebuild silently re-opened a fixed blocker: pending and failed KPI figures looked identical

**What happened**: the Kopi 2a rebuild of `/dashboard` replaced `CrmKpiRow` (LoadingSkeleton while pending, ErrorState + retry on failure) with a page-level `const { data: stats } = useDashboardStats(...)`. Both a pending query and a failed one then rendered the same em dash, with no retry — re-breaking the exact bug the 2026-07-14 critic pass had fixed and logged as a blocker in docs/05-implementation/completed/INSURANCE_CRM_REDESIGN_PRD.md.

**Root cause**: the rebuild treated "figures render an em dash until their query resolves, never a placeholder zero" as the whole states story. That rule only covers ABSENT — it says nothing about FAILED, and destructuring only `data` off the query throws away the flags that tell them apart.

**Fix**: `components/OverviewKpiRow` restores both states in the 2a language. Generally: when a redesign replaces a component, diff the OLD component's query destructuring against the new one — `isLoading` / `isError` / `refetch` disappearing is the tell, and a completed PRD's critic-pass row is where to check whether they were deliberate.

## 2026-07-25 — The 2026-07-14 audit note is now actioned; the named callsites are fixed

**What happened**: The entry above closed with "other crm callsites still call `getCurrentSingaporeTime().getHours()/.toLocaleString('en-SG')`-style patterns (ReportDisclaimer, ReportHero, finance.ts refYear)". They stayed unfixed for eleven days and shipped a wrong "Generated:" stamp onto a printed financial artifact.

**Root cause**: The note recorded the trap but assigned no work, so the redesign batch rebuilt the surface *around* `PortfolioReportPage`'s timestamp without touching the timestamp.

**Fix**: All four are done. `PortfolioReportPage.generatedTimestamp()` and `ReportDisclaimer` use `formatDisplayDateTimeLong(new Date())`; `ReportHero`'s as-of date uses `formatDisplayDateLong(new Date())`; `currentRefYear()` uses the new `getSingaporeYear()` in `timezoneUtils`. `getCurrentSingaporeTime()` keeps its remaining callers — they want an *instant* (comparison refDates, "now" arguments), which it returns correctly — and its docblock now says so explicitly. **Supersedes** the audit note in the 2026-07-14 entry; the lesson itself still stands.

## 2026-07-27 — ClientDetailActions's read-only hint had the profiler's page-cream contrast bug

**Origin**: src/features/profiler/lib/lessons.md (2026-07-27)

**What happened**: `ClientDetailActions`'s `ReadOnlyHint` mirrors the profiler's `ResultDetailActions` copy line for line, including `text-muted-foreground`. That token is `#7D6B5B` — 4.72:1 on card cream but **4.12:1 on the page cream `#F0E6D6`** the `DetailPageFrame` hero actually paints, and the hint renders at 10.5px. The profiler copy was caught by `load-a11y.spec.ts`; this one has no a11y spec covering a foreign-owned client, so it was silently failing AA.

**Root cause**: the component was copied from the profiler along with its bug. Neither copy inherited the `--fg-dim` call that `PageShellHero`'s own meta line makes on the same ground for the same reason.

**Fix**: both variants take `var(--fg-dim)` (6.40:1). Generally: `text-muted-foreground` is a CARD-cream token — anything rendered into a `DetailPageFrame`/`ListPageFrame` hero sits on the page cream and needs `--fg-dim` under 18px. When mirroring a component across features, re-measure its colours against the new parent's ground rather than trusting the source.
