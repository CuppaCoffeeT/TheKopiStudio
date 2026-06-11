# AppBase_REFACTOR — Overview (index only)

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-05-31 SGT — **SRC_STRUCTURE_CLEANUP_PRD landed 2026-05-31 — legacy `src/components/<domain>/` elimination shipped.** `src/components/` is now `{primitives,ui,shared}` only; all legacy `src/components/<domain>/` folders gone; `src/{types,constants,styles}` drained + removed; `src/hooks` root 116 → 71; OTCalculator page→feature drift edge eliminated; new `no-stray-domain-components` dep-cruiser rule (error) enforces the shape; 105 dead files deleted · ~70 surfaces relocated/promoted (tsc 0 · drift true-0 · build pass · knip 172 → 77 · @p0 378 pass). Prior (2026-04-28): **W09 throughput: 25 module runs · MODULES_MANIFEST 26 migrated · 11 inspected · 1 audited · 0 production-ready.** Then (2026-04-28): two primitive-level a11y bugfixes shipped via interactive `/generalworks` inspection — `Drawer.tsx` title/subtitle now use `VaulDrawer.Title`/`Description` (resolves Radix "DialogContent requires DialogTitle" warning across every detail drawer); `DataTable.tsx` splits the desktop `role="table"` from the mobile `role="list"` so role=table is fully display:none below md (resolves axe critical `aria-required-children` on every LIST adopter at mobile viewport). `/generalworks` `<ListPageFrame>` testid props wired — repairs pre-existing WF-0301. Earlier (2026-04-27): W09 #24 `/auth/verify` migration (288 LOC monolith → dispatcher) + 4 specs (WF-0598..WF-0601); W09 #25-#26 `/comms` + `/comms/pending` + `/competitoranalysis` migrations; WF-0602 captured on `/auth/verified`; `/quotations/:id` reaches 100% primitive-composed across 5 passes (`DatePicker.disabledDate` · `SMSOption.disabledMessage` · `SearchableMultiSelectProps.triggerTestId` enhancements; final hard-grep state 6a/6d/6e zero · 6b 6 sanctioned · 6c 4 sanctioned bespoke). **104 primitives · 903 adoptions** · drift zero (43 modules · 52 deps). Full history in [RECENT_CHANGES.md](RECENT_CHANGES.md).
**Status**: 🔵 Planning
**Priority**: 🔴 Critical
**Target window**: 2026-04-16 → 2026-05-21 (5 weeks)

## Vision (2 sentences — draft)

Transform AppBase from a bug-prone, inconsistently-styled prototype into a visually polished, component-DRY internal app that compounds rather than firefights. Every module shares one shell (auth, queries, forms, tables, design tokens, motion) so one fix lands everywhere, every workflow is seat-belted by Playwright before prod, and new modules scaffold via skills so the shape can't drift.

## System DAG

> **What's a DAG?** Directed Acyclic Graph — stages connected by arrows that only point forward. Shows *order, parallel lanes, merge gates, HITL gates, terminals* at a glance. Added per `/create-system` (2026-04-17 update).
>
> **Adaptation note**: this refactor system is not a work-item-flow system (no cron loop, no per-item chase). The DAG here models **phases of the refactor project** and **which cards run in parallel lanes**. `ORCHESTRATOR.md` is intentionally skipped (no chase rules / state-handler cron to define) — see X11 if you'd like to reinstate it.

```
[START: scaffold done]
        │
        ▼
  ┌────────────────── S1 FOUNDATION (Week 1) ──────────────────┐
  │  W01 Supabase baseline    →  flag: baseline                 │
  │  W02 Module audit         →  flag: audit_done               │
  │  W06 Dead code purge      →  flag: purged                   │
  │  W12 Compliance sweeps    →  flag: sweeps_done              │
  │  W11 /refactor-status     →  flag: dashboard_live           │
  │  W14 Auth + RLS audit     →  flag: auth_audited             │
  │  W18 Docs audit + archive →  flag: docs_audited    ← NEW    │
  └───────────────────────────┬────────────────────────────────┘
                              │
  MERGE G1: baseline ∧ audit_done ∧ purged ∧ sweeps_done ∧ auth_audited ∧ docs_audited
                              │  (sweeps_done = W12 Sweep 1 mechanical only; W12.02–.05 feed G4 via sweeps_done_full)
                              │  (dashboard_live is parallel, not gated)
                              ▼
  ┌────────────────── S2 SEATBELT + MAP (Week 2) ──────────────┐
  │  W03+W04 multi-tool harness → flag: seatbelt + wf_map       │
  │    (paired via W03_04_EXECUTION_PROTOCOL.md — 9 phases)     │
  │  W11.02 Modules dashboard tab → feeds batch review          │
  │  W22 CI gates (Husky + GH Actions) → flag: ci_enforced  NEW │
  │  W05 Drift detector       →  flag: drift_on                 │
  │  W15.01 RLS HIGH-risk     →  starts (payroll, salary, users)│
  │  W17 Component library    →  flag: components_chosen        │
  │  W19 MWP context refresh  →  flag: context_refreshed        │
  │  W21 React Query cache fix → flag: cache_fixed              │
  └───────────────────────────┬────────────────────────────────┘
                              │
  MERGE G2: seatbelt ∧ wf_map ∧ ci_enforced ∧ drift_on ∧ components_chosen ∧ context_refreshed ∧ cache_fixed
                              │  (seatbelt = P0-green subset of WORKFLOW_LEDGER)
                              │  (wf_map = inventory has P0 + stubs for non-P0)
                              │  (ci_enforced = W22 pre-push blocks red)
                              │
                              ▼
              S3 DESIGN (Week 3)  (HITL: accept X1..X12)
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              W07 prims   W08 tokens   W15.02..03 continue
                    │         │              │
                    └────┬────┘              │
                         │                   │ (parallel — no gate)
                  MERGE G3: prims ∧ tokens
                         │
                         ▼
  ┌────────────────── S4 MIGRATION (Weeks 4–5) ────────────────┐
  │  W13 PDP split            →  flag: pdp_split               │
  │  W09.01..W09.N modules    →  flag: modules_done            │
  │  W15.04..W15.N RLS finish →  flag: rls_restored            │
  │  W16 MFA                  →  flag: mfa_live         ← NEW  │
  │     (HITL per module: 7-day soak + user sign-off)          │
  └───────────────────────────┬────────────────────────────────┘
                              │
  MERGE G4: pdp_split ∧ modules_done ∧ rls_restored ∧ mfa_live ∧ sweeps_done_full
           (sweeps_done_full = W12.02 ∧ W12.03 ∧ W12.04 ∧ W12.05 all done)
                              │
                              ▼
                     S5 HARDEN (Week 5)
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
              W10 scaffolding        W20 Claude cron watchdog
              flag: skills_live      flag: watchdog_live  ← NEW
                   │                     │
                   └──────────┬──────────┘
                              │
              MERGE G5: skills_live ∧ watchdog_live
                              │
                              ▼
                [TERMINAL: refactor_complete → watchdog keeps it clean]

(side)  W05 drift PR comments feed back into Lane G per-module sign-off
(side)  W11 dashboard renders this whole file as a live view from Week 1 onward
(side)  W20 watchdog enforces W19 MWP pattern continuously after Week 5
(HITL)  S3 entry — user accepts X1..X12 before W07/W08 start
(HITL)  S4 per module — user signs off each 7-day soak before flag_unset
(HITL)  W20 escalations reach Telegram; user approves high-risk fixes

Tracks: CODE (W01→W02→W04→W07→W13/W09→W10)
        SECURITY (W14→W15.##→W16)
        VISIBILITY (W11 from Day 2)
        QUALITY (W18→W19→W20 — docs + context + watchdog)
        DESIGN (W17 → W07/W08)
All tracks run parallel; G4 waits for CODE + SECURITY; G5 waits for skills + watchdog.
```

## Lane map — which card runs where

| Stage | Week | Cards (run in parallel within the stage) | Merge gate |
|---|---|---|---|
| **S1 FOUNDATION** | Week 1 | W01 · W02 · W06 · W12 · W11 · W14 · W18 | G1: `baseline ∧ audit_done ∧ purged ∧ sweeps_done ∧ auth_audited ∧ docs_audited` (dashboard_live is parallel) |
| **S2 SEATBELT+MAP** | Week 2 | W03+W04 (paired) · W11.02 · W22 · W05 · W15.01 · W17 · W19 · W21 · W12.03 · W12.04 | G2: `seatbelt ∧ wf_map ∧ ci_enforced ∧ drift_on ∧ components_chosen ∧ context_refreshed ∧ cache_fixed` |
| **S3 DESIGN** | Week 3 | W07 · W08 · W15.02 · W15.03 · W12.02 · W12.05 | G3: `prims ∧ tokens` (after HITL X1..X12) |
| **S4 MIGRATION** | Weeks 4–5 | W13 · W09 · W15.04 · W15.05 · W16 | G4: `pdp_split ∧ modules_done ∧ rls_restored ∧ mfa_live ∧ sweeps_done_full` |
| **S5 HARDEN** | Week 5 | W10 · W20 | G5: `skills_live ∧ watchdog_live` |

**Legend**: `──▶` transition · `├──▶` fan-out · `MERGE: a ∧ b` merge gate · `(side)` passive flag · `(HITL)` human gate · `[TERMINAL]` exit

**Update this DAG when**: a W## card is added, a sequence becomes parallelisable, a new merge gate is discovered, a new HITL gate appears, or a terminal condition changes.

## Three layers (adapted to a project-plan system)

| Layer | Role | Artifact | Changes when |
|---|---|---|---|
| **DAG** (direction) | Phases, parallel lanes, merge gates, HITL gates, terminals. | This section of `SYSTEM_OVERVIEW.md` | Card added · parallelism discovered · new HITL gate |
| **Cards** (scope per lane) | One W## per refactor effort. Each card has its own 0→5 lifecycle when spawned via `/create-workflow`. | `workflows/W##_*.md` | Scope/cost of that effort changes |
| **Execution** (the actual work) | PRs + commits + tests. No cron. Human + Claude drive each card through its W##_STATE.md lifecycle. | Git history + per-card `WORKFLOW_STATE.md` | Every merged PR |

Standard `ORCHESTRATOR.md` is for cron-driven item-flow systems (quotations, WP apps). This system executes through PRs, not state-handler ticks — the DAG + per-card WORKFLOW_STATE is sufficient.

## Context diagram

```
┌──────────────┐        ┌─────────────────────┐        ┌────────────────┐
│ Staff browser│──auth──▶│                     │──sql──▶│ Supabase (prod)│
│ (desktop+mob)│        │   AppBase React app   │        └────────────────┘
└──────────────┘        │   your-app.example.com    │──api──▶┌────────────────┐
                        │                     │        │ WhatsApp Biz API│
┌──────────────┐        │   src/modules/*     │        └────────────────┘
│ Claude agents│──api──▶│   src/shared/*      │──api──▶┌────────────────┐
│ (email,      │        │                     │        │ Gmail / NAS    │
│  WhatsApp)   │        └─────────────────────┘        └────────────────┘
└──────────────┘                  ▲
                                  │ seatbelt
                            ┌─────┴──────┐
                            │ Playwright │
                            │ (CI gate)  │
                            └────────────┘
```

## How to review (30-sec ritual)

1. Scan backlog table — flag any card that looks wrong
2. Scan X1..X12 decisions — accept `[default]`s silently or override per row
3. Pick top 🔴 Now card you want me to `/create-workflow` next (default: **W01**)

**For the execution plan** (how each card actually gets done, week by week, per-card lifecycle, weekly rhythm, risk register, definition of done): see [EXECUTION_PLAN.md](EXECUTION_PLAN.md).

## Backlog

| # | Card | Tier | Status | Automation | Needs from you |
|---|---|---|---|---|---|
| W01 | [Supabase baseline + staging](workflows/W01_SUPABASE_BASELINE.md) | Now | 🟢 | 👤 manual | — (closed 2026-04-18) |
| W02 | [Module inventory audit](workflows/W02_MODULE_INVENTORY.md) | Now | 🟢 | 🤖 | — (closed 2026-04-18) |
| W03 | [Workflow inventory audit](workflows/W03_WORKFLOW_INVENTORY.md) | Now (S2) | 🟡 | 👀 HITL + 🤖 T1/T2 autodiscovery | `/explore-all-modules` complete 2026-04-19. Ledger: 144 rows · 100 green · 39 needs_skill · 1 failed. All 47 active modules captured. P0 score 6/19. Paired with W04. |
| W03.04 | [W03+W04 Execution Protocol](workflows/W03_04_EXECUTION_PROTOCOL.md) | Now (S2) | 🔵 spec locked 2026-04-18 | spec | 9-phase plan · multi-tool evidence · T1/T2/T3 tiering |
| W04 | [Multi-tool evidence harness (Playwright + Supabase + NAS + Gmail + ghost-os)](workflows/W04_PLAYWRIGHT_SEATBELT.md) | Now (S2) | 🟡 | hybrid | UI + DB + NAS runners live, 16 @p0 specs green. Gmail + ghost-os runners pending. Scope expanded 2026-04-18 from Playwright-only to 5-tool harness. |
| W05 | [Drift detector](workflows/W05_DRIFT_DETECTOR.md) | Now (S2) | 🟡 | 🤖 | **⏰ Next check Fri 2026-04-24** — `bash scripts/drift_weekly_digest.sh`; flip 🟢 if digest shows non-zero churn + rule-delta. **Done 2026-04-19**: dep-cruiser 17.3.10 + 4-rule config + `drift:check`/`drift:graph` + weekly digest + baseline tag on origin at `pre-refactor-baseline` (`9201024`, 992 modules / 5 circular errors / 0 cross-feature leaks / 16 oversharing → W07). CI PR comments → W22. See [W05_DRIFT_BASELINE.md](research/W05_DRIFT_BASELINE.md). |
| W06 | [Dead code purge](workflows/W06_DEAD_CODE_PURGE.md) | **Now** | 🟢 | hybrid | — (closed 2026-04-18) |
| W07 | [Shared primitives design](workflows/W07_SHARED_PRIMITIVES.md) | Next | 🟡 | 👀 HITL | **Phase 2 ✅ — 70/70 primitives designed + built (2026-04-20 eod+2).** 44 → 70 in one day via 3 parallel build agents translating ~1800 LOC of Claude Design JSX from handoff `nl73fwyg`: form/ 11 (Input · Textarea · Select · Checkbox · Radio · Switch · DatePicker · FileUpload · Field · Progress · Stepper) + ui/ 9 (DataTable · TableHeader · DataRow · SortIcon · TableCheckbox · Pagination · PageBtn · MobileListCard) + charts/ 8 (ChartShell · AreaChart · BarChart · HBarChart · ChartTooltip · ChartLoading · ChartError · LegendRow) + shell/FilterPill. Plus AppHeader redesign from handoff `FmPJtwZw` (pixel lockup · Bell-first · 6px gap · glass 72/70 · mobile back-chevron). `tsc` + `build` green. 0 pending promote. Adoption: 44 (unchanged; kit lab-only until W09 consumes). **Flips 🟢 when ≥50% prod adoption from W09.** Earlier (eod): 45 primitives — S4a Heavyweight Detail 10 primitives + DetailPageFrame wrapper. Earlier: S4a Heavyweight Detail 10 primitives shipped: DetailPageFrame (one-stop wrapper) + PageShell · TabNav · Timeline · StatusTransitionModal · RelatedRecordsCard · ActivityLogTimeline · SendEmailDialog · LineItemsEditor (code/name/description split cols) · DestructiveConfirmDialog. Visual-verified at `/design-lab/heavyweight-detail`. 0/5 pages adopted — WAVE 2 per-page chats + W09 migrations next. Earlier: DashboardHeader shim over AppHeader · shell(11) · overlays(11) · dashboard(7) · atoms(3) · cells(4). Earlier batches below. **Phase 1 ✅ + Phase 2 in flight: 36 primitives live + 2026-04-20 DashboardHeader shim.** shell(11 · +SearchInput) + cells(4 · DateCell/DateTimeCell/CurrencyCell/NumberCell) + overlays(11) + dashboard(7) + atoms(3). **2026-04-20**: `src/components/DashboardHeader.tsx` rewritten as shim over `<AppHeader>` + `<ImpersonationBanner>` + page-heading block → 71 adopter pages inherit S-shell glass chrome with zero call-site edits (AppHeader indirect adoption 1/80 → 72/80). Direct per-page migration deferred to post-S4 Detail (`<PageShell>` spec lands there; cutover then is 5-min find-replace). **Phase 2 infra (eod+15i)**: typed Supabase client ([`lib/supabase/typed-client.ts`](../../src/lib/supabase/typed-client.ts) — fetchPage/fetchOne/fetchDropdown/fetchCount) · vitest + @testing-library wired (22/22 green). All S1/S2/S-shell/S3 primitives spec-match verified at [`/design-lab/overlays`](../../../src/features/design-lab/overlays/OverlaysLabPage.tsx). Toaster root-mounted; `ui/sonner` = shim; `DashboardHeader` = shim. Governance: [UNIVERSAL_COMPONENTS.md](UNIVERSAL_COMPONENTS.md) + `/use-primitives` skill. Remaining Phase 2 🔴 blocked on S4+ sessions (PageShell · Timeline · LineItemsEditor · Stepper · MobileDrawer · WorkflowProgressBar · MapCanvas · SpatialPicker · DrawingModal · IntegrationCard · KpiTile · Chart). |
| W08 | [Design system baseline](workflows/W08_DESIGN_SYSTEM.md) | Next | 🟡 | 👀 HITL | **Phase 3 effectively COMPLETE — 70/70 primitives designed · targeted pivot delivered eod+2 (2026-04-20).** All 3 micro-items closed: Stepper promoted · Progress bar shipped (Workflow/Card compositions ⚫ deferred) · Field primitive covers FormRow concept. Bonus: full form kit (11) + DataTable kit (9) + Chart kit (8) via one big `/design-prompt` → handoff `nl73fwyg`. AppHeader v2 via handoff `FmPJtwZw`. Remaining deferrals (S4b · S4c · S7 · S8 · S11 · S12 · KpiTile) flipped ⚫ — no W09 page blocks on them; build on-demand if needed. **W08 stays 🟡 only until W09 consumes the kit** (flip 🟢 at ≥5 page migrations with visual-verify green). No more full archetype sessions unless a W09 page blocks. Earlier: **Phase 3: 5 of 15 sessions ✅.** S1 · S2 · S-shell · S3 · **S4a** all shipped. Earlier: User plan pivot: stop doing full Claude Design sessions · do targeted micro-work: (a) promote Stepper (HTML already in handoff), (b) mini chat for S10 Progress primitives (WorkflowProgressBar · ProgressCard · CDW step strip), (c) mini chat for S6 Form FormRows (FormRow · FormField · FormSection — MobileDrawer already covered by existing Drawer). After: full focus on W09 migrations via `/w09-migrate` skill, one page at a time. Earlier: **Phase 3: 5 of 15 sessions ✅.** S1 · S2 · S-shell · S3 · **S4a** all shipped. S4a WAVE 1 (9 shared + DetailPageFrame) built + verified; WAVE 2 (5 parallel per-page chats) NEXT — tight scope: each chat composes DetailPageFrame + designs 2-3 page-specific atoms only (AgentPromptCard for Quotation · NASFolderMappingCard for Project · PersonRoleStatusPanel + WhatsAppThreadPanel for Person · etc). CDW+Spatial mapping deferred to S11 session. Earlier: **Phase 1 + Phase 2 ✅ · primary CTA LOCKED slate-700 (eod+11).** P1: Tailwind v4 + full LOCKED_PICKS `@theme` + `tokens.ts` + /design-lab/fonts + DESIGN_SYSTEM.md deprecated. P2: fonts locked app-wide (Roboto body + Geist Mono tabular + Geist Pixel opt-in) · shadcn `--primary`/`--destructive`/`--ring` remapped with primary = **slate-700 #334155 (10.7:1 AAA)** (user final pick; brief eod+8 slate-500 trial reverted; LOCKED_PICKS v3.1 amended zinc-700 → slate-700) · ThemeProvider hoisted to app root · `ThemeToggle` in DashboardHeader · heading scale + link + focus-ring tokenised · 7 `ui/*` retrofits · **violation audit — 5,556 sites / ~500 files** (W07 absorbs ~1.5-2k, W09 eats ~2.4k). **Phase 3 reframed (eod+10)**: original "motion primitives + /design-system page" moved to Phase 4. Phase 3 is now **6 Claude Design archetype sessions** via [claude.ai/design](https://claude.ai/design) — List/Table · Dashboard · Detail · Form · Settings · Tool. Each session produces archetype visual spec → W08 token refinements + W07 primitive(s) built to spec + 2 W09 proof modules. Plan: [CLAUDE_DESIGN_GAME_PLAN.md](CLAUDE_DESIGN_GAME_PLAN.md). Unblocks W07 Phase 2 primitive-by-primitive. W08 stays 🟡 until W09 consumes the audit. |
| W09 | [Per-module migration (umbrella)](workflows/W09_MODULE_MIGRATIONS.md) | **Now** | 🟡 | hybrid | **25 module runs since 2026-04-20 · MODULES_MANIFEST: 26 migrated · 11 inspected · 1 audited.** **2026-04-28**: cross-cutting Drawer + DataTable a11y bugfixes (every detail-drawer + every LIST-adopter benefits) surfaced via interactive `/generalworks` inspection; `/generalworks` testid props wired (repairs WF-0301). **2026-04-27**: W09 #24 `/auth/verify` + 4 specs · W09 #25-#26 `/comms` + `/competitoranalysis` + `/comms/pending` · `/quotations/:id` 100% primitive-composed. Today (2026-04-27): `/quotations/:id` reached 100% primitive-composed via 5 sequential passes — W23 #2+#3 promoted 3 design surfaces (FollowUpCard · CompetitorPricing · SpatialFeatureSelector) from 2 handoffs · W09 quotation-detail-body BIG migration relocated 9 sibling files (UnifiedQuotationView 2,544 LOC + 8 companions) into `src/features/quotations/components/` · cleanup pass closed 116 token violations + raw labels/buttons + inline Popover+Calendar · sanctioned-list aggressive-swap pass · domain-select wrapper internalization (3 of 4 `ui/*-select` now compose primitive `SearchableMultiSelect` directly). 3 primitive enhancements shipped (additive, backward-compat): `DatePicker.disabledDate` · `SMSOption.disabledMessage` · `SearchableMultiSelectProps.triggerTestId`. **19 modules show 🟢 migrated in MODULES_MANIFEST.json**. Final feature-folder grep state: 6a/6d/6e zero · 6b 6 sanctioned cross-feature · 6c 4 sanctioned bespoke (3 ProductPicker + 1 RHF form-array input). Earlier (2026-04-20 → 2026-04-26): dashboard · companylist+detail · serviceslist · clientprofiles+contactdetail · payslip · payment-management (shell + 3 sub-tabs) · projectlist · generalworks · productsservices · xero-settings · emailinbox · quotation-list · quotation-settings · quotation-create · peoplemanagement-list · peoplemanagement-detail. **Next up**: invoice-detail · project-detail (parallels W13 split) · quotationdetail manual-inspection + workflow-audit gates → production-ready flip. |
| W10 | [Scaffolding skills](workflows/W10_SCAFFOLDING_SKILLS.md) | Later | 🔴 | 🤖 | blocked |
| W11 | [Refactor dashboard page](workflows/W11_REFACTOR_DASHBOARD.md) | **Now** | 🟢 | 🤖 | — (Phase 1 closed) |
| W11.02 | [Modules dashboard tab](workflows/W11.02_MODULES_DASHBOARD_TAB.md) | Now (S2) | 🟢 | 🤖 | ✅ MVP shipped 2026-04-18 — live at /refactor-dashboard → Modules |
| W11.03 | [Primitives adoption dashboard tab](workflows/W11.03_PRIMITIVES_ADOPTION_DASHBOARD.md) | **Now** | 🟢 | 🤖 | **Shipped 2026-04-20.** `scripts/primitives-manifest-builder.mjs` + CLI · Vite dev-plugin at `/api/primitives-manifest` · tab live at `/refactor-dashboard → Primitives` with preview thumbnails + Designed/Built/Live status + 🚢 adoption count + per-row drawer with full iframe + Copy promote cmd button for pending primitives. 43 primitives tracked. Classifies adopters into prod/lab/test so "Live" means real-production only. Replaces hand-maintained DESIGN_CATALOG.md Adopted column. |
| W12 | [Compliance sweeps — Sweep 1 LEGACY (mechanical)](workflows/W12_COMPLIANCE_SWEEPS.md) | Now | 🟢 | hybrid | — (closed 2026-04-18, re-scoped; behavior changes moved to W12.02–.05) |
| W12.02 | [Sweep 1b — PAGINATE list views](workflows/W12.02_SWEEP_1B_PAGINATE_LIST_VIEWS.md) | Next | 🟡 | hybrid | **Part A 🟢 shipped 2026-04-19 (eod+15) · commit `09c68ad`** — `.limit()` safety net across 12 unbounded list queries (11 files). Audit rescoped 29 → 12 real fixes. **Part B deferred to post-W07 Phase 2** (needs `<DataTable>` primitive). |
| W12.03 | [Sweep 2 — RBAC role checks (8 + W12.03b 4)](workflows/W12.03_SWEEP_2_RBAC_ROLE_CHECKS.md) | — | 🟢 | hybrid | **Closed 2026-04-19** — W12.03 6 orphan gates via `/admin` module + W12.03b 4 live gates via new `rls_capabilities` rows (`change_user_role`, `manage_integrations`, `edit_ot_entries`) + existing `finance`. AuthContext +`hasCapability()`. 2 Index.tsx sites still deferred → W09. |
| W12.04 | [Sweep 3 — Timezone (177)](workflows/W12.04_SWEEP_3_TIMEZONE.md) | — | 🟢 | hybrid | **Closed 2026-04-19 · 58fd0ce → 01919bb** — 332/352 `format()` calls + all 9 `parseISO` swapped across 155 files in 10 batches. Flag `sweep_3_timezone_done` ✅. 20 NEEDS-HUMAN tail documented in [rule](../../../.claude/rules/timezone.md). |
| W12.05 | [Sweep 1c — HITL dynamic queries (250 audited)](workflows/W12.05_SWEEP_1C_HITL_DYNAMIC_QUERIES.md) | — | 🟢 | 👀 HITL | **Closed 2026-04-19 · `2e4d960`** — 209 LEGACY-FIX + 1 DROPDOWN applied; 22 PAGINATE → W12.02; 18 ALREADY-OK; 0 NEEDS-HUMAN. Flag `sweep_1c_hitl_done` ✅. |
| W13 | [ProjectDetailPage split (3,200L → 5 features)](workflows/W13_PROJECTDETAILPAGE_SPLIT.md) | Later | 🔴 | 👀 HITL | Q-W13-a..d |
| W14 | [Auth + RLS audit](workflows/W14_AUTH_RLS_AUDIT.md) | **Now** | 🟢 | 🤖 + 👀 | — (closed 2026-04-18 · Q-W14-a..d ✅) |
| W15 | [RLS per-domain rollout (umbrella)](workflows/W15_RLS_ROLLOUT.md) | Next | 🔴 | hybrid | — (Q-W15-a..d ✅ defaults) · unblocked by W14 ✅ |
| W15.01 | [Users + People RLS (identity)](workflows/W15.01_USERS_AND_PEOPLE_RLS.md) | Now (S2) | 🟢 | hybrid | **Closed 2026-04-19 — early flip, zero-consumer-impact verified.** All 4 identity-domain `ai_ro_select` dropped · `people` capability-based · `ai_readonly` role orphaned (0 connects, 0 consumers). Ledger 20 → 16. |
| W15.02 | [Payroll + Salary RLS](workflows/W15.02_PAYROLL_AND_SALARY_RLS.md) | Next (S3) | 🟡 | hybrid | **Part A 🟢 shipped 2026-04-19 (eod+15)** — plugged `worker_applications` `SELECT: true` leak (→ `has_module('HR Applications') OR is_admin()`). Migration `20260419_165635`. Seatbelt `tests/workflows/rls/worker-applications-rls.spec.ts @p0` green. Ledger 14 → 13. **Part B deferred to post-W17** — salary/pay_slips worker-self read + worker_leave_balance + worker_ot tightenings need multi-role test-user infra. |
| W15.03 | [Clients RLS](workflows/W15.03_CLIENTS_RLS.md) | Now (S2) | 🟢 | hybrid | closed 2026-04-19 as no-op — client domain was already capability-gated; matrix overstated scope; W15.03b reserved for tightening work if needed |
| W15.04 | [Projects + Quotations RLS](workflows/W15.04_PROJECTS_AND_QUOTATIONS_RLS.md) | Later (S4) | 🟢 | hybrid | **Closed 2026-04-19** — migration `20260419_160656_w15_04_projects_quotations_rls.sql` dropped `projects.ai_ro_select` + replaced `quotation_lifecycle_events.auth read lifecycle events` with `is_approved_user()` read. Service-role INSERT kept. Ledger 16 → 14. Sub-flag `rls_projects_and_quotations_done` ✅. |
| W15.05 | [Ops + Logs RLS](workflows/W15.05_OPS_AND_LOGS_RLS.md) | Later (S4-S5) | 🟢 | hybrid | **Closed 2026-04-19 (eod+14)** — 12 permissive policies dropped via `20260419_160554_w15_05_ops_logs_rls.sql`. 8 DROP-only (email_classifications · email_threads · modules · roles · services · trial_trenches · trial_trench_services · trial_trench_status_log) · 4 DROP+REPLACE with approved-read/admin-write (site_form_pdf_templates · whatsapp_threads · whatsapp_messages · whatsapp_participants). No new capability slugs. Ledger 14 → 2 (only W15.02 payroll remains for G4). |
| W16 | [MFA / 2FA](workflows/W16_MFA.md) | Next | 🔴 | 🤖 + 👤 | Q-W16-a..d |
| W17 | [Component library + test page](workflows/W17_COMPONENT_LIBRARY.md) | **Now** | 🟢 | 👀 HITL | — **CLOSED 2026-04-19 · X6 ✅** · all 7 slots locked + 3 cross-cutting patterns (CTA · glass · mobile data-table) · 3 mockups validated · full handoff in [LOCKED_PICKS.md](LOCKED_PICKS.md) · DESIGN_SYSTEM.md superseded · sets `components_chosen` ✅ |
| W18 | [Docs audit + archive](workflows/W18_DOCS_AUDIT.md) | **Now** | 🟢 | hybrid | ✅ Closed 2026-04-18 (reduced scope: 13 archived + 6 link fixes; per-module rewrites moved to W09) |
| W19 | [MWP context architecture (CONTEXT.md + decisions/lessons + TOKEN_BUDGET)](workflows/W19_MWP_CONTEXT.md) | Next (S2) | 🟢 | 🤖 + 👀 | — Closed 2026-04-19 · sets `context_refreshed` ✅ · 14 CONTEXT.md (6 new + 8 verified) · TOKEN_BUDGET.md shipped + indexed · 3 workspaces seeded with decisions/lessons (refactor-dashboard · supabase/migrations · tests/workflows) · root CLAUDE.md memory-reading rule landed |
| W20 | [Claude-powered cron watchdog](workflows/W20_CRON_WATCHDOG.md) | Later | 🔴 | 🤖 | Q-W20-a..e |
| W21 | [React Query cache fix (edit→back stale bug)](workflows/W21_REACT_QUERY_CACHE_FIX.md) | **Now** | 🟢 | hybrid | **Formal CLOSED 2026-04-19 (eod+15)** — all 4 implementation tasks shipped earlier (`28dedce`/`f6b513f`/`016219b`/`e38d94e`) + WF-0099 cache-staleness Playwright gate now green in commit `95e2959`. @p0 suite 16/16 desktop+mobile green. |
| W22 | [CI gates — Husky pre-commit/pre-push + GH Actions](workflows/W22_CI_GATES.md) | Now (S2→S3) | 🟢 | 🤖 | **Closed 2026-04-19 · all structural done-when met.** Ledger auto-sync job shipped · lint-staged restored · full ESLint gate (max-warnings=1610) · WF-0019 back in @p0 with 3/2s/5s/15s NAS retry · CI auto-skips NAS-deps + caps smoke at SMOKE_MAX_ROUTES=20. Flag `ci_enforced` ✅. Gmail-sync 5xx observability → W04-P5b (separate card). |
| W23 | [Design-lab handoff staging (/design-lab/handoffs)](workflows/W23_DESIGN_LAB_HANDOFF_STAGING.md) | **Now** | 🟢 | hybrid | **Shipped 2026-04-19 (eod+19) · 2 live promotions today.** **W23 #1 (2026-04-26)**: handoff `2026-04-26-LWwN0H4g` staged + promoted `<WhatsAppThreadPanel>` primitive (411 LOC) → `src/components/primitives/detail/`. Composes `Card` + `Badge` + `Switch` + `Textarea` + `Button` + `Tooltip`; variants `surface=card\|bare` · `compact`; supports failed-send banner + Resend + char counter (added in W23 #1.1 same day). Adopted by PersonWhatsAppSection (W09 #18 deferral closed) + QuotationWhatsAppTab. Orphan-deleted 3 files in `src/components/comms/` + empty dir. **Earlier (2026-04-19)**: Vite dev-plugin serves `docs/.../handoffs/**` at `/docs-assets/handoffs/*` + index JSON · route `/design-lab/handoffs` with sidebar (snapshot list + diff chips) / main (iframe preview) / files-panel (per-file "Copy promote cmd") · `/design-import` revised: STAGE mode writes to `docs/.../handoffs/<YYYY-MM-DD>-<short-hash>/` + computes diff-vs-prior + MANIFEST.json + auto-archive >5 · `--promote <file>` applies mapped Edit. `tsc` + `build` green. |

Tier: Now / Next / Later · Status: 🔴 planned · 🟡 in progress · 🟢 production · ⚫ dropped
Automation: 🤖 auto · 👀 HITL · 👤 manual · hybrid

## Dependency graph (roll-up — see DAG above for full lane detail)

```
  CODE TRACK                                    SECURITY TRACK        VISIBILITY

  W01 baseline ──┐                              W14 audit ──┐
  W02 audit ─────┤                                          │
  W06 purge ─────┼─▶ G1 ─▶ W04 ──┐                          │
  W12 sweeps ────┘               │                          │
                                 ├─▶ G2 ─▶ W07 ──┐          ▼
  W03 map ───────▶ G2            │         W08 ─┼─▶ G3 ─▶ W15.## (per-domain)
  W05 drift ─────▶ G2            │               │                │
                                                  │               │    W11 dashboard
                                                  └─▶ W13 ──┐     │    (parallel from
                                                       W09  ┼─────┘     Week 1 onward)
                                                   W16 MFA ┤
                                                            │
                                                       G4 ──┴─▶ W10 ─▶ G5 ─▶ [done]
```

Three tracks run in parallel: **CODE** (structure refactor), **SECURITY** (RLS + MFA), **VISIBILITY** (dashboard from day one).

## Cross-cutting open decisions

Scan this table; accept `[default]`s silently or override any row. ✅ committed · 🟡 default-pending-confirm · 🔴 open.

| # | Topic | Status | Where decision lives |
|---|---|---|---|
| X1 | System location | ✅ | `docs/99-refactor/_system/` |
| X2 | Feature-flag strategy | ✅ | env `VITE_FF_*` + `useFeatureFlag` hook — no paid service |
| X3 | Playwright auth strategy | ✅ | `storageState.json` per worker, seeded admin test user |
| X4 | Supabase baseline approach | ✅ | **Resolved 2026-04-18 in W01**: Path B — live-DB + Supabase Pro daily backups (no branching). Path A (nuclear baseline reset for branching) **deferred to Week 5 S5** after W09 module migrations rebuild local-files ↔ prod parity. Research found only 7 of ~365 local migration files match the 371 prod migrations — drift too severe for a one-shot reset to be worth the current prod op. |
| X5 | Shared primitives folder | ✅ | Bulletproof React — `src/features/<name>/` + root `components/ ui/ hooks/ lib/ utils/` |
| X6 | UI library baseline | ✅ | **Resolved 2026-04-19 in W17**: shadcn baseline kept · augmented with TanStack Table (data tables) · Tremor (charts/KPI) · Motion for React (micro-interactions + signature moments) · vaul (mobile drawer) · Magic UI NumberTicker (count-ups) · Aceternity-style scroll-beam (timeline). 7 real-choice slots locked + 3 cross-cutting patterns: **CTA = `zinc-700` strong-grey near-black** (NOT red — Linear/Vercel pattern), **brand red kept as ACCENT only** (status badges, dots, focus rings), **glass header** + subtle gradient page backdrop on every page, **mobile tables = stacked card-rows** (no horizontal scroll), **optional translucent Card variant** for marketing/hero surfaces. Full picks + W07/W08 token spec in [LOCKED_PICKS.md](LOCKED_PICKS.md). DESIGN_SYSTEM.md formally deprecated (superseded by W08 token-spec rewrite). |
| X7 | Module folder shape | ✅ | `src/features/<name>/` with colocated `components/ api/ hooks/ types/` + barrel `index.ts` |
| X8 | Drift detector + MWP discipline | 🔴 | **Expanded — 3 tracks, resolves across W05 + W18 + W19 + W20.** (a) Code boundaries via dependency-cruiser (W05) · (b) Docs cleanup + MWP CONTEXT.md architecture + decisions/lessons (W18 + W19) · (c) Continuous enforcement via Claude cron watchdog (W20). Ultimate goal: any future prompt lands correctly, no drift. **Tracker 2026-04-19**: user accepted keeping 🔴 open — flips ✅ only when all 4 cards close. |
| X9 | Refactor dashboard source | ✅ | `/refactor-status` parses `SYSTEM_STATE.md` at Vite build via `?raw` + react-markdown + remark-gfm |
| X10 | Supabase baseline: CLI or MCP? | 🟡 | **Deferred to Week 5** along with Path A. When Path A runs, one-time CLI exception applies: `supabase db dump --linked --schema-only` → reset `schema_migrations` → declarative `schemas/` going forward. Until then, MCP-only discipline holds (CLAUDE.md rule 4 unchanged). **2026-04-19**: user accepted keeping 🟡 deferred — "till after finish everything then we try". |
| X11 | Create `ORCHESTRATOR.md`? | ✅ | Skip — no cron loop / work-item flow; DAG + per-card WORKFLOW_STATE is sufficient. |
| X12 | RLS strategy + Playwright matrix | ✅ | **Resolved 2026-04-18 in W14**: **capability-based — keep + extend existing framework**. Verified via RLS_STATE_MATRIX: 77% of tables (125/163) already have real capability-based policies; framework has 8 live functions (`has_capability`, `is_admin`, `is_finance_role`, `can_manage_projects`, `can_manage_quotations`, `is_field_or_above`, `is_approved_user`, `is_super_admin`) + 23 role-capability mappings. W15 rolls out per-domain (W15.01–.05 HIGH-risk first). Playwright RLS matrix in W04. 3-layer drift tracking (ledger + COMMENT ON POLICY + watchdog SQL) ensures no permissive policy survives to G4 per Q-W14-d. Live counter rendered on `/refactor-dashboard` once W11.02 ships. |

**Per-card Q-W## questions** — tactical within-workflow choices, resolved at each card's 0_INTAKE stage before `/create-workflow` fires.

## Recommended first build order

Per the DAG lanes (see **Lane map** table above for full detail):

- **S1 FOUNDATION (Week 1, parallel)** — W01 · W02 · W06 · W11 · W12 · W14 · W18 → MERGE G1
- **S2 SEATBELT+MAP (Week 2, parallel)** — W04 · W03 · W05 · W15.01 · W17 · W19 · W21 → MERGE G2
- **S3 DESIGN (Week 3, parallel, after HITL X1..X12 accepted)** — W07 · W08 · W15.02-03 → MERGE G3
- **S4 MIGRATION (Weeks 4–5, parallel)** — W13 · W09.01..N · W15.04..N · W16 → MERGE G4
- **S5 HARDEN (Week 5)** — W10 · W20 → MERGE G5 → terminal + watchdog-maintained

Where each stage/card appears in the week-by-week calendar: [EXECUTION_PLAN.md](EXECUTION_PLAN.md#5-week-calendar).

## Research drill-downs (complete)

- [research/REPO_AUDIT.md](research/REPO_AUDIT.md) — 🟢 complete (324 lines)
- [research/REFACTOR_BEST_PRACTICES.md](research/REFACTOR_BEST_PRACTICES.md) — 🟢 complete (1819 words)

### Top findings from research (blunt)

**From REPO_AUDIT (current state):**
- **34 Supabase query violations** — 8% of `.select()` calls missing `.range/.limit/.single` (silent truncation risk at 1,000 rows)
- **8 hardcoded role checks** violating module-based RBAC (CLAUDE.md rule 2)
- **ProjectDetailPage is 3,200 lines** handling 5 workflows — single-biggest refactor target
- **8 major duplication clusters** spanning 45 files (contact forms, pickers, badges, etc.)
- **177 raw `date-fns` vs 75 `timezoneUtils`** — 58% timezone-compliance gap
- **5 backup files** cluttering `src/pages/` — delete in W06
- 20+ modules, 87 pages, 565 components, 112 hooks, 88 services
- 15 strong shared-primitive candidates; **~40% component-code reduction** achievable

**From REFACTOR_BEST_PRACTICES (industry defaults):**
- Feature flags: `VITE_FF_*` env vars + `useFeature()` hook (zero deps; upgrade to PostHog only if %-rollouts needed)
- Folders: **Bulletproof React** — `src/features/<name>/` + shared primitives at root (`src/components/`, `src/hooks/`, `src/lib/`)
- React Query: per-feature **query-key factory** (tkdodo), `queryOptions()` for new code, optimistic `onSettled` invalidation
- Playwright: **setup-project + storageState**, Supabase REST login (no UI flow), dedicated test user + `is_test_data` tagging, **10 critical flows not 100**
- Supabase recovery: `pg_dump` archive → reset `schema_migrations` → `supabase db pull` baseline → declarative `schemas/` + `db diff` going forward (**one-time CLI exception**)
- Fonts: **Geist Sans + Geist Mono + Instrument Serif**. Inter is the new AI-slop default — avoid
- Motion: package renamed `framer-motion` → `motion`, import `motion/react`
- Dead code: **knip** (ts-prune is deprecated; author recommends knip)
- Drift: **dependency-cruiser** (fails CI on boundary violation) + `ls-tree` weekly diff
- Dashboard: Vite `?raw` + `react-markdown` + `remark-gfm` (20-line component)
- **Pitfall pattern** from 5 public post-mortems: scope creep kills in-place refactors. Pick 2 of 5 axes for weeks 1–3.

## Handoff after this review

Once you accept defaults or override:

1. I update each card's open questions — replace `[default]` with ✅ accepted or your answer
2. Tag current `main` as `pre-refactor-baseline`
3. Run `/create-workflow` on W01 first
4. Execute W01's 0_INTAKE → 5_DEPLOY lifecycle

**Do NOT start building any W## card until defaults are accepted.** This is the half-cooked protection.

## Related

- [RAW_REQUIREMENTS.md](RAW_REQUIREMENTS.md) — intake verbatim
- [EXECUTION_PLAN.md](EXECUTION_PLAN.md) — 5-week calendar + per-card lifecycle
- [SYSTEM_STATE.md](SYSTEM_STATE.md) — rolling dashboard
- [workflows/](workflows/) — 21 W## cards
- [research/](research/) — evidence base
- Root [CLAUDE.md](../../../CLAUDE.md) — hard rules
- [CORE_PRINCIPLES.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md) — tenets this follows
