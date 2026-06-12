# CRM — Feature Memory

Insurance CRM on AppBase (SHIPPED incl. reports): clients/policies/interactions/bank + dashboard + printable reports. Module rows `/crm`, `/clients` (+`/:id`, `/:id/report`), `/crm-reports`. Read docs/03-features/crm/CRM_MODULE.md + lib/decisions.md first.

## Map

- `pages/` — CrmDashboardPage · ClientsListPage · ClientDetailPage (4 tabs + comm-style card) · ClientReportPage (13 sections) · PortfolioReportPage
- `api/` — clients/policies/interactions/bank/dashboard + portfolioService (bounded) + linkedResultsService (results by client_id, .limit(10))
- `hooks/` — detail(id) sub-keys incl. linkedResults · usePortfolioReport
- `lib/` — finance.ts (exact port) · financeReport barrel + Bands/Economics/Portfolio/Sections (oracle-locked report math) · followUps · mapping · report-print.css · decisions.md
- `components/` — report/ (format-only sections) · detail/ · modals/ · FollowUpBadge

## Constraints

- Report MATH PURITY: components format only; every number from lib (literals 1.025/1.06 preserved; oracle tests cite legacy JSX)
- Band tones WCAG-darkened (#047857/#92400e/#b91c1c) — logic/labels legacy-exact; portfolio premiums ANNUALISED (documented, footnoted)
- report-canvas light-locked screen+print; `.no-print` chrome; window.print()
- Comm-style card: LOCAL DISC palette (no profiler import); ONE neutral empty state (never-converted ≡ RLS-hidden)
- Legacy quirks per decisions.md — never "fix"; soft delete everywhere (exc. replaceProjections); bank recompute owns derived cols
- Keys: crmClients/crmDashboard only
