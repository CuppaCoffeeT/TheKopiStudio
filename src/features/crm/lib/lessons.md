# Lessons — src/features/crm

Last Updated: 2026-08-18

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

## 2026-08-13 — /dashboard had no navigation at all on a phone

**What happened**: logged in on mobile, `/dashboard` rendered the greeting, profiler band and queue with no app chrome above them — no rail, no bar, no way to reach another module. Every other route was fine.

**Root cause**: `AppHeaderMobileBar` is homed PER PAGE by the three archetype frames, not by `DashboardLayout`. `DashboardHomePage` composes no frame (its `GreetingHeader` masthead is the header block, so `AppHeaderShell` would stack a second H1 over it), so it inherited no bar. `AppSidebar` is `hidden lg:flex`, and the ⌘K hotkey was removed 2026-08-05 — the bar's search icon is now the *only* opener of the module palette — so the three facts composed into a dead-end page. The existing rail spec asserted only that the rail is hidden below lg and returned early, so nothing caught it.

**Fix**: `DashboardHomePage` renders `AppHeaderMobileBar` + `ImpersonationBanner` off `useDashboardChrome`, the same wiring `ListPageFrame` uses. The spec's mobile branch now walks the whole escape path — search icon → palette → `/clients` — instead of returning early. Generally: chrome that lives in the frames is absent from any page that skips them; a page composing its own layout must render the bar itself, and a mobile assertion that only checks something is *hidden* proves nothing about what stands in for it.

## 2026-08-13 — The Overview queue trusted RLS for a boundary RLS does not draw

**What happened**: a super_admin's `/dashboard` "Unfinished work" band listed another advisor's customers alongside their own, under the caption "Pick up where you left off". The same page also showed a customer as "Never profiled" who had just been profiled.

**Root cause**: two different faces of one assumption — *the row I can read is the row that is mine*. (1) `getCustomerQueue` filtered nothing but `is_deleted`, leaning on RLS for scope; but `clients_select` also passes `has_capability('view_all_clients')` and `results` carries a "Managers read all results" policy, so for an elevated viewer the personal work queue silently became the whole firm's. (2) `deriveJourney({ hasProfile })` reads `results.client_id` and nothing else, while the wizard only ever wrote that column via "Convert to client" afterwards — so a profile saved for an existing customer never attached to them.

**Fix**: `getCustomerQueue(userId)` takes the advisor as a REQUIRED argument and filters `user_id` on all three reads (the id is in the query key too — impersonation swaps the advisor without unmounting). Cross-advisor reach stays on the Customers list, which is built to show whose customer is whose. Separately, the profiler now sets `client_id` at save time via `?customerId=`. Generally: RLS answers *may I read this row*, never *is this row mine* — any surface whose copy says "you"/"your" must filter the owner itself, and a service that defaults to no owner filter will eventually be called by an elevated viewer.

## 2026-08-13 — the mobile bar had no visible way to change module

**What happened**: with the bar restored (entry above), `/dashboard` on a phone still read as a dead end — the only navigation affordance was a magnifying glass, which users take to mean "search this page", not "go to another module".

**Root cause**: the 2a decision recorded in `AppSidebar` was "AppHeaderMobileBar serves navigation + account — no second drawer is built". That was true *while ⌘K was a hotkey*: the palette was a first-class navigation surface with a keyboard entry point, and the search icon was a second door to it. When the hotkey was removed (2026-08-05) the palette lost its identity as navigation and became a page-level search icon, but the "no second drawer" decision was never revisited. A decision can be invalidated by a change somewhere else entirely — the note that records it should be re-read whenever its premise moves.

**Fix**: `AppNavDrawer` — a left sheet holding the rail's own list — opened from a leading menu button on the bar. The list itself moved out of `AppSidebar` into `AppSidebarNav`, rendered by both, because two hand-kept copies would drift the first time a module was added (the same reasoning that made the rail and ⌘K share `groupModulesByCategory`). The palette stays as the fast path. Note the testid trick: below lg the rail is `hidden` — still in the DOM — so the shared nav takes its "More" heading testid as a prop, or an unscoped `getByTestId` finds both copies and trips Playwright strict mode.

## 2026-08-18 — a column DEFAULT of 0 turned a correct money rule into a silent under-count

**What happened**: the CRM Dashboard's "Annual premium" tile read $5,689 against a book whose live policies carry $20,425 of annualised premium. Four of the nine live policies contributed exactly $0 and the tile said nothing about it.

**Root cause**: `summariseClient` scales an ILP premium by `ilpPremiumInclusionPercent` — the correct rule; only the protection slice is premium revenue. But `policies.ilp_premium_inclusion_percent` DEFAULTS TO 0, and so does `policyFormModel`'s blank. Every ILP saved without someone deliberately setting that field is therefore multiplied by zero. The rule was right, the default made it a data-loss switch, and nothing on screen distinguished "excluded on purpose" from "nobody filled this in".

**Fix**: `lib/ilpExclusion.ts` computes what the rule dropped, and both the tile subtitle and the Portfolio Report's premium row declare it. The MATH IS UNCHANGED, deliberately — a 0 is genuinely ambiguous (a sibling ILP on the same customer carries a deliberate 50), so re-including zero-percent ILPs at 100% would inflate every book that has used the field correctly. Full provenance: [docs/06-operations/CRM_FIGURE_PROVENANCE.md](../../../../docs/06-operations/CRM_FIGURE_PROVENANCE.md).

**Generalise**: a `DEFAULT 0` on a column that MULTIPLIES is a silent data-loss switch. When a scaling factor defaults to zero, "unset" and "exclude entirely" become the same stored value, and no aggregate downstream can tell them apart. Prefer a NULL default (or a NOT NULL with a real default like 100) so the two states stay distinguishable — and when they cannot be, make the total say what it left out rather than trusting the reader to notice.

## 2026-08-18 — `dvh` on a page shell is the iPad bottom-scroll jump

**What happened**: on iPad, scrolling to the bottom of a page made the last content shift or disappear.

**Root cause**: page shells used `min-h-screen` (`100vh` — the LARGE viewport, taller than what you can see) or `min-h-dvh` (the DYNAMIC viewport, which literally resizes as the Safari toolbar collapses and expands). On a page-level min-height that is a container resize DURING a scroll gesture, and the browser re-anchors the scroll position mid-animation. `viewport-fit=cover` compounded it: with no bottom inset on `body`, the last row also sat under the home indicator.

**Fix**: every page shell moved to `min-h-svh` — the SMALL viewport, the one value that does not change while you scroll — with `html, body { min-height: 100% }` painting the ground under the shortfall and `padding-bottom: env(safe-area-inset-bottom)` on `body` clearing the indicator once for every page. `dvh` remains correct for SIZING an overlay (a drawer should track the chrome); it is only wrong as a page floor. Recorded in `.claude/rules/mobile-web.md` §2.
