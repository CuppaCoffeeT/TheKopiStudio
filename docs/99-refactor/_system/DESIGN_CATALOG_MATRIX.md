# DESIGN_CATALOG — Module × primitive matrix

**Created**: 2026-04-28 SGT (extracted from `DESIGN_CATALOG.md` to clear 6.9× budget overflow)
**Last Updated**: 2026-07-25 SGT — `/dashboard` row: launcher trio marked RETIRED, archetype flipped to 2a Overview
**Status**: 🟢 Production
**Priority**: 🔴 Critical

👉 Workspace router: [DESIGN_CATALOG.md](./DESIGN_CATALOG.md) · Sibling: [DESIGN_CATALOG_PRIMITIVES.md](./DESIGN_CATALOG_PRIMITIVES.md)

## 📋 Overview

Per-module consumption of primitive groups. Columns = primitive groups. `●` = module consumes this group. Rows sorted by archetype cluster. **Migration target**: when a module's row is fully migrated (every `●` replaced by `✓`), that module flips 🟢 in W09.

| Module (route) | COMPONENT_MAP cnt | Archetype | Shells | Atoms | Overlays | States | Form | Motion | Migration |
|---|---:|---|---|---|---|---|---|---|---|
| /dashboard | 8 dashboard/ | **2a Overview** (was Module Launcher) | ● **AppHeader · GreetingHeader · KpiIndexCard** · ⚠️ ~~ModuleCard~~ ~~ModuleSearch~~ ~~CategoryHeader~~ **RETIRED 2026-07-25** (files deleted with the launcher grid — see [DEPRECATIONS.md](./DEPRECATIONS.md)); NeedsAttentionPill · AttentionHeader · CountBadge survive but are unadopted here | — | ● Popover (ImpersonationSelector) · DropdownMenu (UserMenu) · **CommandPalette (⌘K)** · Toaster | — | — | — | **🟢 MIGRATED 2026-04-19 · W09 #1 · commit d49cf78 · CommandPalette added eod+15h · rebuilt as the Kopi 2a Overview 2026-07-25** |
| /admin-overview | 2 | Dashboard | ● DataTable · AppHeader | ● Button · Badge | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /admin (dashboard) | — | Dashboard | ● KpiTile · AppHeader | ● Button | ● Toast | ● Empty | — | — | 🔴 |
| /superadmin | — | Dashboard | ● KpiTile · AppHeader | ● Button | ● Toast | ● Empty | — | — | 🔴 |
| /engineer-dashboard | 18 | Dashboard | ● KpiTile · DataTable · AppHeader | ● Button · Badge · StatusBadge | ● Toast · Modal · Popover | ● Empty · Error | — | — | 🔴 |
| /drafter-dashboard | 11 drafter/ | Dashboard | ● KpiTile · DataTable · AppHeader | ● Button · StatusBadge | ● Toast · Modal · Drawer | ● Empty · Loading | — | — | 🔴 |
| /report-dashboard | 7 | Dashboard | ● Chart · DataTable · AppHeader | ● Button · Badge | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /plan-purchase-dashboard | 3 | Dashboard | ● DataTable · AppHeader | ● StatusBadge | ● Toast | ● Empty | — | — | 🔴 |
| /nce-dashboard | 3 | Dashboard | ● DataTable · AppHeader | ● StatusBadge | ● Toast | ● Empty | — | — | 🔴 |
| /commsdashboard | 4 comms/ | Dashboard | ● DataTable · AppHeader | ● Button | ● Toast | ● Empty | — | — | 🔴 |
| /refactor-dashboard | features/ | Internal · Custom | — (custom tabs · Progress/Plan/Decisions markdown-driven) | ● Badge | ● Toast | ● Empty | — | — | 🟢 N/A · design-system meta-view (tracks others) |
| **Dashboard subtotal** | | | 11 routes | | | | | | **1/11** (`/dashboard` 🟢 · rest pending · role dashboards = separate KPI archetype session TBD) |
| /quotations | 31 quotation/ | List/Table | ● DataTable · AppHeader | ● StatusBadge · Avatar · Chip · IconButton · Button | ● Toast · Modal · Dropdown · Popover | ● Empty · Loading · Error · NoResults | — | ● FloatingCTA | 🟡 preview shipped (2026-04-19) |
| /clientprofiles | 18 client-management/ | List/Table | ● DataTable · AppHeader | ● Avatar · Chip · Button | ● Toast · Modal · Drawer | ● Empty · Loading | — | ● FloatingCTA | 🔴 |
| /projectlist (/projects) | features/projects/ | List/Table | ✓ ListPageFrame · DataTable · AppHeader | ✓ Chip (status) · DateCell | ✓ FilterDropdown ×7 · DatePicker (range) | ✓ Empty · Loading · NoResults | — | ✓ FilterBar · FloatingCTA (via frame) | 🟢 MIGRATED (W09 #11) |
| /workerlist | — | List/Table | ● DataTable · AppHeader | ● Avatar · Chip | ● Toast · Modal | ● Empty · Loading | — | ● FloatingCTA | 🔴 |
| /companylist | features/ | List/Table | ✓ DataTable · AppHeader | ✓ Chip | ✓ Toast · Modal | ✓ Empty · Loading | — | ✓ FloatingCTA · FilterBar · FilterPill | 🟢 MIGRATED (W09 #3) |
| /generalworks | features/ | List/Table | ✓ ListPageFrame · DataTable · AppHeader | ✓ Chip (status) · Badge (jlgw) · DateCell | ✓ Modal · Drawer · FilterDropdown · SearchableMultiSelect · DatePicker | ✓ Empty · Loading · NoResults | — | ✓ FilterBar · FloatingCTA (via frame) | 🟢 MIGRATED (W09 #4) |
| /meetingprojects | 8 | List/Table | ● DataTable · AppHeader | ● StatusBadge · Chip | ● Toast · Modal · Popover | ● Empty | — | — | 🔴 |
| /serviceslist | features/ | List/Table | ● DataTable · AppHeader | ● Chip · IconButton | ● Toast · Modal | ● Empty | — | — | 🟡 (W09 pilot) |
| /staffmanagement | 3 staff/ | List/Table | ● DataTable · AppHeader | ● Avatar · Chip | ● Toast · Modal | ● Empty | — | — | 🟡 (W07 proof) |
| /peoplemanagement | features/ | List/Table | ✓ ListPageFrame · DataTable · StatusTabs · AppHeader | ✓ DateCell · Pill (inline) | ✓ Modal · SearchableMultiSelect · FilterDropdown · Alert · Input · Field | ✓ Empty · Loading · NoResults | — | ✓ FilterBar · FloatingCTA (via frame) | 🟢 MIGRATED (W09 #12) |
| /claims (list) | 23 claims/ | List/Table | ● DataTable · AppHeader | ● StatusBadge · Chip | ● Toast · Modal · Popover | ● Empty · Loading | — | — | 🔴 |
| /invoices | 10 invoice/ | List/Table | ● DataTable · AppHeader | ● StatusBadge · Chip | ● Toast · Modal · Dropdown | ● Empty · Loading | — | — | 🔴 |
| /emaillogs | 9 email/ | List/Table | ● DataTable · AppHeader | ● StatusBadge · Chip | ● Toast · Popover | ● Empty · Loading | — | — | 🔴 |
| /emailtemplates | — | List/Table | ● DataTable · AppHeader | ● Chip · IconButton | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /templatefiles | 1 | List/Table | ● DataTable · AppHeader | ● Chip | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /nasfoldertemplates | — | List/Table | ● DataTable · AppHeader | ● Chip | ● Toast · Modal · Drawer | ● Empty · Error | — | — | 🔴 |
| /competitoranalysis | features/ | List/Table | ✓ ListPageFrame · DataTable · AppHeader | ✓ Badge · KpiTile · CurrencyCell | ✓ Modal · FilterDropdown · Checkbox | ✓ Empty · Loading · NoResults | — | ✓ FilterBar · FloatingCTA (via frame) | 🟢 MIGRATED (W09) |
| /engineer-workload | 4 | List/Table | ● DataTable · AppHeader | ● Avatar · Chip | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /dailyattendance | features/attendance/ | TOOL (list-table chrome) | ✓ DataTable · AppHeader · Pagination · SearchInput | ✓ Badge · Button · SelectMenu · Checkbox · Input · DatePicker · Field | ✓ Toast | ✓ Empty · NoResults · Loading | — | ✓ SearchInput | 🟢 MIGRATED (W09 · 2026-04-28; DataTable adoption 2026-05-25) |
| /coordinatorattendance | features/attendance/ | TOOL (list-table chrome) | ✓ DataTable · AppHeader · Pagination · SearchInput | ✓ Badge · Button · SelectMenu · Checkbox · Input · DatePicker · Field | ✓ Toast | ✓ Empty · NoResults · Loading | — | ✓ SearchInput | 🟢 MIGRATED (W09 · 2026-05-25) |
| /hr-applications | 1 hr/ | List/Table | ● DataTable · AppHeader | ● StatusBadge · Avatar · Chip | ● Toast · Modal · Drawer | ● Empty · Loading | — | ● FloatingCTA | 🔴 |
| /hr-pending-sends | DECOMMISSIONED | List/Table | — | — | — | — | — | — | 🚫 [DECOMMISSIONED 2026-04-29](../../05-implementation/active/HR_PENDING_SENDS_MODULE_DECOMMISSION.md) — producer (HR Lifecycle Agent) removed; module soft-deleted (`is_active=false`), RPC dropped. |
| /payment-management | 3 | List/Table | ● DataTable · AppHeader | ● StatusBadge · Chip | ● Toast · Modal · Popover | ● Empty · Loading | — | — | 🔴 |
| /commspending | — | List/Table | ● DataTable · AppHeader | ● Chip | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /admin/projects | — | List/Table | ● DataTable · AppHeader | ● StatusBadge · Chip | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /admin/companies | — | List/Table | ● DataTable · AppHeader | ● Chip | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /admin/services | — | List/Table | ● DataTable · AppHeader | ● Chip · IconButton | ● Toast · Modal | ● Empty | — | — | 🔴 |
| /sops | features/sops/ | List/Table | ✓ ListPageFrame · AppHeader (via frame) · DataTable | ✓ Chip (status) · Badge (category) · DateCell | ✓ Modal (SopCreateDialog) · FilterDropdown | ✓ Empty · Loading · NoResults | — | ✓ FilterBar · FloatingCTA (via frame) | 🟢 BUILT (sops module Phase 3 · 2026-06-01) |
| /sops/:id | features/sops/ | Detail | ✓ DetailPageFrame · AppHeader (via frame) · TabNav | ✓ Card · Badge · Button · SopWatermark | ✓ Modal · DestructiveConfirmDialog | ✓ Loading (frame skeleton) | ✓ FileUpload (attachments) · Input · Field | — | 🟢 BUILT (sops module Phase 4 · 2026-06-01) — 4 tabs (Overview · Attachments · Linked · Access); MarkdownProse (shell/) for SopOverviewTab; sopPrint.css + usePrintScreenDeterrence for anti-capture |
| **List/Table subtotal** | | | 26 routes | | | | | | 2/26 preview |
| /quotations/:id | 31 quotation/ | Detail + LineItems | ● PageShell · LineItemsEditor · Timeline · AppHeader | ● StatusBadge · Avatar · Button · Chip | ● Toast · Modal · Drawer · Popover · Dropdown | ● Empty · Loading · Error | ● FormShell · FieldRow · SubmitBar | ● Stepper · Timeline | 🔴 |
| /projects/:id | features/projects/ (215 files) | Detail | ✓ DetailPageFrame · AppHeader (via frame) · PageShell · TabNav · ImpersonationBanner · NotificationsBell · ViewAsSelector | ✓ Badge · Button · IconButton · Card{Header,Title,Content} · Tabs/TabsList/TabsTrigger/TabsContent · Chip kind=filter · SearchInput · Progress · CDWProgressTimeline | ✓ Modal · Popover · Tooltip · Alert · SearchableMultiSelect · StarredMultiSelect (via ClientContactMultiSelect) | ✓ Loading (frame skeleton) | ✓ Input · Textarea · Select · Switch · DatePicker · Field · FileUpload (auto-save via useAutoSaveForm) | — | 🟢 MIGRATED (W09 #28 P1–P11 · 2026-05-27) — 8 tabs (Details · Client Interaction · Plan Purchase · NCE · CDW Parts & Spatial · Drafting Drawings · Completed Works · History) on per-card pencil-edit + auto-save (16 cards, shared useEditableCard hook). Standardised cross-tab toolbar: pencil icon + 320px SearchInput + Chip filters + right-aligned actions. Global Edit/Save/Cancel + URL /edit alias + EditingCardsProvider unsaved-changes guard all retired P9. WF-0312 load spec (chromium + mobile-safari) passes axe wcag2aa with `aria-progressbar-name` + `color-contrast` disabled (primitive-level debt, deferred to next a11y W-card). P12 orphan sweep next. |
| /claims/:id | claims/ | Detail + LineItems | ● PageShell · LineItemsEditor · Timeline · AppHeader | ● StatusBadge · Button | ● Toast · Modal · Popover | ● Empty · Loading | ● FormShell | ● Timeline | 🔴 |
| /invoices/:id | invoice/ | Detail + LineItems | ✓ DetailPageFrame · AppHeader (via frame) · LoadingSpinner | ✓ Badge · Button · IconButton · Card{Header,Title,Content} | ✓ Modal · DestructiveConfirmDialog · RecordPaymentModal · XeroContactResolveModal · Popover · Tooltip · Alert | ✓ Loading (frame) | ✓ Input · Textarea · Checkbox · Label · FileUpload · Field (form) | — | 🟢 MIGRATED (W09 InvoiceDetail · 2026-04-27) — `/invoices/:id` (+ /edit) decomposed 2,256 LOC monolith → 25 feature files (page 293 + view/edit bodies + 6 modals + 5 hooks + 3 lib); 4 cross-feature primitives promoted P1 (RecordPaymentModal · WorkItemMappingSelector · XeroContactPicker · XeroContactResolveModal); 6c/6d/6e zero · 6a=1 + 6b=3 deferrals user-approved |
| /progress-claims/:id | progress-claims/ | Detail + LineItems | ● PageShell · LineItemsEditor · Timeline · AppHeader | ● StatusBadge · Button | ● Toast · Modal · Popover | ● Empty · Loading | ● FormShell | ● Timeline | 🔴 |
| /engineer-project-detail/:id | engineer-dashboard/ | Detail | ● PageShell · DataTable · Timeline · AppHeader | ● StatusBadge · Avatar · Button | ● Toast · Modal · Drawer | ● Empty · Loading · Error | ● FormShell · FieldRow | ● Timeline | 🔴 |
| /people/:id | 2 people/ | Detail | ● PageShell · AppHeader | ● Avatar · StatusBadge · Button | ● Toast · Modal · Popover | ● Empty · Loading | ● FormShell · FieldRow | — | 🔴 |
| /hr-applications/:id | — | Detail | ● PageShell · Timeline · AppHeader | ● StatusBadge · Avatar | ● Toast · Modal · Drawer | ● Empty · Loading | ● FormShell | ● Timeline | 🔴 |
| /xero-settings/invoice/:id | features/xero-settings/ | Tool (read-only viewer) | ✓ AppHeader (via DashboardHeader shim) · LoadingSpinner · ErrorState | ✓ Card · Button · Badge | — | ✓ Loading · Error | — | — | 🟢 MIGRATED (W09 #25 · 2026-04-28) — Xero cache viewer reclassified `detail → tool` (no S4 evidence). 4 cards · sanctioned `ui/table` · timezone-utils everywhere |
| /email-threads/:id | email/ | Detail | ● PageShell · Timeline · AppHeader | ● Avatar · Chip | ● Toast · Modal | ● Empty · Loading | ● FormShell | ● Timeline | 🔴 |
| CompanyDetail (feature/companydetail) | 8 detail/ · 1 overlays/ · 1 shell/ | Detail | ✓ DetailPageFrame · AppHeader (via frame) | ✓ StatusBadge (via frame) | ✓ Modal · DestructiveConfirmDialog | ✓ Loading (frame skeleton) | ✓ via legacy CompanyForm | ✓ ActivityLogTimeline · RelatedRecordsCard ×3 | 🟢 MIGRATED (W09 #2 v2.1) |
| PersonDetail (features/people) | 1 detail/ (DetailPageFrame) · 1 overlays/Modal · 1 detail/DestructiveConfirmDialog · 4 shell/ (Card · Button · Badge · PageTitle via frame) · 5 form/ (Input · Select · Switch · Field · Label) | Detail | ✓ DetailPageFrame · AppHeader (via frame) · PageTitle (via frame) | ✓ Badge · Button · Card · Card{Header,Title,Content} | ✓ Modal (xxl/lg) · DestructiveConfirmDialog tier 1 | ✓ Loading (frame skeleton) | ✓ Input · Select · Switch · Field (form primitives) | — | 🟢 MIGRATED (W09 #18 · 2026-04-26) — `/peoplemanagement/:id` · 13 components + 9 hooks decomposed · single-caller orphan-sweep deleted `comms/PersonWhatsAppPanel`, relocated `services/workerEmploymentService` → `features/people/api/` · W23 #1 same day promoted `WhatsAppThreadPanel` primitive (handoff `2026-04-26-LWwN0H4g`) — W15 deferral fully closed, all 5 W09 hard greps zero |
| ContactDetailView | — | Detail | ● PageShell · Timeline · AppHeader | ● Avatar · Chip | ● Toast · Modal · Popover | ● Empty · Loading | ● FormShell · FieldRow | ● Timeline | 🔴 |
| **Detail subtotal** | | | 13 routes | | | | | | 5/13 (projectdetail · invoicedetail · xero-settings/invoice · companydetail · persondetail) |
| /quotations/create | quotation-create forms | Form | ● FormShell · PageShell · AppHeader | ● Button · Chip · StatusBadge | ● Toast · Modal · Drawer · Popover | ● Loading · Error | ● FieldRow · SubmitBar · InputRow · SelectRow · DateRow · MultiSelectRow | ● Stepper · Drawer | 🔴 |
| ~~/projects/create~~ | ⚠️ **DELETED 2026-05-25** — W09 #12. Creation moved to `NewProjectDialog` modal on `/projectlist`. See [DEPRECATIONS.md](./DEPRECATIONS.md). Row kept for historical column-totals only. | Modal | (via dialog primitives) | (via dialog primitives) | Dialog · SearchableMultiSelect · StarredMultiSelect | — | Input · DatePicker · Label · ClientContactMultiSelect | — | 🟢 MIGRATED (W09 #12 · 2026-05-25) |
| /invoices/create | invoice-create | Form | ● FormShell · LineItemsEditor · PageShell · AppHeader | ● Button · StatusBadge · Chip | ● Toast · Modal · Popover | ● Loading · Error | ● FieldRow · SubmitBar · InputRow · SelectRow · DateRow | ● Stepper | 🔴 |
| /progress-claims/create | pc-create | Form | ● FormShell · LineItemsEditor · PageShell · AppHeader | ● Button · StatusBadge | ● Toast · Modal | ● Loading | ● FieldRow · SubmitBar · InputRow | ● Stepper | 🔴 |
| /supervisor (addworkentry) | 67 supervisor/ | Form (mobile-first) | ● FormShell · AppHeader | ● Button · Chip | ● Toast · Drawer · Modal | ● Loading · Error | ● FieldRow · SubmitBar · InputRow · SelectRow · DateRow | ● Stepper · Drawer · FloatingCTA | 🔴 |
| /otentry | — | Form (mobile-first) | ● FormShell · AppHeader | ● Button · Chip · Avatar | ● Toast · Drawer · Modal | ● Loading · Error | ● FieldRow · SubmitBar · InputRow · DateRow · MultiSelectRow | ● Stepper · Drawer · FloatingCTA | 🔴 |
| /generalworks (entry) | 5 | Form | ● FormShell · AppHeader | ● Button · Chip | ● Toast · Modal | ● Loading | ● FieldRow · SubmitBar · InputRow · SelectRow · DateRow | ● Stepper | 🔴 |
| /hr-applications (apply) | — | Form | ● FormShell · PageShell · AppHeader | ● Button · Chip | ● Toast · Modal | ● Loading | ● FieldRow · SubmitBar · InputRow · DateRow · MultiSelectRow | ● Stepper | 🔴 |
| **Form subtotal** | | | 8 routes | | | | | | 0/8 |
| /quotationsettings | 11 quotation-settings/ | Settings | ● AppHeader · DataTable | ● Button · Chip | ● Toast · Modal · Popover | ● Empty | ● FormShell · FieldRow | — | 🔴 |
| /emailaccount | email/ | Settings | ● AppHeader | ● Button · Badge | ● Toast · Modal · Drawer | ● Empty · Error | ● FormShell · FieldRow · InputRow | — | 🔴 |
| /emailsettings | 1 | Settings | ● AppHeader | ● Button · Badge | ● Toast · Modal | ● Empty · Error | ● FormShell · FieldRow | — | 🔴 |
| /pdftemplates | quotation/pdf-templates/ | Settings | ● AppHeader · DataTable | ● Button · Chip | ● Toast · Modal · Drawer | ● Empty · Loading · Error | ● FormShell · FieldRow | — | 🔴 |
| /xerosettings | 6 xero/ | Settings | ● AppHeader · DataTable | ● Button · Badge · StatusBadge | ● Toast · Modal · Popover | ● Empty · Loading · Error | ● FormShell · FieldRow | — | 🔴 |
| /productsservices | 3 products-services/ | Settings | ● AppHeader · DataTable | ● Button · Chip | ● Toast · Modal | ● Empty | ● FormShell · FieldRow · InputRow · SelectRow | — | 🔴 |
| /nasoperations | — | Settings | ● AppHeader · DataTable | ● Button · StatusBadge | ● Toast · Modal | ● Empty · Loading · Error | — | — | 🔴 |
| **Settings subtotal** | | | 7 routes | | | | | | 0/7 |
| /ot-calculator | 21 management/ | Tool | ● AppHeader | ● Button · Chip · Avatar | ● Toast · Modal · Popover | ● Loading · Error | ● FieldRow · InputRow · SelectRow · DateRow · MultiSelectRow | — | 🔴 |
| /jltt | 15 jltt/ | Tool | ● AppHeader · DataTable | ● Button · StatusBadge · Chip · Avatar | ● Toast · Modal · Drawer · Popover | ● Empty · Loading | ● FieldRow · InputRow · SelectRow · DateRow · MultiSelectRow | — | 🔴 |
| /leaves | — | Tool | ● AppHeader · DataTable | ● Button · StatusBadge · Avatar | ● Toast · Modal | ● Empty · Loading | ● FieldRow · InputRow · DateRow | — | 🔴 |
| /salary | features/salary/ | List | ✓ AppHeader · ImpersonationBanner · PageTitle · PageDescription · FilterBar · DataTable · Pagination · FloatingCTA · MobileListCard · ListPageFrame | ✓ Button · Card · Badge · CurrencyCell · DateCell · KpiTile | ✓ Modal (xxl/md) · ModalPrimaryAction · ModalGhostAction · Toast | ✓ Empty · Loading · NoResults (via DataTable variants) | ✓ Input · Select · Field | — | 🟢 MIGRATED (W09 · 2026-04-28) — 1431-LOC monolith → 21 files; legacy `PaymentMethodForm` deleted (sole-caller orphan); 5 hard greps zero |
| /payslip (management) | features/payslip/ | Tool | ✓ AppHeader (direct) · ImpersonationBanner · PageTitle · PageDescription · Tabs · sanctioned ui/table | ✓ Button · Card · Badge · IconButton (via Button variant=icon) · Switch · Label · Field-style inputs | ✓ Modal (sm/lg/xl/xxl) · ModalPrimaryAction · ModalGhostAction · DestructiveConfirmDialog tier 1 · Popover · Alert · Tabs · Toast · Progress | ✓ LoadingSpinner-class via lucide RefreshCw spin · Empty (table fallback) | ✓ Input · Checkbox · Switch · Textarea · Label (form primitives) | ✓ Calendar (sanctioned) | 🟢 MIGRATED (W09 #15 · 2026-04-23) — Modal xxl promoted mid-run · DashboardHeader shim retired in favor of direct AppHeader composition |
| /performance-review | 6 performance-review/ | Tool | ● AppHeader · DataTable | ● Button · Avatar · StatusBadge | ● Toast · Modal | ● Empty · Loading | ● FieldRow · InputRow | — | 🔴 |
| **Tool subtotal** | | | 6 routes | | | | | | 1/6 (/payslip — W09 #15) |

### Non-archetype routes (low-prio)

| Module (route) | Archetype | Notes |
|---|---|---|
| /login | Auth | Splash + form. 1 FormShell + Button + Input + Toast. Absorbed into S6 Form. |
| /auth/verify, /auth/verified, /auth/reset-password | Auth | Same as above. |
| /coordinatorreview, /supervisorreview | Review hybrid | List + Detail absorbed. Both W09-migrated (2026-05-09 coord · 2026-05-23 supervisor). |
| ~~/managementreview~~ | ~~Review hybrid~~ | **🔴 DECOMMISSIONED 2026-05-13** — module removed (commit `39e35ed4`), `modules.is_active=false`, RPC dropped. See [MANAGEMENT_REVIEW_MODULE_DECOMMISSION.md](../../05-implementation/active/MANAGEMENT_REVIEW_MODULE_DECOMMISSION.md). |
| /emailinbox | Inbox | Unique — email-client layout. Maybe S9 polish, or deferred. |
| /design-lab, /design-lab/fonts, /design-lab/preview/quotations | Internal | Skip — design tooling. |
| /refactor-dashboard | Internal | Design tab extension = B3 (this session). |

---

## 📚 Related

- [DESIGN_CATALOG.md](./DESIGN_CATALOG.md) — router (sessions · W09 adoption · approval state)
- [DESIGN_CATALOG_PRIMITIVES.md](./DESIGN_CATALOG_PRIMITIVES.md) — per-primitive Design · Impl · Adopted inventory (sections A–N)
- [workflows/W09_MODULE_MIGRATIONS.md](./workflows/W09_MODULE_MIGRATIONS.md) — adopter (per-module migration)
