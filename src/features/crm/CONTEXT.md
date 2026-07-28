# CRM — Feature Memory

Insurance CRM (SHIPPED): customers/policies/interactions/bank + dashboards + reports. Routes `/dashboard`, `/crm`, `/clients` (+`/:id`, `/:id/report`), `/crm-reports`. Read docs/03-features/crm/CRM_MODULE.md + lib/decisions.md first.

**IA (2026-07-28, customer-centred):** the rail leads with Overview + Customers; the three tools are launched FROM a customer, never from nav. `lib/customerJourney` is the ONE ruleset all three surfaces read — change it there, never per-page.

## Map

- `pages/` — DashboardHomePage (/dashboard = ACTION QUEUE: dateline + profiler launcher band + 4 queue figures + quiet/unfinished/reviews bands) · CrmDashboardPage · ClientsListPage ("Customers" + journey checklist column) · ClientDetailPage (tool launcher + 4 tabs + comm card) · ClientReportPage (13 sections) · PortfolioReportPage
- `api/` — clients/policies/interactions/bank/dashboard + portfolioService (bounded) + linkedResultsService (crm-owned `results` reads, by client_id .limit(10)) + customerQueueService (getCustomerQueue = whole-book queue; getCustomerSignals = ids on ONE list page)
- `hooks/` — detail(id) sub-keys incl. linkedResults · usePortfolioReport · useCustomerQueue · useCustomerSignals (page-scoped, keepPreviousData)
- Keys: crmClients (incl. `signals(ids)`) / crmDashboard (incl. `customerQueue()`) only
- `lib/` — finance.ts (exact port) · financeReport barrel + Bands/Economics/Portfolio/Sections (oracle-locked math) · followUps · **customerJourney (3-step chain + queue rule; pure, tz-injected)** · mapping · report-print.css · decisions.md
- `components/` — report/ (format-only) · detail/ (incl. CustomerToolLauncher) · modals/ (incl. AddCustomerChoiceModal fork) · FollowUpBadge · JourneyChecklist · QueueStatStrip · StartProfilerBand · CustomerQueueSection
- `planning/` — **sub-workspace**: the three customer-scoped advisory tools (tax · SRS · Legacy Map) at `/clients/:id/<tool>`. Own CONTEXT.md + decisions/lessons. Inside crm because they read the customer record — see its decisions.md.

## Constraints

- MATH PURITY: components format only; all numbers from lib (1.025/1.06 kept; oracle tests cite legacy JSX)
- JOURNEY PURITY: no surface re-derives "gone quiet" / "unfinished" / step state — import from `lib/customerJourney`, inject `refDate`
- HONEST SIGNALS: profiler is binary (no partial rows exist); report `done` = *ready to generate* (no issued flag); "Last contact" never reports the added-date fallback
- Band tones Kopi + WCAG-darkened (#4A6A4E/#7D5F3D/#8F3D1F) — logic/labels legacy-exact; premiums ANNUALISED (footnoted)
- report-canvas light-locked; `.no-print` chrome; window.print()
- Comm card: LOCAL DISC palette (no profiler import); ONE neutral empty state (never-converted ≡ RLS-hidden)
- Legacy quirks per decisions.md — never "fix"; soft delete (exc. replaceProjections); bank recompute owns derived cols
