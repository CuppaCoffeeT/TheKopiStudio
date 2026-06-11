# Codebase Deep Research — State of the AppBase Trench Trace Portal

**Created**: 2026-05-29 10:30:00 SGT
**Last Updated**: 2026-05-29 10:30:00 SGT
**Status**: 🟢 Production (point-in-time snapshot)
**Priority**: 🔴 Critical

## 📋 Overview

Full-codebase deep-research snapshot produced by 4 multi-agent workflows (~107 subagents) plus direct tool runs (`npm run build`, `npm run lint`, `npm run drift:check`, live Supabase `get_advisors`). Every high-severity claim is **tool-verified AND adversarially re-checked**; refuted claims are listed in §9 so the rest can be trusted. This is the baseline the whole-codebase remediation program ([REMEDIATION roadmap](#10--remediation-roadmap-how-to-proceed)) builds on.

**Method:** fan-out across 5 angles (architecture · data model · tech debt · design-system/W09 · testing/CI/ops) → each finding re-verified against source with `file:line` citations → refuted findings dropped → synthesis. Coverage gaps: build reproduced (12.3 MB chunk) but not runtime-profiled; schema sampled via advisors + generated types, not an exhaustive 137-table read.

## 📚 Related Documentation
- [ARCHITECTURE_BLUEPRINT.md](ARCHITECTURE_BLUEPRINT.md) — target `src/` shape (needs update: documents 2 component tiers, reality is 4)
- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) · [SYSTEM_STATE.md](SYSTEM_STATE.md) — refactor DAG + live dashboard
- [DESIGN_CATALOG_PRIMITIVES.md](DESIGN_CATALOG_PRIMITIVES.md) — primitive inventory (stale count: says 105/115, actual 144)
- [.claude/commands/w09-migrate/](../../../.claude/commands/w09-migrate/) — per-module migration skill + compliance greps
- [docs/99-meta/TOKEN_BUDGET.md](../../99-meta/TOKEN_BUDGET.md) — doc size ceilings

---

## 1. Headline

The refactor is **mid-stream and directionally correct**. Feature folders are ~95% clean and aggressively decomposed. The remaining work is **structural and lives outside the feature layer**: drain `services/`, split the god-files, break the primitive barrel cycles, finish the shared-shadcn phase-out, and turn aspirational gates (drift/LOC) into enforced ones. The single genuinely urgent item is the **2 anon-readable `SECURITY DEFINER` views**.

> **Correction (post-publish):** Finding #1 below originally read "lint gate RED / cap 1460". That was a **stale read** — the actual cap is `--max-warnings=1610` (`package.json:10`, raised in commit `3a6d2191` "w22: raise ESLint cap 1460 → 1610"), and `npm run lint` exits **0** (1,508 < 1,610). The lint gate is **GREEN** with 102 headroom. The real issue is warning *debt* + the cap not being single-sourced, not a block. Corrected in the table and §10 below.

- ~349k LOC src · 1,599 `.tsx` + 1,260 `.ts` · 1,041 docs · 56 feature folders · 426 migrations.
- `features/` holds 236,930 LOC / 2,184 files. Two features = 21.5% of the app: `projects` (30,842) + `quotations` (20,219).

## 2. Folder structure — pre-W09 (≈Apr 16, `ce21a83`) → now

| Top-level | Then | Now | Verdict |
|---|--:|--:|---|
| `features/` | 0 | 56 folders / 2,310 files | 🆕 Bulletproof-React destination |
| `pages/` | 86 | 12 | thinned 86% → route shells |
| `components/` domain dirs | 47 | 21 | dissolving into features/primitives/shared |
| `components/primitives/` | 0 | 144 `.tsx` | 🆕 design system (1 approved deviation) |
| `components/shared/` | 9 | 43 | cross-feature promotion layer |
| `services/` | 99 | 83 (40,937 LOC) | 🟠 transitional → `features/*/api/` |
| `config/ · constants/ · styles/` | present | present, untouched | 🟠 transitional, none absorbed |

**Moved:** `pages/*`(thick) → `features/<x>/pages/` + thin re-export · `components/<domain>/*` → `features/<x>/components/` (26 domains evacuated) · `services/<x>Service.ts` → `features/<x>/api/` (half done — 24/56 features have `api/`).

## 3. Compliance reality (the headline correction)

Re-ran the 5 W09 greps on **code only** (`.ts/.tsx`, excluding `.md`), then opened every hit:

| | Count |
|---|--:|
| Features fully clean (real violations = 0) | **53 / 56** |
| **Genuine production-code violations, entire repo** | **1** — `supervisor/.../GeneralWorksFileManager.tsx:17` → `import { NASFilePicker } from '@/components/project-management/NASFilePicker'` |
| Violations in 2 intentionally-exempt sandboxes | design-lab (60) + refactor-dashboard (36) |
| Raw-grep hits that were comment/JSDoc noise | 12 |

The "147 raw `ui/` imports / gate flunking everywhere" reading is an artifact of counting comments, `.md` docs, and the two dev sandboxes. **The real shadcn debt is OUTSIDE the gate's blast radius:** the 5 greps only scan `src/features/`. Raw `@/components/ui/*` in **`src/components/*` (234) + `src/pages` (47) = 281** code-only imports are invisible to W09.

## 4. The 9 errors — explained (all tool-verified)

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 1 | ~~**Lint gate RED**~~ → **CORRECTED: lint GREEN, warning-debt only** | 🟡 Med | `npm run lint` exits **0**: **1,508 warnings < 1,610 cap** (`package.json:10`, raised W22). Real issue: cap duplicated 3× + carries slack + 1,358 `any` |
| 2 | **2 `SECURITY DEFINER` views readable by anon key** | 🔴 High | `get_advisors` 2 ERROR: `project_spatial_features_denormalized`, `quotations_with_spatial_summary` |
| 3 | **53 circular deps in primitives barrels** | 🔴 High | `drift:check`: `RichTextEditor → shell/index → … → form/index → RichTextEditor` |
| 4 | **Single 12.3 MB JS bundle** (3.15 MB gzip), 2 `lazy()` | 🟠 Med | `npm run build` `index-D7TtjZq9.js 12,273 kB` |
| 5 | **196 dependency-cruiser violations, gate wired into NOTHING** | 🟠 Med | `drift:check` = 142 cross-feature + 53 circular + 1 page→feature; `grep drift .husky .github` = 0 |
| 6 | 5 always-true RLS + 192 mutable-`search_path` fns + auth gaps | 🟠 Med | `get_advisors`: `rls_policy_always_true`×5, `function_search_path_mutable`×192 |
| 7 | 1,292 `any`-escapes; 251 files >200 LOC | 🟠 Med | grep + `wc -l` (22 in features, 94 components, 70 services, 33 hooks, 18 utils, 8 pages) |
| 8 | CI @p0 ≈ Login + 5-route smoke; real coverage in (red) pre-push | 🟠 Med | `seatbelt.yml`, `.husky/pre-push` |
| 9 | Tracking docs stale (primitives 144 vs 115/105); SANCTIONED whitelist out of sync across 3 mirrors | 🟢 Low | `find` vs doc text |

### Plain-English explanation of each

1. **Lint warning debt (NOT a red gate — corrected).** `npm run lint` runs `eslint . --max-warnings=1610` (cap raised W22, commit `3a6d2191`); the repo has **1,508 warnings, 0 errors** → **under cap → exits 0 → GREEN** (husky `pre-push` + CI both pass). The earlier "RED at 1460" was a stale read I propagated without checking `package.json` directly. The genuine issues: the cap literal is duplicated across 3 files (package.json / pre-push / seatbelt.yml) and carries ~102 of slack, and the 1,508 warnings are mostly `no-explicit-any` (1,358) — debt to ratchet down, not a block. **Fix:** single-source the cap, lower it to the exact count (~1,501) so new code can't grow it, add a `no-explicit-any` baseline ratchet. **Effort: S.**
2. **2 anon-readable `SECURITY DEFINER` views.** A `SECURITY DEFINER` view runs with the *view owner's* rights, bypassing the querying user's RLS. Both views are granted to `anon`+`authenticated` and have no `auth.uid()` filter → anyone with the public anon key can read quotation + client-name data. **Fix:** recreate both with `security_invoker=true` (PG15+; underlying `spatial_features` already has SELECT RLS, so a clean swap). Apply via Supabase MCP `apply_migration`. **Effort: S, urgent.**
3. **53 circular deps in the primitives barrels.** Cross-group primitives import each other's group `index.ts` barrel, forming cycles (e.g. `RichTextEditor` → `shell/index` → `AppHeaderShell` → `NotificationsBell` → `overlays/index` → … → `form/index` → `RichTextEditor`). Cycles defeat tree-shaking (feeds the 12 MB bundle) and create fragile init order. Because every feature imports these barrels, the cycles ripple system-wide. **Fix:** cross-group primitives import the concrete sibling file (`../overlays/Tooltip`), never the group `index.ts`; barrels re-export only. **Effort: M, mechanical.**
4. **Single 12.3 MB bundle.** Only 2 `React.lazy()` calls exist app-wide (both in `QuotationDetail.tsx`); no `manualChunks`. All ~70 routes ship in one `index-*.js` of 12,273 kB (3,154 kB gzip). Slow first load. **Fix:** route-level `React.lazy` + `<Suspense>` in the layout; split super-admin/heavy-dep features (invoices/exceljs, comms/leaflet, pdf/jspdf) first. Needs #3 done to actually tree-shake. **Effort: M.**
5. **196 drift violations, gate unwired.** `dependency-cruiser` reports 196 errors (142 cross-feature deep imports + 53 circular + 1 page→feature) but `drift:check` is in neither husky nor CI — the config header even claims "CI-wired in W22" (false). So the "features are islands" rule is decorative and drift accrues silently. **Fix:** fix the 53 circular + 1 page→feature now, baseline the 142, wire into pre-push/CI with a ratchet. **Effort: M.**
6. **5 always-true RLS + 192 mutable search_path + auth gaps.** `rls_policy_always_true`×5 (`project_form_imports`, `workflows`, `workflow_runs`, `workflow_incidents`, `xero_webhook_events`) = any authenticated user can CRUD them. 192 `SECURITY DEFINER` functions have mutable `search_path` (hardening, not an open hole — `CREATE` is revoked on `public`). Auth WARNs: leaked-password protection off, long OTP expiry, outdated Postgres, public `whatsapp-maps` bucket allows listing. **Fix:** capability/module predicates on the 5 tables; batch `ALTER FUNCTION … SET search_path=public,pg_temp`; flip the dashboard auth toggles. **Effort: S–M.**
7. **1,292 `any`-escapes; 251 files >200 LOC.** `: any`×893, `as any`×198 (worst clusters: Xero/claims/invoices, masking Supabase row-shape drift). 251 files exceed the 200-LOC decomposition target — but only **22 are inside `features/`** (13 of those in sandboxes); the rest: `components/` 94, `services/` 70, `hooks/` 33, `utils/` 18, `pages/` 8. **Fix:** `no-explicit-any` + per-file LOC ESLint ratchets (warn now, error on net-new). **Effort: M, ongoing.**
8. **CI @p0 is thin.** The CI seatbelt = Login + a 5-route smoke (`SMOKE_MAX_ROUTES=5` after OOMs; WF-0012/WF-0019 auto-skip on ubuntu). The real workflow coverage runs in pre-push — which is currently blocked by the red lint gate (#1). So green CI ≠ healthy app. **Fix:** larger runner or shard the route smoke; and unblock #1. **Effort: M.**
9. **Stale tracking docs.** `find src/components/primitives -name '*.tsx'` = 144, but `primitives/CONTEXT.md` says 115 and `DESIGN_CATALOG_PRIMITIVES.md` says 105. The SANCTIONED whitelist (the W09 gate's allow-list) is out of sync across its 3 mandated mirrors (`company-email-modal` present in `primitive-coverage.md`, absent in `closing-checklist.md`) → the gate flags a legitimate import. **Fix:** filesystem-read manifest as source of truth; single-source SANCTIONED. **Effort: S.**

## 5. Transitional folders — the settle plan

These were supposed to be deprecated/removed post-migration but persist:

| Folder | Now | Target | Settle play |
|---|---|---|---|
| `services/` | 83 files / 40,937 LOC | `features/<x>/api/` | Per-feature: move `<x>Service.ts` → `features/<x>/api/`, split if >200 LOC, update imports, delete original. Cross-cutting services (email, xero, whatsapp, nas) → `src/lib/<domain>/` or a shared `api/`. Biggest single W09 chunk. |
| `config/` | `agentRegistry.ts` | `lib/` or `integrations/` | Move 1 file → `src/lib/agentRegistry.ts`; delete folder. **Effort: S.** |
| `constants/` | `workerConstants.ts`, `leaveTypes.ts` | `utils/` or feature `types/` | `leaveTypes` → `features/leaves/`; `workerConstants` → `utils/` or `features/workerlist/`. **Effort: S.** |
| `styles/` | `payslip-print.css` | `features/payslip/` or `index.css` | Co-locate with payslip; delete folder. **Effort: S.** |

`config/constants/styles` are ~30 minutes total. `services/` is the real program (see roadmap §10).

## 6. Component tiers (real model = 4; blueprint documents 2)

| Tier | Path | Rule | Count |
|---|---|---|--:|
| Primitive | `components/primitives/<group>/` | stateless, design-spec-backed; import when a Need→Import row exists | 144 |
| Sanctioned `ui/` | `components/ui/` | shadcn + 16 domain wrappers (already primitive-composed) | ~89 |
| Shared cross-feature | `components/shared/<domain>/` | used by ≥2 features → promote here, don't mirror | 43 |
| Feature-local | `features/<x>/components/` | used by exactly 1 feature | — |

## 7. Feature scorecard highlights

- 236,930 LOC / 56 features / 2,184 files. Domains: quotations-projects 26.6% · claims-invoices 12.3% · supervisor-workentry 11.3% · hr-payroll 11.0% · dashboards 6.6%.
- Feature folders aggressively decomposed — biggest *production* file is `QuotationDetail.tsx` (256 LOC).
- `projects` table is the keystone — touched by ~20 features; widest schema-change blast radius (with `client_companies`, `client_contacts`, `people`, `worker_ot`).
- 24/56 features have `api/`; the 32 without are mostly by-design (shared-service or service-layer features).

## 8. DRY / consolidation targets

| Target | LOC | Play |
|---|--:|---|
| `services/invoicesService.ts` | 2,802 | split queries/mutations/pdf/xeroSync → `features/invoices/api/` |
| `utils/queryKeys.ts` | 2,509 | per-domain modules behind a thin barrel; keep `queryKeys.x.y()` API (419 importers); type the 77 `queryClient: any` |
| `services/claimableItemsService.ts` | 2,256 | query/mutation/mapping split; decompose `useClaimableItems.ts` (1,475) same pass |
| supervisor↔trialtrench↔workerot↔supervisor-drafts | — | one "worker-ops" domain split across 4 folders (142 cross-feature edges); promote shared row-builders/OT-pickers to `shared/` + `hooks/` |
| 281 raw-shadcn imports in `components/*`+`pages/` | — | W-card; extend W09 greps to scan there |
| StatusBadge family (~12 hand-rollers) | — | collapse to canonical `Badge` + per-feature tone map |

## 9. False alarms (refuted by verification)

- "56 of 64 primitives have zero adopters" → false; 1,197 real primitive imports across features.
- "Capability RLS used in only 2/298 policies" → false; ~150 route through `has_capability()`.
- "Many tables at 0 rows" → stale planner estimates; live `count(*)` shows them populated.
- "PhotoUploadStep reimplemented 3×" → 2/3 use primitive `FileUpload`; real overlap ~18 LOC.

## 10. Remediation roadmap (how to proceed)

Sequenced so each phase unblocks the next. Detailed execution plans tracked as W-cards.

**Phase 0 — Stop the bleeding (days, S effort).**
1. Recreate the 2 `SECURITY DEFINER` views with `security_invoker=true` (#2) + replace 5 always-true RLS + flip Supabase auth toggles + lock `whatsapp-maps` bucket (#6). 2. Single-source the lint cap + lower to exact (#1, gate already green). 3. Single-source the SANCTIONED whitelist + fix primitive counts to 144 (#9). See [REMEDIATION_MASTER_PLAN_2026-05-29.md](REMEDIATION_MASTER_PLAN_2026-05-29.md) for the full sequenced program.

**Phase 1 — Make gates real (1–2 wks, M).**
5. Break the 53 primitive cycles (#3). 6. Wire `drift:check` + `no-explicit-any` + per-file LOC ratchets into pre-push/CI with baselines (#5, #7). 7. Extend W09 greps to `components/*` + `pages/` and W-card the 281 shared-shadcn imports.

**Phase 2 — Structural debt (multi-wk, L).**
8. Route-level code-splitting (#4). 9. Drain `services/` into `features/*/api/`; split the 3 god-files + `queryKeys.ts` (§8). 10. Dissolve `config/constants/styles` (§5). 11. Consolidate the worker-ops cluster.

**Phase 3 — Canonicalize + finish (parallel, M).**
12. Update ARCHITECTURE_BLUEPRINT to 4 tiers + absorb transitional folders. 13. Author the canonical entry-doc set (how the app works · create-module · delete-module · compliance-check) + primitive/shared indexes. 14. Doc remediation (over-budget/stale/conflicting — per the `doc-canon-audit` sweep). 15. Finish the ~16 unmigrated features.

---

*Snapshot produced 2026-05-29 via multi-agent deep research. Numbers are point-in-time; re-run the workflows to refresh. Supersede this file rather than editing it once the remediation program advances.*
