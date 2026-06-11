-- ============================================================================
-- BACKFILL — populate the new identity layer from the legacy profiles table.
-- public.profiles stays live and untouched (the old deployed app reads it);
-- public.users is the canonical identity table for the merged app.
-- ============================================================================

-- 1. Backfill public.users from public.profiles (same UUIDs as auth.users)
INSERT INTO public.users (id, email, name, role, is_approved, is_active, created_at)
SELECT p.id,
       p.email,
       COALESCE(p.full_name, p.username, p.email),
       p.role,            -- 'advisor' | 'manager' — both seeded in public.roles
       TRUE,              -- existing accounts are pre-approved
       TRUE,
       p.created_at
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

-- 2. Promote the owner account to super_admin in the new identity layer.
--    profiles.role is intentionally untouched — the old app's behavior is unchanged.
UPDATE public.users SET role = 'super_admin' WHERE email = 'skytwech@gmail.com';

-- 3. One-time JWT claim backfill: capability RLS reads
--    auth.jwt()->app_metadata->>'role'. Ongoing sync on promote/demote will be
--    handled by an admin edge function (auth.admin.updateUserById) in Phase 1.
UPDATE auth.users au
SET raw_app_meta_data = COALESCE(au.raw_app_meta_data, '{}'::jsonb)
                        || jsonb_build_object('role', u.role)
FROM public.users u
WHERE au.id = u.id;
