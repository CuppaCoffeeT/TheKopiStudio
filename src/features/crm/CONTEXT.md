# CRM — Feature Memory

Insurance CRM (SHIPPED): clients/policies/interactions/bank + dashboards + reports. Routes `/dashboard`, `/crm`, `/clients` (+`/:id`, `/:id/report`), `/crm-reports`. Read docs/03-features/crm/CRM_MODULE.md + lib/decisions.md first.

## Map

- `pages/` — DashboardHomePage (/dashboard landing: module cards + KPI row + client-progress) · CrmDashboardPage · ClientsListPage · ClientDetailPage (4 tabs + comm card) · ClientReportPage (13 sections) · PortfolioReportPage
- `api/` — clients/policies/interactions/bank/dashboard + portfolioService (bounded) + linkedResultsService (results by client_id .limit(10) · getProfiledClientIds)
- `hooks/` — detail(id) sub-keys incl. linkedResults · usePortfolioReport
- Keys: crmClients (incl. profiledFlags)/crmDashboard only
- `lib/` — finance.ts (exact port) · financeReport barrel + Bands/Economics/Portfolio/Sections (oracle-locked math) · followUps · mapping · report-print.css · decisions.md
- `components/` — report/ (format-only) · detail/ · modals/ · FollowUpBadge

## Constraints

- MATH PURITY: components format only; all numbers from lib (1.025/1.06 kept; oracle tests cite legacy JSX)
- Band tones Kopi + WCAG-darkened (#4A6A4E/#7D5F3D/#AB4925) — logic/labels legacy-exact; premiums ANNUALISED (footnoted)
- report-canvas light-locked; `.no-print` chrome; window.print()
- Comm card: LOCAL DISC palette (no profiler import); ONE neutral empty state (never-converted ≡ RLS-hidden)
- Legacy quirks per decisions.md — never "fix"; soft delete (exc. replaceProjections); bank recompute owns derived cols
