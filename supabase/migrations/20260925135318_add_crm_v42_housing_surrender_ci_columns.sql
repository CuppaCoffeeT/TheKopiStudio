-- The five fields the advisor's reference CRM gained between `insurance_crm (36)`
-- and `insurance_crm_v42`. All additive and nullable; no data is rewritten.
--
-- Applied to prod via Supabase MCP on 2026-09-25 (supabase/CONTEXT.md: MCP
-- only, never the CLI, for DB changes). This file is the repo's copy so
-- `supabase db reset` can rebuild the same schema on the ephemeral CI DB.
--
-- clients — CPF projection inputs:
--   cpf_housing_monthly      OA drawn each month for a housing loan. The
--                            projection deducts it from OA until the end age;
--                            leaving it out over-states OA and CPF LIFE.
--   cpf_housing_end_age      Age the loan is paid off. NULL = pays until 55.
--   avg_annual_income_to_55  The "simple option": one average income used for
--                            contributions when no life-stage tier is filled.
--
-- policies:
--   surrender_value          What the client would actually receive if they
--                            cashed out today (after charges). Feeds the
--                            report's "What you can access today" section.
--   ci_accelerated           CI payout draws down the death benefit instead of
--                            stacking on it. DEFAULT true — it is the common
--                            Singapore structure and what the reference assumes
--                            for any policy that never answered the question
--                            (`ciAccelerated !== false`). Nullable; the app
--                            reads NULL as accelerated too.

alter table public.clients
  add column if not exists cpf_housing_monthly numeric,
  add column if not exists cpf_housing_end_age smallint,
  add column if not exists avg_annual_income_to_55 numeric;

alter table public.policies
  add column if not exists surrender_value numeric,
  add column if not exists ci_accelerated boolean default true;
