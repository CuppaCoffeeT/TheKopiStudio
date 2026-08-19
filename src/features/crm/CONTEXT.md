# CRM — Feature Memory

Insurance CRM (SHIPPED): customers/policies/activity/bank + dashboards + reports. Routes `/dashboard`, `/crm`, `/clients` (+`/:id`, `/:id/report`), `/tools/*`, `/crm-reports`. Read docs/03-features/crm/CRM_MODULE.md + lib/decisions.md first.

**IA (2026-08-18, tools are places; rail shape revised 2026-08-19):** the rail leads with Overview + Customers, lists every tool under an always-open "Tools" heading below them, keeps an "Others" disclosure for modules no band claimed, and pins Account Settings to the bottom. Each tool owns a top-level `/tools/*` route and asks "which customer?" INSIDE itself (`?customer=<id>`, `ToolCustomerBar`) — clearable back to a blank scratch pad. The old `/clients/:id/<tool>` URLs redirect. `lib/customerJourney` is still the ONE ruleset every surface reads for chain state — change it there, never per-page.

**Superseded (2026-07-28 → 2026-08-18):** "tools are launched FROM a customer, never from nav", and the Overview shortcut row that softened it. Both are gone: a shortcut that opens a modal before the page is a gate, and an advisor often has no customer yet. The record's own `CustomerToolLauncher` remains — it is the other direction of the same trip.

**Privacy:** customer names and money are masked by default app-wide (`MaskContext` + `SensitiveName`/`SensitiveMoney`); the eye lives in the app chrome, not per page. Report pages never mask — they ARE the client-facing artifact.

## Map

- `pages/` — DashboardHomePage (/dashboard = ACTION QUEUE: dateline + daily quote + reviews/unfinished/quiet bands, most-urgent first) · CrmDashboardPage · ClientsListPage ("Customers" + journey checklist column) · ClientDetailPage (tool launcher + 4 tabs incl. **Activity** + comm card) · ClientReportPage (14 sections; `/clients/:id/report` AND `/tools/client-report?customer=`) · PortfolioReportPage
- `api/` — clients/policies/interactions/bank/dashboard + portfolioService (bounded) + linkedResultsService (crm-owned `results` reads, by client_id .limit(10)) + customerQueueService (getCustomerQueue(userId) = OWN-book queue, all 3 reads filter user_id; getCustomerSignals = ids on ONE list page) + clientOptionsService (getOwnClientOptions = OWN-book id+name for the tool bar; separate module so the narrower-than-RLS boundary is visible at the import) + **customerActivityService** (READ side of the merged automatic+manual timeline; the WRITE side is `@/lib/activityLog`, app-level, because the profiler writes there too)
- `hooks/` — detail(id) sub-keys incl. linkedResults + **activity** · usePortfolioReport · useCustomerQueue · useCustomerSignals (page-scoped, keepPreviousData) · useOwnClientOptions (tool-bar list) · useInfoToolParam (`?tool=info` → open the edit form, then strip; owns the param constants) · **useCustomerActivity / useLogActivity / useLogToolOpen**
- Keys: crmClients (incl. `signals(ids)`, `ownOptions(userId)`, `activity(id)`) / crmDashboard (incl. `customerQueue(userId)`) only
- `lib/` — finance.ts (exact port) · financeReport barrel + Bands/Economics/Portfolio/Sections (oracle-locked math) · **ilpExclusion** (what the premium total dropped, and why the math is disclosed not changed) · followUps · **customerJourney (3-step chain + queue rule; pure, tz-injected)** · profilerEntry (the ONE `/profiler?prospect=&customerId=` builder) · customerToolCards (record launcher; chain 01–03 is ordered ADVICE, no longer a gate) · **customerActivity** (tracked fields + `diffClient`) · **reportCompleteness** (NIL + the report's own missing-info list) · mapping · report-print.css · decisions.md
- `components/` — report/ (format-only, incl. ReportMissingInfo) · detail/ (incl. CustomerToolLauncher · **ActivityTab**) · modals/ (incl. AddCustomerChoiceModal fork) · FollowUpBadge · JourneyChecklist · CustomerQueueBoard · CustomerQueueSection · **ToolCustomerBar** (the in-page "which customer?", used by every tool AND the standalone report)
- `planning/` — **sub-workspace**: the three advisory tools (tax · SRS · Legacy Map) at `/tools/{tax-calculator,srs,legacy-planner}`. Own CONTEXT.md + decisions/lessons. Inside crm because they read the customer record — see its decisions.md.

## Constraints

- MATH PURITY: components format only; all numbers from lib (1.025/1.06 kept; oracle tests cite legacy JSX)
- FIGURE PROVENANCE: every dashboard/report number is traced in docs/06-operations/CRM_FIGURE_PROVENANCE.md. A premium total that drops zero-percent ILPs must SAY SO (`ilpExclusion`) — never silently, and never by "fixing" the number
- JOURNEY PURITY: no surface re-derives "gone quiet" / "unfinished" / step state — import from `lib/customerJourney`, inject `refDate`
- PROFILED = `results.client_id`, never `clients.risk_profile` (the add form defaults it to 'Moderate', so reading it reports a profile for every new customer)
- HONEST SIGNALS: profiler is binary (no partial rows exist); the report is UNGATED and prints `NIL` for what is missing; "Last contact" never reports the added-date fallback
- HISTORY IS APPEND-ONLY: `customer_activity` carries no UPDATE/DELETE policy. Only MANUAL (`interactions`) rows are editable in the Activity tab; automatic rows offer no controls
- OWN-BOOK SCOPE: /dashboard is a personal queue — filter `user_id` in the service, never lean on RLS (it also passes `view_all_clients` holders + managers). Applies to BOTH `getCustomerQueue` and the tool bar's `getOwnClientOptions`; do not "reuse" `getClientsPaginated` for either. Cross-advisor reach belongs to /clients. See lib/lessons.md 2026-08-13
- Band tones Kopi + WCAG-darkened (#4A6A4E/#7D5F3D/#8F3D1F) — logic/labels legacy-exact; premiums ANNUALISED (footnoted)
- report-canvas light-locked; `.no-print` chrome (incl. the standalone report's customer bar); window.print()
- Comm card: LOCAL DISC palette (no profiler import); ONE neutral empty state (never-converted ≡ RLS-hidden)
- Legacy quirks per decisions.md — never "fix"; soft delete (exc. replaceProjections); bank recompute owns derived cols
