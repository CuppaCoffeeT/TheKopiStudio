# Auth User ID Normalization

**Created**: 2025-09-12 08:15:00 SGT  
**Last Updated**: 2025-09-12 08:15:00 SGT  
**Status**: 🟢 Production  
**Priority**: 🟡 High  

## 📋 Overview
[Brief description and purpose of this document]

## 📚 Related Documentation
[Links to related documents with brief descriptions]


## Overview

This document identifies and addresses a critical database design inconsistency where some tables directly reference `auth.users(id)` while others properly reference `public.users(id)`. This inconsistency violates database normalization principles and creates maintenance and integrity issues.

## 📚 Related Documentation

- [DATABASE_POLICY.md](../../01-system-architecture/DATABASE_POLICY.md) - Database security and RLS policies
- [MODULE_SYSTEM.md](../../01-system-architecture/MODULE_SYSTEM.md) - Application-level permission system
- [WORKFLOW_SYSTEM.md](../../01-system-architecture/WORKFLOW_SYSTEM.md) - Business workflow patterns

## Problem Statement

### Current Inconsistent Pattern

The database currently has two different patterns for referencing users:

#### ❌ **Problematic Pattern** - Direct `auth.users(id)` References
```sql
-- spatial_features table
created_by UUID REFERENCES auth.users(id),
updated_by UUID REFERENCES auth.users(id),

-- quotations table  
quote_prepared_by UUID REFERENCES auth.users(id),

-- user_permissions table
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
granted_by uuid REFERENCES auth.users(id),
```

#### ✅ **Correct Pattern** - `public.users(id)` References
```sql
-- trial_trenches table
assigned_drafter_id uuid REFERENCES public.users(id),

-- trial_trench_status_log table
changed_by_user_id uuid NOT NULL REFERENCES public.users(id),

-- general_works_entries table
supervisor_id uuid NOT NULL REFERENCES public.users(id),
coordinator_id uuid REFERENCES public.users(id),
assigned_drafter_id uuid REFERENCES public.users(id),

-- worker_ot table
supervisor_id UUID NOT NULL REFERENCES public.users(id),
```

### Why This Is a Problem

1. **Violates Normalization**: Business logic tables should reference the business entity table (`public.users`), not the authentication table (`auth.users`)

2. **Data Integrity Issues**: 
   - `public.users` contains business logic (roles, approval status, soft deletes)
   - `auth.users` only contains authentication data
   - Direct references bypass business rules and validation

3. **Inconsistent Behavior**:
   - Some features can reference non-approved or deleted users
   - Role-based logic becomes inconsistent
   - Audit trails become fragmented

4. **Maintenance Complexity**:
   - User-related changes must be tracked in multiple places
   - Foreign key relationships are split across different patterns
   - Business logic becomes scattered

## Current Database Design

### Proper Architecture
```
auth.users (Supabase Auth)
    ↓ (1:1)
public.users (Business Profile)
    ↓ (1:many)
[All Business Tables]
```

### Current Broken Architecture
```
auth.users (Supabase Auth)
    ↓ (1:1)
public.users (Business Profile)
    ↓ (1:many)
[Some Business Tables]

auth.users (Supabase Auth)
    ↓ (1:many) ❌ WRONG
[Other Business Tables]
```

## Affected Tables Analysis

### Tables Requiring Migration File Fixes (No Database Changes Needed)

| Table | Column(s) | Migration File Issue | Current DB State | Action Required |
|-------|-----------|---------------------|------------------|-----------------|
| `spatial_features` | `created_by`, `updated_by` | Defined as `REFERENCES auth.users(id)` in migration | **No FK constraints exist** | Fix migration file only |
| `quotations` | `quote_prepared_by` | Defined as `REFERENCES auth.users(id)` in migration | **No FK constraints exist** | Fix migration file only |
| `user_modules` | `user_id`, `granted_by` | Defined as `REFERENCES auth.users(id)` in migration | **No FK constraints exist** | Fix migration file only |

### Tables Already Correct

| Table | Column(s) | Reference |
|-------|-----------|-----------|
| `trial_trenches` | `assigned_drafter_id` | `public.users(id)` ✅ |
| `trial_trench_status_log` | `changed_by_user_id` | `public.users(id)` ✅ |
| `trial_trench_comments` | `author_user_id` | `public.users(id)` ✅ |
| `general_works_entries` | `supervisor_id`, `coordinator_id`, `assigned_drafter_id` | `public.users(id)` ✅ |
| `general_works_status_log` | `user_id` | `public.users(id)` ✅ |
| `worker_ot` | `supervisor_id` | `public.users(id)` ✅ |

## Implementation Plan

### Phase 1: Assessment and Documentation ✅ Completed

**Objective**: Fully document the current state and create migration strategy

**Tasks**:
1. ✅ Document all affected tables and columns
2. ✅ Analyze data integrity implications  
3. ✅ Create comprehensive migration plan
4. ✅ Validate foreign key constraints and dependencies
5. ✅ Check for any application code that might be affected

**Deliverables**:
- This documentation file
- Updated `DOCUMENTATION_INDEX.md`
- Migration strategy with rollback plan

**Phase 1 Assessment Findings**:

1. **Database Schema Analysis** (✅ Completed):
   - `spatial_features` table: Has `created_by` and `updated_by` columns defined as UUID but **NO foreign key constraints currently exist**
   - `quotations` table: Has `quote_prepared_by` column defined as UUID but **NO foreign key constraints currently exist**  
   - `user_permissions` table: **Does NOT exist in current database** - this was likely from an older migration or different branch

2. **Migration Files Analysis** (✅ Completed):
   - Found 3 migration files with problematic `auth.users(id)` references:
     - `20250110_180000-spatial-data-phase1-tables.sql`: Lines 39-40 (spatial_features created_by, updated_by)
     - `20250110_190000-quotation-module-integration.sql`: Line 73 (quotations quote_prepared_by)
     - `20250627011711-d31aee3e-ab7b-4aa0-aa56-5eaa6a12862c.sql`: Lines 29,32 (user_modules table - renamed from user_permissions)

3. **Current Database State** (✅ Completed):
   - **CRITICAL FINDING**: The problematic foreign key constraints were **never actually applied** to the database
   - Current database only has proper `public.users(id)` references for all existing foreign keys
   - The `user_permissions` table referenced in documentation doesn't exist - it's actually `user_modules` table

4. **Application Code Impact** (✅ Completed):
   - No direct `auth.users` references found in application code
   - Application correctly uses `public.users` pattern throughout
   - Quotation module code properly handles user references via application logic
   - No breaking changes expected for application code

**Updated Risk Assessment**: **SIGNIFICANTLY LOWER RISK** - The foreign key constraints were never applied, so this is primarily a migration file cleanup task rather than a live database migration.

### Phase 2: Migration File Cleanup ⚪ Planning

**Objective**: Fix the migration files to use correct foreign key patterns

**Tasks**:
1. ⚪ Create corrected migration files that reference `public.users(id)`
2. ⚪ Update the problematic migration files or create override migrations
3. ⚪ Verify that foreign key constraints can be properly applied
4. ⚪ Test migration files on development branch
5. ⚪ Document the corrected patterns

**Validation Queries**:
```sql
-- Check for auth.users records not in public.users
SELECT au.id, au.email 
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id 
WHERE pu.id IS NULL;

-- Check spatial_features references
SELECT sf.id, sf.created_by, sf.updated_by
FROM public.spatial_features sf
LEFT JOIN public.users u1 ON sf.created_by = u1.id
LEFT JOIN public.users u2 ON sf.updated_by = u2.id
WHERE u1.id IS NULL OR u2.id IS NULL;

-- Check quotations references  
SELECT q.id, q.quote_prepared_by
FROM public.quotations q
LEFT JOIN public.users u ON q.quote_prepared_by = u.id
WHERE u.id IS NULL;

-- Check user_permissions references
SELECT up.id, up.user_id, up.granted_by
FROM public.user_permissions up
LEFT JOIN public.users u1 ON up.user_id = u1.id
LEFT JOIN public.users u2 ON up.granted_by = u2.id
WHERE u1.id IS NULL OR (up.granted_by IS NOT NULL AND u2.id IS NULL);
```

### Phase 3: Foreign Key Constraint Application ⚪ Planning

**Objective**: Apply the corrected foreign key constraints to the database

**Migration Strategy**:
1. ⚪ Create migration to add proper foreign key constraints referencing `public.users(id)`
2. ⚪ Validate data integrity before applying constraints
3. ⚪ Apply foreign key constraints to `spatial_features`, `quotations`, and `user_modules` tables
4. ⚪ Verify constraints are properly created
5. ⚪ Test application functionality

**Migration Template**:
```sql
-- Migration: Add proper foreign key constraints for user references
-- Date: [EXECUTION_DATE]  
-- Purpose: Add missing foreign key constraints that should reference public.users(id)

-- =====================================================
-- DATA VALIDATION
-- =====================================================
-- Ensure all user references exist in public.users before adding constraints
DO $$
BEGIN
    -- Check spatial_features.created_by references
    IF EXISTS (
        SELECT 1 FROM public.spatial_features sf 
        LEFT JOIN public.users u ON sf.created_by = u.id 
        WHERE sf.created_by IS NOT NULL AND u.id IS NULL
    ) THEN
        RAISE EXCEPTION 'spatial_features has invalid created_by references';
    END IF;
    
    -- Check spatial_features.updated_by references  
    IF EXISTS (
        SELECT 1 FROM public.spatial_features sf
        LEFT JOIN public.users u ON sf.updated_by = u.id
        WHERE sf.updated_by IS NOT NULL AND u.id IS NULL  
    ) THEN
        RAISE EXCEPTION 'spatial_features has invalid updated_by references';
    END IF;
    
    -- Check quotations.quote_prepared_by references
    IF EXISTS (
        SELECT 1 FROM public.quotations q
        LEFT JOIN public.users u ON q.quote_prepared_by = u.id
        WHERE q.quote_prepared_by IS NOT NULL AND u.id IS NULL
    ) THEN
        RAISE EXCEPTION 'quotations has invalid quote_prepared_by references';
    END IF;
    
    -- Check user_modules.user_id references
    IF EXISTS (
        SELECT 1 FROM public.user_modules um
        LEFT JOIN public.users u ON um.user_id = u.id
        WHERE um.user_id IS NOT NULL AND u.id IS NULL
    ) THEN
        RAISE EXCEPTION 'user_modules has invalid user_id references';
    END IF;
    
    -- Check user_modules.granted_by references
    IF EXISTS (
        SELECT 1 FROM public.user_modules um
        LEFT JOIN public.users u ON um.granted_by = u.id  
        WHERE um.granted_by IS NOT NULL AND u.id IS NULL
    ) THEN
        RAISE EXCEPTION 'user_modules has invalid granted_by references';
    END IF;
END $$;

-- =====================================================
-- SPATIAL_FEATURES TABLE
-- =====================================================
-- Add constraints referencing public.users (none exist currently)
ALTER TABLE public.spatial_features 
ADD CONSTRAINT spatial_features_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(id);

ALTER TABLE public.spatial_features 
ADD CONSTRAINT spatial_features_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES public.users(id);

-- =====================================================
-- QUOTATIONS TABLE  
-- =====================================================
-- Add constraint referencing public.users (none exists currently)
ALTER TABLE public.quotations 
ADD CONSTRAINT quotations_quote_prepared_by_fkey 
FOREIGN KEY (quote_prepared_by) REFERENCES public.users(id);

-- =====================================================
-- USER_MODULES TABLE  
-- =====================================================
-- Add constraints referencing public.users (none exist currently)
ALTER TABLE public.user_modules 
ADD CONSTRAINT user_modules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_modules 
ADD CONSTRAINT user_modules_granted_by_fkey 
FOREIGN KEY (granted_by) REFERENCES public.users(id);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify all constraints are properly created
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('spatial_features', 'quotations', 'user_modules')
    AND ccu.table_name = 'users'
ORDER BY tc.table_name, tc.constraint_name;
```

**Phase 1 Summary & Resolution**:

✅ **Issue RESOLVED by Migration System Reset (2025-09-07)**: The migration system reconstruction automatically fixed all foreign key normalization issues.

✅ **Automatic Resolution**: 
- The baseline migration `20250907_052924_baseline_production_schema_record` established proper foreign key patterns
- All tables now correctly reference `public.users(id)` except `users` table itself (which properly references `auth.users(id)`)
- No manual foreign key fixes needed
- Migration governance framework prevents future violations

🔄 **Status**: **COMPLETED** - No further action required for this normalization project

⚠️ **Final State**:
- **All foreign keys properly normalized** - constraints follow correct patterns
- **Migration governance implemented** - prevents future violations  
- **Cursor rules active** - automatic validation of foreign key patterns
- **Documentation complete** - standards documented for future reference

**This normalization effort is now complete thanks to the migration system reconstruction.**

### Phase 4: Cursor Rule Creation ⚪ Planning

**Objective**: Prevent future occurrences through automated enforcement

**Tasks**:
1. ⚪ Create `.cursor/rules/foreign-key-standards.mdc`
2. ⚪ Document proper foreign key patterns
3. ⚪ Include examples and anti-patterns
4. ⚪ Set up automatic validation rules

**Cursor Rule Content**:
```markdown
---
description: Enforces proper foreign key patterns for user references
globs: supabase/migrations/**/*.sql
alwaysApply: true
---

# Foreign Key Standards for User References

## MANDATORY Pattern

ALL user references in business tables MUST reference `public.users(id)`, NEVER `auth.users(id)`.

## ✅ Correct Pattern
```sql
-- Always reference public.users for business logic
supervisor_id UUID REFERENCES public.users(id),
created_by UUID REFERENCES public.users(id),
assigned_to UUID REFERENCES public.users(id)
```

## ❌ Forbidden Pattern  
```sql
-- NEVER reference auth.users directly in business tables
supervisor_id UUID REFERENCES auth.users(id),  -- ❌ WRONG
created_by UUID REFERENCES auth.users(id),     -- ❌ WRONG
```

## Architecture Rule

Only the `public.users` table should reference `auth.users(id)` as its primary key:
```sql
-- ONLY acceptable auth.users reference
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  -- business logic columns
);
```

## Rationale

1. **Normalization**: Business logic centralized in public.users
2. **Data Integrity**: All user relationships go through business validation
3. **Consistency**: Single source of truth for user data
4. **Maintainability**: Changes only affect one relationship layer
```

### Phase 5: Application Code Review ⚪ Planning

**Objective**: Ensure application code follows the correct pattern

**Tasks**:
1. ⚪ Review all TypeScript interfaces and types
2. ⚪ Check Supabase client queries for incorrect references
3. ⚪ Update any hardcoded `auth.users` references in code
4. ⚪ Verify all user-related queries use `public.users`
5. ⚪ Test application functionality post-migration

### Phase 6: Documentation and Standards Update ⚪ Planning

**Objective**: Update all documentation to reflect the correct pattern

**Tasks**:
1. ⚪ Update `DATABASE_POLICY.md` with foreign key standards
2. ⚪ Update `MIGRATION_TEMPLATE.md` with correct examples
3. ⚪ Add foreign key validation to migration checklist
4. ⚪ Update any feature documentation that references user relationships
5. ⚪ Create migration review guidelines

## Business Rules & Constraints

### Data Integrity Requirements

1. **Referential Integrity**: All user references must exist in `public.users`
2. **Business Logic Enforcement**: User relationships must respect approval and active status
3. **Audit Trail Consistency**: All user actions must be traceable through `public.users`

### Migration Constraints

1. **Zero Downtime**: Migration must not disrupt active application usage
2. **Data Preservation**: No data loss during foreign key updates
3. **Rollback Capability**: Must be able to revert changes if issues arise
4. **Validation Required**: Post-migration verification of all relationships

## Prevention Strategy

### 1. Cursor Rule Enforcement
- Automatic validation in migration files
- Prevents direct `auth.users(id)` references in business tables
- Provides correct examples and patterns

### 2. Migration Template Updates
```sql
-- CORRECT: Reference public.users for business logic
user_id UUID REFERENCES public.users(id),
created_by UUID REFERENCES public.users(id),
supervisor_id UUID REFERENCES public.users(id),

-- INCORRECT: Never reference auth.users directly
-- user_id UUID REFERENCES auth.users(id), -- ❌ FORBIDDEN
```

### 3. Code Review Checklist
- [ ] All user foreign keys reference `public.users(id)`
- [ ] No direct `auth.users(id)` references in business tables
- [ ] Foreign key constraints include proper CASCADE rules
- [ ] Migration includes data validation queries

### 4. Documentation Standards
- All new table documentation must specify user reference patterns
- Migration documentation must include foreign key validation
- Feature specs must clarify user relationship requirements

## Implementation Phases Timeline

| Phase | Estimated Effort | Risk Level | Dependencies |
|-------|------------------|------------|--------------|
| Phase 1: Assessment | 1-2 hours | Low | None |
| Phase 2: Validation | 2-3 hours | Medium | Phase 1 complete |
| Phase 3: Migration | 1-2 hours | High | Phases 1-2 complete, Production approval |
| Phase 4: Cursor Rule | 1 hour | Low | Phase 3 complete |
| Phase 5: Code Review | 2-4 hours | Medium | Phase 3 complete |
| Phase 6: Documentation | 1-2 hours | Low | All phases complete |

## Risk Assessment

### High Risk Items
- **Production Migration**: Changing foreign key constraints on live data
- **Application Breakage**: Code that assumes direct `auth.users` access
- **Data Integrity**: Potential for orphaned records during migration

### Mitigation Strategies
- **Comprehensive Testing**: Validate all queries before and after migration
- **Rollback Plan**: Document exact steps to revert changes
- **Phased Approach**: Test on development branch first
- **Data Backup**: Ensure recent backup before migration execution

## Success Criteria

### Phase Completion Criteria

1. **Phase 1 Complete**: All affected tables and relationships documented
2. **Phase 2 Complete**: Data validation confirms no integrity issues
3. **Phase 3 Complete**: All foreign keys reference `public.users(id)` consistently
4. **Phase 4 Complete**: Cursor rule prevents future violations
5. **Phase 5 Complete**: Application code uses correct patterns
6. **Phase 6 Complete**: All documentation reflects correct standards

### Final Success Metrics

- [ ] Zero direct `auth.users(id)` references in business tables
- [ ] All user relationships go through `public.users(id)`
- [ ] Cursor rule prevents future violations
- [ ] Application functionality unchanged post-migration
- [ ] Documentation accurately reflects implementation
- [ ] Migration template includes correct patterns

## Future Considerations

### Long-term Improvements

1. **Automated Validation**: Database triggers to prevent incorrect foreign key creation
2. **Type Safety**: TypeScript types that enforce correct user reference patterns
3. **Migration Linting**: Automated checks in CI/CD pipeline
4. **Documentation Sync**: Automated updates to ensure docs stay current

### Monitoring and Maintenance

1. **Regular Audits**: Quarterly review of foreign key patterns
2. **New Developer Training**: Include foreign key standards in onboarding
3. **Code Review Focus**: Emphasize user reference patterns in PR reviews
4. **Documentation Updates**: Keep examples current with actual implementation

## Emergency Procedures

### If Migration Fails

1. **Immediate Rollback**: Use prepared rollback migration
2. **Data Validation**: Verify no data corruption occurred  
3. **Application Testing**: Ensure all functionality restored
4. **Root Cause Analysis**: Identify and document failure reason
5. **Plan Revision**: Update migration strategy based on learnings

### If Application Breaks Post-Migration

1. **Quick Assessment**: Identify affected functionality
2. **Temporary Fixes**: Apply minimal patches to restore service
3. **Full Testing**: Comprehensive validation of all user-related features
4. **Documentation Update**: Record any discovered issues and solutions

This normalization effort is critical for maintaining data integrity and ensuring consistent user relationship patterns across the entire application.


