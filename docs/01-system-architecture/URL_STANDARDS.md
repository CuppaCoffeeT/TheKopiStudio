# URL Standards and Hyperlink Documentation

**Created**: 2025-09-12 08:15:00 SGT
**Last Updated**: 2026-02-26 18:00:00 SGT
**Status**: 🟢 Production  
**Priority**: 🟢 Medium  

## 📋 Overview

This document defines the URL standards and hyperlink conventions for the Trench Trace Portal application. Covers route naming, query parameter standards for list views, and notification action URLs.

## 📚 Related Documentation

- [SUPABASE_QUERY_STANDARDS.md](./SUPABASE_QUERY_STANDARDS.md) - Server-side pagination (`.range()` + `{ count: 'exact' }`)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - `TablePaginationControls` component
- [MODULE_SYSTEM.md](./MODULE_SYSTEM.md) - Module path and RBAC system

## 🎯 URL Naming Convention

### **Primary Rule: NO HYPHENS**
- ✅ **CORRECT**: `/coordinatorreview`, `/managementreview`, `/supervisormode`
- ❌ **INCORRECT**: `/coordinator-review`, `/management-review`, `/supervisor-mode`

### **Secondary Rule: Use Hyphens Only for Multi-Word Descriptions**
- ✅ **CORRECT**: `/ot-calculator`, `/drafter-dashboard`, `/payment-management`
- ❌ **INCORRECT**: `/otcalculator`, `/drafterdashboard`, `/paymentmanagement`

## 📁 Complete Route Directory — Archived

The full route snapshot has been archived to [_archive/URL_ROUTE_DIRECTORY_SNAPSHOT.md](./_archive/URL_ROUTE_DIRECTORY_SNAPSHOT.md). For the authoritative list of current routes, grep [src/App.tsx](../../src/App.tsx). This doc now carries the naming **rule** (section above) and URL state conventions (sections below) only.

## 📝 CRUD Resource Routes (RESTful Standard)

All resource modules with detail pages MUST follow this URL pattern:

### **Standard CRUD Pattern**

| Action | Pattern | Example |
|--------|---------|---------|
| List | `/resource` | `/invoices` |
| Create | `/resource/create` | `/invoices/create` |
| View | `/resource/:id` | `/invoices/123` |
| Edit | `/resource/:id/edit` | `/invoices/123/edit` |

### **Current Implementation**

| Resource | List | Create | View | Edit |
|----------|------|--------|------|------|
| Quotations | `/quotations` | `/quotations/create` | `/quotations/:id` | `/quotations/:id/edit` |
| Invoices | `/invoices` | `/invoices/create` | `/invoices/:id` | `/invoices/:id/edit` |
| Projects | `/projectlist` | `/projects/create` | `/projects/:id` | `/projects/:id/edit` |
| Companies | `/companylist` | - | `/companylist/:id` | `/companylist/:id/edit` |

### **Implementation Pattern**

Edit routes reuse the detail page component with URL-based edit detection:

```typescript
// In page component
const location = useLocation();
const isEditRoute = location.pathname.endsWith('/edit');
const [isEditMode, setIsEditMode] = useState(isEditRoute);

// Edit button navigates to /edit URL (creates bookmarkable link)
const handleEdit = () => navigate(`/resource/${id}/edit`);

// Cancel navigates back to view URL
const handleCancel = () => navigate(`/resource/${id}`);

// Save persists changes and navigates back
const handleSave = () => {
  mutation.mutate(data, {
    onSuccess: () => navigate(`/resource/${id}`)
  });
};
```

### **Benefits**

- **Bookmarkable URLs**: Users can share direct links to edit mode
- **Browser history**: Back button works correctly
- **Same component**: View and edit use the same page component
- **Consistent UX**: All modules follow the same pattern

## 🔗 Notification Action URL Standards

### **Base URL Patterns**

```typescript
// Coordinator Review URLs
'/coordinatorreview?tab={tab}&highlight={id}'
'/coordinatorreview?tab={tab}&filter={filter}&highlight={id}'

// Management Review URLs  
'/managementreview?highlight={id}'

// JLTT URLs
'/jltt?highlight={id}'

// Other specific URLs
'/ot-calculator?highlight={id}'
'/supervisor?highlight={id}'
```

### **Tab Parameters for Coordinator Review**

| Tab Value | Description | Usage |
|-----------|-------------|-------|
| `trenches` | Trial trenches | New submissions, rejections |
| `worker-ot` | Worker OT records | OT submissions, approvals |
| `clarifications` | Clarification requests | Drawing clarifications |
| `drawing-reviews` | Drawing reviews | Completed drawings |

### **Filter Parameters**

| Filter Value | Description | Usage |
|--------------|-------------|-------|
| `pending` | Pending items | Default filter |
| `approved` | Approved items | Status filter |
| `rejected` | Rejected items | Status filter |
| `management-rejected` | Management rejected | OT specific |

### **URL Examples by Workflow**

#### **Trial Trench Workflow**
```typescript
// New submission
'/coordinatorreview?tab=trenches&highlight={trench_id}'

// Assigned to drafter
'/jltt?highlight={trench_id}'

// Needs clarification
'/coordinatorreview?tab=clarifications&highlight={trench_id}'

// Drawing completed
'/coordinatorreview?tab=drawing-reviews&highlight={trench_id}'

// Final approval
'/managementreview?highlight={trench_id}'
```

#### **OT Workflow**
```typescript
// New OT submission
'/coordinatorreview?tab=worker-ot&highlight={ot_id}'

// OT approved by coordinator
'/managementreview?highlight={ot_id}'

// OT rejected
'/coordinatorreview?tab=worker-ot&highlight={ot_id}'
```

## 🔎 List View Query Parameters (MANDATORY for new list views)

**ALL new list views MUST sync filter, search, sort, and page state to URL query parameters.** This makes every filtered view shareable — copy the URL, paste it to a colleague, and they see the exact same view.

### Standard Parameter Names

| Parameter | Purpose | Format | Example |
|-----------|---------|--------|---------|
| `search` | Text search term | String | `?search=sky+tan` |
| `status` | Status filter | Comma-separated | `?status=active,on+hold` |
| `sort` | Sort column | String | `?sort=award_date` |
| `order` | Sort direction | `asc` or `desc` | `?order=desc` |
| `page` | Current page number | Integer | `?page=3` |
| `tab` | Active tab | String | `?tab=users` |

**Domain-specific filters** use descriptive names:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| `company` | Company filter | `?company=uuid1,uuid2` |
| `role` | Role filter | `?role=supervisor,drafter` |
| `project` | Project filter | `?project=uuid` |
| `from` / `to` | Date range | `?from=2026-01-01&to=2026-02-28` |

### URL Construction Rules

**1. Clean URLs — omit defaults:**
```typescript
// ✅ CORRECT - param omitted when value matches default
/projectlist                              // default sort, page 1, no search
/projectlist?search=orchard               // only non-default params shown
/projectlist?status=on+hold&page=2        // only active filters in URL

// ❌ WRONG - cluttered URL with default values
/projectlist?search=&status=active,on+hold,completed&sort=award_date&order=asc&page=1
```

**2. Multi-value params — comma-separated:**
```typescript
// ✅ CORRECT
?status=active,on+hold
?company=uuid1,uuid2

// ❌ WRONG - repeated params
?status=active&status=on+hold
```

**3. Page auto-resets when filters change:**
```typescript
// User is on page 3, then types a search → URL becomes:
/projectlist?search=orchard        // page param removed (reset to 1)

// User clicks page 2 → URL becomes:
/projectlist?search=orchard&page=2 // page only shown when > 1
```

### Standard Implementation Pattern — `useURLPagination` Hook

**ALL new list views MUST use `useURLPagination`** from `src/hooks/useURLPagination.ts`. This hook replaces manual `useSearchParams` + `updateParams` boilerplate.

Reference implementations:
- [PeopleManagement.tsx](../../src/features/people/pages/PeopleManagement.tsx) (server-side pagination + hook; post-W09 composes `<ListPageFrame>`)
- [MeetingProjectsTable.tsx](../../src/components/meeting-projects/MeetingProjectsTable.tsx) (legacy inline pattern)

```typescript
import { useURLPagination } from '@/hooks/useURLPagination';

// Configure defaults — params are omitted from URL when they match defaults (clean URLs)
const { params, setters, updateParams, resetAll, hasActiveFilters } = useURLPagination({
  sort: 'created_at',   // default sort column
  order: 'desc',         // default sort direction
  tab: 'all',            // default tab
  status: 'all',         // default status
});

// --- Read state (all derived from URL) ---
params.search      // string  — search term
params.status      // string  — status filter value
params.role        // string[] — multi-value filter (comma-separated in URL)
params.sort        // string  — sort column
params.order       // 'asc' | 'desc'
params.page        // number  — current page (≥ 1)
params.tab         // string  — active tab

// --- Setters (auto-reset page to 1, omit defaults from URL) ---
setters.setSearch('sky tan')       // → ?search=sky+tan
setters.setStatus('active')        // → ?status=active
setters.setRole(['worker','staff']) // → ?role=worker,staff
setters.setSort('name')            // → (omitted if matches default)
setters.toggleOrder()              // → ?order=desc
setters.setPage(3)                 // → ?page=3
setters.setTab('users')            // → ?tab=users
resetAll()                         // → clears all params

// --- Low-level batch update (for custom filters not covered above) ---
updateParams({ company: companyId || null, from: startDate || null });
```

#### Hook Features

| Feature | How It Works |
|---------|-------------|
| Clean URLs | Default values are omitted — `/projectlist` not `/projectlist?sort=created_at&order=desc&page=1` |
| Page auto-reset | Changing any filter automatically resets page to 1 |
| Multi-value filters | `params.role` parses `?role=worker,staff` into `['worker', 'staff']` |
| Shareable URLs | Copy URL → paste → colleague sees the exact same filtered view |
| Batch updates | `updateParams({ search: null, status: 'active' })` — one URL change |

#### UX Best Practices (MANDATORY)

These patterns prevent the "flash of loading" and search input focus loss:

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';

const { data, isLoading, isFetching } = useQuery({
  queryKey: queryKeys.entity.list({ ...params }),
  queryFn: () => entityService.getPaginated({ ...params }),
  placeholderData: keepPreviousData,  // ← keeps old data visible during refetch
});

// Only show full-page "Loading..." on initial mount — NEVER on filter changes
if (isLoading && !data) return <div>Loading...</div>;

// Use opacity fade for background refetches — don't unmount the table
<div className={`transition-opacity duration-150 ${isFetching ? 'opacity-60' : ''}`}>
  <Table>...</Table>
</div>
```

**Search input debounce**: Filter components (e.g., `PeopleFilters`) MUST use local state + 350ms debounce for search input. Never update URL on every keystroke — it causes re-renders and cursor focus loss.

### Example URLs

```
/peoplemanagement?tab=users
/peoplemanagement?tab=users&search=sky+tan
/peoplemanagement?tab=users&search=sky+tan&role=super_admin
/projectlist?status=active,on+hold&sort=award_date&order=desc&page=2
/projectlist?search=orchard&company=uuid1,uuid2
/workerlist?status=active&sort=jwp&order=asc
/invoices?from=2026-01-01&to=2026-02-28&status=pending
```

### What NOT to Put in URLs

- **Expanded/collapsed row state** → Use `localStorage` (per-user UI preference)
- **Modal open/close state** → Use `useState` (transient UI state)
- **Form input state** → Use `useState` or React Hook Form (not shareable)
- **Auth tokens or sensitive data** → Never in URLs

### Enforcement Checklist

When creating new list views:
- [ ] Uses `useURLPagination` hook (NOT raw `useSearchParams` + manual `updateParams`)
- [ ] Standard param names from table above
- [ ] Default values omitted from URL (clean URLs) — handled automatically by hook
- [ ] Multi-value filters use comma-separated format — handled automatically by `params.role`
- [ ] Page auto-resets to 1 when filters change — handled automatically by hook
- [ ] URL is shareable — copying and pasting reproduces the same view
- [ ] Combined with server-side pagination (see [SUPABASE_QUERY_STANDARDS.md](./SUPABASE_QUERY_STANDARDS.md))
- [ ] Uses `placeholderData: keepPreviousData` for smooth UX
- [ ] Search input is debounced (350ms local state) — never updates URL per keystroke
- [ ] Uses `isFetching` opacity fade, not full-page "Loading..." on filter changes

---

## 🚫 Common Mistakes to Avoid

### **1. Incorrect Hyphen Usage**
```typescript
// ❌ WRONG - Don't use hyphens for single concepts
'/coordinator-review'  // Should be '/coordinatorreview'
'/management-review'   // Should be '/managementreview'
'/supervisor-mode'     // Should be '/supervisormode'

// ✅ CORRECT - Use hyphens only for multi-word descriptions
'/ot-calculator'        // Two words: "OT" + "calculator"
'/drafter-dashboard'    // Two words: "drafter" + "dashboard"
'/payment-management'   // Two words: "payment" + "management"
```

### **2. Inconsistent Tab Names**
```typescript
// ❌ WRONG - Don't use inconsistent tab names
'/coordinatorreview?tab=rejected'     // Should be 'trenches'
'/coordinatorreview?tab=completed'    // Should be 'drawing-reviews'

// ✅ CORRECT - Use standardized tab names
'/coordinatorreview?tab=trenches'
'/coordinatorreview?tab=worker-ot'
'/coordinatorreview?tab=clarifications'
'/coordinatorreview?tab=drawing-reviews'
```

### **3. Missing Parameters**
```typescript
// ❌ WRONG - Missing highlight parameter
'/coordinatorreview?tab=trenches'

// ✅ CORRECT - Include highlight parameter
'/coordinatorreview?tab=trenches&highlight={id}'
```

## 📝 Development Guidelines

### **Before Creating New Routes**

1. **Check this document** for existing patterns
2. **Follow the naming convention**: No hyphens for single concepts
3. **Use hyphens only** for multi-word descriptions
4. **Test the route** in the browser to ensure it works
5. **Update this document** if adding new routes
6. **Update MODULE_SYSTEM.md** if creating new modules

### **Module Creation URL Compliance Checklist**

When creating new modules, ensure:

- [ ] **Read URL_STANDARDS.md** before choosing module path
- [ ] **Module path follows naming convention** (no hyphens for single concepts)
- [ ] **Database migration uses compliant path**
- [ ] **App.tsx route matches module path exactly**
- [ ] **All navigation links use compliant URLs**
- [ ] **Legacy routes added** for backward compatibility if needed
- [ ] **URL_STANDARDS.md updated** with new route
- [ ] **MODULE_SYSTEM.md references** URL standards compliance

### **Before Creating Notification URLs**

1. **Use the correct base URL** from the table above
2. **Include the `highlight` parameter** with the record ID
3. **Use the correct tab name** for coordinator review
4. **Test the URL** by manually navigating to it
5. **Verify the target page** handles the highlight parameter

### **URL Validation Checklist**

- [ ] Route follows naming convention (no hyphens for single concepts)
- [ ] URL includes all required parameters
- [ ] Tab names match the standardized list
- [ ] URL has been tested in browser
- [ ] Target page handles URL parameters correctly
- [ ] URL is documented in this file

## 🔄 Migration and Updates

### **When Updating Existing URLs**

1. **Create a migration** to update database records
2. **Update frontend code** to use new URLs
3. **Test thoroughly** to ensure no broken links
4. **Update this document** with any changes

### **Example Migration**
```sql
-- Update incorrect URLs in notifications
UPDATE public.notifications 
SET action_url = REPLACE(action_url, '/coordinator-review', '/coordinatorreview')
WHERE action_url LIKE '%/coordinator-review%';
```

## 📚 Related Documentation

- [Notification System](../_archive/05-implementation/active/NOTIFICATION_SYSTEM.md) - Detailed notification workflow (archived)
- [Database Migration Protocol](../.cursor/config.json) - Migration standards
- [Design System](./DESIGN_SYSTEM.md) - UI/UX standards

## 🎯 Quick Reference

### **Most Common URLs**
```typescript
// Coordinator Review
'/coordinatorreview?tab=trenches&highlight={id}'
'/coordinatorreview?tab=worker-ot&highlight={id}'
'/coordinatorreview?tab=clarifications&highlight={id}'
'/coordinatorreview?tab=drawing-reviews&highlight={id}'

// Management Review
'/managementreview?highlight={id}'

// JLTT
'/jltt?highlight={id}'
```

### **Naming Rules**
- **Single concept**: No hyphens (`coordinatorreview`, `managementreview`)
- **Multi-word**: Use hyphens (`ot-calculator`, `drafter-dashboard`)
- **Acronyms**: No hyphens (`jltt`, `ot`)

---

**Last Updated**: August 3, 2025  
**Version**: 1.0  
**Maintainer**: Development Team 