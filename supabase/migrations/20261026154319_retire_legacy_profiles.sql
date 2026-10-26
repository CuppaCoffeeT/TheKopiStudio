-- Retire the legacy-profiler compat layer (CUTOVER_RUNBOOK §4).
--
-- Applied to prod via Supabase MCP on 2026-10-26 (supabase/CONTEXT.md: MCP
-- only, never the CLI, for DB changes). This file is the repo's copy so
-- `supabase db reset` can rebuild the same schema on the ephemeral CI DB.
--
-- Why now: the old vanilla-JS profiler and the old CRM are no longer deployed
-- (both Vercel projects deleted), so `public.profiles`, `get_my_role()` and the
-- open "Anyone can insert results" policy only served this app — as a second,
-- drifting copy of the role (super_admin mirrored as 'manager', or not at all).
-- `public.users` + JWT capabilities are now the only source of truth.
-- The open INSERT was NOT legacy-only: /profiler is public, and a signed-out
-- visitor's profile still saves anonymously (useSaveResult → user_id NULL).
-- profiles was exported to backups/profiles-2026-10-26.json (gitignored) first.
--
-- results — Pattern D, same shape as the 5 CRM tables (CRM_DATA_SPINE.md):
--   SELECT  owner, or anyone holding view_all_results (manager, super_admin).
--           The 9 anonymous legacy rows keep user_id NULL: visible to read-all
--           roles only, editable by nobody.
--   INSERT  either the anonymous shape (user_id NULL AND client_id NULL — the
--           signed-out wizard save) or an owned row whose client_id is NULL or
--           one of the caller's OWN clients. Before this, any session could
--           write any user_id and hang a result off any advisor's customer.
--   UPDATE  owner only; same own-client rule on client_id.
--   DELETE  owner only.
-- user_id FK → public.users(id) (Hard Rule 3), same ON DELETE CASCADE.

-- ── results RLS ─────────────────────────────────────────────────────────────
drop policy if exists "Users read own results" on public.results;
drop policy if exists "Users update own results" on public.results;
drop policy if exists "Users delete own results" on public.results;
drop policy if exists "Managers read all results" on public.results;
drop policy if exists "Anyone can insert results" on public.results;

create policy results_select on public.results for select to authenticated
  using ((select auth.uid()) = user_id or (select public.has_capability('view_all_results')));

create policy results_insert on public.results for insert to anon, authenticated
  with check (
    (user_id is null and client_id is null)
    or (
      (select auth.uid()) = user_id
      and (client_id is null or exists (
        select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())
      ))
    )
  );

create policy results_update on public.results for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (client_id is null or exists (
      select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())
    ))
  );

create policy results_delete on public.results for delete to authenticated
  using ((select auth.uid()) = user_id);

-- anon had every privilege on results; it only ever needs the anonymous INSERT
-- (no SELECT — the anonymous save is fire-and-forget, never return=representation).
revoke all on public.results from anon;
grant insert on public.results to anon;

-- ── results.user_id FK → public.users ───────────────────────────────────────
alter table public.results drop constraint if exists results_user_id_fkey;
alter table public.results
  add constraint results_user_id_fkey foreign key (user_id)
  references public.users(id) on delete cascade;

-- ── signup trigger stops writing the legacy row ─────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.users (id, name, email, role, is_approved, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', new.email),
    new.email,
    'advisor',      -- hardcoded; metadata role ignored to prevent self-elevation
    false,          -- requires admin approval before access
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;

-- ── drop the legacy table + its role reader ─────────────────────────────────
-- Its policies, its updated_at trigger and its auth.users FK go with it.
drop table if exists public.profiles;
drop function if exists public.get_my_role();

-- Advisor WARN (function_search_path_mutable). Body only touches NEW.
alter function public.update_updated_at() set search_path = '';
