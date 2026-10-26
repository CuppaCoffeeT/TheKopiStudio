-- Fix-forward for 20261026171551_lock_down_anon_and_users_read.
--
-- Applied to prod via Supabase MCP on 2026-10-26 (supabase/CONTEXT.md: MCP
-- only, never the CLI, for DB changes). This file is the repo's copy so
-- `supabase db reset` can rebuild the same schema on the ephemeral CI DB.
--
-- That migration revoked anon's SELECT on clients. The single results_insert
-- policy (TO anon, authenticated) carries an EXISTS (… public.clients …)
-- subquery, and a policy subquery runs with the CALLER's privileges — so every
-- anonymous /profiler save failed with "permission denied for table clients"
-- (prod, ~1 minute, caught by the REST probe). Split it: anon gets a
-- subquery-free policy for the one shape it may write; the client-ownership
-- subquery lives only in the authenticated policy.

drop policy if exists results_insert on public.results;

create policy results_insert_anon on public.results for insert to anon
  with check (user_id is null and client_id is null);

create policy results_insert on public.results for insert to authenticated
  with check (
    (user_id is null and client_id is null)
    or (
      (select auth.uid()) = user_id
      and (client_id is null or exists (
        select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())
      ))
    )
  );
