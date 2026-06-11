# Feature Specifications

How production features work today. Permanent reference (Layer 3) — updated when features change. Router only.

## What belongs / doesn't

Specs of **current behavior** (UI, data model, workflow) by domain. NOT: build plans → `docs/05-implementation/` · architecture → `docs/01-system-architecture/` · external APIs → `docs/04-integrations/`.

## Navigation

Open the subfolder's own `CONTEXT.md` to route into a spec + its code. Code paths are under `src/features/`.

| Subfolder(s) | Domain | Code in |
|--------------|--------|---------|
| `autonomous-agent/` | Agent ecosystem, runs | `agent-runs/`, `agent-setup/` |
| `claiming/` `progress-claims/` | Invoice/advance/progress claiming | `claims/`, `progress-claims/` |
| `dashboards/` `supervisor*/` | Supervisor/drafter/engineer/report views | `drafterdashboard/`, `engineer-dashboard/` |
| `comms/` `email*/` | Email automation, Gmail triage, AI classify | `email/`, `emailaccount/`, `comms/` |
| `invoicing/` | Invoices, financial overview, Xero | `invoices/`, `xero-settings/` |
| `nas-templates/` `nasoperations/` | NAS template + folder ops | `nasfoldertemplates/`, `nasoperations/` |
| `nce-management/` | NCE submissions | `ncedashboard/` |
| `ot-calculation/` | OT calc, edit grids, incomplete months | `otcalculator/`, `workerlist/` |
| `payslip/` | Payslip generator + bulk payroll | `payslip/` |
| `performance-review/` | Worker composite-score analytics | `performancereview/` |
| `personnel/` | Staff vs workers, People Management | `people/`, `staffmanagement/`, `workerlist/` |
| `plan-purchase/` `purchaseorders/` | Plan-purchase tracking + POs | `plan-purchase-dashboard/`, `purchaseorders/` |
| `materialinventory/` `materialrequests/` | Material stock + requests | `materialinventory/`, `materialrequests/` |
| `project-management/` `meeting-projects/` | Projects, CDW, file tracking | `projects/`, `meetingprojects/` |
| `quotation/` | Quotations, PDF templates, spatial maps | `quotations/`, `quotation-settings/`, `pdf-templates/` |
| `hr-applications/` `hr-pending-sends/` | HR application intake + send queue | `hr-applications/` |
| `work-entry/` | General works, trial trench, hours | `fieldops/`, `site-forms/` |

## Before working here

- "How it works today" stays · "how to build/change it" → `docs/05-implementation/`
- Naming + headers: `.claude/rules/documentation.md`
