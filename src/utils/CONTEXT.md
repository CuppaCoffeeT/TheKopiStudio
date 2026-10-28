# Utils — Shared Primitive Root

Pure helper functions: timezone, query keys, toast, formatting. One of four shared primitive roots (X5).

## Scope

**Belongs**: pure functions (no React hooks, no JSX — except `toastHelper.tsx`); cross-cutting helpers.
**Doesn't**: hooks (`src/hooks/`); components (`src/components/`); API calls (`src/services/`). shadcn `cn` lives in `src/lib/utils.ts`.

## Navigation

| Category | Files |
|----------|-------|
| **Time** | `timezoneUtils` (sole sanctioned date wrapper) |
| **React Query** | `queryKeys` (centralized factory — extend, don't bypass) |
| **Toast** | `toastHelper.tsx` (`showSuccess` · `showError` · `showInfo` · `showWarning` · `showEnhancedToast`) |
| **Formatting** | `currencyHelper` |
| **Helpers** | `dashboardHelpers`, `authStorage`, `suppressExtensionErrors` |

Deleted 2026-10-28 as unused: `databaseErrorHandler`, `resumableUpload`, `threadDateFormat`, `numberFormatter`, `textTruncation` ([DEPRECATIONS.md](../../docs/99-refactor/_system/DEPRECATIONS.md)). The other AppBase-era helpers once listed here left in earlier cleanups.

## Before working here

- **Naming**: `camelCase.ts`. Pure modules — no import-time side effects.
- **Time**: every new date helper extends `timezoneUtils.ts`. Never reach for raw `date-fns` (rule: timezone).
- **Query keys**: extend `queryKeys/index.ts` rather than inlining keys (W21-1 migrated 28 files to the factory).
- **Toast**: only `toastHelper.tsx` may import sonner directly.
- **Formatters**: pure — strings in, strings out. No React Query, no fetch.

## 📚 Related

- [src/CONTEXT.md](../CONTEXT.md) · [.claude/rules/timezone.md](../../.claude/rules/timezone.md) · [.claude/rules/toast-system.md](../../.claude/rules/toast-system.md) · [.claude/rules/react-query.md](../../.claude/rules/react-query.md)
- [docs/01-system-architecture/TIMEZONE_POLICY.md](../../docs/01-system-architecture/TIMEZONE_POLICY.md)
