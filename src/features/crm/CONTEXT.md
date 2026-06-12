# CRM — Feature Memory

Insurance CRM on AppBase (SHIPPED): clients + policies + interactions + bank history + dashboard. Two module rows `/crm` + `/clients` (+ `/clients/:id`). Read docs/03-features/crm/CRM_MODULE.md + lib/decisions.md first. Reports (next PRD) build on lib/.

## Map

- `pages/` — CrmDashboardPage (4 KPIs, empty-book CTA) · ClientsListPage (server search, URL pages) · ClientDetailPage (4 tabs; foreign clients read-only)
- `api/` — clients/policies/interactions/bank services + dashboardService (bounded selects; children inner-join clients.is_deleted)
- `hooks/` — queries on detail(id) sub-keys; mutations invalidate detail(id)+dashboard (clients add lists())
- `lib/` — finance.ts (exact legacy port) · financeReport.ts (report math, one-way import) · followUps.ts · mapping.ts · decisions.md · vectors + tests
- `components/` — FollowUpBadge + followUpTone · detail/ · modals/

## Constraints

- Legacy parity: modal fields/coercions per PRD port map (client ''→null, policy ''→0, followUp ''→null); preserved finance quirks — never "fix" (decisions.md)
- finance.ts replays 115 vectors float-exact; time-dependent fns take refYear/refDate (app: SG clock; tests pin 2026)
- Client edits never write total_bank_balance/last_review_date — bank mutations recompute both; projection replace = hard-delete, dedup keep-last
- Soft delete everywhere; every read filters is_deleted (exception: replaceProjections)
- Dashboard premium = annualised, not legacy raw sum; list badge = next_review_date only
- Keys: queryKeys.crmClients/crmDashboard only
