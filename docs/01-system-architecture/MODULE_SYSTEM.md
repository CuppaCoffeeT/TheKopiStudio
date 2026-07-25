# Module System Documentation

**Created**: 2025-09-12 08:15:00 SGT  
**Last Updated**: 2026-07-25 SGT — frame-primitive note: launcher atoms retired, `KpiIndexCard` named  
**Status**: 🟢 Production  
**Priority**: 🔴 Critical  

## 📋 Overview

The AppBase Trench Trace Portal uses a comprehensive Role-Based Access Control (RBAC) system for managing module permissions. This system allows fine-grained control over which users can access specific features of the application.

## 📚 Related Documentation
- [DATABASE_POLICY.md](./DATABASE_POLICY.md) - Application-level security approach and minimal RLS standards
- [DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md](../02-security/DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md) - Critical security requirements for modules
- [URL_STANDARDS.md](./URL_STANDARDS.md) - **MANDATORY** Route naming conventions for module paths
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - UI/UX standards for module headers and components
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - Complete system documentation index

## Architecture

### Database Tables

#### 1. `public.modules`
Stores all available system modules/features.

```sql
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                    -- Display name (e.g., "Supervisor Dashboard")
  description text NOT NULL,             -- Description for admin panel
  icon_name text NOT NULL,               -- Lucide React icon name
  path text NOT NULL UNIQUE,             -- Route path (e.g., "/supervisordashboard") - MUST follow URL_STANDARDS.md
  category text NOT NULL DEFAULT 'general', -- Grouping category
  sort_order integer NOT NULL DEFAULT 0, -- Display order
  is_active boolean NOT NULL DEFAULT true, -- Enable/disable module
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### 2. `public.role_modules` 
Default role-based permissions for modules.

```sql
CREATE TABLE public.role_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL REFERENCES public.roles(name), -- FK to roles table (was user_role enum pre-2026)
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_granted boolean NOT NULL DEFAULT true, -- Permission granted/denied
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, module_id)
);
```

**Note**: `role_modules.role` is a `text` column with a foreign key to `public.roles(name)`. The legacy `user_role` enum has been replaced by the dynamic `public.roles` table — query it live via Supabase MCP for the current role set.

#### 3. `public.user_modules`
Individual user permission overrides.

```sql
CREATE TABLE public.user_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_granted boolean NOT NULL,           -- Override permission
  granted_by uuid REFERENCES public.users(id), -- Who granted the override
  granted_at timestamptz NOT NULL DEFAULT now(),
  notes text,                            -- Optional notes
  UNIQUE(user_id, module_id)
);
```

## User Roles

Roles are stored in the dynamic `public.roles` table (no longer a hardcoded `user_role` enum). The set of roles changes over time, so **do not rely on a hardcoded list here** — query the live table via Supabase MCP (project `your-project-ref`):

```sql
SELECT name, display_name FROM public.roles ORDER BY name;
```

`role_modules.role` references `public.roles(name)`, and `get_user_modules()` resolves a user's accessible modules from their role plus per-user overrides.



## Module Categories

Modules are organized into logical categories:

| Category | Purpose | Examples |
|----------|---------|----------|
| `admin` | System administration | Admin Dashboard |
| `management` | Business management | Company/Project/Worker Management |
| `operations` | Daily operations | Supervisor Mode, JLTT |
| `reviews` | Approval workflows | Coordinator/Management Review |
| `reports` | Analytics and reporting | Reports, OT Calculator |

## Permission Resolution

The system uses a hierarchical permission model:

1. **Role-based defaults** from `role_modules` table
2. **User-specific overrides** from `user_modules` table (takes precedence)
3. **Final permission** = Override OR Default

### Permission Query Function

```sql
-- Get user's accessible modules
SELECT * FROM public.get_user_modules(user_id);
```

This function returns only modules the user can access, considering both role defaults and individual overrides.

## Module Page Shell

### Frame primitives (use these)

New and migrated module pages MUST use the page-shell **frame primitives**. Pick by archetype:

| Archetype | Frame primitive | Import from |
|-----------|-----------------|-------------|
| Tool / dashboard / settings / generic page | `AppHeaderShell` | `@/components/primitives/shell` |
| Detail page (single record) | `DetailPageFrame` | `@/components/primitives/detail` |
| List / table page | `ListPageFrame` | `@/components/primitives/ui` |

`AppHeaderShell` bundles the app header + impersonation banner + page-bg backdrop + content frame + title/description block, and internalises the `ViewAsSelector` + `NotificationsBell` slot fillers via the `useViewAs` / `useNotificationsBell` connector hooks. The dashboard header + tile atoms (`GreetingHeader`, `AttentionHeader`, `KpiIndexCard`) live in `@/components/primitives/dashboard`. `ModuleCard`, `CategoryHeader` and `ModuleSearch` were **deleted 2026-07-25** with the module-launcher grid — module navigation is the sidebar rail plus the ⌘K `CommandPalette`. See [DEPRECATIONS.md](../99-refactor/_system/DEPRECATIONS.md).

```tsx
import { AppHeaderShell } from '@/components/primitives/shell';

const ModulePage = () => {
  return (
    <AppHeaderShell
      title="Module Name"
      description="Brief description of module purpose"
    >
      {/* Module content goes here */}
      <div className="space-y-6">
        {/* Your module components */}
      </div>
    </AppHeaderShell>
  );
};
```

See [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) for the full frame-primitive prop API.

### Header Usage Patterns

All examples use `AppHeaderShell` from `@/components/primitives/shell` (swap for `DetailPageFrame` / `ListPageFrame` per archetype above).

#### 1. Standard Module (Default Dashboard Back)
```tsx
<AppHeaderShell
  title="Worker Management"
  description="Manage worker information and assignments"
>
  {/* Content */}
</AppHeaderShell>
```

#### 2. Module With Custom Back Path
```tsx
<AppHeaderShell
  title="Company Management"
  description="Manage client companies and their information"
  backPath="/companylist"
  backLabel="Back to Companies"
>
  {/* Content */}
</AppHeaderShell>
```

#### 3. Full-Width Module (Tables/Data)
```tsx
<AppHeaderShell
  title="JL Trial Trench (JLTT)"
  description="Manage trial trench projects and submissions"
  fullWidth
>
  {/* Wide table content */}
</AppHeaderShell>
```

#### 4. No Back Button (Dashboard-like Pages)
```tsx
<AppHeaderShell
  title="OT Calculator"
  description="Comprehensive overtime calculation and analysis"
  showBack={false}
  fullWidth
>
  {/* Calculator content */}
</AppHeaderShell>
```

### User Information Display

The header automatically displays:
- **User Name**: Profile name or email fallback
- **User Role**: Formatted role (e.g., "Super Admin", "Management")
- **Logout Button**: Consistent logout functionality

### Responsive Behavior

The header is fully responsive:
- **Desktop**: Horizontal layout with user info on right
- **Mobile**: Stacked layout with optimized spacing
- **Container Width**: Respects `fullWidth` prop for content layout

### Background and Styling

All modules use consistent background styling:
```css
/* Applied by the frame primitive (AppHeaderShell / DetailPageFrame / ListPageFrame) */
.min-h-screen.bg-gray-50 {
  /* Light gray background */
}
```

## Adding New Modules

### Step 1: Database Migration

Create a migration file following the naming convention:
`YYYYMMDD_HHMMSS_module_name_integration.sql` (timestamp + underscore-separated description, per [migrations rule](../../.claude/rules/migrations.md))

**⚠️ CRITICAL: Module Path URL Standards**

**BEFORE creating the module path, you MUST:**
1. **Read [URL_STANDARDS.md](./URL_STANDARDS.md)** for path naming rules
2. **Follow the URL naming convention**: No hyphens for single concepts
3. **Use hyphens ONLY for multi-word descriptions** (e.g., `/ot-calculator`, `/drafter-dashboard`)

**Examples:**
- ✅ **CORRECT**: `/clientprofiles`, `/generalworks`, `/supervisordashboard`
- ❌ **INCORRECT**: `/client-profiles`, `/general-works`, `/supervisor-dashboard`

```sql
-- Migration: Add [Module Name] module
-- Date: YYYY-MM-DD  
-- Purpose: Add new module with proper permissions

-- =====================================================
-- MODULE INTEGRATION
-- =====================================================

-- Add module to modules table
-- ⚠️ CRITICAL: Module path MUST follow URL_STANDARDS.md conventions
INSERT INTO public.modules (name, path, description, icon_name, sort_order, is_active, category)
VALUES ('Module Name', '/modulepath', 'Module description', 'IconName', 99, true, 'category')
ON CONFLICT (path) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category;

-- Grant permissions to appropriate roles
DO $$
DECLARE
  module_id uuid;
BEGIN
  -- Get the module ID (use URL standards compliant path)
  SELECT id INTO module_id FROM public.modules WHERE path = '/modulepath';
  
  IF module_id IS NOT NULL THEN
    -- Grant to super_admin (always)
    INSERT INTO public.role_modules (role, module_id, is_granted)
    VALUES ('super_admin', module_id, true)
    ON CONFLICT (role, module_id) DO UPDATE SET is_granted = true;
    
    -- Grant to specific roles as needed
    INSERT INTO public.role_modules (role, module_id, is_granted)
    VALUES ('management', module_id, true)
    ON CONFLICT (role, module_id) DO UPDATE SET is_granted = true;
    
    -- Explicitly deny to roles that shouldn't have access
    INSERT INTO public.role_modules (role, module_id, is_granted)
    VALUES ('supervisor', module_id, false)
    ON CONFLICT (role, module_id) DO UPDATE SET is_granted = false;
    
    RAISE NOTICE '[Module Name] permissions configured successfully';
  ELSE
    RAISE EXCEPTION 'Failed to find [Module Name] module';
  END IF;
END $$;
```

### Step 2: Frontend Integration

#### Add Route to App.tsx

**⚠️ CRITICAL: Route Path Must Match Module Path**

The route path MUST exactly match the module path from the database and follow [URL_STANDARDS.md](./URL_STANDARDS.md) conventions.

```tsx
import ModuleComponent from '@/features/modulename/pages/ModuleComponent';

// Add to router configuration
// ⚠️ Path MUST match database module path and follow URL standards
{
  path: "/modulepath",  // NO hyphens for single concepts
  element: <ModuleComponent />,
}

// Optional: Add legacy route for backward compatibility
{
  path: "/module-path",  // Old non-compliant path
  element: <ModuleComponent />,
}
```

#### Icon Requirements

- Use **Lucide React** icon names only
- Icon must exist in the library (check: https://lucide.dev/icons/)
- Use PascalCase naming (e.g., `Monitor`, `Settings`, `Users`, `FileText`)
- **Common icons**: `FileText`, `Settings`, `Users`, `Monitor`, `Briefcase`, `Calculator`

#### URL Standards Compliance

**🚨 MANDATORY: All module paths MUST follow [URL_STANDARDS.md](./URL_STANDARDS.md)**

**URL Naming Rules:**
- **Single concepts**: NO hyphens (e.g., `/clientprofiles`, `/generalworks`, `/supervisordashboard`)
- **Multi-word descriptions**: Use hyphens (e.g., `/ot-calculator`, `/drafter-dashboard`)
- **Acronyms**: NO hyphens (e.g., `/jltt`, `/ot`)

**Examples:**
```sql
-- ✅ CORRECT: Single concept paths
INSERT INTO public.modules (name, path, ...) VALUES ('Client Profiles', '/clientprofiles', ...);
INSERT INTO public.modules (name, path, ...) VALUES ('General Works', '/generalworks', ...);
INSERT INTO public.modules (name, path, ...) VALUES ('Supervisor Dashboard', '/supervisordashboard', ...);

-- ✅ CORRECT: Multi-word paths  
INSERT INTO public.modules (name, path, ...) VALUES ('OT Calculator', '/ot-calculator', ...);
INSERT INTO public.modules (name, path, ...) VALUES ('Drafter Dashboard', '/drafter-dashboard', ...);

-- ❌ INCORRECT: Hyphens in single concepts
INSERT INTO public.modules (name, path, ...) VALUES ('Client Profiles', '/client-profiles', ...);
INSERT INTO public.modules (name, path, ...) VALUES ('General Works', '/general-works', ...);
```

**Validation Checklist:**
- [ ] Module path follows URL_STANDARDS.md naming convention
- [ ] App.tsx route exactly matches module path
- [ ] Navigation links use compliant URLs
- [ ] Legacy routes added for backward compatibility if needed

### Step 3: Testing Checklist

- [ ] Module appears in Admin Dashboard → Role-Based Module Permissions
- [ ] Correct roles can see the module in their dashboard
- [ ] Restricted roles cannot access the module
- [ ] Module is properly categorized and sorted
- [ ] Icon displays correctly
- [ ] Route works and component loads

## 🚨 **CRITICAL: Module Routing Checklist**

**This checklist prevents the common 404 "Page not found" error when creating new modules.**

### **Pre-Implementation Checklist**

#### **1. Component Export Verification**
- [ ] **Component exists**: Verify the page component file exists in correct location
- [ ] **Default export**: Ensure component uses `export default ComponentName`
- [ ] **No syntax errors**: Run linter check on component file
- [ ] **All imports valid**: Verify all imported components/hooks exist and are properly exported

#### **2. Import Statement Verification**
- [ ] **Correct import path**: Verify import path matches file location
- [ ] **Named vs Default exports**: Check if components use `export default` or `export { Component }`
- [ ] **Import syntax**: Use correct syntax:
  ```tsx
  // For default exports
  import ComponentName from '@/path/to/Component';
  
  // For named exports  
  import { ComponentName } from '@/path/to/Component';
  ```

#### **3. App.tsx Integration**
- [ ] **Import statement added**: Component imported at top of App.tsx
- [ ] **Route object added**: Route added to router configuration array
- [ ] **Route order correct**: Specific routes before catch-all `*` route
- [ ] **Path matches module**: Route path matches module path in database

#### **4. Route Configuration Pattern**
```tsx
// ✅ CORRECT: Specific route before catch-all
{
  path: "/client-profiles",
  element: <ClientProfilesPage />,
},
{
  path: "/client-profiles/:id", 
  element: <ContactDetailView />,
},
// ... other specific routes ...
{
  path: "*",  // Catch-all route LAST
  element: <NotFound />,
}
```

### **Common Import/Export Issues**

#### **Issue 1: Wrong Import Syntax**
```tsx
// ❌ WRONG: Named import for default export
import { ClientProfilesList } from '@/features/clientprofiles/pages/ClientProfilesList';

// ✅ CORRECT: Default import for default export  
import ClientProfilesList from '@/features/clientprofiles/pages/ClientProfilesList';
```

#### **Issue 2: Missing Component Dependencies**
```tsx
// ❌ WRONG: Importing non-existent hook
import { useClientCompanies } from '@/hooks/useCompanyDetails';

// ✅ CORRECT: Import from correct file
import { useClientCompanies } from '@/hooks/useClientCompanies';
```

#### **Issue 3: Route Order Problems**
```tsx
// ❌ WRONG: Catch-all route before specific routes
{
  path: "*",
  element: <NotFound />,
},
{
  path: "/client-profiles",  // This will never be reached!
  element: <ClientProfilesPage />,
}

// ✅ CORRECT: Specific routes before catch-all
{
  path: "/client-profiles",
  element: <ClientProfilesPage />,
},
{
  path: "*",
  element: <NotFound />,
}
```

### **Debugging Steps for 404 Errors**

#### **Step 1: Verify Route Registration**
```tsx
// Check if route exists in App.tsx
console.log('Looking for route:', window.location.pathname);
// Should match a route in the router configuration
```

#### **Step 2: Check Component Loading**
```tsx
// Temporarily replace complex component with simple test
{
  path: "/client-profiles",
  element: <div>Test: Route Working</div>,  // Simple test first
}
```

#### **Step 3: Verify Import Chain**
```tsx
// Check each import in the component file
import ComponentName from '@/path/to/Component';  // Does this file exist?
// Check if ComponentName is exported from that file
```

#### **Step 4: Check Console Errors**
- Open browser DevTools → Console
- Look for JavaScript errors that prevent component loading
- Common errors: "Cannot resolve module", "Component is not defined"

### **Complete Module Creation Checklist**

#### **Phase 1: Database Setup**
- [ ] Migration file created with correct timestamp
- [ ] Module inserted into `public.modules` table
- [ ] Role permissions configured in `public.role_modules`
- [ ] Migration executed successfully (no errors)

#### **Phase 2: Component Development**
- [ ] Page component created in correct directory
- [ ] Component uses `export default ComponentName`
- [ ] All imported dependencies exist and are properly exported
- [ ] Component passes linting checks
- [ ] Component renders without JavaScript errors

#### **Phase 3: Routing Integration**
- [ ] Component imported in `App.tsx`
- [ ] Route object added to router configuration
- [ ] Route path matches module path exactly
- [ ] Route placed before catch-all `*` route
- [ ] No duplicate route paths

#### **Phase 4: Navigation Integration**
- [ ] Module surfaced on the dashboard module grid (auto-filtered by `get_user_modules()`)
- [ ] Correct icon imported and used
- [ ] Role-based visibility implemented (via `role_modules` / `user_modules`, not hardcoded roles)
- [ ] Module appears for authorized users only

#### **Phase 5: Testing & Verification**
- [ ] Route accessible via direct URL navigation
- [ ] Route accessible via navigation menu
- [ ] Component loads without errors
- [ ] All functionality works as expected
- [ ] Role-based access control working
- [ ] Mobile responsive design verified

### **Emergency Fix for 404 Errors**

If you get a 404 error after creating a module:

1. **Check route order in App.tsx** - ensure specific routes come before `*`
2. **Verify component import** - check import statement syntax
3. **Test with simple component** - replace complex component with `<div>Test</div>`
4. **Check console errors** - look for JavaScript errors preventing load
5. **Verify file exists** - ensure component file exists and is properly exported
6. **Check import dependencies** - verify all imported components/hooks exist

### **Prevention Best Practices**

1. **Always test with simple component first** before adding complex functionality
2. **Use consistent import/export patterns** throughout the project
3. **Place specific routes before catch-all** in router configuration
4. **Run linting checks** before testing routes
5. **Check console for errors** when debugging 404 issues
6. **Verify all dependencies exist** before importing them

## 🚨 **CRITICAL: Common Routing Errors**

> **Historical note (kept intentionally — debugging history)**: the examples below were written against the legacy `DashboardHeader` wrapper and the now-removed `AdminNavigation` tab component. Both were retired by the W09 primitive migration — new code uses the **frame primitives** (`AppHeaderShell` / `DetailPageFrame` / `ListPageFrame`) and the dashboard module grid for navigation. The **routing lessons themselves remain valid** (e.g. `/admin-dashboard` is not a real route — use `/dashboard`). Read the component names as illustrative of the anti-pattern, not as current imports.

### **Invalid Route: /admin-dashboard**

**❌ WRONG**: `/admin-dashboard` is **NOT** a valid route in this application.

**✅ CORRECT**: The main dashboard route is `/dashboard`

#### **Common Error Pattern**
```tsx
// ❌ WRONG: This will cause 404 errors
<DashboardHeader 
  backPath="/admin-dashboard"
  backLabel="Back to Admin Dashboard"
>
```

```tsx
// ✅ CORRECT: Use the actual dashboard route
<DashboardHeader 
  backPath="/dashboard"
  backLabel="Back to Dashboard"
>
```

### **Back Button Navigation Standards**

#### **Rule: Back Button Goes to Previous Logical Page**

1. **Module Pages** → Back to `/dashboard`
2. **Detail Pages** → Back to list page (e.g., `/companylist/:id` → `/companylist`)
3. **Sub-modules** → Back to parent module

#### **Correct Back Navigation Examples**

```tsx
// ✅ Company List → Dashboard
<DashboardHeader 
  title="Companies"
  backPath="/dashboard"
  backLabel="Back to Dashboard"
>

// ✅ Company Detail → Company List
<DashboardHeader 
  title="Company Details"
  backPath="/companylist"
  backLabel="Back to Companies"
>

// ✅ Client Profiles → Dashboard
<DashboardHeader 
  title="Client Profiles"
  backPath="/dashboard"
  backLabel="Back to Dashboard"
>
```

### **Admin Navigation Tab Issues**

#### **❌ Problem: Unnecessary Admin Navigation on Non-Admin Pages**

**Issue**: Adding `AdminNavigation` component to pages that don't need tabbed navigation creates confusion and cluttered UI.

```tsx
// ❌ WRONG: Don't add AdminNavigation to specialized modules
const ClientProfilesPage = () => {
  return (
    <DashboardHeader title="Client Profiles">
      <AdminNavigation userRole={user.role} />  {/* ❌ UNNECESSARY */}
      {/* This creates confusing tabs like "Projects", "Workers", etc. */}
    </DashboardHeader>
  );
};
```

#### **✅ Solution: Only Use AdminNavigation for True Admin Pages**

**Rule**: `AdminNavigation` should **ONLY** be used for pages that are part of the core admin management system.

```tsx
// ✅ CORRECT: Specialized modules don't need AdminNavigation
const ClientProfilesPage = () => {
  return (
    <DashboardHeader title="Client Profiles">
      {/* No AdminNavigation - this is a specialized module */}
    </DashboardHeader>
  );
};
```

> **2026-04-26 update**: `/admin` (SuperAdminDashboard) was deleted. User/people administration lives entirely on `/peoplemanagement`. Treat `/admin*` paths as removed.

#### **When to Use AdminNavigation**

| Page Type | Use AdminNavigation? | Reason |
|-----------|---------------------|---------|
| `/peoplemanagement` | ✅ Yes | User/people administration hub (post-2026-04-26) |
| `/companylist` | ✅ Yes | Part of admin suite |
| `/client-profiles` | ❌ No | Specialized module |
| `/jltt` | ❌ No | Specialized module |
| `/ot-calculator` | ❌ No | Specialized module |
| `/quotations` | ❌ No | Specialized module |

### **Route Validation Checklist**

#### **Before Implementing Any Module**

- [ ] **Verify target route exists** in `App.tsx`
- [ ] **Use correct dashboard route** (`/dashboard`, not `/admin-dashboard`)
- [ ] **Set appropriate back navigation** (logical parent page)
- [ ] **Only add AdminNavigation** to core admin pages
- [ ] **Test navigation flow** (forward and back)

#### **Common Route Patterns**

```tsx
// ✅ STANDARD PATTERNS
"/dashboard"           // Main dashboard
"/companylist"         // Company management
"/companylist/:id"     // Company details
"/client-profiles"     // Client profiles module
"/client-profiles/:id" // Individual contact
"/jltt"               // JLTT module
"/quotations"         // Quotation module
"/ot-calculator"      // OT calculator

// ❌ INVALID ROUTES (will cause 404)
"/admin-dashboard"    // Does not exist
"/admin"              // Removed 2026-04-26 — use /peoplemanagement
"/super-admin"        // Removed 2026-04-26 — use /peoplemanagement
"/admin/companies"    // Use /companylist instead
```

### **Emergency Fixes for Common Issues**

#### **Fix 1: 404 on Back Button**
```tsx
// Problem: backPath="/admin-dashboard" causes 404
// Solution: Change to valid route
<DashboardHeader 
  backPath="/dashboard"  // ✅ Valid route
  backLabel="Back to Dashboard"
>
```

#### **Fix 2: Confusing Admin Navigation**
```tsx
// Problem: AdminNavigation on specialized pages
// Solution: Remove AdminNavigation from non-admin modules
const SpecializedPage = () => (
  <DashboardHeader title="Specialized Module">
    {/* Remove AdminNavigation from here */}
  </DashboardHeader>
);
```

#### **Fix 3: Route Not Found**
1. Check if route exists in `App.tsx`
2. Verify component is properly imported
3. Ensure route path matches exactly
4. Test with simple component first

### **Prevention Guidelines**

1. **Always verify routes exist** before using them in navigation
2. **Use `/dashboard` as main hub**, not `/admin-dashboard`
3. **Reserve AdminNavigation** for core admin functionality only
4. **Test navigation flows** before deployment
5. **Follow established patterns** from existing modules

## Module Access Control

### ⚠️ CRITICAL: Correct Access Control Pattern

**🚨 COMMON MISTAKE: Using Hardcoded Role Checks**

Many pages in the codebase incorrectly use hardcoded role checks instead of the module permission system:

```tsx
// ❌ WRONG: Hardcoded role check bypasses module permission system
const QuotationSettingsPage = () => {
  const { user, loading } = useAuth(['management', 'super_admin']);
  
  if (!user || !['management', 'super_admin'].includes(user.role)) {
    return null;
  }
  
  // ... rest of component
};
```

**Why This Is Wrong:**
1. ❌ Bypasses the dynamic module permission system
2. ❌ Prevents role management from working correctly
3. ❌ Module appears on dashboard but redirects when clicked
4. ❌ Super admin cannot grant access to other roles

**✅ CORRECT: Module-Based Access Control**

```tsx
// ✅ CORRECT: Check module access via permission system
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const QuotationSettingsPage = () => {
  const navigate = useNavigate();
  const { user, modules, loading } = useAuth();
  
  // Check if user has access to this specific module
  const hasModuleAccess = modules.some(module => module.path === '/quotationsettings');
  
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);
  
  React.useEffect(() => {
    if (!loading && user && !hasModuleAccess) {
      navigate('/dashboard');
    }
  }, [loading, user, hasModuleAccess, navigate]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !hasModuleAccess) {
    return null;
  }
  
  // ... rest of component
};
```

**Why This Is Correct:**
1. ✅ Respects the module permission system
2. ✅ Role management works as expected
3. ✅ Super admin can grant/revoke access dynamically
4. ✅ Consistent with dashboard navigation
5. ✅ Single source of truth (database `role_modules` table)

### Frontend Permission Checking

The frontend uses the `get_user_modules()` function to determine module visibility:

```tsx
// Example: Check if user can access a module
const { modules } = useAuth();
const canAccessModule = modules.some(module => module.path === '/target-path');
```

**Complete Example:**

> Most routes get their module-access check declaratively at the route level via `<ProtectedRoute modulePath="/mymodule">` (`src/components/shared/app-shell/ProtectedRoute.tsx`), which runs the same `modules.some(m => m.path === modulePath)` check and redirects to `/dashboard`. The in-component pattern below is for pages that need to gate UI internally.

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeaderShell } from '@/components/primitives/shell';

const MyModulePage = () => {
  const navigate = useNavigate();
  const { user, modules, loading } = useAuth();
  
  // Get module path from route
  const MODULE_PATH = '/mymodule'; // Match path in database
  
  // Check if user has access via module permission system
  const hasModuleAccess = modules.some(module => module.path === MODULE_PATH);
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      console.log('❌ No user found, redirecting to login');
      navigate('/login');
    }
  }, [loading, user, navigate]);
  
  // Redirect if no module access
  React.useEffect(() => {
    if (!loading && user && !hasModuleAccess) {
      console.log('❌ User does not have access to module, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [loading, user, hasModuleAccess, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !hasModuleAccess) {
    return null;
  }
  
  return (
    <AppHeaderShell
      title="My Module"
      description="Module description"
      backPath="/dashboard"
      backLabel="Back to Dashboard"
    >
      {/* Module content */}
    </AppHeaderShell>
  );
};

export default MyModulePage;
```

### Navigation Menu

The main dashboard automatically filters modules based on user permissions, showing only accessible modules.

### Route Protection

Each route should verify permissions using the module system to prevent unauthorized access even with direct URL navigation.

**Migration Guide for Existing Pages:**

If you find a page using hardcoded role checks:

1. **Identify the hardcoded pattern:**
   ```tsx
   const { user, loading } = useAuth(['management', 'super_admin']);
   ```

2. **Replace with module-based check:**
   ```tsx
   const { user, modules, loading } = useAuth();
   const hasModuleAccess = modules.some(module => module.path === '/modulepath');
   ```

3. **Update conditional rendering:**
   ```tsx
   // Old: if (!user || !['management', 'super_admin'].includes(user.role))
   // New: if (!user || !hasModuleAccess)
   ```

4. **Add redirect logic:**
   ```tsx
   React.useEffect(() => {
     if (!loading && user && !hasModuleAccess) {
       navigate('/dashboard');
     }
   }, [loading, user, hasModuleAccess, navigate]);
   ```

**Pages That Need Migration:**
- ✅ `QuotationSettingsPage.tsx` - Fixed (now uses module-based access for `/quotationsettings`)
- ✅ `QuotationList.tsx` - Fixed (now uses module-based access for `/quotations`)
- ✅ `QuotationDetail.tsx` (W09 #10 P1 shell · `src/features/quotations/pages/`) — module-based access for `/quotations`
- ✅ `QuotationCreate.tsx` - Fixed (now uses module-based access for `/quotations`)
- ⚠️ `SalaryPage.tsx` - Still uses hardcoded role check (needs migration)

**Testing Checklist:**
- [ ] Module appears on dashboard for authorized roles
- [ ] Clicking module navigates to page (not back to dashboard)
- [ ] Page content loads correctly
- [ ] Unauthorized roles don't see module on dashboard
- [ ] Direct URL access redirects to dashboard for unauthorized users
- [ ] Role management changes take effect immediately (after page refresh)

## Module System Functions

### Core Functions

#### `get_user_modules(p_user_id uuid)`
Returns all modules accessible to a specific user.

```sql
SELECT * FROM public.get_user_modules('user-uuid-here');
```

#### `set_user_module_permission(p_user_id uuid, p_module_id uuid, p_is_granted boolean, p_notes text)`
Grants or revokes module access for a specific user (super admin only).

```sql
SELECT public.set_user_module_permission(
  'user-uuid',
  'module-uuid', 
  true,
  'Special access granted for project X'
);
```

## Best Practices

### Module Design

1. **Single Responsibility**: Each module should have a clear, specific purpose
2. **Descriptive Naming**: Use clear, business-friendly names
3. **Logical Categorization**: Group related modules in appropriate categories
4. **Icon Consistency**: Use icons that clearly represent the module's function

### Permission Strategy

1. **Principle of Least Privilege**: Grant minimum necessary access
2. **Role-Based Defaults**: Set sensible defaults for each role
3. **Individual Overrides**: Use sparingly for special cases
4. **Clear Documentation**: Document why specific permissions are granted/denied

### Database Considerations

1. **Migration Safety**: Always use ON CONFLICT clauses for module insertion
2. **Permission Verification**: Include validation in migration scripts
3. **Rollback Planning**: Consider how to reverse permission changes
4. **Performance**: Index frequently queried columns

## Troubleshooting

### Common Issues

#### Module Not Appearing in Dashboard

**Symptoms**: Module exists in database but not visible to users

**Causes & Solutions**:
1. **Check module exists with correct schema**:
   ```sql
   SELECT id, name, path, icon_name, category, is_active 
   FROM public.modules 
   WHERE path = '/module-path';
   ```

2. **Verify get_user_modules function returns the module**:
   ```sql
   SELECT * FROM public.get_user_modules() WHERE path = '/module-path';
   ```

3. **Check role permissions in role_modules table**:
   ```sql
   SELECT rm.role, rm.is_granted, m.name 
   FROM public.role_modules rm
   JOIN public.modules m ON rm.module_id = m.id
   WHERE m.path = '/module-path';
   ```

4. **Verify user's role**:
   ```sql
   SELECT role FROM public.users WHERE id = auth.uid();
   ```

5. **Check for user overrides**:
   ```sql
   SELECT um.is_granted, m.name 
   FROM public.user_modules um
   JOIN public.modules m ON um.module_id = m.id
   WHERE um.user_id = auth.uid() AND m.path = '/module-path';
   ```

6. **Module inactive**: Check `is_active` flag
   ```sql
   SELECT * FROM public.modules WHERE path = '/module-path';
   ```

#### Permission Denied Errors

**Symptoms**: Users can see module but get access denied

**Causes & Solutions**:
1. **Frontend/Backend mismatch**: Verify both check same permissions
2. **Stale cache**: Clear user session/cache
3. **Role mismatch**: Verify user role in `public.users` table

#### Schema Mismatch Issues

**Symptoms**: Modules inserted but not appearing, function errors

**Common Cause**: Mismatch between old and new module system schemas

**Solution**: Ensure modules table has correct structure:
```sql
-- Check current modules table structure
\d public.modules

-- Required columns for new system:
-- id, name, path, icon_name, category, sort_order, is_active
-- created_at, updated_at

-- If missing columns, apply migration:
-- 20250924_081343_fix_module_system_schema_mismatch.sql
```

### Debugging Commands

```sql
-- Get all modules for current user
SELECT * FROM public.get_user_modules();

-- Get all modules for specific user
SELECT * FROM public.get_user_modules('user-uuid');

-- Check user's role
SELECT role FROM public.users WHERE id = auth.uid();

-- Get all role permissions for a module
SELECT rm.role, rm.is_granted, m.name 
FROM public.role_modules rm 
JOIN public.modules m ON rm.module_id = m.id 
WHERE m.path = '/module-path';

-- Get user overrides
SELECT u.email, um.is_granted, m.name
FROM public.user_modules um 
JOIN public.users u ON um.user_id = u.id 
JOIN public.modules m ON um.module_id = m.id 
WHERE m.path = '/module-path';

-- Check all active modules
SELECT name, path, icon_name, category, sort_order 
FROM public.modules 
WHERE is_active = true 
ORDER BY sort_order, name;
```

## Security Considerations

### Database Security

1. **RLS Policies**: Minimal policies as per project standard
2. **Function Security**: All functions use `SECURITY DEFINER`
3. **Permission Validation**: Critical functions verify super admin access

### Frontend Security

1. **Defense in Depth**: Both frontend and backend check permissions
2. **No Security by Obscurity**: Hiding UI elements is not sufficient
3. **API Protection**: All API endpoints verify permissions independently

### Audit Trail

The system maintains audit trails for:
- Module permission changes (`granted_by`, `granted_at`)
- User role changes (via users table)
- Module activation/deactivation

## Future Enhancements

### Planned Features

1. **Time-based Permissions**: Temporary access with expiration
2. **Permission Groups**: Predefined sets of module permissions  
3. **Delegation**: Allow coordinators to grant specific permissions
4. **Audit Dashboard**: UI for viewing permission changes
5. **Bulk Operations**: Mass permission updates

### Performance Optimizations

1. **Permission Caching**: Cache user permissions in frontend
2. **Database Indexes**: Optimize frequently queried columns
3. **Function Optimization**: Improve complex permission queries

---

**Last Updated**: 2026-05-30 SGT  
**Status**: 🟢 Production  
**Maintainer**: Development Team
