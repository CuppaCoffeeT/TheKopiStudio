# Utils — Shared Primitive Root

Pure helper functions: timezone, query keys, formatters, generators, validators. One of four shared primitive roots (X5).

## Scope

**Belongs**: pure functions (no React hooks, no JSX — except `enhancedToastHelper.tsx`); cross-cutting helpers; PDF/Excel generators; jinja2 validators.
**Doesn't**: hooks (`src/hooks/`); components (`src/components/`); API calls (`src/services/`). shadcn `cn` lives in `src/lib/utils.ts`.

## Navigation

| Category | Files |
|----------|-------|
| **Time** | `timezoneUtils` (sole sanctioned date wrapper) |
| **React Query** | `queryKeys` (centralized factory — extend, don't bypass) |
| **Toast** | `toastHelper`, `enhancedToastHelper.tsx` |
| **Formatting** | `currencyHelper`, `numberFormatter*`, `areaFormatter`, `textTruncation`, `trialTrenchDisplayFormatter` |
| **Status / badges** | `generalWorksStatusBadge.tsx`, `serviceColorMap`, `serviceTypeMapping` |
| **PDF / Excel** | `clientPdfGenerator`, `payslip*Generator`, `progressClaimPdfGenerator`, `*ExcelExport`, `otCalculatorExport` |
| **Templates** | `jinja2*`, `docxJinja2Validator`, `createPayslipTemplate` |
| **Domain compute** | `otCalculations`, `incompleteMonthCalculator`, `payslipRate*`, `payslipStatusChecker`, `nceCompute`, `planPurchaseCompute`, `cdwProjectProgress`, `conductScore` |
| **Helpers** | `cdwPartHelpers`, `planPurchaseHelpers`, `dashboardHelpers`, `interactionConstants`, `searchHelpers`, `permissionUtils` |
| **Files / Auth / DB** | `fileRenameUtils`, `resumableUpload`, `nasDebugHelper`, `authStorage`, `auditHelper`, `databaseErrorHandler` |

## Before working here

- **Naming**: `camelCase.ts`. Pure modules — no import-time side effects.
- **Time**: every new date helper extends `timezoneUtils.ts`. Never reach for raw `date-fns` (rule: timezone).
- **Query keys**: extend `queryKeys.ts` rather than inlining keys (W21-1 migrated 28 files to the factory).
- **Toast**: only `toastHelper.ts` may import sonner directly.
- **Formatters**: pure — strings in, strings out. No React Query, no fetch.
- **Generators**: PDF/Excel are heavy (jspdf, exceljs); keep them lazy-loaded by callers.
- **Compute helpers**: unit-test domain math (OT, payroll, NCE, plan-purchase) — correctness-critical.

## 📚 Related

- [src/CONTEXT.md](../CONTEXT.md) · [.claude/rules/timezone.md](../../.claude/rules/timezone.md) · [.claude/rules/toast-system.md](../../.claude/rules/toast-system.md) · [.claude/rules/react-query.md](../../.claude/rules/react-query.md)
- [docs/01-system-architecture/TIMEZONE_POLICY.md](../../docs/01-system-architecture/TIMEZONE_POLICY.md)
