# CRM — Feature Memory

Insurance CRM (SHIPPED): clients/policies/interactions/bank + dashboards + reports. Routes `/dashboard`, `/crm`, `/clients` (+`/:id`, `/:id/report`), `/crm-reports`. Read docs/03-features/crm/CRM_MODULE.md + lib/decisions.md first.

## Map

- `pages/` — DashboardHomePage (/dashboard 2a Overview: dateline masthead + 2 index KPI cards + Latest additions table; NO launcher) · CrmDashboardPage · ClientsListPage · ClientDetailPage (4 tabs + comm card) · ClientReportPage (13 sections) · PortfolioReportPage
- `api/` — clients/policies/interactions/bank/dashboard + portfolioService (bounded) + linkedResultsService (crm-owned `results` reads: by client_id .limit(10) · listRecentResults for the Overview feed)
- `hooks/` — detail(id) sub-keys incl. linkedResults · usePortfolioReport · useLatestAdditions (fetch+merge only; owns the Overview's ONE held-record-module set + per-source `resultsStatus`)
- Keys: crmClients/crmDashboard (incl. recentResults) only
- `lib/` — finance.ts (exact port) · financeReport barrel + Bands/Economics/Portfolio/Sections (oracle-locked math) · followUps · latestAdditions (Overview row shape + mappers + the two record-module paths) · mapping · report-print.css · decisions.md
- `components/` — report/ (format-only) · detail/ · modals/ · FollowUpBadge · LatestAdditionsTable · OverviewKpiRow (per-card skeleton + quiet retry)

## Constraints

- MATH PURITY: components format only; all numbers from lib (1.025/1.06 kept; oracle tests cite legacy JSX)
- Band tones Kopi + WCAG-darkened (#4A6A4E/#7D5F3D/#8F3D1F) — logic/labels legacy-exact; premiums ANNUALISED (footnoted)
- report-canvas light-locked; `.no-print` chrome; window.print()
- Comm card: LOCAL DISC palette (no profiler import); ONE neutral empty state (never-converted ≡ RLS-hidden)
- Legacy quirks per decisions.md — never "fix"; soft delete (exc. replaceProjections); bank recompute owns derived cols
