-- Security review follow-up (2026-10-26) — before real client data is loaded.
--
-- Applied to prod via Supabase MCP on 2026-10-26 (supabase/CONTEXT.md: MCP
-- only, never the CLI, for DB changes). This file is the repo's copy so
-- `supabase db reset` can rebuild the same schema on the ephemeral CI DB.
--
-- Audit result (anon key probed live against every table + RPC): every table
-- already had RLS on and the public key read 0 rows everywhere. Three gaps:
--
-- 1. users_select was USING (true). /signup is open (email-confirmed), so any
--    stranger who confirms an address becomes `authenticated` and could list
--    every staff member's email, phone and role. Now: own row, or a role that
--    already sees across advisors (view_all_clients / manage_accounts —
--    manager + super_admin). The three cross-user readers in the app
--    (Customers owner column, Manage Accounts, activity actor names) all run
--    as one of those roles, or read only the caller's own id.
-- 2. get_user_modules(p_user_id) is SECURITY DEFINER and returned ANY user's
--    module list to anyone, signed in or not. Now: only the caller's own, or a
--    super_admin's lookup. The app only ever passes the signed-in user's id.
-- 3. anon held every table privilege on every table — and Supabase's default
--    ACL grants the same on each NEW table — so a single future table shipped
--    without RLS would be readable with the public key. anon now keeps only
--    the anonymous profiler INSERT on results (RLS still shapes it), and new
--    tables created by `postgres` no longer grant anon anything. A future
--    table that genuinely needs signed-out access must GRANT it explicitly.
--    customer_activity's two policies named the `public` role; they now name
--    `authenticated` like every other table (no behaviour change).

-- ── 1. users: own row, or a cross-advisor role ──────────────────────────────
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (
    (select auth.uid()) = id
    or (select public.has_capability('view_all_clients'))
    or (select public.has_capability('manage_accounts'))
  );

-- ── 2. get_user_modules: caller's own modules only ──────────────────────────
create or replace function public.get_user_modules(p_user_id uuid)
returns table(module_id uuid, name text, description text, icon_name text, path text, category text, sort_order integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_user_id is distinct from auth.uid() and not public.is_super_admin() then
    return;
  end if;

  return query
  with user_role_modules as (
    select distinct m.id, m.name, m.description, m.icon_name, m.path, m.category, m.sort_order
    from public.users u
    join public.roles r         on r.name = u.role
    join public.role_modules rm on rm.role = r.name
    join public.modules m       on m.id = rm.module_id
    where u.id = p_user_id and rm.is_granted = true and m.is_active = true and r.is_active = true
  ),
  user_override_modules as (
    select m.id, m.name, m.description, m.icon_name, m.path, m.category, m.sort_order
    from public.user_modules um
    join public.modules m on m.id = um.module_id
    where um.user_id = p_user_id and um.is_granted = true and m.is_active = true
  )
  select * from user_role_modules
  union
  select * from user_override_modules
  order by sort_order, name;
end;
$function$;

-- ── 3. anon: no table privileges except the anonymous results insert ────────
revoke all on all tables in schema public from anon;
grant insert on public.results to anon;
alter default privileges for role postgres in schema public revoke all on tables from anon;

alter policy customer_activity_select on public.customer_activity to authenticated;
alter policy customer_activity_insert on public.customer_activity to authenticated;
