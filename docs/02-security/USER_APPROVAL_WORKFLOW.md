# User Onboarding & Approval Workflow SOP

**Created**: 2025-01-29 18:07:00 SGT
**Last Updated**: 2026-04-26 SGT (Hardened default role — metadata role override removed)
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

AppBase Trench Trace Portal requires **manual administrator approval** for all new user registrations. This SOP covers the complete end-to-end process from user signup to successful login, including both the **user's steps** and the **admin's steps**.

**Who can approve users**: Only users with `super_admin` or `management` roles (via `/peoplemanagement` module).

## 📚 Related Documentation

- [authentication/CONTEXT.md](../01-system-architecture/authentication/CONTEXT.md) - Auth workspace router (flows, DB, patterns, troubleshooting)
- [PEOPLE_SYSTEM.md](../01-system-architecture/PEOPLE_SYSTEM.md) - People normalization architecture
- [MODULE_SYSTEM.md](../01-system-architecture/MODULE_SYSTEM.md) - Module-based permissions
- [DUPLICATE_USER_ACCOUNT_ISSUE_AND_PREVENTION.md](./DUPLICATE_USER_ACCOUNT_ISSUE_AND_PREVENTION.md) - Preventing duplicate accounts

---

## 🔄 Complete Onboarding Flow (Overview)

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ONBOARDING FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: User Signs Up          (User does this)                │
│     └─► your-app.example.com → Register tab                          │
│     └─► Enters: Full Name, Email, Password                     │
│                                                                 │
│  STEP 2: Email Verification     (User does this)                │
│     └─► User receives verification email from Supabase          │
│     └─► Clicks link → Email verified                            │
│     └─► Sees "Pending admin approval" message                   │
│     └─► ⛔ CANNOT login yet                                     │
│                                                                 │
│  STEP 3: Admin Creates/Links Person Record  (Admin does this)   │
│     └─► Go to /peoplemanagement → Pending Users tab             │
│     └─► Click "Review & Approve" on the pending user            │
│     └─► Search for existing person OR create new person first   │
│     └─► Select person record to link                            │
│                                                                 │
│  STEP 4: Admin Assigns Role & Approves      (Admin does this)   │
│     └─► Select appropriate role in approval dialog              │
│     └─► Click Approve                                           │
│     └─► System sets: is_approved=TRUE, person_id, role          │
│                                                                 │
│  STEP 5: User Logs In           (User does this)                │
│     └─► User enters email + password                            │
│     └─► System checks: email verified ✓ approved ✓ active ✓    │
│     └─► ✅ Access granted with role-based modules               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step: What the New User Does

### Step 1: Create Account

1. Go to **your-app.example.com**
2. Click the **"Register"** tab on the login page
3. Fill in:
   - **Full Name** - Their real name (e.g., "John Tan")
   - **Email** - Their email address (must be unique in the system)
   - **Password** - Minimum 6 characters
4. Click **"Create Account"**
5. A success message appears: *"Account Registration: Confirm Your Email"*

### Step 2: Verify Email

1. Check email inbox for the verification email from Supabase
2. Click the **verification link** in the email
   - Links expire within a few minutes for security
   - If expired, can resend from the login page (60-second cooldown between resends)
3. Redirected to a success page: *"Your email has been successfully verified"*
4. The page will say: *"Your account is now pending approval from the YOUR-TEAM system administrator"*

### Step 3: Wait for Admin Approval

- The user **cannot login** until an admin approves their account
- If they try to login, they will see: *"Your account is pending approval from the YOUR-TEAM system administrator"*
- The admin should notify the user (via WhatsApp/SMS/email) once approved

### Step 4: First Login

1. Go to **your-app.example.com**
2. Enter email and password
3. System validates: email verified → account approved → account active
4. Redirected to the dashboard with access to modules based on their assigned role

---

## 👨‍💼 Step-by-Step: What the Admin Does

### Prerequisites

- Admin must have `super_admin` or `management` role
- Admin must have access to the **People Management** module (`/peoplemanagement`)

### Step 1: Check for Pending Users

1. Navigate to **People Management** (`/peoplemanagement`)
2. Click the **"Pending Users"** tab
3. The tab badge shows the count of users awaiting approval
4. Each pending user shows:
   - Display name (from signup)
   - Email address
   - Email verification status
   - Registration date

> **Alternative**: Super Admins can also view pending users on the **Super Admin Dashboard** (`/dashboard`) → User Approvals tab, which offers bulk approval and filtering features.

### Step 2: Ensure a Person Record Exists

Before approving, the user **must be linked to a `people` record**. There are two scenarios:

#### Scenario A: Person Already Exists in the System

If the engineer is already recorded as a worker, staff member, or client contact, their person record already exists. The approval dialog lets you **search and select** their existing record.

#### Scenario B: Person Does Not Exist Yet

If this is a brand new person not yet in the system:

1. Go to **People Management** → **All People** tab
2. Create a new person record with at minimum:
   - **First name** (required)
   - **Last name** (optional)
   - **Email** (should match their signup email)
   - **Phone** (optional)
3. Save the person record
4. Then proceed to approve the user and link to this new record

### Step 3: Approve the User

1. On the **Pending Users** tab, click **"Review & Approve"** on the user
2. The **User Approval Dialog** opens showing:
   - User's registration details (name, email, registration date)
3. **Search and select** the person record to link to
4. **Select the role** to assign:

| Role | Typical Use Case | Access Level |
|------|-----------------|--------------|
| `supervisor` | Site supervisors managing workers and work entries | Field operations modules |
| `coordinator` | Project coordinators overseeing workflow | Coordination + approval modules |
| `management` | Management staff with broad access | Most modules + people management |
| `drafter` | Drafters handling drawings and detection work | Drafter-specific modules |
| `Office_admin` | Office administrators | Office admin modules |
| `super_admin` | System administrators (use sparingly) | All modules + system admin |

5. Click **Approve**
6. System calls `approve_user_and_link_person()` which:
   - Links the user to the person record (`person_id`)
   - Sets `is_approved = TRUE`
   - Assigns the selected role
   - Records who performed the approval

### Step 4: Notify the User

Currently there is **no automatic notification** when a user is approved. The admin should manually notify the user (WhatsApp, SMS, email, etc.) that their account is ready.

---

## 🏢 Bulk Onboarding Scenario: Multiple New Engineers

When onboarding multiple engineers at once (e.g., 5 new engineers):

### Preparation (Before They Sign Up)

1. **Decide roles** - What role will each engineer have? (Usually `supervisor` or `coordinator` for engineers)
2. **Collect info** - Get their full names and email addresses in advance
3. **Optional: Pre-create person records** - Go to `/peoplemanagement` → All People tab and create person records ahead of time. This speeds up the approval step later.

### Execution

1. **Send signup instructions** to all engineers:
   > "Go to your-app.example.com, click Register, enter your name/email/password, then check your email to verify. After that, wait for admin approval."
2. **Wait** for all engineers to sign up and verify their emails
3. **Go to** `/peoplemanagement` → Pending Users tab
4. **Approve each user** one by one:
   - Click "Review & Approve"
   - Link to their person record (create if needed)
   - Assign role
   - Approve
5. **Notify all engineers** they can now login

> **Tip for Super Admins**: The Super Admin Dashboard (`/dashboard`) → User Approvals tab supports **bulk selection and approval**, which is faster for multiple users.

---

## 🔧 Behind the Scenes: System Architecture

### Database Flow

```
1. supabase.auth.signUp()
   └─► Creates row in auth.users

2. handle_new_user() trigger fires
   └─► Creates row in public.users:
       - id = auth.users.id
       - is_approved = FALSE
       - is_active = TRUE
       - person_id = NULL
       - role = 'supervisor' (HARDCODED — raw_user_meta_data.role ignored)

3. Admin calls approve_user_and_link_person()
   └─► Updates public.users:
       - person_id = linked person
       - is_approved = TRUE
       - role = assigned role

4. Login calls get_user_profile()
   └─► JOINs users + people via person_id
   └─► Returns: name, email, role, is_approved, is_active

5. Auth loads get_user_modules()
   └─► Gets role-based modules (role_modules table)
   └─► Gets user-level overrides (user_modules table)
   └─► Returns combined module list
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase auth (email, password, email_confirmed_at) |
| `public.users` | App user record (role, is_approved, person_id, is_active) |
| `public.people` | Central person data (name, email, phone, etc.) |
| `public.roles` | Available roles (supervisor, coordinator, etc.) |
| `public.role_modules` | Which modules each role can access |
| `public.user_modules` | Per-user module overrides |

### Login Validation Chain

```
Email + Password → Supabase Auth
    ↓ (pass)
Email Verified? → Check auth.users.email_confirmed_at
    ↓ (pass)
Account Approved? → Check public.users.is_approved
    ↓ (pass)
Account Active? → Check public.users.is_active
    ↓ (pass)
✅ Load profile + modules → Redirect to dashboard
```

---

## ⚠️ Common Mistakes

### Mistake 1: Approving Without Linking a Person Record

If `is_approved` is set to TRUE but `person_id` is still NULL:
- User can login but has no name displayed
- `get_user_profile()` returns incomplete data
- Some features may break

**Prevention**: Always use the approval dialog in `/peoplemanagement` which enforces person linking.

### Mistake 2: Creating Duplicate Person Records

If the engineer already exists in the system (e.g., as a worker), creating a new person record will result in duplicate data.

**Prevention**: Always **search** for the person first in the approval dialog before creating a new record.

### Mistake 3: Assigning the Wrong Role

Giving someone `super_admin` when they should be `supervisor` gives them full system access.

**Prevention**: Refer to the role table above. When in doubt, start with a less-privileged role - it can always be changed later.

---

## 🔍 Troubleshooting

### User Says "My account is pending approval"

**Check**: Go to `/peoplemanagement` → Pending Users tab. If they appear there, approve them. If they don't appear:

```sql
-- Check their status directly
SELECT id, is_approved, is_active, person_id, role
FROM public.users
WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

### User Approved But Still Can't Login

Check all three gates:
1. **Email verified?** - `auth.users.email_confirmed_at` must not be NULL
2. **Approved?** - `public.users.is_approved` must be TRUE
3. **Active?** - `public.users.is_active` must be TRUE
4. **Person linked?** - `public.users.person_id` must not be NULL

### User Sees Empty Dashboard (No Modules)

The role may not have modules assigned:

```sql
-- Check what modules the role has
SELECT m.name, m.path FROM role_modules rm
JOIN modules m ON rm.module_id = m.id
WHERE rm.role = '<user_role>' AND rm.is_granted = true;
```

### User Never Received Verification Email

- Check spam/junk folder
- User can resend verification from the login page (Register tab → shows resend option)
- Verification link cooldown: 60 seconds between resends
- Links expire within a few minutes

---

## 🚀 Known Limitations & Future Improvements

| Current Limitation | Potential Improvement |
|---|---|
| No automatic notification when user is approved | Add email notification via Resend integration |
| No invite/bulk signup flow | Add admin-initiated invite system (send signup link) |
| Person record must exist before approval | Auto-create person from signup metadata, allow admin to review/edit |
| No approval status visibility for users | Show real-time status on login page |
| Approval can only be done one-at-a-time in People Management | Super Admin Dashboard already supports bulk - could bring to People Management too |

---

## 📊 Monitoring & Metrics

### View Registration Queue

```sql
-- Pending approvals sorted by wait time
SELECT
  auth_email,
  display_name,
  created_at,
  EXTRACT(DAY FROM NOW() - created_at) as days_waiting,
  is_email_confirmed
FROM public.get_unapproved_users_with_metadata()
ORDER BY created_at ASC;
```

### Approval Statistics

```sql
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as total_signups,
  COUNT(*) FILTER (WHERE is_approved = TRUE) as approved,
  COUNT(*) FILTER (WHERE is_approved = FALSE) as pending
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;
```

---

## 🔐 Security Notes

1. **Email Enumeration Prevention**: The signup form shows a generic success message even for duplicate emails
2. **No Auto-Approval**: All users require manual admin review
3. **Person Linkage Required**: Cannot approve without linking to person record (data integrity)
4. **Role Validation**: `approve_user_and_link_person()` validates role exists
5. **Dual Gate**: Both `is_approved` AND `is_active` must be TRUE for access
6. **Default Role Safety**: New signups default to `supervisor` — hardcoded in `handle_new_user`. `raw_user_meta_data.role` is **ignored** to prevent self-elevation via signup metadata. Admin assigns the real role on approval.
