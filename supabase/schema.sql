--
-- PostgreSQL database dump
--

\restrict lwdRvWbqlYHoinMxG57aDoIvC7Tu0AwAo3hLHluxvFYaJ8DI0aLQVZapIrKXh90

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: can_manage_projects(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_projects() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER PARALLEL SAFE
    SET search_path TO 'public'
    AS $$ SELECT has_capability('manage_projects'); $$;


--
-- Name: get_all_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_users() RETURNS TABLE(id uuid, name text, email text, role text, is_approved boolean, is_active boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT u.id, u.name, u.email, u.role, u.is_approved, u.is_active
  FROM public.users u
  WHERE u.is_deleted = false AND public.is_super_admin();
$$;


--
-- Name: get_my_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_my_role() RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


--
-- Name: get_user_modules(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_modules(p_user_id uuid) RETURNS TABLE(module_id uuid, name text, description text, icon_name text, path text, category text, sort_order integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH user_role_modules AS (
    SELECT DISTINCT m.id, m.name, m.description, m.icon_name, m.path, m.category, m.sort_order
    FROM public.users u
    JOIN public.roles r         ON r.name = u.role
    JOIN public.role_modules rm ON rm.role = r.name
    JOIN public.modules m       ON m.id = rm.module_id
    WHERE u.id = p_user_id AND rm.is_granted = true AND m.is_active = true AND r.is_active = true
  ),
  user_override_modules AS (
    SELECT m.id, m.name, m.description, m.icon_name, m.path, m.category, m.sort_order
    FROM public.user_modules um
    JOIN public.modules m ON m.id = um.module_id
    WHERE um.user_id = p_user_id AND um.is_granted = true AND m.is_active = true
  )
  SELECT * FROM user_role_modules
  UNION
  SELECT * FROM user_override_modules
  ORDER BY sort_order, name;
END;
$$;


--
-- Name: get_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_profile() RETURNS TABLE(id uuid, name text, email text, role text, is_approved boolean, is_active boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT u.id, u.name, u.email, u.role, u.is_approved, u.is_active
  FROM public.users u
  WHERE u.id = auth.uid() AND u.is_deleted = false;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, is_approved, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    'advisor',      -- hardcoded; metadata role ignored to prevent self-elevation
    FALSE,          -- requires admin approval before access
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;

  -- Legacy table for the still-deployed old app (signup form supplies username).
  -- New-app signups have no username metadata; email is unique so it is a safe stand-in.
  INSERT INTO public.profiles (id, username, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', NEW.email),
    'advisor'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: has_capability(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_capability(capability_name text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER PARALLEL SAFE
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rls_capabilities
    WHERE capability = capability_name
      AND role = COALESCE(auth.jwt()->'app_metadata'->>'role', 'unauthorized')
  );
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER PARALLEL SAFE
    SET search_path TO 'public'
    AS $$ SELECT has_capability('admin'); $$;


--
-- Name: is_approved_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_approved_user() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER PARALLEL SAFE
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_approved = TRUE AND is_active = TRUE
  );
$$;


--
-- Name: is_field_or_above(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_field_or_above() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER PARALLEL SAFE
    SET search_path TO 'public'
    AS $$ SELECT has_capability('field_or_above'); $$;


--
-- Name: is_finance_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_finance_role() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER PARALLEL SAFE
    SET search_path TO 'public'
    AS $$ SELECT has_capability('finance'); $$;


--
-- Name: is_super_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', 'unauthorized') = 'super_admin';
$$;


--
-- Name: protect_user_privileges(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.protect_user_privileges() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
DECLARE
  jwt_claims text;
BEGIN
  IF NEW.role           IS DISTINCT FROM OLD.role
     OR NEW.is_approved IS DISTINCT FROM OLD.is_approved
     OR NEW.is_active   IS DISTINCT FROM OLD.is_active
     OR NEW.is_deleted  IS DISTINCT FROM OLD.is_deleted
  THEN
    -- current_setting(..., true) returns NULL when the GUC was never set
    -- (direct postgres / migration sessions) and can return '' after a
    -- RESET; NULLIF folds both into NULL so ::json below never sees ''.
    jwt_claims := NULLIF(current_setting('request.jwt.claims', true), '');

    IF jwt_claims IS NULL THEN
      RETURN NEW;                       -- direct postgres / migration session
    END IF;

    IF jwt_claims::json->>'role' = 'service_role' THEN
      RETURN NEW;                       -- service-role REST (role-sync fn)
    END IF;

    IF public.is_super_admin() THEN
      RETURN NEW;                       -- super_admin end-user JWT
    END IF;

    RAISE EXCEPTION
      'changing role/is_approved/is_active/is_deleted on public.users requires super_admin or the role-sync function'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bank_balance_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_balance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    balance numeric NOT NULL,
    notes text,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    date_of_birth date,
    occupation text,
    annual_income numeric,
    risk_profile text DEFAULT 'Moderate'::text,
    notes text,
    created_date date DEFAULT CURRENT_DATE,
    last_review_date date,
    next_review_date date,
    review_frequency text DEFAULT 'Annual'::text,
    total_bank_balance numeric DEFAULT 0,
    cpf_oa numeric DEFAULT 0,
    cpf_sa numeric DEFAULT 0,
    cpf_ma numeric DEFAULT 0,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    personal_investment_value numeric,
    personal_investment_growth_rate numeric,
    include_personal_investment_in_retirement boolean DEFAULT true NOT NULL,
    future_income_step1 numeric,
    future_income_start_age1 smallint,
    future_income_end_age1 smallint,
    future_income_step2 numeric,
    future_income_start_age2 smallint,
    future_income_end_age2 smallint,
    future_income_step3 numeric,
    future_income_start_age3 smallint,
    future_income_end_age3 smallint
);


--
-- Name: COLUMN clients.personal_investment_growth_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.personal_investment_growth_rate IS 'Expected annual return as a PERCENT (6 = 6%), matching the reference CRM input.';


--
-- Name: COLUMN clients.include_personal_investment_in_retirement; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clients.include_personal_investment_in_retirement IS 'Advisor''s call: does this pot count toward the retirement sum? Defaults true.';


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    type text DEFAULT 'Meeting'::text,
    notes text,
    follow_up date,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: legacy_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legacy_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_by uuid,
    updated_by uuid,
    plan jsonb DEFAULT '{"assets": [], "people": [], "spouseName": "", "allocations": [], "nominations": []}'::jsonb NOT NULL,
    schema_version smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN legacy_plans.plan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.legacy_plans.plan IS 'A whole LegacyPlan document — see src/features/crm/planning/lib/legacy.ts. Read and written whole; nothing derived is stored.';


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon_name text NOT NULL,
    path text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    body text,
    link text,
    type text DEFAULT 'info'::text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    type text NOT NULL,
    provider text,
    policy_number text,
    premium numeric DEFAULT 0,
    frequency text DEFAULT 'Annual'::text,
    coverage_amount numeric DEFAULT 0,
    tpd_coverage numeric DEFAULT 0,
    tpd_same_as_death boolean DEFAULT false,
    critical_illness_coverage numeric DEFAULT 0,
    ci_notes text,
    early_critical_illness_coverage numeric DEFAULT 0,
    eci_notes text,
    start_date date,
    end_date date,
    status text DEFAULT 'Active'::text,
    has_cash_value boolean DEFAULT false,
    current_cash_value numeric DEFAULT 0,
    is_investment_linked boolean DEFAULT false,
    current_account_value numeric DEFAULT 0,
    investment_allocation text,
    illustrated_value_age_55 numeric DEFAULT 0,
    illustrated_value_age_65 numeric DEFAULT 0,
    ilp_premium_inclusion_percent numeric DEFAULT 0,
    is_hospitalization boolean DEFAULT false,
    hospital_type text DEFAULT 'Private'::text,
    integrated_shield_cpf numeric DEFAULT 0,
    integrated_shield_cash numeric DEFAULT 0,
    rider_cash numeric DEFAULT 0,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    full_name text,
    role text DEFAULT 'advisor'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['advisor'::text, 'manager'::text])))
);


--
-- Name: projected_cash_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projected_cash_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    policy_id uuid NOT NULL,
    age integer NOT NULL,
    value numeric NOT NULL,
    created_by uuid,
    updated_by uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    advisor_name text NOT NULL,
    prospect_name text NOT NULL,
    age_range text,
    occupation text,
    meeting text,
    disc_primary text NOT NULL,
    disc_secondary text NOT NULL,
    score_d integer DEFAULT 0 NOT NULL,
    score_i integer DEFAULT 0 NOT NULL,
    score_s integer DEFAULT 0 NOT NULL,
    score_c integer DEFAULT 0 NOT NULL,
    mbti text NOT NULL,
    questions_answered integer DEFAULT 0 NOT NULL,
    observations_count integer DEFAULT 0 NOT NULL,
    raw_answers jsonb,
    nv_observations jsonb,
    notes text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    client_id uuid,
    CONSTRAINT results_disc_primary_check CHECK ((disc_primary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text]))),
    CONSTRAINT results_disc_secondary_check CHECK ((disc_secondary = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text])))
);


--
-- Name: rls_capabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rls_capabilities (
    capability text NOT NULL,
    role text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role text NOT NULL,
    module_id uuid NOT NULL,
    is_granted boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    is_system_role boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module_id uuid NOT NULL,
    is_granted boolean NOT NULL,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    phone text,
    role text DEFAULT 'advisor'::text NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bank_balance_history bank_balance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_balance_history
    ADD CONSTRAINT bank_balance_history_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: legacy_plans legacy_plans_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_plans
    ADD CONSTRAINT legacy_plans_client_id_key UNIQUE (client_id);


--
-- Name: legacy_plans legacy_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_plans
    ADD CONSTRAINT legacy_plans_pkey PRIMARY KEY (id);


--
-- Name: modules modules_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_path_key UNIQUE (path);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: projected_cash_values projected_cash_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projected_cash_values
    ADD CONSTRAINT projected_cash_values_pkey PRIMARY KEY (id);


--
-- Name: projected_cash_values projected_cash_values_policy_id_age_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projected_cash_values
    ADD CONSTRAINT projected_cash_values_policy_id_age_key UNIQUE (policy_id, age);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);


--
-- Name: rls_capabilities rls_capabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rls_capabilities
    ADD CONSTRAINT rls_capabilities_pkey PRIMARY KEY (capability, role);


--
-- Name: role_modules role_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT role_modules_pkey PRIMARY KEY (id);


--
-- Name: role_modules role_modules_role_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT role_modules_role_module_id_key UNIQUE (role, module_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_modules user_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_pkey PRIMARY KEY (id);


--
-- Name: user_modules user_modules_user_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_module_id_key UNIQUE (user_id, module_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_bank_balance_history_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_balance_history_client_id ON public.bank_balance_history USING btree (client_id);


--
-- Name: idx_bank_balance_history_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_balance_history_created_by ON public.bank_balance_history USING btree (created_by);


--
-- Name: idx_bank_balance_history_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_balance_history_updated_by ON public.bank_balance_history USING btree (updated_by);


--
-- Name: idx_bank_balance_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_balance_history_user_id ON public.bank_balance_history USING btree (user_id);


--
-- Name: idx_clients_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_created_by ON public.clients USING btree (created_by);


--
-- Name: idx_clients_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_updated_by ON public.clients USING btree (updated_by);


--
-- Name: idx_clients_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_user_id ON public.clients USING btree (user_id);


--
-- Name: idx_interactions_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_client_id ON public.interactions USING btree (client_id);


--
-- Name: idx_interactions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_created_by ON public.interactions USING btree (created_by);


--
-- Name: idx_interactions_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_updated_by ON public.interactions USING btree (updated_by);


--
-- Name: idx_interactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_user_id ON public.interactions USING btree (user_id);


--
-- Name: idx_legacy_plans_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legacy_plans_client_id ON public.legacy_plans USING btree (client_id);


--
-- Name: idx_legacy_plans_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legacy_plans_user_id ON public.legacy_plans USING btree (user_id);


--
-- Name: idx_policies_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_client_id ON public.policies USING btree (client_id);


--
-- Name: idx_policies_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_created_by ON public.policies USING btree (created_by);


--
-- Name: idx_policies_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_updated_by ON public.policies USING btree (updated_by);


--
-- Name: idx_policies_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_policies_user_id ON public.policies USING btree (user_id);


--
-- Name: idx_projected_cash_values_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projected_cash_values_created_by ON public.projected_cash_values USING btree (created_by);


--
-- Name: idx_projected_cash_values_updated_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projected_cash_values_updated_by ON public.projected_cash_values USING btree (updated_by);


--
-- Name: idx_projected_cash_values_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projected_cash_values_user_id ON public.projected_cash_values USING btree (user_id);


--
-- Name: idx_results_client_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_results_client_id ON public.results USING btree (client_id);


--
-- Name: idx_results_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_results_created_at ON public.results USING btree (created_at DESC);


--
-- Name: idx_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_results_user_id ON public.results USING btree (user_id);


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: users protect_user_privileges; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER protect_user_privileges BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileges();


--
-- Name: results results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: bank_balance_history update_bank_balance_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_bank_balance_history_updated_at BEFORE UPDATE ON public.bank_balance_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: interactions update_interactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: legacy_plans update_legacy_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_legacy_plans_updated_at BEFORE UPDATE ON public.legacy_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: policies update_policies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projected_cash_values update_projected_cash_values_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projected_cash_values_updated_at BEFORE UPDATE ON public.projected_cash_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bank_balance_history bank_balance_history_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_balance_history
    ADD CONSTRAINT bank_balance_history_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: bank_balance_history bank_balance_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_balance_history
    ADD CONSTRAINT bank_balance_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: bank_balance_history bank_balance_history_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_balance_history
    ADD CONSTRAINT bank_balance_history_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: bank_balance_history bank_balance_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_balance_history
    ADD CONSTRAINT bank_balance_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: clients clients_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: clients clients_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: interactions interactions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: interactions interactions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: interactions interactions_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: interactions interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: legacy_plans legacy_plans_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_plans
    ADD CONSTRAINT legacy_plans_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: legacy_plans legacy_plans_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_plans
    ADD CONSTRAINT legacy_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: legacy_plans legacy_plans_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_plans
    ADD CONSTRAINT legacy_plans_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: legacy_plans legacy_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_plans
    ADD CONSTRAINT legacy_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: policies policies_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: policies policies_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: policies policies_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: policies policies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: projected_cash_values projected_cash_values_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projected_cash_values
    ADD CONSTRAINT projected_cash_values_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: projected_cash_values projected_cash_values_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projected_cash_values
    ADD CONSTRAINT projected_cash_values_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE;


--
-- Name: projected_cash_values projected_cash_values_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projected_cash_values
    ADD CONSTRAINT projected_cash_values_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: projected_cash_values projected_cash_values_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projected_cash_values
    ADD CONSTRAINT projected_cash_values_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: results results_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: results results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: role_modules role_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT role_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: role_modules role_modules_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_modules
    ADD CONSTRAINT role_modules_role_fkey FOREIGN KEY (role) REFERENCES public.roles(name) ON DELETE CASCADE;


--
-- Name: user_modules user_modules_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);


--
-- Name: user_modules user_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: user_modules user_modules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_modules
    ADD CONSTRAINT user_modules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES public.roles(name);


--
-- Name: results Anyone can insert results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert results" ON public.results FOR INSERT WITH CHECK (true);


--
-- Name: modules Authenticated can read modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read modules" ON public.modules FOR SELECT TO authenticated USING (true);


--
-- Name: rls_capabilities Authenticated can read rls_capabilities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read rls_capabilities" ON public.rls_capabilities FOR SELECT TO authenticated USING (true);


--
-- Name: role_modules Authenticated can read role_modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read role_modules" ON public.role_modules FOR SELECT TO authenticated USING (true);


--
-- Name: roles Authenticated can read roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read roles" ON public.roles FOR SELECT TO authenticated USING (true);


--
-- Name: user_modules Authenticated can read user_modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can read user_modules" ON public.user_modules FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Managers read all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers read all profiles" ON public.profiles FOR SELECT USING ((public.get_my_role() = 'manager'::text));


--
-- Name: results Managers read all results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers read all results" ON public.results FOR SELECT USING ((public.get_my_role() = 'manager'::text));


--
-- Name: profiles Managers update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers update all profiles" ON public.profiles FOR UPDATE USING ((public.get_my_role() = 'manager'::text)) WITH CHECK ((public.get_my_role() = 'manager'::text));


--
-- Name: modules Super admins manage modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins manage modules" ON public.modules TO authenticated USING (( SELECT public.is_super_admin() AS is_super_admin)) WITH CHECK (( SELECT public.is_super_admin() AS is_super_admin));


--
-- Name: rls_capabilities Super admins manage rls_capabilities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins manage rls_capabilities" ON public.rls_capabilities TO authenticated USING (( SELECT public.is_super_admin() AS is_super_admin)) WITH CHECK (( SELECT public.is_super_admin() AS is_super_admin));


--
-- Name: role_modules Super admins manage role_modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins manage role_modules" ON public.role_modules TO authenticated USING (( SELECT public.is_super_admin() AS is_super_admin)) WITH CHECK (( SELECT public.is_super_admin() AS is_super_admin));


--
-- Name: roles Super admins manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins manage roles" ON public.roles TO authenticated USING (( SELECT public.is_super_admin() AS is_super_admin)) WITH CHECK (( SELECT public.is_super_admin() AS is_super_admin));


--
-- Name: user_modules Super admins manage user_modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins manage user_modules" ON public.user_modules TO authenticated USING (( SELECT public.is_super_admin() AS is_super_admin)) WITH CHECK (( SELECT public.is_super_admin() AS is_super_admin));


--
-- Name: results Users delete own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users delete own results" ON public.results FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users manage own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own notifications" ON public.notifications TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: profiles Users read own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: results Users read own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own results" ON public.results FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: results Users update own results; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users update own results" ON public.results FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: bank_balance_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bank_balance_history ENABLE ROW LEVEL SECURITY;

--
-- Name: bank_balance_history bank_balance_history_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bank_balance_history_delete ON public.bank_balance_history FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: bank_balance_history bank_balance_history_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bank_balance_history_insert ON public.bank_balance_history FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: bank_balance_history bank_balance_history_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bank_balance_history_select ON public.bank_balance_history FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.has_capability('view_all_clients'::text) AS has_capability)));


--
-- Name: bank_balance_history bank_balance_history_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bank_balance_history_update ON public.bank_balance_history FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: clients clients_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_delete ON public.clients FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: clients clients_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_insert ON public.clients FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: clients clients_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.has_capability('view_all_clients'::text) AS has_capability)));


--
-- Name: clients clients_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clients_update ON public.clients FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: interactions interactions_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_delete ON public.interactions FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: interactions interactions_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_insert ON public.interactions FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: interactions interactions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_select ON public.interactions FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.has_capability('view_all_clients'::text) AS has_capability)));


--
-- Name: interactions interactions_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY interactions_update ON public.interactions FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: legacy_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legacy_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: legacy_plans legacy_plans_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_plans_delete ON public.legacy_plans FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: legacy_plans legacy_plans_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_plans_insert ON public.legacy_plans FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: legacy_plans legacy_plans_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_plans_select ON public.legacy_plans FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.has_capability('view_all_clients'::text) AS has_capability)));


--
-- Name: legacy_plans legacy_plans_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_plans_update ON public.legacy_plans FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: policies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

--
-- Name: policies policies_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policies_delete ON public.policies FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: policies policies_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policies_insert ON public.policies FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: policies policies_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policies_select ON public.policies FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.has_capability('view_all_clients'::text) AS has_capability)));


--
-- Name: policies policies_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY policies_update ON public.policies FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projected_cash_values; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projected_cash_values ENABLE ROW LEVEL SECURITY;

--
-- Name: projected_cash_values projected_cash_values_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY projected_cash_values_delete ON public.projected_cash_values FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: projected_cash_values projected_cash_values_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY projected_cash_values_insert ON public.projected_cash_values FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: projected_cash_values projected_cash_values_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY projected_cash_values_select ON public.projected_cash_values FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT public.has_capability('view_all_clients'::text) AS has_capability)));


--
-- Name: projected_cash_values projected_cash_values_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY projected_cash_values_update ON public.projected_cash_values FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));


--
-- Name: results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

--
-- Name: rls_capabilities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rls_capabilities ENABLE ROW LEVEL SECURITY;

--
-- Name: role_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_delete ON public.users FOR DELETE TO authenticated USING (( SELECT public.is_super_admin() AS is_super_admin));


--
-- Name: users users_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_insert ON public.users FOR INSERT TO authenticated WITH CHECK (( SELECT public.is_super_admin() AS is_super_admin));


--
-- Name: users users_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_select ON public.users FOR SELECT TO authenticated USING (true);


--
-- Name: users users_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update ON public.users FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = id)) WITH CHECK ((( SELECT auth.uid() AS uid) = id));


--
-- PostgreSQL database dump complete
--

\unrestrict lwdRvWbqlYHoinMxG57aDoIvC7Tu0AwAo3hLHluxvFYaJ8DI0aLQVZapIrKXh90



--
-- Re-attach the signup trigger that lives on auth.users (outside the public
-- schema, so pg_dump --schema=public omits it). handle_new_user() is defined
-- above. Local `supabase start` creates auth.users before applying this, so the
-- trigger binds cleanly. Captured via catalog on 2026-08-13.
--
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
