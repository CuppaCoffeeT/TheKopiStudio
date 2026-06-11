# React Query Cache Migration Log (Dec 2025) — Archived

**Archived**: 2026-04-20 SGT
**Reason**: Historical Dec-2025 migration log extracted during folder promotion to keep the live workspace under the 15,000-char reference-doc ceiling (see [docs/99-meta/TOKEN_BUDGET.md](../../../99-meta/TOKEN_BUDGET.md)).
**Status**: 🔴 Archived — retained for audit trail. See live workspace for the W21-corrected state as of 2026-04-19.

👉 Live workspace: [../CONTEXT.md](../CONTEXT.md) · Current enforcement: [../ENFORCEMENT.md](../ENFORCEMENT.md)

> ⚠️ Note: This log covers ONLY the Dec 2025 `src/hooks/*` migration pass. It claimed "34/34 complete" but did not touch `src/components/**` / `src/pages/**`. The real completion was done by W21 in Apr 2026 — see the live standard's W21 correction section.

---

## 📊 Historical Migration Log (Dec 2025)

> The pre-2026-04 entity tracking below is **incomplete** — it covers only the `src/hooks/*` hook-file migration. Component and page-level migration is tracked by W21-1 (above).

### Overview
**Total Entities Identified**: 34+ entities requiring migration
**Migration Started**: 2025-01-19
**Estimated Total Effort**: 90-130 hours

### Hook-file Entities (34/34 — hook-files only, Dec 2025)

| Entity | Files Migrated | Complexity | Completed Date |
|--------|---------------|------------|----------------|
| **Companies** | 5 files | Medium | 2025-01-19 |
| **Projects** | 11 files (core paths) + 1 critical fix | Medium-Complex | 2025-01-19 |
| **Quotations** | 7 files + central factory | High - Complex | 2025-01-19 |
| **Client Contacts** | 4 files + central factory | Medium | 2025-01-19 |
| **Products/Services** | 2 files + central factory | Medium | 2025-01-19 |
| **People** | 2 files + central factory | Medium | 2025-01-19 |
| **Staff** | 2 files + central factory | Medium | 2025-01-19 |
| **Trial Trenches / JLTT** | 13 hooks + 2 components + central factory | High - Complex | 2025-01-20 |
| **Worker OT Calculator** | 4 hooks + 5 components + central factory | Complex (payroll) | 2025-01-29 |
| **Workers** | 2 files + central factory | Medium | 2025-11-30 |
| **General Works** | 12 files + central factory | Medium-Complex | 2025-11-30 |
| **Services** | 5 files + central factory | Simple | 2025-11-30 |
| **Service Groups** | 3 files + central factory | Simple | 2025-11-30 |
| **NCE Submissions** | 1 hook + central factory | Medium | 2025-11-30 |
| **Plan Purchases** | 1 hook + central factory | Medium | 2025-11-30 |
| **CDW Parts** | 3 files + central factory | Medium | 2025-11-30 |
| **Spatial Features** | 1 hook + central factory | Medium | 2025-11-30 |
| **Drafter/Drawing Reviews** | 2 files + supervisors factory | Simple | 2025-11-30 |
| **NAS Folder Templates** | 4 files + central factory | Medium | 2025-11-30 |
| **Clarification Requests** | 2 files + central factory | Simple | 2025-11-30 |
| **PDF Templates** | 1 hook + central factory | Simple | 2025-11-30 |
| **Payslip Templates** | 1 component + central factory | Simple | 2025-11-30 |
| **Quotation Settings** | 6 components + central factory | Medium | 2025-11-30 |
| **User Approvals** | 1 component + central factory | Simple | 2025-11-30 |
| **Audit Logs** | 1 hook + central factory | Simple | 2025-11-30 |
| **NAS Validation** | 2 files + central factory | Simple | 2025-11-30 |
| **Worker Comments** | Already compliant (1 hook) | Simple | 2025-11-30 |
| **Form Attachments** | 1 file fix | Simple | 2025-11-30 |
| **Report Generation** | Already compliant (3+ files) | Simple | 2025-11-30 |
| **Export Operations** | Already compliant (uses queryKeys.trialTrenches.jltt.exportData()) | Simple | 2025-12-01 |
| **Notification Preferences** | ⏭️ SKIPPED - System deprecated (replaced with dashboard counts + Sonner toasts) | N/A | 2025-12-01 |
| **User Settings** | Already compliant (uses queryKeys.users.profile('current')) | Simple | 2025-12-01 |
| **Supervisor Components (Bonus)** | 3 files + 2 new factory sections | Medium | 2025-12-01 |
| **Company Emails** | 1 hook + central factory | Simple | 2025-11-30 |
| **Merge Operations** | 2 hooks + central factory (includes enhanced sub-section) | Medium | 2025-11-30 |

**Companies Files**: CompanyList.tsx, CompaniesManagement.tsx, ProjectEditForm.tsx, useClientCompanies.ts, useCompanyDetails.ts

**Projects Files**: ProjectsList.tsx, AdminProjects.tsx, ProjectAdvancedFilters.tsx, UnifiedTrialTrenchFilters.tsx, FilterControls.tsx, OTEditModal.tsx, OTWorkEntryEditModal.tsx, CustomerFormSection.tsx, ProjectAuditLog.tsx, ProjectNASMapping.tsx, CompanyDetailView.tsx

**Projects Query Keys Migrated**:
- `['projects']` → `queryKeys.projects.list({})`
- `['projects', companyId, showOnlyActive]` → `queryKeys.projects.list({ companyId, showOnlyActive })`
- `['projects-for-filters']`, `['projects-for-filter']`, `['projects-for-edit-modal']` → `queryKeys.projects.list({ status: 'active' })`
- `['active-projects']`, `['active-projects-v2']` → `queryKeys.projects.list({ status: 'active' })`
- `['project-filter-options']` → `queryKeys.projects.filterOptions()`
- `['project-detail', id]` → `queryKeys.projects.detail(id)`
- `['project-audit-log', id]` → `queryKeys.projects.auditLog(id)`
- `['project-validation-status', id]` → `queryKeys.projects.validationStatus(id)`
- `['customer-form-file', id]` → `queryKeys.projects.customerFormFile(id)`

**Quotations Files**: useEnhancedQuotations.ts (core hook - removed local QUERY_KEYS), UnifiedQuotationView.tsx (manual invalidations), EnhancedQuotationList.tsx, useQuotationSpatialFeatures.ts, useEmailTemplates.ts, QuotationAuditLog.tsx, QuotationNASMapping.tsx

**Quotations Query Keys Migrated** (22+ patterns):
- `['enhanced-quotations']`, `['enhanced-quotations', 'list']` → `queryKeys.quotations.list({})`
- `['enhanced-quotations', 'detail', id]`, `['enhanced-quotation', id]` → `queryKeys.quotations.detail(id)`
- `['enhanced-quotations', 'next-number']` → `queryKeys.quotations.nextNumber()`
- `['quotation-number-exists', number, excludeId]` → `queryKeys.quotations.numberExists(number, excludeId)`
- `['enhanced-quotations', 'reference-data']` → `queryKeys.quotations.referenceData()`
- `['quotation-email-recipients', 'list', quotationId]` → `queryKeys.quotations.emailRecipients(quotationId)`
- `['quotation-logs', quotationId]` → `queryKeys.quotations.logs(quotationId)`
- `['quotations', quotationId, 'cdw-parts']` → `queryKeys.quotations.cdwParts(quotationId)`
- `['quotations', quotationId, 'spatial-features']` → `queryKeys.quotations.spatialFeatures(quotationId)`
- `['quotations', quotationId, 'assigned-spatial-features']` → `queryKeys.quotations.assignedSpatialFeatures(quotationId)`
- `['quotation-validation-status', id]` → `queryKeys.quotations.validationStatus(id)`
- `['quotation-spatial-features', quotationId]` → `queryKeys.spatialFeatures.quotationFeatures(quotationId)`
- `['available-spatial-features', filters]` → `queryKeys.spatialFeatures.available(filters)`
- `['spatial-features-by-quotation', quotationNumber]` → `queryKeys.spatialFeatures.byQuotationNumber(quotationNumber)`
- `['cdw-parts', partId, 'spatial-features']` → `queryKeys.spatialFeatures.byCdwPart(partId)`
- `['email-templates']` → `queryKeys.emailTemplates.all`
- `['email-templates', 'list', { type }]` → `queryKeys.emailTemplates.list(type)`
- `['email-templates', 'detail', id]` → `queryKeys.emailTemplates.detail(id)`
- `['email-templates', 'default', type]` → `queryKeys.emailTemplates.default(type)`
- `['email-logs', 'list', 'quotation', quotationId]` → `queryKeys.emailLogs.byQuotation(quotationId)`

**Central Factory Updates**:
- Added `quotations.numberExists()`, `quotations.referenceData()`, `quotations.cdwParts()`, `quotations.assignedSpatialFeatures()`, `quotations.validationStatus()`
- Added `spatialFeatures.quotationFeatures()`, `spatialFeatures.available()`, `spatialFeatures.byQuotationNumber()`, `spatialFeatures.byCdwPart()`
- Added complete `emailTemplates` section (all, lists, list, active, details, detail, default, defaultQuotation)
- Added complete `emailLogs` section (all, lists, byQuotation)

**Note**: 7+ supervisor component files remain for Projects - these are lower priority and can be migrated later if needed.

**Client Contacts Files**: useClientContacts.ts (core hook - removed local clientContactsKeys), ClientContactMultiSelect.tsx (inline query), useEnhancedMergeOperations.ts (hardcoded invalidations), useMergeOperations.ts (hardcoded invalidations)

**Client Contacts Query Keys Migrated** (8 patterns):
- `['client-contacts']` → `queryKeys.clientContacts.all`
- `['client-contacts', 'list', filters]` → `queryKeys.clientContacts.list(filters)`
- `['client-contacts', 'detail', id]` → `queryKeys.clientContacts.detail(id)`
- `['client-contacts', 'company', companyId]` → `queryKeys.clientContacts.byCompany(companyId)`
- `['client-contacts', 'mailing-list', companyId]` → `queryKeys.clientContacts.mailingList(companyId)`
- `['client-contacts', 'statistics', companyId]` → `queryKeys.clientContacts.statistics(companyId)`
- `['client-contacts-by-company', companyId]` → `queryKeys.clientContacts.byCompany(companyId)` (inline query in ClientContactMultiSelect.tsx)
- Updated hardcoded invalidations in merge operations hooks

**Central Factory Updates**:
- Expanded `clientContacts` section with `byCompany()`, `mailingList()`, `statistics()`
- Updated `invalidateEntity` helper to include `clientContacts`
- Reduced staleTime from 5 minutes to global 1 minute (or removed explicit staleTime)

**Products/Services Files**: useProductsServices.ts (core hook - removed local QUERY_KEYS), component files use hooks only

**Products/Services Query Keys Migrated** (7 patterns):
- `['products-services']` → `queryKeys.productsServices.all`
- `['products-services', 'list', filters]` → `queryKeys.productsServices.list(filters)`
- `['products-services', 'detail', id]` → `queryKeys.productsServices.detail(id)`
- `['products-services', 'categories']` → `queryKeys.productsServices.categories()`
- `['products-services', 'sales', category]` → `queryKeys.productsServices.salesItems(category)`
- `['products-services', 'purchase', category]` → `queryKeys.productsServices.purchaseItems(category)`
- `['products-services', 'search', searchTerm, filters]` → `queryKeys.productsServices.search(searchTerm, filters)`

**Central Factory Updates**:
- Added complete `productsServices` section (all, lists, list, details, detail, categories, salesItems, purchaseItems, search)
- Updated `invalidateEntity` helper to include `productsServices`
- Reduced staleTime from 5 minutes to global 1 minute (kept 10 minutes for categories, 30 seconds for search)

**People Files**: PeopleManagement.tsx (2 inline queries), PersonDetail.tsx (1 query + 2 mutation invalidations)

**People Query Keys Migrated** (3 patterns):
- `['unapproved-users']` → `queryKeys.people.unapprovedUsers()` (user registration workflow)
- `['all-people']` → `queryKeys.people.allPeople()` (complete directory)
- `['person', id]` → `queryKeys.people.person(id)` (single person detail)

**Central Factory Updates**:
- Expanded `people` section to include `allPeople()`, `person(id)`, `unapprovedUsers()` (legacy patterns)
- Maintained existing hierarchical patterns: `list(filters)`, `detail(id)` (for future standardization)
- `invalidateEntity` helper already included `people`

**Staff Files**: StaffList.tsx (hardcoded query key), staff-select.tsx (direct DB query → React Query)

**Staff Query Keys Migrated** (1 pattern):
- `['staff-employment']` → `queryKeys.staff.list({ isActive: true })`

**Central Factory Updates**:
- `staff` section already existed, used existing `list({ isActive: true })` pattern
- `invalidateEntity` helper already included `staff`

**Critical Bug Fix**: ProjectDetailPage.tsx (line 1495) - Added `queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })` to project update mutation onSuccess callback. This fixes the stale data issue where editing a project (e.g., assigning an engineer) didn't update the project list until manual refresh.

**StaffSelect Component Improvement**: Converted from direct database queries to React Query with centralized key `queryKeys.staff.list({ isActive: true })`. Now benefits from caching (2-minute staleTime) and automatic invalidation when staff records are updated.

**Trial Trenches/JLTT Hooks**: useJLTTData.ts, useJLTTTrialTrenchData.ts, useJLTTExportData.ts, useJLTTFilterCounts.ts, useCoordinatorTrialTrenchData.ts, useSupervisorTrialTrenchData.ts, useDrafterTrialTrenchData.ts, useTrialTrenchStatusLog.ts, useTrialTrenchAttachments.ts (+ useTrialTrenchAttachmentSummary), useDrafters.ts, useDrafterCounts.ts, useDrafterData.ts, DrawingReviewsTable.tsx

**Trial Trenches/JLTT Query Keys Migrated** (22+ patterns):
- `['jltt-data', page, pageSize, filters]` → `queryKeys.trialTrenches.jltt.data(page, pageSize, filters)`
- `['jltt-trial-trenches', userId, userRole, filters, pagination]` → `queryKeys.trialTrenches.jltt.trenches(userId, userRole, filters, pagination)`
- `['jltt-export-data', userId, userRole, filters]` → `queryKeys.trialTrenches.jltt.exportData(userId, userRole, filters)`
- `['jltt-filter-counts']` → `queryKeys.trialTrenches.jltt.filterCounts()`
- `['jltt-filter-options']` → `queryKeys.trialTrenches.jltt.filterOptions()`
- `['coordinator-trial-trenches', filters, pagination]` → `queryKeys.trialTrenches.coordinator.list(filters, pagination)`
- `['supervisor-trial-trenches', userId, userRole, filters, pagination]` → `queryKeys.trialTrenches.supervisor.list(userId, userRole, filters, pagination)`
- `['drafter-trial-trenches', userId, userRole, filters, pagination]` → `queryKeys.trialTrenches.drafter.list(userId, userRole, filters, pagination)`
- `['trial-trench-status-log', trenchId]` → `queryKeys.trialTrenches.statusLog(trenchId)`
- `['trial-trench-attachments', trialTrenchId]` → `queryKeys.trialTrenches.attachments(trialTrenchId)`
- `['trial-trench-attachment-summary', trialTrenchId]` → `queryKeys.trialTrenches.attachmentSummary(trialTrenchId)`
- `['drawing-reviews']` → `queryKeys.drawingReviews.list()`
- `['drafters']` → `queryKeys.drafters.list()`
- `['drafters-for-filters']` → `queryKeys.drafters.forFilters()`
- `['drafter-data']` → `queryKeys.drafters.data()`
- `['drafter-counts', userId]` → `queryKeys.drafters.counts(userId)`
- `['drafter-general-works', userId]` → `queryKeys.drafters.generalWorks(userId)`
- `['trial-trenches']` → `queryKeys.trialTrenches.all` (in invalidations)

**Trial Trenches/JLTT Components Migrated** (2 critical files):
- useWorkflowStatus.ts: Updated 5 invalidations to use centralized keys (`trialTrenches.all`, `jltt.all`, `jltt.filterCounts()`, `drafters.data()`, `drawingReviews.all`)
- DeleteTrialTrenchButton.tsx: Updated invalidation from hardcoded `['jltt-data']` to `queryKeys.trialTrenches.jltt.all`

**Central Factory Updates**:
- Added complete `trialTrenches` section with nested hierarchical structure:
  - `jltt` sub-section: `data()`, `trenches()`, `exportData()`, `filterCounts()`, `filterOptions()`
  - Role-based views: `coordinator.list()`, `supervisor.list()`, `drafter.list()`
  - Detail queries: `statusLog()`, `attachments()`, `attachmentSummary()`
- Added `drawingReviews` section: `all`, `list()`
- Added `drafters` section: `all`, `list()`, `forFilters()`, `data()`, `counts()`, `generalWorks()`
- Added filter type definitions: `JLTTFilters`, `TrialTrenchFilters`, `PaginationParams`
- Updated `invalidateEntity` helper to include `trialTrenches`, `drawingReviews`, `drafters`

**Remaining Components**: ✅ ALL MIGRATED (0 files remaining)

**All Workflow Components Compliant** (verified/migrated 2025-11-30):
- ✅ src/components/drafter/UnifiedDrafterTrialTrenchTable.tsx - Uses `queryKeys.trialTrenches.drafter.all`, `queryKeys.drafterCounts.all`
- ✅ src/components/drafter/GeneralWorksTable.tsx - Uses `queryKeys.generalWorks.drafterAssigned()`, `queryKeys.drafterCounts.all`, `queryKeys.coordinatorCounts.all`
- ✅ src/components/trial-trench/shared/UnifiedTrialTrenchFilters.tsx - Migrated to use `queryKeys.supervisors.forFilters()`, `queryKeys.drafters.forFilters()`
- ✅ src/components/supervisor/hooks/edit-trench/useEditTrenchMutation.ts - Uses `queryKeys.trialTrenches.jltt.all`, `queryKeys.coordinatorCounts.all`, `queryKeys.trialTrenches.supervisor.all`, `queryKeys.trialTrenches.coordinator.all`
- ✅ src/components/coordinator/TrialTrenchesTable.tsx - Uses `queryKeys.trialTrenches.coordinator.all`, `queryKeys.coordinatorCounts.all`
- ✅ src/components/supervisor/SupervisorTrialTrenchesTable.tsx - Migrated to use `queryKeys.trialTrenches.supervisor.all`, `queryKeys.supervisorCounts.all()`
- ✅ src/components/coordinator/generalworks/DrafterAssignmentDialog.tsx - Uses `queryKeys.drafters.list()`, `queryKeys.generalWorks.coordinatorPending()`, `queryKeys.coordinatorCounts.all`, `queryKeys.drafterCounts.all`

**Note**: All trial trench and general works workflow components are now fully compliant with the centralized query key factory pattern.

**Workers Files**: PaySlipPage_new.tsx, useOTEntryData.ts

**Workers Query Keys Migrated** (3 patterns):
- `['workers-with-salary', periodStart, periodEnd, filters]` → `queryKeys.workers.withSalary(periodStart, periodEnd, filters)`
- `['active-workers']` → `queryKeys.workers.active()`
- `['user-profile']` → `queryKeys.users.profile('current')`

**General Works Files** (12 files across 5 modules):
- Pages: GeneralWorks.tsx, useCoordinatorCounts.ts
- Coordinator Module: GeneralWorksTable.tsx (coordinator), DrafterAssignmentDialog.tsx, TrialTrenchesTable.tsx
- Supervisor Module: SupervisorGeneralWorksTable.tsx, EditGeneralWorksModal.tsx, useGeneralWorksFormMutation.ts
- Drafter Module: GeneralWorksTable.tsx (drafter), UnifiedDrafterTrialTrenchTable.tsx
- Management Module: ManagementGeneralWorksTable.tsx, ManagementTrialTrenchesTable.tsx
- Hooks: useSupervisorCounts.ts, useWorkflowStatus.ts

**General Works Query Keys Migrated** (20+ patterns):
- `['general-works', activeTab, filters]` → `queryKeys.generalWorks.list({ ...filters, activeTab })`
- `['general-works-stats']` → `queryKeys.generalWorks.stats()`
- `['coordinator-counts']` → `queryKeys.coordinatorCounts.all`
- `['supervisor-counts', userId]` → `queryKeys.supervisorCounts.all(userId)`
- `['drafter-counts']` → `queryKeys.drafterCounts.all`
- `['coordinator-pending-general-works']` → `queryKeys.generalWorks.coordinatorPending()`
- `['supervisor-rejected-general-works', userId]` → `queryKeys.generalWorks.supervisorRejected(userId)`
- `['drafter-general-works', userId]` → `queryKeys.generalWorks.drafterAssigned(userId)`
- `['management-pending-general-works']` → `queryKeys.managementPending.generalWorks()`
- `['management-pending-trenches-with-services']` → `queryKeys.managementPending.trenches()`
- `['management-counts']` → `queryKeys.managementCounts.all`
- `['mgmt-stats']` → `queryKeys.managementCounts.stats()`
- `['coordinator-trial-trenches']` → `queryKeys.trialTrenches.coordinator.all`
- `['drafter-trial-trenches']` → `queryKeys.trialTrenches.drafter.all`
- `['drafters']` → `queryKeys.drafters.list()`

**Central Factory Updates**:
- Expanded `generalWorks` section with `coordinatorPending()`, `managementPending()`, `supervisorRejected()`, `drafterAssigned()`, `stats()`
- Added `coordinatorCounts` section: `all`
- Added `supervisorCounts` section: `all(userId)`
- Added `drafterCounts` section: `all`
- Added `managementPending` section: `trenches()`, `generalWorks()`
- Added `managementCounts` section: `all`, `stats()`
- Updated `workers` section with `withSalary()`, `active()`

**Worker OT Calculator Hooks**: useOTCalculatorData.ts, useSalaryData.ts, usePayslipNotes.ts, useLeaveEntryMutation.ts

**Worker OT Calculator Components**: OTEditModal.tsx, FilterControls.tsx, AllHistory.tsx, OTWorkEntryEditModal.tsx

**Worker OT Calculator Query Keys Migrated** (15+ patterns):
- `['ot-calculator-data', filters]` → `queryKeys.workerOT.calculatorData(filters)`
- `['ot-history']` → `queryKeys.workerOT.history()`
- `['supervisors-for-filter']` → `queryKeys.users.forOTFilter()`
- `['supervisors-for-edit-modal']` → `queryKeys.users.forOTFilter()`
- `['current-salaries']` → `queryKeys.salaries.current()`
- `['salary-history', workerId]` → `queryKeys.salaries.history(workerId)`
- `['current-salary', workerId]` → `queryKeys.salaries.forWorker(workerId)`
- `['payslip-note', workerId, periodStart, periodEnd]` → `queryKeys.payslipNotes.forPeriod(workerId, periodStart, periodEnd)`
- `['working-days-summary']` → `queryKeys.workingDays.all` (invalidation)
- `['payslip-data']` → `queryKeys.payslips.all` (invalidation)

**Central Factory Updates**:
- Added `OTCalculatorFilters` type definition
- Expanded `workerOT` section with `calculatorData(filters)`, `history()`
- Added `salaries` section: `all`, `current()`, `forWorker()`, `history()`
- Added `payslipNotes` section: `all`, `forPeriod()`
- Added `workingDays` section: `all`, `summary()`
- Added `payslips` section: `all`, `data()`
- Expanded `users` section with `forOTFilter()` for OT filter support
- Updated `invalidateEntity` helper to include `salaries`, `payslipNotes`, `workingDays`, `payslips`

**CDW Parts Files**: useProjectCDW.ts, CDWProgressTracker.tsx, ProjectDetailPage.tsx

**CDW Parts Query Keys Migrated** (9 patterns):
- `['project-cdw-parts', projectId]` → `queryKeys.cdwParts.byProject(projectId)`
- `['cdwStepFileCount', projectId, cdwPartId, stepNumber]` → `queryKeys.cdwParts.stepFileCount(projectId, cdwPartId, stepNumber)`
- `['cdwStepFile', projectId, cdwPartId, stepNumber]` → `queryKeys.cdwParts.stepFile(projectId, cdwPartId, stepNumber)`

**Central Factory Updates**:
- Added `cdwParts` section: `all`, `byProject()`, `stepFileCount()`, `stepFile()`
- Updated `invalidateEntity` helper to include `cdwParts`

**Spatial Features Files**: useProjectCDW.ts (project spatial features patterns)

**Spatial Features Query Keys Migrated** (6 patterns):
- `['spatial-features-project']` → `queryKeys.spatialFeatures.projectList()`
- `['assigned-project-spatial-features', projectId]` → `queryKeys.spatialFeatures.assignedToProject(projectId)`
- `['part-spatial-features', partId]` → `queryKeys.spatialFeatures.byPartId(partId)`
- Mutation invalidation patterns updated to use centralized keys

**Central Factory Updates**:
- Expanded `spatialFeatures` section with `projectList()`, `assignedToProject()`, `byPartId()`
- Updated `invalidateEntity` helper to include `spatialFeatures`

**Drafter/Drawing Reviews Files**: DrawingReviewsTable.tsx, UnifiedTrialTrenchFilters.tsx

**Drafter/Drawing Reviews Query Keys Migrated** (3 patterns):
- `['drawing-reviews']` → `queryKeys.drawingReviews.all`
- `['drafters-for-filters']` → `queryKeys.drafters.forFilters()`
- `['supervisors-for-filters']` → `queryKeys.supervisors.forFilters()`

**Central Factory Updates**:
- Added `supervisors` section: `all`, `list()`, `forFilters()`
- Used existing `drawingReviews.all` and `drafters.forFilters()`

**NAS Folder Templates Files**: TemplateSelectionDialog.tsx, NASFolderTemplatesPage.tsx, FileMappingDialog.tsx, TemplateFilesPage.tsx

**NAS Folder Templates Query Keys Migrated** (14 patterns):
- `['nasFolderTemplates', 'active']` → `queryKeys.nasTemplates.active()`
- `['templateFileCount', templateId]` → `queryKeys.nasTemplates.fileCount(templateId)`
- `['nasFolderTemplates']` → `queryKeys.nasTemplates.all`
- `['template', templateId]` → `queryKeys.nasTemplates.detail(templateId)`
- `['templateFiles']` → `queryKeys.nasTemplates.files.all`
- `['templateMappings', templateId]` → `queryKeys.nasTemplates.mappings(templateId)`

**Central Factory Updates**:
- Added `nasTemplates` section: `all`, `active()`, `detail()`, `fileCount()`, `mappings()`, `files.all`
- Added `invalidateEntity` helper for `nasTemplates`

**Clarification Requests Files**: ClarificationTable.tsx, useWorkflowStatus.ts

**Clarification Requests Query Keys Migrated** (2 patterns):
- `['clarification-requests']` → `queryKeys.clarifications.all`
- `queryKeys.trialTrenches.clarification()` → Fixed broken reference (method now exists)

**Central Factory Updates**:
- Added `clarifications` section: `all`, `list()`, `detail()`, `byTrench()`
- Added `trialTrenches.clarification()` method (was missing, causing runtime errors)
- Added `invalidateEntity` helper for `clarifications`

**PDF Templates Files**: usePDFTemplates.ts

**PDF Templates Query Keys Migrated** (5 patterns):
- `['pdf-templates']` → `queryKeys.pdfTemplates.all`
- `['pdf-templates', 'list']` → `queryKeys.pdfTemplates.list()`
- `['pdf-templates', 'detail', id]` → `queryKeys.pdfTemplates.detail(id)`
- `['pdf-templates', 'variables']` → `queryKeys.pdfTemplates.variables()`
- `['pdf-templates', 'active']` → `queryKeys.pdfTemplates.active()`
- `['pdf-templates', 'default']` → `queryKeys.pdfTemplates.default()`

**Central Factory Updates**:
- Expanded `pdfTemplates` section with `variables()`, `active()`, `default()`
- Removed local `PDF_TEMPLATE_KEYS` factory (kept deprecated export for backward compatibility)
- Added `invalidateEntity` helper for `pdfTemplates`

**Payslip Templates Files**: PayslipTemplateManagement.tsx

**Payslip Templates Query Keys Migrated** (4 patterns):
- `['payslip-templates']` → `queryKeys.payslipTemplates.all`

**Central Factory Updates**:
- Added complete `payslipTemplates` section: `all`, `lists()`, `list()`, `details()`, `detail()`, `byType()`, `default()`
- Added `invalidateEntity` helper for `payslipTemplates`

**Quotation Settings Files** (6 components):
- AreaTypesManagement.tsx
- JobTypeManagement.tsx
- ClientTypesManagement.tsx
- ClientWorkTypesManagement.tsx
- PaymentTermsManagement.tsx
- JobTypeProductAssociation.tsx

**Quotation Settings Query Keys Migrated** (12+ patterns):
- `['area-types']` → `queryKeys.quotationSettings.areaTypes.all`
- `['job-types']` → `queryKeys.quotationSettings.jobTypes.all`
- `['job-type-product-counts']` → `queryKeys.quotationSettings.jobTypes.productCounts()`
- `['job-type-products', jobTypeId]` → `queryKeys.quotationSettings.jobTypes.products(jobTypeId)`
- `['client-work-types']` → `queryKeys.quotationSettings.clientWorkTypes.all`
- `['client-types']` → `queryKeys.quotationSettings.clientTypes.all`
- `['payment-terms']` → `queryKeys.quotationSettings.paymentTerms.all`
- `['sales-products']` → `queryKeys.quotationSettings.salesProducts.all`
- `['quotation-reference-data']` → `queryKeys.quotationSettings.referenceData()`

**Central Factory Updates**:
- Added comprehensive `quotationSettings` section with nested entities:
  - `areaTypes`: `all`, `list()`
  - `jobTypes`: `all`, `list()`, `productCounts()`, `products(jobTypeId)`
  - `clientWorkTypes`: `all`, `list()`
  - `clientTypes`: `all`, `list()`
  - `paymentTerms`: `all`, `list()`
  - `salesProducts`: `all`, `list()`
  - `referenceData()`
- Added comprehensive `invalidateEntity.quotationSettings()` that invalidates all sub-keys

**User Approvals Files**: UserApprovalsTab.tsx

**User Approvals Query Keys Migrated** (1 pattern):
- `['pending-users']` → `queryKeys.people.pendingUsers()`

**Central Factory Updates**:
- Added `people.pendingUsers()` method returning `['pending-users']` (maintains existing key pattern)

**Audit Logs Files**: useAuditLogs.ts

**Audit Logs Query Keys Migrated** (4 patterns):
- `['audit-logs-company', companyId, options]` → `queryKeys.auditLogs.company(companyId, options)`
- `['audit-logs-contact', contactId]` → `queryKeys.auditLogs.contact(contactId, options)`
- `['audit-logs-company-summary', companyId]` → `queryKeys.auditLogs.companySummary(companyId)`
- `['audit-logs-contact-summary', contactId]` → `queryKeys.auditLogs.contactSummary(contactId)`

**Central Factory Updates**:
- Added complete `auditLogs` section: `all`, `company()`, `companySummary()`, `contact()`, `contactSummary()`
- Added `invalidateEntity` helper for `auditLogs`

**NAS Validation Files**: NASConnectionStatus.tsx, useProjectValidation.ts

**NAS Validation Query Keys Migrated** (3 patterns):
- `['nas-connection-status']` → `queryKeys.nasValidation.connectionStatus()`
- `['project-validation-status', projectId]` → `queryKeys.nasValidation.projectStatus(projectId)`
- `['trench-validation', projectId, trenchNumber]` → `queryKeys.nasValidation.trenchStatus(projectId, trenchNumber)`

**Central Factory Updates**:
- Added complete `nasValidation` section: `all`, `connectionStatus()`, `projectStatus()`, `trenchStatus()`
- Added `invalidateEntity` helper for `nasValidation`

**Company Emails Files**: useCompanyEmails.ts

**Company Emails Query Keys Migrated** (5 patterns):
- `['companyEmails']` → `queryKeys.companyEmails.all`
- `['companyEmails', 'company', companyId]` → `queryKeys.companyEmails.byCompany(companyId)`
- `['companyEmails', 'detail', id]` → `queryKeys.companyEmails.detail(id)`
- Removed hardcoded fallback keys `['companyEmails', 'none']`
- All mutations updated to use centralized keys

**Central Factory Updates**:
- Added complete `companyEmails` section: `all`, `lists()`, `byCompany()`, `details()`, `detail()`
- Added `invalidateEntity` helper for `companyEmails`

**Merge Operations Files**: useMergeOperations.ts, useEnhancedMergeOperations.ts

**Merge Operations Query Keys Migrated** (16+ patterns):
- `['merge-operations']` → `queryKeys.mergeOperations.all`
- `['merge-operations', 'company-previews']` → `queryKeys.mergeOperations.companyPreviews()`
- `['merge-operations', 'company-previews', primaryId, duplicateId]` → `queryKeys.mergeOperations.companyPreview(primaryId, duplicateId)`
- `['merge-operations', 'contact-previews']` → `queryKeys.mergeOperations.contactPreviews()`
- `['merge-operations', 'contact-previews', primaryId, duplicateId]` → `queryKeys.mergeOperations.contactPreview(primaryId, duplicateId)`
- `['merge-operations', 'validation', type, primaryId, duplicateId]` → `queryKeys.mergeOperations.validation(primaryId, duplicateId, type)`
- `['merge-operations', 'history']` → `queryKeys.mergeOperations.history()`
- `['merge-operations', 'history', 'company', companyId]` → `queryKeys.mergeOperations.companyHistory(companyId)`
- `['merge-operations', 'history', 'contact', contactId]` → `queryKeys.mergeOperations.contactHistory(contactId)`
- `['enhanced-merge-operations']` → `queryKeys.mergeOperations.enhanced.all`
- `['enhanced-merge-operations', 'previews']` → `queryKeys.mergeOperations.enhanced.previews()`
- `['enhanced-merge-operations', 'previews', primaryId, duplicateId]` → `queryKeys.mergeOperations.enhanced.preview(primaryId, duplicateId)`
- `['enhanced-merge-operations', 'impacts']` → `queryKeys.mergeOperations.enhanced.impacts()`
- `['enhanced-merge-operations', 'impacts', primaryId, duplicateId]` → `queryKeys.mergeOperations.enhanced.impact(primaryId, duplicateId)`

**Central Factory Updates**:
- Added complete `mergeOperations` section with nested structure:
  - Company merge: `companyPreviews()`, `companyPreview()`
  - Contact merge: `contactPreviews()`, `contactPreview()`
  - Validation: `validation()`
  - History: `history()`, `companyHistory()`, `contactHistory()`
  - Enhanced sub-section: `enhanced.all`, `enhanced.previews()`, `enhanced.preview()`, `enhanced.impacts()`, `enhanced.impact()`
- Added `invalidateEntity` helper for `mergeOperations` (invalidates both standard and enhanced)
- Added `companies.mergeCandidates()` for merge candidate queries

**Deprecated Wrapper Migration** (useCompanyDetails.ts, useClientContacts.ts):
- Updated all hooks to use `queryKeys.companies.*` and `queryKeys.clientContacts.*` directly
- Deprecated wrappers (`clientCompanyKeys`, `clientContactsKeys`) kept for backward compatibility but now delegate entirely to centralized factory

**Modules/Roles** - ⏭️ SKIPPED (Architectural Exception):
- Does NOT use React Query at all (uses direct Supabase calls with useState/useEffect)
- Files: AuthContext.tsx, useModulePermissionData.ts, usePermissionActions.ts
- Migrating would require architectural refactoring, not just key migration
- Can be addressed in a future "React Query Adoption" initiative if needed

---

### 🔴 High Priority - Business Critical (2/2 complete - 100%)

#### ✅ 1. Quotations **[COMPLETED]**
- **Query Keys**: 22+ patterns migrated to centralized factory
- **Files**: 7 files migrated
- **Mutations**: Create, update, delete, CDW parts, spatial features, email recipients
- **Complexity**: High - Complex (had local factory, now centralized)
- **Status**: ✅ Completed 2025-01-19
- **Notes**:
  - Removed local QUERY_KEYS factories from useEnhancedQuotations.ts, useQuotationSpatialFeatures.ts, useEmailTemplates.ts
  - Updated manual invalidations in UnifiedQuotationView.tsx
  - Added comprehensive central factory keys for quotations, spatial features, email templates, email logs
  - All quotation CRUD operations now use centralized invalidation

#### ✅ 2. Trial Trenches (JLTT) **[COMPLETED]**
- **Query Keys**: 22+ patterns migrated to centralized factory (see detailed list above)
- **Files**: 13 hooks + 2 components migrated (useJLTTData.ts, useCoordinatorTrialTrenchData.ts, DrawingReviewsTable.tsx, etc.)
- **Mutations**: Create, update, status changes, drafter assignment, clarifications, deletions
- **Complexity**: High - Complex (multiple role-specific views, workflow states, nested hierarchy)
- **Status**: ✅ Completed 2025-01-20
- **Notes**:
  - Created hierarchical query key structure with `trialTrenches`, `drawingReviews`, `drafters` sections
  - Migrated all 13 core query hooks to use centralized keys
  - Updated critical workflow invalidation point (useWorkflowStatus.ts)
  - 7 component files with `invalidateQueries` remain for future migration (lower priority)

---

### 🟡 Medium Priority - Core Operations (7/7 complete - 100%)

| Entity | Key Patterns | Files | Complexity | Status |
|--------|-------------|-------|------------|--------|
| **Client Contacts** | `['client-contacts']` | 4 files | Medium | ✅ Completed 2025-01-19 |
| **Products/Services** | `['products-services']` | 2 files | Medium | ✅ Completed 2025-01-19 |
| **People** | `['people']`, `['all-people']`, `['person', id]` | 2 files | Medium | ✅ Completed 2025-01-19 |
| **Staff** | `['staff-employment']` | 2 files | Medium | ✅ Completed 2025-01-19 |
| **Worker OT Calculator** | `['ot-calculator-data']`, `['worker-ot-entries']` | 4 hooks + 5 components | Complex | ✅ Completed 2025-01-29 |
| **Workers** | `['workers']`, `['active-workers']` | 2 files | Medium | ✅ Completed 2025-11-30 |
| **General Works** | `['general-works']`, `['coordinator-counts']` | 12 files | Medium-Complex | ✅ Completed 2025-11-30 |

---

### ⚪ Low Priority - Supporting Features (✅ All Complete)

<details>
<summary><b>Click to expand full list</b></summary>

| # | Entity | Key Patterns | Files | Complexity | Status |
|---|--------|-------------|-------|------------|--------|
| 1 | Email Templates | `['email-templates']` | 3-4 | Simple | ✅ Completed (part of Quotations migration) |
| 2 | PDF Templates | `['pdf-templates']` | 1 | Simple | ✅ Completed 2025-11-30 |
| 3 | Payslip Templates | `['payslip-templates']` | 1 | Simple | ✅ Completed 2025-11-30 |
| 4 | NAS Folder Templates | `['nasFolderTemplates']` | 4 | Medium | ✅ Completed 2025-11-30 |
| 5 | Template Files | `['templateFiles']` | - | - | ✅ Part of NAS Folder Templates |
| 6 | Clarification Requests | `['clarification-requests']` | 2 | Simple | ✅ Completed 2025-11-30 |
| 7 | User Approvals | `['pending-users']` | 1 | Simple | ✅ Completed 2025-11-30 |
| 8 | History/Audit Logs | `['audit-logs-*']` | 1 | Simple | ✅ Completed 2025-11-30 |
| 9 | Dashboard Counts | `['coordinator-counts']`, etc. | ~6 | Simple | ✅ Part of General Works migration |
| 10 | Worker Comments | `queryKeys.workerComments.*` | 1 | Simple | ✅ Completed 2025-11-30 (already compliant) |
| 11 | Customer Form Files | `['customer-form-file']` | 1 | Simple | ✅ Part of Projects migration |
| 12 | Quotation Settings | `['area-types']`, `['job-types']`, etc. | 6 | Medium | ✅ Completed 2025-11-30 |
| 13 | NAS Health/Validation | `['nas-connection-status']`, `['project-validation-status']` | 2 | Simple | ✅ Completed 2025-11-30 |
| 14 | Form Attachments | `queryKeys.trialTrenches.attachments()` | 1 | Simple | ✅ Completed 2025-11-30 (1 fix) |
| 15 | Report Generation | `queryKeys.projects.finalReportFile()` | 3+ | Simple | ✅ Completed 2025-11-30 (already compliant) |
| 16 | Modules/Roles | N/A | N/A | N/A | ⏭️ SKIPPED - No React Query usage (architectural exception) |
| 17 | Company Emails | `['companyEmails']` | 1 | Simple | ✅ Completed 2025-11-30 |
| 18 | Merge Operations | `['merge-operations']`, `['enhanced-merge-operations']` | 2 | Medium | ✅ Completed 2025-11-30 |

**Remaining Entities**: ✅ NONE - All entities migrated!

**Bonus Supervisor Components Migration** (2025-12-01):
- SupervisorSubmissionsTable.tsx: 2 keys (`['supervisor-work-entries']` → `queryKeys.supervisorWorkEntries.byUser()`, `['supervisor-working-hours']` → `queryKeys.supervisorWorkingHours.byUser()`)
- PhotoUploadStep.tsx: 3 keys (`['nas-connection-status']` → `queryKeys.nasValidation.connectionStatus()`, `['project-validation']` → `queryKeys.nasValidation.projectStatus()`, `['trench-validation']` → `queryKeys.nasValidation.trenchStatus()`)
- BasicInfoStep.tsx: 2 keys (`['projects']` → `queryKeys.projects.list()`, `['supervisors']` → `queryKeys.supervisors.list()`)

**Central Factory Updates** (2025-12-01):
- Added `supervisorWorkEntries` section: `all`, `byUser(userId)`
- Added `supervisorWorkingHours` section: `all`, `byUser(userId)`

**Note**: Notifications system has been fully deprecated and removed from the codebase (database tables, functions, triggers, and frontend components all removed). Replaced with dashboard count badges + Sonner toast system.

</details>

---

### 📈 Progress Tracking

**Completion Rate**: 🎉 100% (34/34 entities) - MIGRATION COMPLETE!
**High Priority**: 100% (2/2 completed) - Quotations ✅, Trial Trenches / JLTT ✅
**Medium Priority**: 100% (7/7 completed) - Client Contacts ✅, Products/Services ✅, People ✅, Staff ✅, Worker OT Calculator ✅, Workers ✅, General Works ✅
**Supporting Features**: 25/25+ completed - Services ✅, Service Groups ✅, NCE Submissions ✅, Plan Purchases ✅, CDW Parts ✅, Spatial Features ✅, Salary ✅, Payslip Notes ✅, Drafter/Drawing Reviews ✅, NAS Folder Templates ✅, Clarification Requests ✅, PDF Templates ✅, Payslip Templates ✅, Quotation Settings ✅, User Approvals ✅, Audit Logs ✅, NAS Validation ✅, Worker Comments ✅, Form Attachments ✅, Report Generation ✅, Export Operations ✅, User Settings ✅, Supervisor Components ✅, Company Emails ✅, Merge Operations ✅
**All Workflow Components**: ✅ FULLY COMPLIANT - Supervisor, Coordinator, Drafter workflow components all use centralized query keys
**Architectural Exceptions**: Modules/Roles (does not use React Query - direct Supabase calls)
**Deprecated/Removed**: Notification Preferences (system replaced with dashboard counts + Sonner toasts)

**Current Status**: ✅ ALL ENTITIES MIGRATED - No remaining work required.

**Final Cleanup Session** (2025-11-30 - Late Night):
- Company Emails - Migrated useCompanyEmails.ts (removed hardcoded fallback keys, added central factory)
- Merge Operations - Migrated useMergeOperations.ts and useEnhancedMergeOperations.ts
- Deprecated Wrapper Cleanup - Updated useCompanyDetails.ts and useClientContacts.ts to use queryKeys directly
- Added `companyEmails` and `mergeOperations` (with `enhanced` sub-section) to queryKeys.ts
- Added `companies.mergeCandidates()` to queryKeys.ts
- Added `invalidateEntity` helpers for new entities

**Inline Spread Pattern Cleanup** (2025-11-30 - Final):
- useProgressClaims.ts - Added `progressClaims.withDetails(id)` to replace inline spread `[...detail(id), 'with-details']`
- useProjectClaimLineItems.ts - Added `projectClaimLineItems.stats(projectId)` to replace inline spread `[...byProject(projectId), 'stats']`
- Both patterns now use centralized factory methods - 100% compliance achieved

**Previous Migration Session** (2025-12-01):
- Export Operations - Already compliant (uses queryKeys.trialTrenches.jltt.exportData())
- Notification Preferences - ⏭️ SKIPPED (entire notification system deprecated/removed)
- User Settings - Already compliant (uses queryKeys.users.profile('current'))
- **Bonus Discovery - 7 Hardcoded Keys Found in Supervisor Components**:
  - SupervisorSubmissionsTable.tsx (2 keys)
  - PhotoUploadStep.tsx (3 keys)
  - BasicInfoStep.tsx (2 keys)
- Added `supervisorWorkEntries` and `supervisorWorkingHours` to queryKeys.ts

**Previous Migration Session** (2025-11-30):
- PDF Templates (usePDFTemplates.ts)
- Payslip Templates (PayslipTemplateManagement.tsx)
- Quotation Settings (6 components: AreaTypes, JobTypes, ClientTypes, ClientWorkTypes, PaymentTerms, JobTypeProductAssociation)
- User Approvals (UserApprovalsTab.tsx)
- Audit Logs (useAuditLogs.ts)
- NAS Validation (NASConnectionStatus.tsx, useProjectValidation.ts)
- Worker Comments (useWorkerComments.ts - already compliant)
- Form Attachments (useWorkEntryFormMutation.ts - fixed 1 hardcoded key)
- Report Generation (FinalReportSection.tsx, useJLTTExportData.ts - already compliant)

---

### 🎯 Recommended Migration Order

#### **Phase 1: Foundation** (Week 1) ✅ COMPLETED
1. ✅ Companies (DONE - 2025-01-19)
2. ✅ Projects (DONE - 2025-01-19) - Core paths migrated (11 files)
3. ✅ Client Contacts (DONE - 2025-01-19) - Migrated 4 files, expanded central factory
4. ✅ Products/Services (DONE - 2025-01-19) - Migrated 2 files, added to central factory
5. ⏸️ Dashboard Counts (simple, read-only)

#### **Phase 2: Core Business** (Week 2-3)
6. ✅ Quotations (DONE - 2025-01-19) - Migrated 7 files
7. ✅ People (DONE - 2025-01-19) - Migrated 2 files, central entity
8. ✅ Staff (DONE - 2025-01-19) - Migrated 2 files + critical bug fix in ProjectDetailPage
9. ⏸️ Workers

#### **Phase 3: Workflows** (Week 4)
10. Trial Trenches (JLTT)
11. General Works
12. Worker OT

#### **Phase 4: Supporting** (Week 5+)
13-32. Remaining entities (templates, settings, etc.)

---
