-- ═══════════════════════════════════════════════════════════════════════════
-- Seed for the EPHEMERAL LOCAL TEST DATABASE (CI only — never prod).
--
-- Applied by `supabase db reset` / `supabase start` AFTER the schema migration.
-- Two halves, in dependency order:
--   1. RBAC backbone (roles, modules, role_modules, rls_capabilities) — dumped
--      verbatim from prod so capability + module grants match exactly.
--   2. The 8 legacy `results` fixtures the E2E suite asserts on (total >= 8,
--      "Bee zhen" search, James read-only). Owner ids are NULL here; the auth
--      seed step (tests/setup/seed-auth-users.mjs) reassigns "Bee zhen" to the
--      seeded super_admin AFTER the auth users exist, so it stays foreign to the
--      manager (exercising view_all_results) without importing a real person.
--
-- The three E2E auth accounts are NOT created here — auth.users seeding is
-- gotrue-version-sensitive, so it is done via the admin API in that same script.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. RBAC backbone (verbatim from prod; ordered so FKs resolve) ────────────

INSERT INTO public.roles (id, name, display_name, description, is_system_role, is_active, created_at, updated_at) VALUES
 ('a51f60a2-9487-4e40-99ac-fe130484fcf2','super_admin','Super Admin',NULL,true,true,'2026-06-11 08:29:14.618047+00','2026-06-11 08:29:14.618047+00'),
 ('e25228a3-9fbc-476b-b370-5a35322d984f','management','Management',NULL,true,true,'2026-06-11 08:29:14.618047+00','2026-06-11 08:29:14.618047+00'),
 ('8184ba29-81ed-4846-be40-8c9deeb89ebf','supervisor','Supervisor',NULL,true,true,'2026-06-11 08:29:14.618047+00','2026-06-11 08:29:14.618047+00'),
 ('f9903da3-ca5b-4cb6-aad0-fce0099d1a11','advisor','Advisor',NULL,true,true,'2026-06-11 08:29:14.618047+00','2026-06-11 08:29:14.618047+00'),
 ('ee57f6eb-6c2c-4cd5-87b5-75f8aa810eff','manager','Manager',NULL,true,true,'2026-06-11 08:29:14.618047+00','2026-06-11 08:29:14.618047+00');

INSERT INTO public.modules (id, name, description, icon_name, path, category, sort_order, is_active, created_at, updated_at) VALUES
 ('a82c0495-a919-4cdc-85c3-4df7aaee327a','Dashboard','Main dashboard','LayoutDashboard','/dashboard','general',0,true,'2026-06-11 08:29:14.618047+00','2026-06-11 08:29:14.618047+00'),
 ('41be04d9-3a32-484e-9c9b-f253e81edbdf','Profiler','Run a DISC × MBTI prospect profile','UserSearch','/profiler','general',10,true,'2026-06-11 10:15:00.732594+00','2026-06-11 10:15:00.732594+00'),
 ('036a27bc-5ffc-459a-9088-ff9aa57878a9','Results','Saved profiling results & playbooks','ClipboardList','/profiler-results','general',20,true,'2026-06-11 10:15:00.732594+00','2026-06-11 10:15:00.732594+00'),
 ('be6d5737-ff11-4028-83e8-c857a889b319','CRM Dashboard','Your book at a glance','Briefcase','/crm','general',30,true,'2026-06-11 12:42:01.360967+00','2026-06-12 03:42:08.035383+00'),
 ('b92df10c-1147-4a29-bab5-328e8c088dd9','Clients','Client book — policies, reviews, balances','Contact','/clients','general',40,true,'2026-06-11 12:42:01.360967+00','2026-06-12 03:42:08.035383+00'),
 ('8339583f-747f-4f79-99f8-6ee92d712ca7','Portfolio Report','Book-wide financial summary','FileChartColumn','/crm-reports','general',50,true,'2026-06-12 06:49:47.238983+00','2026-06-12 06:49:47.238983+00'),
 ('694525f5-2115-4a23-89c8-cb11e400d981','Manage Accounts','Approve users & manage roles','Users','/manage-accounts','admin',80,true,'2026-06-11 10:15:00.732594+00','2026-06-11 10:15:00.732594+00'),
 ('d00ebd47-3888-42c0-a31d-3ab4e470f851','Account Settings','Your profile & security','Settings','/account-settings','admin',90,true,'2026-06-11 10:15:00.732594+00','2026-06-11 10:15:00.732594+00');

INSERT INTO public.rls_capabilities (capability, role, description, created_at) VALUES
 ('admin','super_admin','Full admin access','2026-06-11 08:29:14.618047+00'),
 ('admin','management','Management admin access','2026-06-11 08:29:14.618047+00'),
 ('field_or_above','super_admin','Field operations access','2026-06-11 08:29:14.618047+00'),
 ('field_or_above','management','Field operations access','2026-06-11 08:29:14.618047+00'),
 ('field_or_above','supervisor','Field operations access','2026-06-11 08:29:14.618047+00'),
 ('view_all_clients','manager','Read every advisor''s CRM book','2026-06-11 09:04:29.148294+00'),
 ('view_all_clients','super_admin','Read every advisor''s CRM book','2026-06-11 09:04:29.148294+00'),
 ('view_all_results','manager','Read every advisor''s profiler results','2026-06-11 09:04:29.148294+00'),
 ('view_all_results','super_admin','Read every advisor''s profiler results','2026-06-11 09:04:29.148294+00'),
 ('manage_accounts','manager','Promote/demote/approve users','2026-06-11 09:04:29.148294+00'),
 ('manage_accounts','super_admin','Promote/demote/approve users','2026-06-11 09:04:29.148294+00');

INSERT INTO public.role_modules (id, role, module_id, is_granted, created_at) VALUES
 ('ffb168d6-0a8e-41d4-a880-4664d5cfa4fa','super_admin','a82c0495-a919-4cdc-85c3-4df7aaee327a',true,'2026-06-11 08:29:14.618047+00'),
 ('5fd69b4f-eeec-431a-b554-cfb5e653f966','management','a82c0495-a919-4cdc-85c3-4df7aaee327a',true,'2026-06-11 08:29:14.618047+00'),
 ('a88e643b-d8f1-4fae-ace7-3ae4ee3c8bd6','supervisor','a82c0495-a919-4cdc-85c3-4df7aaee327a',true,'2026-06-11 08:29:14.618047+00'),
 ('f00eeae1-874a-4dde-ab76-249e23c1f3aa','advisor','a82c0495-a919-4cdc-85c3-4df7aaee327a',true,'2026-06-11 08:29:14.618047+00'),
 ('8eeb97d8-05c0-4c1d-833b-d976583365d6','manager','a82c0495-a919-4cdc-85c3-4df7aaee327a',true,'2026-06-11 08:29:14.618047+00'),
 ('fe41f980-e3cd-454e-9edf-c026d8f68f06','advisor','41be04d9-3a32-484e-9c9b-f253e81edbdf',true,'2026-06-11 10:15:00.732594+00'),
 ('2f1bb1a5-892d-4fc1-af4a-c1d57e763ddb','manager','41be04d9-3a32-484e-9c9b-f253e81edbdf',true,'2026-06-11 10:15:00.732594+00'),
 ('92d51bca-c2c6-4ec9-8838-855ccaaed8f6','super_admin','41be04d9-3a32-484e-9c9b-f253e81edbdf',true,'2026-06-11 10:15:00.732594+00'),
 ('456ec888-0925-47ea-8566-47076d4c2fe8','advisor','036a27bc-5ffc-459a-9088-ff9aa57878a9',true,'2026-06-11 10:15:00.732594+00'),
 ('0ba0e2f8-f04b-4b12-89f8-3d6a256335e2','manager','036a27bc-5ffc-459a-9088-ff9aa57878a9',true,'2026-06-11 10:15:00.732594+00'),
 ('005f1b0e-3f17-4bc9-ad24-3353a0f83bff','super_admin','036a27bc-5ffc-459a-9088-ff9aa57878a9',true,'2026-06-11 10:15:00.732594+00'),
 ('023a0c13-9414-4e66-9ac6-ec339099538b','advisor','d00ebd47-3888-42c0-a31d-3ab4e470f851',true,'2026-06-11 10:15:00.732594+00'),
 ('00bb94dd-a18c-4ccd-bdea-c1997ebbe443','manager','d00ebd47-3888-42c0-a31d-3ab4e470f851',true,'2026-06-11 10:15:00.732594+00'),
 ('13d7fc79-6341-4a31-8308-5d1c49d7860a','super_admin','d00ebd47-3888-42c0-a31d-3ab4e470f851',true,'2026-06-11 10:15:00.732594+00'),
 ('ff50a681-3d0b-4182-9f2b-a45ad491b7e3','manager','694525f5-2115-4a23-89c8-cb11e400d981',true,'2026-06-11 10:15:00.732594+00'),
 ('bea78427-4fa4-422d-b23c-f5f63cf9fd7c','super_admin','694525f5-2115-4a23-89c8-cb11e400d981',true,'2026-06-11 10:15:00.732594+00'),
 ('c5d3a3e5-fda7-4c13-acc3-373c1f54ed7a','advisor','694525f5-2115-4a23-89c8-cb11e400d981',false,'2026-06-11 10:15:00.732594+00'),
 ('0598f8ae-5c6e-4594-9131-67668a140916','advisor','be6d5737-ff11-4028-83e8-c857a889b319',true,'2026-06-11 12:42:01.360967+00'),
 ('b8857ada-250a-45d7-a013-dc7ed5d3a3cc','manager','be6d5737-ff11-4028-83e8-c857a889b319',true,'2026-06-11 12:42:01.360967+00'),
 ('ab70dfc1-7c5e-4812-b1a0-65ca6b7d69d3','super_admin','be6d5737-ff11-4028-83e8-c857a889b319',true,'2026-06-11 12:42:01.360967+00'),
 ('25c6e2dc-6a44-443f-a6d6-b0e5fcddfcc5','advisor','b92df10c-1147-4a29-bab5-328e8c088dd9',true,'2026-06-11 12:42:01.360967+00'),
 ('a894b8e7-9b3a-4ef0-8084-5e3d065c3c6c','manager','b92df10c-1147-4a29-bab5-328e8c088dd9',true,'2026-06-11 12:42:01.360967+00'),
 ('65a02959-3ded-4536-917f-70056fcc5c6f','super_admin','b92df10c-1147-4a29-bab5-328e8c088dd9',true,'2026-06-11 12:42:01.360967+00'),
 ('12ffbbf1-c35f-4c42-bd49-a59a195d6d67','advisor','8339583f-747f-4f79-99f8-6ee92d712ca7',true,'2026-06-12 06:49:47.238983+00'),
 ('851b002a-d0b5-4092-ad34-8f6de26a7542','manager','8339583f-747f-4f79-99f8-6ee92d712ca7',true,'2026-06-12 06:49:47.238983+00'),
 ('21dface5-ce59-4247-a1d3-f0130fb89005','super_admin','8339583f-747f-4f79-99f8-6ee92d712ca7',true,'2026-06-12 06:49:47.238983+00');

-- ── 2. The 8 legacy `results` fixtures (owner NULL; scoring jsonb left empty —
--       the golden-master scoring suite reads the in-repo fixture file, not the
--       DB, so E2E only needs these rows to EXIST and render) ─────────────────

INSERT INTO public.results
 (id, user_id, advisor_name, prospect_name, age_range, occupation, meeting, disc_primary, disc_secondary,
  score_d, score_i, score_s, score_c, mbti, questions_answered, observations_count, raw_answers, nv_observations, notes, created_at, updated_at) VALUES
 ('b332c435-bdb7-459f-8de4-e2910238f3b6', NULL, 'Minchin','James',   '41-45','Hair stylist',    '1','I','D', 6, 7, 3, 6,'ENTP',8, 6,'[]'::jsonb,'{}'::jsonb,'','2026-03-31 07:18:08.526342+00','2026-03-31 07:18:08.526342+00'),
 ('954632aa-b25f-4710-8c80-c5260d6f26d3', NULL, 'Tester1','Test10',  '46+',  'Teacher',         '3','S','D', 0, 0,28, 0,'ISFJ',8,10,'[]'::jsonb,'{}'::jsonb,'','2026-03-31 10:55:04.3879+00',  '2026-03-31 10:55:04.3879+00'),
 ('69cd1636-5e78-49ab-8a6e-36d89881ec9d', NULL, 'Tester1','Verlin',  '20-25','Marketing',       '1','S','I', 2, 9,15, 7,'ENFJ',8,15,'[]'::jsonb,'{}'::jsonb,'','2026-04-01 07:31:41.31156+00', '2026-04-01 07:31:41.31156+00'),
 ('57d8b949-a5cc-4217-91ac-bc51cca500a0', NULL, 'Tester1','Test11',  '46+',  'CEO',             '1','I','D', 8,13, 7, 4,'ESTP',8,14,'[]'::jsonb,'{}'::jsonb,'','2026-04-01 08:10:08.785663+00','2026-04-01 08:10:08.785663+00'),
 ('883d2eca-e09a-4dc8-957c-b1a84bf15e5d', NULL, 'Keane',  'Bee zhen','26-30','Childcare teacher','1','S','I', 0, 9,18, 3,'ISFJ',8,12,'[]'::jsonb,'{}'::jsonb,'','2026-04-01 14:56:47.474358+00','2026-04-01 14:56:47.474358+00'),
 ('0971f4f5-17ca-4fcc-a466-ff6ff52dafaa', NULL, 'verlin', 'yang han','20-25','NSF',             '1','S','D', 8, 5, 9, 4,'INTJ',8,10,'[]'::jsonb,'{}'::jsonb,'','2026-04-03 08:44:08.809817+00','2026-04-03 08:44:08.809817+00'),
 ('13065eb4-6588-4936-ace3-1813ad769f32', NULL, 'verlin', 'ken',     '26-30','Student',         '3','I','S', 5, 8, 8, 6,'ENTJ',8,11,'[]'::jsonb,'{}'::jsonb,'','2026-04-08 01:22:51.961426+00','2026-04-08 01:22:51.961426+00'),
 ('4ee66eb6-6f84-473b-b5b8-d3125d126dae', NULL, 'verlin', 'shi ting','20-25','Engineering',     '2','S','I', 0, 9,21, 4,'ESFJ',8,16,'[]'::jsonb,'{}'::jsonb,'','2026-04-14 07:53:42.679649+00','2026-04-14 07:53:42.679649+00');
