# Client Profiles Module

**Created**: 2026-04-26 18:00:00 SGT
**Last Updated**: 2026-04-26 18:00:00 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

`/clientprofiles` is the cross-company directory of client contacts (people who work at client companies). The module pairs:

| Route | Component | Archetype | Source |
|---|---|---|---|
| `/clientprofiles` | `ClientProfilesList` | list | [src/features/clientprofiles/pages/ClientProfilesList.tsx](../../src/features/clientprofiles/pages/ClientProfilesList.tsx) |
| `/clientprofiles/:id` | `ContactDetail` | detail | [src/features/clientprofiles/pages/ContactDetail.tsx](../../src/features/clientprofiles/pages/ContactDetail.tsx) |

Domain tables: `client_contacts` ↔ `people` (1-1 via `person_id`) ↔ `client_companies` (N-1 via `company_id`). Contact roles via `contact_roles`.

W09 migration #18 landed both pages on 2026-04-26 — see [docs/99-refactor/_system/design/pages/clientprofiles/MIGRATION_PLAN.md](../99-refactor/_system/design/pages/clientprofiles/MIGRATION_PLAN.md) and [DESIGN_CATALOG.md](../99-refactor/_system/DESIGN_CATALOG.md) W09 #18 row.

## Workflows

| WF ID | Workflow | Status |
|---|---|---|
| WF-0004 / WF-0213 | Add Contact (with duplicate-detection branch + DB verify + hard-delete cleanup) | ✅ tested |
| WF-0201 | Search filter narrows list (350ms debounce → URL `?search=`) | ✅ |
| WF-0202..WF-0207 | Sort by Contact / Company / Position / Email / Status / Created columns (URL `?sort=&order=`) | ✅ desktop · ⏭ mobile (TableHeader hidden on <md) |
| WF-0208 | Filter Active Only toggle (FilterPill `aria-pressed`) | ✅ |
| WF-0209 | Filter Mailing List Only toggle | ✅ |
| WF-0210 | Filter by Company combobox (FilterDropdown + SearchableMultiSelect) | ✅ |
| WF-0211 | Export contacts | dropped — toast stub had no real export; removed from UI |
| WF-0212 | Row click → contact detail | ✅ desktop + mobile (MobileListCard testid) |
| WF-0214 | Transfer contact to another company | detail-page primitive (ContactTransferModal) |
| WF-0215 | Deactivate contact | detail-page primitive (DestructiveConfirmDialog tier 1) |
| WF-0200 | Back to Dashboard | dropped — breadcrumb owns back nav (anti-pattern #11) |

## Compliance

- **Cross-module bubble**: `useClientContacts` mutations call `invalidateEntity.clientContacts(qc) + invalidateDashboards(qc)` exclusively. Adding a contact from any caller (companies / quotation / project-management / engineer-dashboard / clientprofiles itself) refreshes every list view + dashboard count.
- **Primitive coverage** (W09 compliance #6): 6a/6c/6d/6e all return zero. 6b returns 2 documented multi-feature shared imports — see [src/features/clientprofiles/lib/NOTES.md](../../src/features/clientprofiles/lib/NOTES.md).
- **Server-side pagination**: `usePaginatedClientContacts` → `ClientContactsService.getPaginated` (100/page, `.range()` + `{ count: 'exact' }`).
- **URL state**: list uses `useURLPagination` for search/sort/order/page/tab(company)/mailing.

## Deferred legacy

Two cross-feature shared components are imported from `@/components/client-management/contacts/`:

| File | Why kept | Absorbed by |
|---|---|---|
| `ContactForm.tsx` | 6 cross-feature callers — multi-feature shared CRUD form | future W08 form session |
| `DuplicateContactDialog.tsx` | 4 cross-feature callers — paired with ContactForm | future W08 form session |

Same pattern as `features/companies/pages/CompanyDetail.tsx` lines 32–33. Recorded in feature `lib/NOTES.md`.

## 📚 Related Documentation

- [docs/01-system-architecture/PEOPLE_SYSTEM.md](../01-system-architecture/PEOPLE_SYSTEM.md) — `people` table is 1-1 partner of `client_contacts`
- [docs/03-features/personnel/PEOPLE_MANAGEMENT_MODULE.md](personnel/PEOPLE_MANAGEMENT_MODULE.md) — sister module for staff (vs. clients)
- [docs/01-system-architecture/MODULE_SYSTEM.md](../01-system-architecture/MODULE_SYSTEM.md) — module-based RBAC
- [docs/99-refactor/_system/design/pages/clientprofiles/MIGRATION_PLAN.md](../99-refactor/_system/design/pages/clientprofiles/MIGRATION_PLAN.md) — W09 mapping
- [src/features/clientprofiles/CONTEXT.md](../../src/features/clientprofiles/CONTEXT.md) — feature folder navigation
- [src/features/clientprofiles/lib/NOTES.md](../../src/features/clientprofiles/lib/NOTES.md) — deferred legacy register
