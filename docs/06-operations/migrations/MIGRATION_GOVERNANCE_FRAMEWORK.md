# Migration Governance Framework

**Created**: 2025-09-12 08:15:00 SGT  
**Last Updated**: 2025-09-12 08:15:00 SGT  
**Status**: 🟢 Production  
**Priority**: 🔴 Critical  

## 📋 Overview
[Document overview and purpose]

## 📚 Related Documentation
[Links to related documents]


## Overview

This document establishes the complete governance framework for database migrations following the catastrophic migration system reset of 2025-09-07. This framework is designed to prevent the chaos that led to 120+ inconsistent migrations and ensure reliable database evolution going forward.

## 📚 Related Documentation

- [MIGRATION_SYSTEM_RECONSTRUCTION.md](./MIGRATION_SYSTEM_RECONSTRUCTION.md) - Complete story of the migration chaos and reset
- [MIGRATION_TEMPLATE.md](../supabase/MIGRATION_TEMPLATE.md) - Required migration structure and standards
- [AUTH_USER_ID_NORMALIZATION.md](./AUTH_USER_ID_NORMALIZATION.md) - Foreign key standards and normalization
- [DATABASE_POLICY.md](../../01-system-architecture/DATABASE_POLICY.md) - Database security and RLS policies

## Historical Context: The Great Migration Chaos of 2025-09-07

### What Went Wrong

**The Catastrophic State Before Reset**:
- **120 applied migrations** in database vs **106 local files**
- **Complete naming inconsistency**: Mix of UUIDs, timestamps, descriptions, dashes, underscores
- **Manual database changes**: Many changes applied directly through Supabase dashboard
- **Date errors**: Wrong timestamps in filenames (e.g., 2025-01-11 when it was 2025-09-07)
- **No source of truth**: Impossible to recreate database from migration files
- **Foreign key violations**: Some tables incorrectly referenced `auth.users(id)`
- **No review process**: Changes applied without peer review or testing

**Examples of the Chaos**:
```
Local Files:
20250109200000-remove-notification-system-phase2.sql
20250110_180000-spatial-data-phase1-tables.sql        # Mixed format
20250615075616-18c8b6c9-c9bd-4f09-8b28-be2837216f4b.sql  # UUID chaos
20250721091200-notification-phase3-enhancements.sql   # Inconsistent

Database Applied:
20250530020208 | 68c8dbd6-4b0b-432a-a4c1-408fe21acc8a
20250615075611 | 18c8b6c9-c9bd-4f09-8b28-be2837216f4b  # Different timestamp!
20250824051106 | fix-general-works-rejection-validation
```

### The Reset Solution

**2025-09-07 Complete Migration Reset**:
1. **Backup**: All 120 chaotic migrations documented and preserved
2. **Clear History**: Migration table completely cleared
3. **Archive**: 106 old files moved to `migrations_archive/`
4. **Baseline**: Single clean migration `20250907_052924_baseline_production_schema_record` applied
5. **Governance**: This framework implemented to prevent future chaos

## MANDATORY Governance Rules

### Rule 1: No Manual Database Changes

**FORBIDDEN**:
- Making changes directly in Supabase dashboard
- Applying SQL directly in database console
- Using any non-migration method to modify schema
- Bypassing the migration system for "quick fixes"

**REQUIRED**:
- ALL database changes MUST go through migration files
- ALL changes MUST be tracked in version control
- ALL changes MUST follow the review process

### Rule 2: Strict Naming Convention

**MANDATORY Format**: `YYYYMMDD_HHMMSS_descriptive_name.sql`

**Date Verification Process**:
```bash
# STEP 1: Always get current timestamp first
date +"%Y%m%d_%H%M%S"

# STEP 2: Use result in filename
# Example: 20250907_143000_add_user_table.sql
```

**If Date Command Fails**:
- STOP migration creation immediately
- Request manual date confirmation from team
- DO NOT proceed until accurate timestamp is verified
- Document the date verification issue

### Rule 3: Template Compliance

**MANDATORY**: Every migration MUST follow `supabase/MIGRATION_TEMPLATE.md` structure

**Required Sections**:
```sql
-- Migration: [Brief description]
-- Date: [YYYY-MM-DD]
-- Purpose: [Detailed explanation]

-- =====================================================
-- TABLE CREATION/MODIFICATION
-- =====================================================

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- =====================================================
-- TRIGGERS
-- =====================================================

-- =====================================================
-- MANDATORY: MINIMAL RLS POLICY
-- =====================================================
```

### Rule 4: Foreign Key Standards

**MANDATORY Pattern**: ALL user references MUST use `public.users(id)`

✅ **Correct**:
```sql
supervisor_id UUID REFERENCES public.users(id),
created_by UUID REFERENCES public.users(id),
coordinator_id UUID REFERENCES public.users(id)
```

❌ **FORBIDDEN**:
```sql
supervisor_id UUID REFERENCES auth.users(id),  -- CAUSES NORMALIZATION ISSUES
created_by UUID REFERENCES auth.users(id),     -- BYPASSES BUSINESS LOGIC
```

**Exception**: Only `public.users` table references `auth.users(id)`:
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),  -- ONLY acceptable auth.users reference
  -- business columns
);
```

### Rule 5: Mandatory Review Process

**Before ANY Migration Application**:

1. **Peer Review Required**: Another developer must review the migration
2. **Template Compliance Check**: Verify all sections are included
3. **Naming Convention Check**: Verify correct timestamp and format
4. **Foreign Key Validation**: Ensure proper user reference patterns
5. **Testing Required**: Must be tested on development environment
6. **Documentation Review**: Purpose and changes clearly documented

**Review Checklist**:
- [ ] Filename uses `YYYYMMDD_HHMMSS_description.sql` format
- [ ] Date in filename matches current date
- [ ] Migration follows template structure
- [ ] All user foreign keys reference `public.users(id)`
- [ ] Minimal RLS policies included
- [ ] Purpose clearly documented
- [ ] Tested on development environment
- [ ] No manual database changes were made

## Workflow Implementation

### Development Workflow

```mermaid
graph TD
    A[Developer Needs Schema Change] --> B[Run date +"%Y%m%d_%H%M%S"]
    B --> C[Create Migration File with Timestamp]
    C --> D[Follow MIGRATION_TEMPLATE.md]
    D --> E[Implement Changes]
    E --> F[Test Locally]
    F --> G[Create Pull Request]
    G --> H[Peer Review]
    H --> I{Review Passed?}
    I -->|No| J[Fix Issues] --> G
    I -->|Yes| K[Test on Dev Environment]
    K --> L[Approve for Production]
    L --> M[Apply to Production via MCP]
    M --> N[Verify Success]
    N --> O[Update Documentation]
```

### Production Application Workflow

**Prerequisites**:
- ✅ Peer review completed and approved
- ✅ Development environment testing successful
- ✅ Migration follows all governance rules
- ✅ Explicit production approval obtained

**Application Process**:
```bash
# 1. Verify migration compliance
# 2. Get production approval
# 3. Apply via MCP tools (never manual)
# 4. Verify success
# 5. Update documentation
```

## Prevention Mechanisms

### 1. Cursor Rules (Automated)

**File**: `.cursor/rules/migration_standards.mdc`

**Enforces**:
- Correct naming convention
- Template compliance
- Foreign key standards
- Date validation requirements
- Review process reminders

### 2. Git Hooks (Future Enhancement)

**Pre-commit Hook**:
```bash
#!/bin/bash
# Validate migration files before commit

# Check naming convention
for file in supabase/migrations/*.sql; do
    if [[ ! "$file" =~ ^supabase/migrations/[0-9]{8}_[0-9]{6}_.*\.sql$ ]]; then
        echo "ERROR: Migration file $file does not follow naming convention"
        echo "REQUIRED: YYYYMMDD_HHMMSS_description.sql"
        exit 1
    fi
done

# Check template compliance
# Check foreign key patterns
# Validate date accuracy
```

### 3. Documentation Requirements

**Every Migration Must Include**:
- Clear purpose statement
- Affected tables and functions
- Business impact explanation
- Rollback instructions if applicable
- Testing verification steps

### 4. Team Training

**New Developer Onboarding**:
1. Review migration chaos history
2. Understand governance framework
3. Practice with template
4. Complete supervised migration
5. Understand review process

## Monitoring and Enforcement

### Daily Monitoring

**Check for Red Flags**:
- Migration files with incorrect naming
- Manual changes in Supabase dashboard
- Foreign key violations
- Missing peer reviews
- Template non-compliance

**Monitoring Commands**:
```bash
# Check migration file naming
ls supabase/migrations/*.sql | grep -v '^[0-9]\{8\}_[0-9]\{6\}_.*\.sql$'

# Check for auth.users references (should be none except in users table)
grep -r "auth\.users" supabase/migrations/

# Verify migration count matches database
# (Should be automated check)
```

### Quarterly Reviews

**Review Process**:
1. **Migration History Audit**: Verify all migrations are properly tracked
2. **Governance Compliance**: Check adherence to all rules
3. **Process Improvement**: Identify areas for enhancement
4. **Team Training**: Refresh training on governance requirements
5. **Documentation Updates**: Keep governance docs current

## Emergency Procedures

### If Migration Chaos Detected Again

**Immediate Actions**:
1. **STOP**: Halt all migration activity immediately
2. **Assess**: Document the scope and nature of the chaos
3. **Backup**: Ensure recent database backup exists
4. **Plan**: Create detailed recovery plan
5. **Execute**: Implement recovery (potentially another reset)
6. **Strengthen**: Update governance rules to prevent recurrence

### If Date Issues Detected

**Actions**:
1. **Identify**: Find all migrations with incorrect dates
2. **Assess Impact**: Determine if dates affect functionality
3. **Document**: Record the date issues and their scope
4. **Fix**: Rename files with correct dates if safe to do so
5. **Prevent**: Strengthen date validation rules

### If Manual Changes Detected

**Actions**:
1. **Document**: Record what manual changes were made
2. **Create Migration**: Convert manual changes to proper migration
3. **Test**: Verify migration recreates the manual changes
4. **Apply**: Use migration system to formalize changes
5. **Train**: Re-educate team on governance requirements

## Success Metrics

### Green Flags (Healthy Migration System)

- ✅ All migration files follow naming convention
- ✅ Migration history matches local files exactly
- ✅ All changes go through migration files
- ✅ Peer review process is followed consistently
- ✅ No manual database changes occur
- ✅ Foreign key standards are maintained
- ✅ Documentation is kept current

### Red Flags (Immediate Action Required)

- 🚨 Migration files with incorrect naming
- 🚨 Manual changes in Supabase dashboard
- 🚨 Foreign key violations detected
- 🚨 Missing peer reviews
- 🚨 Template non-compliance
- 🚨 Date inconsistencies
- 🚨 Migration history divergence

## Tools and Resources

### Required Tools

1. **MCP Supabase Tools**: For all database operations
2. **Cursor Rules**: Automated validation
3. **Git**: Version control for all migrations
4. **Date Command**: Timestamp verification
5. **Peer Review System**: Code review process

### Reference Materials

1. **Migration Template**: `supabase/MIGRATION_TEMPLATE.md`
2. **Cursor Rules**: `.cursor/rules/migration_standards.mdc`
3. **Historical Archive**: `supabase/migrations_archive/` (106 chaotic files)
4. **Governance Framework**: This document
5. **Foreign Key Standards**: `AUTH_USER_ID_NORMALIZATION.md`

## Long-term Improvements

### Phase 1: Immediate (Completed)

- ✅ Governance framework established
- ✅ Cursor rules implemented
- ✅ Template updated
- ✅ Review process documented

### Phase 2: Near-term (Next 30 days)

- ⚪ Git hooks implementation
- ⚪ Automated migration validation
- ⚪ Team training completion
- ⚪ Process refinement based on usage

### Phase 3: Long-term (Next 90 days)

- ⚪ CI/CD pipeline integration
- ⚪ Automated testing framework
- ⚪ Migration rollback automation
- ⚪ Performance monitoring

## Lessons Learned

### What We Learned from the Chaos

1. **Manual Changes Are Poison**: Even "quick fixes" destroy migration integrity
2. **Naming Matters**: Inconsistent naming makes tracking impossible
3. **Date Accuracy Is Critical**: Wrong dates break chronological understanding
4. **Review Is Essential**: No migration should be applied without review
5. **Documentation Saves Lives**: Proper docs prevent confusion and errors
6. **Automation Prevents Human Error**: Cursor rules catch issues early

### What We Will Never Do Again

- ❌ Apply changes manually through Supabase dashboard
- ❌ Use inconsistent naming conventions
- ❌ Skip peer review for migrations
- ❌ Use incorrect dates in migration files
- ❌ Reference `auth.users(id)` in business tables
- ❌ Apply migrations without testing
- ❌ Skip documentation requirements

## Future-Proofing

### Continuous Improvement

1. **Regular Audits**: Monthly migration system health checks
2. **Process Refinement**: Quarterly review and improvement of governance
3. **Tool Enhancement**: Ongoing improvement of automation and validation
4. **Team Education**: Continuous training on migration best practices
5. **Documentation Updates**: Keep all governance docs current with changes

### Scalability Considerations

As the team and system grow:
- **Multi-environment Support**: Governance for dev, staging, production
- **Branch-based Migrations**: Support for feature branch development
- **Automated Testing**: Comprehensive migration testing pipeline
- **Performance Monitoring**: Track migration performance and optimize
- **Security Enhancements**: Advanced validation and security checks

This governance framework is the result of learning from our mistakes and is designed to ensure the migration chaos of 2025-09-07 never happens again. Every developer must understand and follow these standards to maintain system integrity.

## Emergency Contacts

**If Migration Issues Detected**:
1. **Stop All Migration Activity**: Prevent further damage
2. **Document the Issue**: Create detailed issue report
3. **Escalate Immediately**: Contact senior team members
4. **Reference This Framework**: Use emergency procedures outlined above
5. **Learn and Improve**: Update governance based on new learnings

**Remember**: The cost of following these governance rules is minimal compared to the cost of migration chaos. The 2025-09-07 reset took significant effort that could have been avoided with proper governance.

**Never forget. Never repeat.**

## Why we don't use Supabase branching (2026-04-18)

**Decided during refactor W01**. Supabase branching (GitHub-integrated preview DBs per PR) was attempted twice and failed both times with `MIGRATIONS_FAILED`. Research in W01 explains why a third attempt is deferred rather than retried.

### The drift (measured 2026-04-18)

| Source | Count |
|---|---|
| `.sql` files in `supabase/migrations/` | 365 |
| └─ well-formed `YYYYMMDD_HHMMSS_*.sql` | 318 |
| └─ broken 9-digit prefix | 21 |
| └─ UUID/dash-era chaos (pre-2025-09-07 reset) | 26 |
| Rows in prod `supabase_migrations.schema_migrations` | 371 |
| **Intersection (versions present in both)** | **7** |
| In prod but not local | 364 |
| In local but not prod | 336 |

### Why this breaks branching

Supabase branching replays `supabase/migrations/*.sql` against a fresh blank DB in the **Migrate** step of its deployment DAG (Clone → Pull → Health → Configure → **Migrate** → Seed → Deploy). Our local files do not represent what prod actually ran, so the replay hits missing dependencies, ordering issues from sorted-filename replay including malformed prefixes, and duplicate definitions from post-reset drift. No amount of retrying fixes the files-vs-state gap — the source material itself is wrong.

### Why we didn't do another big-bang reset right now

- A one-shot `pg_dump` baseline → truncate `schema_migrations` → re-seed operation would work once, but the underlying cause (MCP `apply_migration` writes to prod without always creating a matching local `.sql` file) would recreate the drift within weeks
- The refactor (W09) is about to rebuild modules with clean per-module migrations anyway — doing the reset *before* W09 wastes the work; doing it *after* W09 captures far more of the parity for free

### The decision

- **Now (Week 1)**: branching not in use. Prod is the only DB. Supabase Pro built-in daily backups = rollback. W04 Playwright runs against prod with `is_test_data = true` filter.
- **Week 5 (S5 HARDEN)**: nuclear baseline reset (W01.02 card, blocked-by W09) — generate single baseline from prod, archive all pre-baseline migrations, re-enable branching on clean state. Includes new rule in `.claude/rules/migrations.md`: every `mcp__supabase__apply_migration` call must also create the matching local `supabase/migrations/*.sql` file, enforced by the W05 drift detector.

### What this means for day-to-day work

- DB schema changes continue via `mcp__supabase__apply_migration` — nothing changes there
- Do NOT attempt to create a Supabase branch for testing; it will fail
- If you see a new `MIGRATIONS_FAILED` branch appear, it was auto-created by the GitHub integration hook — safe to ignore or delete; it has no effect on prod
