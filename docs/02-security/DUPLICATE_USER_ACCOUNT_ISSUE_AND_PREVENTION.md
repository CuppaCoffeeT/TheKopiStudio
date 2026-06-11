# Duplicate User Account Issue and Prevention

**Created**: 2025-11-10
**Status**: 🟢 Production
**Priority**: 🔴 Critical
**Category**: Security / Authentication

---

## Overview

This document outlines a critical authentication issue discovered on 2025-11-10 where duplicate user accounts prevented legitimate users from logging in, and provides prevention strategies for the new login flow implementation.

---

## The Issue

### Symptom
User Evonne (admin@example.com) received "Your account is pending approval from the YOUR-TEAM system administrator" toast message when attempting to login, despite:
- Having a valid `people` record linked to `users` table
- `users.is_approved = TRUE`
- `users.is_active = TRUE`

### Root Cause Analysis

**Duplicate User Records Discovered:**

1. **Original (Correct) Record**
   - `users.id`: `79562c22-49a3-408d-a12c-f0ac7a3c0360`
   - Role: `Office_admin`
   - `is_approved`: `TRUE`
   - `is_active`: `TRUE`
   - `person_id`: Linked to Evonne in `people` table
   - Email (via people): `admin@example.com`

2. **Duplicate (Incorrect) Record**
   - `users.id`: `f5173fea-c3ef-4b77-a53a-db90a95fdc48` ⚠️ (matches `auth.users.id`)
   - Role: `supervisor`
   - `is_approved`: `FALSE` ❌
   - `is_active`: `FALSE`
   - `person_id`: `NULL` (no link to people table)
   - Created during signup attempt

### The Authentication Flow Failure

```sql
-- Login flow uses get_user_profile() function:
SELECT u.id, u.role, u.is_approved, u.is_active
FROM public.users u
LEFT JOIN public.people p ON u.person_id = p.id
WHERE u.id = auth.uid();  -- ⚠️ auth.uid() returns f5173fea... (new signup ID)
```

**What Happened:**
1. User attempted to signup with `admin@example.com` (email already in use)
2. Supabase `auth.users` created new record with ID `f5173fea...`
3. Database trigger/function created incomplete `public.users` record with same ID
4. **No duplicate email check** prevented this
5. On login, `get_user_profile()` matched the NEW incomplete record (`is_approved=FALSE`)
6. Login code at [Login.tsx:158-162](../../src/pages/Login.tsx#L158-L162) rejected user

### No Pending Registration Record
- Query showed **no pending registration** in `pending_user_registrations` table
- This means the duplicate was created outside the normal registration flow

---

## The Fix (Applied 2025-11-10)

### Immediate Resolution

```sql
-- Step 1: Delete incomplete duplicate user record
DELETE FROM public.users
WHERE id = 'f5173fea-c3ef-4b77-a53a-db90a95fdc48'
AND is_approved = false
AND person_id IS NULL;

-- Step 2: Update correct user record to match auth.users.id
UPDATE public.users
SET id = 'f5173fea-c3ef-4b77-a53a-db90a95fdc48'
WHERE id = '79562c22-49a3-408d-a12c-f0ac7a3c0360';
```

### Result
- ✅ User profile now returns: `is_approved=true`, `is_active=true`, `role=Office_admin`
- ✅ Evonne can login successfully at admin@example.com

---

## Prevention Strategies for New Login Flow

### 1. **Email Uniqueness Enforcement** 🔴 CRITICAL

#### Database Level
```sql
-- Add unique constraint on people.email
ALTER TABLE public.people
ADD CONSTRAINT people_email_unique UNIQUE (email);

-- Create index for performance
CREATE UNIQUE INDEX idx_people_email_unique
ON public.people(LOWER(email))
WHERE is_deleted = FALSE;
```

#### Application Level
- Before allowing signup, check if email exists:
```typescript
const { data: existingPerson } = await supabase
  .from('people')
  .select('email')
  .eq('email', email.toLowerCase())
  .maybeSingle();

if (existingPerson) {
  // Do NOT reveal that email exists (security)
  showError('An error occurred during sign up. Please contact support.');
  return;
}
```

### 2. **Prevent auth.users Duplicate Creation**

#### Pre-Signup Email Verification
```typescript
// Check BEFORE calling supabase.auth.signUp()
const { data: authUser } = await supabase.auth.admin.listUsers();
const emailExists = authUser?.users?.some(
  u => u.email?.toLowerCase() === email.toLowerCase()
);

if (emailExists) {
  // Generic error for security (don't leak user existence)
  showError('Unable to complete registration. Please contact support.');
  return;
}
```

### 3. **Enhanced Registration Flow**

#### Step-by-Step Validation
```typescript
async function handleSignUp(email: string, password: string, userData: any) {
  // 1. Check people table
  const { data: person } = await supabase
    .from('people')
    .select('id, email')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (person) {
    showError('Registration failed. Please contact administrator.');
    return;
  }

  // 2. Check pending_user_registrations
  const { data: pending } = await supabase
    .from('pending_user_registrations')
    .select('id')
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .maybeSingle();

  if (pending) {
    showError('Your registration is already pending approval.');
    return;
  }

  // 3. Proceed with signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userData }
  });

  if (error) {
    // Handle error
  }
}
```

### 4. **Database Triggers for Safety**

#### Prevent Duplicate Users Creation
```sql
-- Function to check for existing email before user creation
CREATE OR REPLACE FUNCTION check_user_email_unique()
RETURNS TRIGGER AS $$
DECLARE
  existing_email TEXT;
BEGIN
  -- Check if a person with this auth ID's email already exists
  SELECT p.email INTO existing_email
  FROM auth.users au
  JOIN public.people p ON LOWER(p.email) = LOWER(au.email)
  WHERE au.id = NEW.id;

  IF existing_email IS NOT NULL THEN
    RAISE EXCEPTION 'User with email % already exists', existing_email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users INSERT
CREATE TRIGGER check_user_email_before_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_email_unique();
```

### 5. **Login Flow Improvements**

#### Enhanced Error Handling
```typescript
// Check for duplicate users during login
const { data: profiles } = await supabase.rpc('get_user_profile');

if (!profiles || profiles.length === 0) {
  // Check if there are duplicate users for this email
  const { data: authUser } = await supabase.auth.getUser();
  if (authUser?.user?.email) {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('person_id', (
        await supabase
          .from('people')
          .select('id')
          .eq('email', authUser.user.email)
          .single()
      ).data?.id);

    if (count && count > 1) {
      // Log critical error - duplicate users detected
      console.error('CRITICAL: Duplicate users detected for', authUser.user.email);
      showError('Account error detected. Please contact system administrator immediately.');
      // Trigger admin notification
    }
  }
}
```

### 6. **Monitoring and Alerts**

#### Duplicate Detection Query
```sql
-- Run periodically to detect duplicates
SELECT
  p.email,
  COUNT(u.id) as user_count,
  ARRAY_AGG(u.id) as user_ids
FROM people p
JOIN users u ON u.person_id = p.id
GROUP BY p.email
HAVING COUNT(u.id) > 1;
```

---

## Implementation Checklist for New Login Flow

### Database Changes
- [ ] Add unique constraint on `people.email`
- [ ] Create unique index on `LOWER(people.email)`
- [ ] Implement `check_user_email_unique()` trigger function
- [ ] Add trigger to prevent duplicate user creation

### Application Changes
- [ ] Add pre-signup email existence check (people table)
- [ ] Add pre-signup email existence check (auth.users)
- [ ] Add pre-signup pending registration check
- [ ] Implement duplicate user detection in login flow
- [ ] Add error logging for duplicate detection
- [ ] Implement admin notification system for critical errors

### Testing
- [ ] Test signup with existing email (should fail gracefully)
- [ ] Test signup with pending registration email (should show pending message)
- [ ] Test login with duplicate users (should detect and alert)
- [ ] Test email case-insensitivity (test@example.com vs TEST@example.com)
- [ ] Load test concurrent signups with same email

### Monitoring
- [ ] Set up daily duplicate detection query
- [ ] Create dashboard widget for duplicate user monitoring
- [ ] Implement automated alerts for duplicate detection

---

## Security Considerations

### Don't Leak User Existence
```typescript
// ❌ BAD: Reveals if email exists
if (emailExists) {
  showError('This email is already registered');
}

// ✅ GOOD: Generic error message
if (emailExists) {
  showError('Unable to complete registration. Please contact support if you believe this is an error.');
}
```

### Email Normalization
```typescript
// Always normalize email before comparison
const normalizedEmail = email.trim().toLowerCase();
```

### Rate Limiting
- Implement rate limiting on signup endpoint (max 3 attempts per hour per IP)
- Prevent email enumeration attacks

---

## Related Documentation

- [MODULE_SYSTEM.md](../01-system-architecture/MODULE_SYSTEM.md) - User role and permission system
- [DATABASE_POLICY.md](../01-system-architecture/DATABASE_POLICY.md) - Database security policies
- [PEOPLE_SYSTEM.md](../01-system-architecture/PEOPLE_SYSTEM.md) - People normalization architecture

---

## Lessons Learned

1. **Trust but Verify**: Even though `users.is_approved=TRUE`, the wrong record was being queried
2. **Email Uniqueness is Critical**: No database constraint prevented duplicate emails across auth/people/users
3. **ID Synchronization Matters**: `public.users.id` MUST match `auth.users.id` for `get_user_profile()` to work
4. **Silent Failures are Dangerous**: Signup succeeded even though email was already in use
5. **Monitoring is Essential**: Duplicate users went undetected until login failure

---

## Future Enhancements

1. **Admin Dashboard Widget**: "Duplicate User Detector" showing potential issues
2. **Automated Cleanup**: Scheduled job to detect and flag duplicate users
3. **Account Linking**: Allow users to "claim" existing person records during signup
4. **Email Verification Before User Creation**: Don't create auth.users until email verified AND approved

---

**Last Updated**: 2025-11-10
**Next Review**: After new login flow implementation
