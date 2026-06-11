
# Supabase Migration Template - Post-Chaos Recovery Standards

## CRITICAL CONTEXT

This template was updated after a complete migration system reset on 2025-09-07 due to 120+ chaotic migrations. These standards are MANDATORY to prevent future migration chaos.

## BEFORE Creating Any Migration

**1. ALWAYS Get Current Timestamp First:**
```bash
date +"%Y%m%d_%H%M%S"
# Example output: 20250907_131800
```

**2. Use Timestamp in Filename:**
```
YYYYMMDD_HHMMSS_descriptive_name.sql
```

**3. If Date Command Fails:**
- STOP immediately
- Request manual date confirmation
- DO NOT proceed until timestamp is verified

## Standard Migration Structure

Every migration MUST follow this exact pattern to maintain consistency and prevent issues.

### Template

```sql
-- Migration: [Brief description of changes]
-- Date: [YYYY-MM-DD]
-- Purpose: [Detailed explanation of what this migration achieves]

-- =====================================================
-- TABLE CREATION/MODIFICATION
-- =====================================================

-- Create or modify your tables here
CREATE TABLE IF NOT EXISTS public.example_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =====================================================
-- TRIGGERS (if needed)
-- =====================================================

-- Add update trigger for updated_at
CREATE OR REPLACE TRIGGER update_example_table_updated_at
  BEFORE UPDATE ON public.example_table
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- MANDATORY: MINIMAL RLS POLICY
-- =====================================================

-- Apply minimal RLS policy as per project standard
-- All security is handled at application level, not database level
ALTER TABLE public.example_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can CRUD example_table" ON public.example_table;

CREATE POLICY "Authenticated can CRUD example_table"
  ON public.example_table
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS (if needed)
-- =====================================================

-- Add any custom functions here
-- Remember to use SECURITY DEFINER carefully
```

## Required Elements

### 1. Minimal RLS Policy (MANDATORY)

**Every table MUST have this exact policy:**

```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can CRUD <table_name>" ON public.<table_name>;

CREATE POLICY "Authenticated can CRUD <table_name>"
  ON public.<table_name>
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 2. Comments

Always include:
- Purpose of the migration
- Date of creation
- Explanation of changes
- RLS policy explanation

### 3. File Naming (UPDATED POST-CHAOS)

**MANDATORY Format**: `YYYYMMDD_HHMMSS_description.sql` (underscores only, NO dashes)

✅ **Correct Examples**:
```
20250907_143000_add_example_table.sql
20250907_150000_fix_user_permissions.sql
20250907_160000_update_workflow_status.sql
```

❌ **FORBIDDEN Examples**:
```
20250907-143000-add-example-table.sql    # NO dashes
20250907_143000-add-example-table.sql    # NO mixed separators
add-example-table.sql                     # NO missing timestamp
20250111_000000_something.sql             # WRONG date (must be current!)
```

**Date Verification Required**: Always run `date +"%Y%m%d_%H%M%S"` before creating migration filename.

## Common Patterns

### Adding a New Table

```sql
-- Create table
CREATE TABLE public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),  -- CORRECT: Reference public.users
  data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Apply minimal RLS (MANDATORY)
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can CRUD new_table" ON public.new_table;
CREATE POLICY "Authenticated can CRUD new_table"
  ON public.new_table FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Modifying Existing Table

```sql
-- Add column
ALTER TABLE public.existing_table 
ADD COLUMN new_column text;

-- Update RLS (ensure minimal policy is still in place)
DROP POLICY IF EXISTS "Authenticated can CRUD existing_table" ON public.existing_table;
CREATE POLICY "Authenticated can CRUD existing_table"
  ON public.existing_table FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Adding Functions

```sql
CREATE OR REPLACE FUNCTION public.example_function(param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Use carefully
AS $$
BEGIN
  -- Function logic here
  RETURN true;
END;
$$;
```

## Things to Avoid

### ❌ DO NOT Use These Patterns:

```sql
-- Restrictive RLS policies
CREATE POLICY "Users can only see own data"
  ON public.table_name
  USING (auth.uid() = user_id);

-- Role-based RLS policies  
CREATE POLICY "Only admins can access"
  ON public.table_name
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Complex permission checks in RLS
CREATE POLICY "Complex permissions"
  ON public.table_name
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions 
      WHERE user_id = auth.uid() 
      AND permission = 'read'
    )
  );
```

## Testing Your Migration

After creating a migration:

1. **Test locally first**
2. **Clear auth state** before testing
3. **Test all user roles**
4. **Check for RLS errors** in browser console
5. **Verify CRUD operations work**

## Emergency Rollback

If a migration breaks RLS:

```sql
-- Quick fix: Reset to minimal RLS
ALTER TABLE public.problematic_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "problematic_policy" ON public.problematic_table;
CREATE POLICY "Authenticated can CRUD problematic_table"
  ON public.problematic_table FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

## GOVERNANCE REQUIREMENTS (Post-Chaos Recovery)

### Mandatory Workflow

1. **Date Verification**: Run `date +"%Y%m%d_%H%M%S"` first
2. **Filename Creation**: Use `YYYYMMDD_HHMMSS_description.sql` format
3. **Template Compliance**: Follow this template exactly
4. **Peer Review**: All migrations require review before application
5. **Development Testing**: Test on dev environment first
6. **Production Approval**: Explicit approval required for production
7. **No Manual Changes**: ALL changes must go through migration files

### What Caused the 2025-09-07 Migration Chaos

- **Manual Database Changes**: Applied directly in Supabase dashboard
- **Inconsistent Naming**: Mix of UUIDs, dashes, underscores, descriptions
- **Wrong Dates**: Using incorrect timestamps in filenames
- **No Review Process**: Migrations applied without oversight
- **Foreign Key Issues**: Some tables referenced `auth.users(id)` incorrectly
- **No Documentation**: Changes made without proper documentation

### Prevention Measures

- **This Template**: Enforces consistent structure
- **Cursor Rules**: Automated validation of migration standards
- **Peer Review**: Mandatory review before any migration application
- **Date Validation**: Automatic timestamp verification
- **Archive System**: Old chaotic migrations preserved for reference

## Remember

- **Minimal RLS is MANDATORY**
- **Application handles security, not database**
- **Test thoroughly before deploying**
- **Document your changes clearly**
- **When in doubt, use the minimal RLS pattern**
- **NEVER make manual database changes**
- **ALWAYS verify date before creating migration**
- **Reference the migration chaos documentation if needed**
