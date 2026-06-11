# Auth Database — Tables, RPCs, RLS

**Status**: 🟢 Production · **Last Updated**: 2026-04-26 SGT

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

Schema reference for the auth-touching tables, the RPCs that AuthContext + Login depend on, and the project-wide RLS pattern.

## Tables

### `auth.users` (Supabase managed)

Never query directly from app code. Supabase Auth owns it.

| Column | Notes |
|---|---|
| `id` (uuid PK) | Used as FK target via `public.users(id)`, never `auth.users(id)` directly |
| `email` | Login identifier |
| `encrypted_password` | Never exposed |
| `email_confirmed_at` | NULL until user clicks verification link |
| `last_sign_in_at`, `created_at` | |

### `public.users`

Application user state. One row per `auth.users` row, created by the `handle_new_user` trigger.

```sql
CREATE TABLE public.users (
  id          uuid PRIMARY KEY,                  -- = auth.users.id
  person_id   uuid REFERENCES people(id),        -- NULL until admin links
  role        text NOT NULL DEFAULT 'supervisor',
  is_approved boolean DEFAULT false,             -- admin gate
  is_active   boolean DEFAULT true,              -- soft-disable
  is_deleted  boolean DEFAULT false,             -- soft-delete
  approved_by uuid,
  approved_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

### `public.people`

Centralized personal info — shared across users, workers, staff, client contacts.

```sql
CREATE TABLE public.people (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  text NOT NULL,
  last_name   text,
  email       text,
  phone       text,
  is_worker   boolean,
  is_staff    boolean,
  is_client_contact boolean,
  created_at  timestamptz DEFAULT now()
);
```

`public.users.person_id → people.id`. Login can't succeed until `person_id` is set (admin does this on approval).

### `public.modules` · `role_modules` · `user_modules`

```sql
modules        (id, name, description, icon_name, path, category, sort_order, is_active)
role_modules   (id, role_id → roles(id), module_id → modules(id))
user_modules   (id, user_id → users(id), module_id → modules(id), is_granted)  -- per-user override
```

**Effective module set for a user** = `(role's modules) ∪ (user_modules where is_granted = true) ∖ (user_modules where is_granted = false)`. Implemented inside `get_user_modules()`.

## RPCs

### `get_user_profile()` → row

```sql
CREATE OR REPLACE FUNCTION get_user_profile()
RETURNS TABLE (id uuid, name text, email text, role text,
               is_approved boolean, is_active boolean)
SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT u.id,
         COALESCE(p.first_name || ' ' || p.last_name, 'Unknown User'),
         p.email, u.role, u.is_approved, u.is_active
  FROM public.users u
  LEFT JOIN public.people p ON u.person_id = p.id
  WHERE u.id = auth.uid();
END $$;
```

`SECURITY DEFINER` runs with postgres privileges → bypasses RLS. `auth.uid()` returns the JWT's user-id.

### `get_user_modules(p_user_id uuid)` → rows

Computes the effective module set described above. Used by AuthContext on login + session restore.

### `handle_new_user()` (auth.users trigger)

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, role, is_approved, is_active)
  VALUES (NEW.id, 'supervisor', FALSE, TRUE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
```

**Hardcoded role** — `raw_user_meta_data.role` is not read. Prevents self-elevation via signup metadata. See [decisions.md](./decisions.md#hardcode-handle_new_user-default-role-2026-04-26).

### `approve_user_and_link_person(p_user_id, p_person_id, p_role, p_approved_by)`

Called by the People-module approval dialog. Sets `person_id`, `role`, `is_approved = TRUE`, `approved_by`, `approved_at`. Fails if `p_role` isn't in `roles`. End-to-end SOP: [USER_APPROVAL_WORKFLOW.md](../../02-security/USER_APPROVAL_WORKFLOW.md).

### `get_unapproved_users_with_metadata()`

Used by both the People-module Pending tab and dashboard counters. **Filters `is_active = TRUE`** — pre-2025 deactivated rows do not surface here. The legacy `get_pending_users()` does NOT filter `is_active` and is the cause of dashboard / People-module count divergence. See [lessons.md](./lessons.md#dashboard-and-people-module-pending-counts-diverged-2026-04-26).

## RLS — minimal pattern

Per [DATABASE_POLICY.md](../DATABASE_POLICY.md), every public table uses:

```sql
ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can CRUD <t>"
  ON public.<t> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

Why minimal:
- prevents recursion (complex policies that reference the same/related tables loop)
- doesn't depend on JWT claims (no stale-token mismatches)
- security is enforced by the application's module gate, not the DB

**Single exception**: `notifications` uses `auth.uid() = user_id` because it's strictly per-user data and the check is non-recursive.

## Login validation chain (where each gate lives)

| Gate | Location | Source |
|---|---|---|
| Password match | Supabase Auth | `auth.users.encrypted_password` |
| Email verified | `Login.tsx` | `auth.users.email_confirmed_at` |
| Approved | `Login.tsx` | `public.users.is_approved` (via `get_user_profile`) |
| Active | `Login.tsx` | `public.users.is_active` |
| Person linked | `Login.tsx` (implicit — name returns "Unknown User") | `public.users.person_id` |
| Module access (per route) | `ProtectedRoute` | `public.user_modules` ∪ `role_modules` |

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) · [AUTHENTICATION_SYSTEM.md](./AUTHENTICATION_SYSTEM.md) · [AUTH_FLOWS.md](./AUTH_FLOWS.md) · [AUTH_PATTERNS.md](./AUTH_PATTERNS.md) · [AUTH_TROUBLESHOOTING.md](./AUTH_TROUBLESHOOTING.md) · [decisions.md](./decisions.md) · [lessons.md](./lessons.md)
- [../DATABASE_POLICY.md](../DATABASE_POLICY.md) · [../MODULE_SYSTEM.md](../MODULE_SYSTEM.md) · [../PEOPLE_SYSTEM.md](../PEOPLE_SYSTEM.md)
- [../../02-security/USER_APPROVAL_WORKFLOW.md](../../02-security/USER_APPROVAL_WORKFLOW.md)
