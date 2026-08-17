# CRM — Feature Memory

Insurance CRM (SHIPPED): customers/policies/interactions/bank + dashboards + reports. Routes `/dashboard`, `/crm`, `/clients` (+`/:id`, `/:id/report`), `/crm-reports`. Read docs/03-features/crm/CRM_MODULE.md + lib/decisions.md first.

**IA (2026-07-28, customer-centred):** the rail leads with Overview + Customers; the three tools are launched FROM a customer, never from nav. `lib/customerJourney` is the ONE ruleset all three surfaces read — change it there, never per-page.

**Overview shortcuts (2026-08-17):** /dashboard also offers the six tools as a button row under the queue figures. This does NOT loosen the rule above — a shortcut asks for the customer FIRST (own-book picker), then navigates to the identical route the record's launcher uses. Nav still never reaches a tool without a customer.

## Map

- `pages/` — DashboardHomePage (/dashboard = ACTION QUEUE: dateline + profiler launcher band + 4 queue figures + quiet/unfinished/reviews bands) · CrmDashboardPage · ClientsListPage ("Customers" + journey checklist column) · ClientDetailPage (tool launcher + 4 tabs + comm card) · ClientReportPage (13 sections) · PortfolioReportPage
- `api/` — clients/policies/interactions/bank/dashboard + portfolioService (bounded) + linkedResultsService (crm-owned `results` reads, by client_id .limit(10)) + customerQueueService (getCustomerQueue(userId) = OWN-book queue, all 3 reads filter user_id; getCustomerSignals = ids on ONE list page) + clientOptionsService (getOwnClientOptions = OWN-book id+name for the shortcut picker; separate module so the narrower-than-RLS boundary is visible at the import)
- `hooks/` — detail(id) sub-keys incl. linkedResults · usePortfolioReport · useCustomerQueue · useCustomerSignals (page-scoped, keepPreviousData) · useOwnClientOptions (picker list, parked until opened) · useInfoToolParam (`?tool=info` → open the edit form, then strip)
- Keys: crmClients (incl. `signals(ids)`, `ownOptions(userId)`) / crmDashboard (incl. `customerQueue(userId)`) only
- `lib/` — finance.ts (exact port) · financeReport barrel + Bands/Economics/Portfolio/Sections (oracle-locked math) · followUps · **customerJourney (3-step chain + queue rule; pure, tz-injected)** · profilerEntry (the ONE `/profiler?prospect=&customerId=` builder) · customerToolCards (record launcher: per-customer state + gating) · dashboardToolShortcuts (Overview row: module gating only, no customer yet) · mapping · report-print.css · decisions.md
- `components/` — report/ (format-only) · detail/ (incl. CustomerToolLauncher) · modals/ (incl. AddCustomerChoiceModal fork · ToolCustomerPickerModal) · FollowUpBadge · JourneyChecklist · QueueStatStrip · StartProfilerBand · CustomerQueueSection · **ToolShortcutLauncher** (row + picker + navigation; the `belowStats` slot) · ToolShortcutRow
- `planning/` — **sub-workspace**: the three customer-scoped advisory tools (tax · SRS · Legacy Map) at `/clients/:id/<tool>`. Own CONTEXT.md + decisions/lessons. Inside crm because they read the customer record — see its decisions.md.

## Constraints

- MATH PURITY: components format only; all numbers from lib (1.025/1.06 kept; oracle tests cite legacy JSX)
- JOURNEY PURITY: no surface re-derives "gone quiet" / "unfinished" / step state — import from `lib/customerJourney`, inject `refDate`
- HONEST SIGNALS: profiler is binary (no partial rows exist); report `done` = *ready to generate* (no issued flag); "Last contact" never reports the added-date fallback
- OWN-BOOK SCOPE: /dashboard is a personal queue — filter `user_id` in the service, never lean on RLS (it also passes `view_all_clients` holders + managers). Applies to BOTH `getCustomerQueue` and the shortcut picker's `getOwnClientOptions`; do not "reuse" `getClientsPaginated` for either. Cross-advisor reach belongs to /clients. See lib/lessons.md 2026-08-13
- Band tones Kopi + WCAG-darkened (#4A6A4E/#7D5F3D/#8F3D1F) — logic/labels legacy-exact; premiums ANNUALISED (footnoted)
- report-canvas light-locked; `.no-print` chrome; window.print()
- Comm card: LOCAL DISC palette (no profiler import); ONE neutral empty state (never-converted ≡ RLS-hidden)
- Legacy quirks per decisions.md — never "fix"; soft delete (exc. replaceProjections); bank recompute owns derived cols
