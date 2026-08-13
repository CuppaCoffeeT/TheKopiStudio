-- =============================================================================
-- Prospect→client link: results.client_id (PRD: REPORTS_LINK_PRD.md · Phase P1)
--
-- Adds a nullable FK from a profiler result to the CRM client it was
-- converted into:
--   • Convert action (P4): INSERT INTO public.clients → UPDATE
--     public.results SET client_id = <new client> (own rows only per the
--     existing results UPDATE policy auth.uid() = user_id).
--   • Client detail DISC card (P4): SELECT ... FROM public.results
--     WHERE client_id = <client> (idx_results_client_id below).
--
-- Additive-safety (the live legacy app keeps writing during the cutover
-- window):
--   • The legacy app INSERTs into public.results with explicit column lists
--     (18 named columns, never client_id) → the new column simply defaults
--     to NULL; zero impact on legacy reads/writes. The new app's typed
--     insert payloads are explicit too.
--   • ON DELETE SET NULL covers hard deletes only. The CRM soft-deletes
--     clients (clients.is_deleted), so SET NULL never fires for soft-deleted
--     clients — linked results keep their client_id; the DISC card queries
--     client → results, so a soft-deleted client's detail page (hidden by
--     the app) is unaffected.
--   • IF NOT EXISTS on both statements → idempotent re-apply.
--   • No RLS change: results policies are row-scoped on user_id and do not
--     reference column lists.
-- =============================================================================

ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_results_client_id ON public.results(client_id);
