# AppBase_REFACTOR — Target architecture blueprint

**Created**: 2026-04-18 SGT
**Last Updated**: 2026-05-31 SGT (SRC_STRUCTURE_CLEANUP_PRD landed — legacy `src/components/<domain>/` dirs eliminated)
**Status**: 🟢 Realized — **this is the single source of truth for folder structure**
**Priority**: 🔴 Critical

> **This is the TARGET architecture — now REALIZED.** The 4-tier component model, the `components/shared/` cross-feature tier, the `src/services/` drain, **and** the legacy `src/components/<domain>/` relocation are all **DONE** (the last via SRC_STRUCTURE_CLEANUP_PRD on 2026-05-31: 105 dead files deleted, ~70 surfaces relocated/promoted, `src/{types,constants,styles}` drained). `src/components/` now holds **only** `primitives/`, `ui/`, `shared/`. A `no-stray-domain-components` dependency-cruiser rule now structurally enforces this. See [Known remaining drift](#-known-remaining-drift-as-of-2026-05-31).

## ⚠️ Deletion policy (locked 2026-04-19)

**This doc is the source of truth for `src/` folder structure.** Anything in `src/` that doesn't map to a section below is either:
1. **Approved deviation** — listed in the "Deviations" section with rationale
2. **Transitional** — listed with the W## card that absorbs it (e.g. `src/services/` → `src/features/<name>/api/` via W09)
3. **Dead code** — delete on sight (flag in next `/code-hygiene`)

When adding a new `src/<folder>/`: first update this blueprint. If the PR doesn't update the blueprint, reviewers push back.

## 📋 Overview

The one-page answer to *"how should the codebase be organised after the refactor?"*

## 📚 Related Documentation

- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) — X5 and X7 decisions live here
- [workflows/W02_MODULE_INVENTORY.md](workflows/W02_MODULE_INVENTORY.md) — produces the current-state inventory
- [workflows/W07_SHARED_PRIMITIVES.md](workflows/W07_SHARED_PRIMITIVES.md) — extracts shared primitives
- [workflows/W09_MODULE_MIGRATIONS.md](workflows/W09_MODULE_MIGRATIONS.md) — umbrella that moves modules into this shape
- [research/REPO_AUDIT.md](research/REPO_AUDIT.md) — current-state findings
- [../../01-system-architecture/MODULE_SYSTEM.md](../../01-system-architecture/MODULE_SYSTEM.md) — runtime RBAC (separate concern from folder layout)

## 📊 Current state — what we have (from REPO_AUDIT 2026-04-16)

- **20+ modules**, 87 pages, **565 components**, 112 hooks, 88 services
- **8 duplication clusters** spanning 45 files (contact forms, pickers, status badges, file uploaders…)
- **ProjectDetailPage.tsx is 3,200 lines** handling 5 workflows in one file
- **34 Supabase query violations** (missing `.range/.limit/.single`)
- **8 hardcoded role checks** bypassing the module RBAC
- **177 raw `date-fns` vs 75 `timezoneUtils`** — 58% timezone compliance gap
- **~40% component-code reduction** estimated achievable

Conclusion: codebase is messy in classic "we-shipped-fast" ways — not architecturally broken, just under-consolidated. Refactor = extract + relocate, not rewrite.

## 🎯 Target shape (Bulletproof React pattern — X5 ✅ · X7 ✅)

```
src/
├── features/                   ← 🆕 one folder per feature/module
│   ├── quotations/
│   │   ├── api/                ← Supabase queries + mutation hooks for this feature
│   │   ├── components/         ← feature-specific components
│   │   ├── hooks/              ← feature-specific React hooks
│   │   ├── lib/                ← pure logic + decisions.md/lessons.md
│   │   ├── pages/              ← the page component(s) — NOT src/pages/
│   │   ├── types.ts            ← feature types (flat file, NOT a types/ dir) — where the feature exports types
│   │   └── index.ts            ← barrel export (public API of the feature)
│   ├── projects/
│   ├── client-profiles/
│   ├── payroll/                ← groups salary + payslip + leaves
│   ├── hr-applications/
│   └── comms/                  ← WhatsApp + email inbox
│
├── components/                 ← cross-feature shared UI — ONLY these 3 (no domain dirs; enforced by no-stray-domain-components)
│   ├── primitives/<group>/     ← design-system primitives (135 — source of truth: PRIMITIVES_MANIFEST.json)
│   ├── ui/                     ← shadcn/ui base + sanctioned domain wrappers
│   └── shared/<domain>/        ← REALIZED cross-feature surfaces (≥2 features)
│
├── hooks/                      ← cross-feature hooks (auth, URL state, toast…)
│   ├── useAuth.tsx             ← via AuthContext
│   ├── useURLPagination.ts
│   └── useFeatureFlag.ts       ← VITE_FF_* lookups
│
├── lib/                        ← infra wrappers + domain logic (services-drain landing zone)
│   ├── supabase.ts
│   ├── queryClient.ts          ← React Query singleton
│   ├── <domain>/               ← multi-consumer domain logic moved out of src/services/
│   │                             (projects, nas, people, progress-claims, upload, merge,
│   │                              errors, templates, audit, email, holidays, client-contacts…)
│   └── motion.ts               ← motion presets
│
├── utils/                      ← pure functions, no React imports
│   ├── queryKeys.ts            ← centralised key factory (enforce via W21)
│   ├── timezoneUtils.ts        ← only entry point for dates
│   ├── toastHelper.ts          ← only entry point for toasts
│   └── …
│
├── pages/                      ← THIN route handlers — residual only (NotFound, RouteError)
│   └── *.tsx                   ← most pages now live in features/<name>/pages/ (OTCalculator relocated to features/otcalculator/)
│
├── contexts/                   ← app-level contexts (AuthContext, etc.)
├── integrations/               ← external-service adapters (Xero, NAS, etc.) — generated Supabase types live in integrations/supabase/
│                                 (the old root src/types/ dir was drained + removed; feature types are flat types.ts files)
├── main.tsx                    ← entry point (ReactDOM.createRoot) — NO src/app/ layer
└── App.tsx                     ← router wiring; routes lazy-load features/<x>/pages/ + remaining src/pages/
```

> **Entry layer:** an earlier draft of this blueprint posited a `src/app/` folder. It does **not** exist. The entry pair is `src/main.tsx` + `src/App.tsx` at the `src/` root; `App.tsx` lazy-loads ~70 route components, the overwhelming majority from `features/<x>` (barrel) / `features/<x>/pages/`, plus a small residual from `src/pages/` (`NotFound`, `RouteError` — OTCalculator relocated to `features/otcalculator/`).

### Why this shape (not alternatives)

- **`src/features/<name>/` over `src/shared/` + `src/modules/`** → industry-standard Bulletproof React pattern. Google it, every medium-sized React codebase trends here.
- **Colocation beats layering** — pages + hooks + components for one feature live together, so deleting a feature is `rm -rf src/features/<name>/`. Layered (`pages/`, `hooks/`, `components/`) spreads one feature across 4 folders.
- **Flat root** (`components/`, `hooks/`, `lib/`, `utils/`) stays — these are the *truly shared* pieces, not "this one component used by 2 modules".
- **`pages/` stays too** but becomes thin — it's where React Router looks. Each file re-exports from `features/<name>/components/<PageComponent>`.

### Rule of thumb: when does something go into `src/components/` (root) vs `src/features/<name>/components/`?

- **Used by ≥ 2 features** → `src/components/` (root)
- **Used by exactly 1 feature** → `src/features/<that-one>/components/`

## 📌 Current-state audit (updated 2026-05-31 — post-remediation reconciliation)

Full-codebase audit: [CODEBASE_DEEP_RESEARCH_2026-05-29.md](CODEBASE_DEEP_RESEARCH_2026-05-29.md).

### ✅ Matches blueprint
| Folder | Shape | Notes (2026-05-31) |
|---|---|---|
| `src/features/` | ✅ | **49 feature folders** (refactor-dashboard + design-lab retired 2026-05-31). Migrated + W09-clean. Each holds the canonical shape (`api/` · `components/` · `hooks/` · `lib/` · `pages/` · `CONTEXT.md`); `types.ts` and `index.ts` appear where the feature exports types / has a public surface. Largest: projects, quotations. |
| `src/components/primitives/` | ✅ | **135 primitives** (source of truth: `PRIMITIVES_MANIFEST.json` / `npm run primitives:manifest`). Grouped: shell · form · overlays · detail · dashboard · charts · ui · atoms. See [primitives/CONTEXT.md](../../../src/components/primitives/CONTEXT.md). |
| `src/components/shared/` | ✅ | **REALIZED tier — 16 domains**: `agent` · `app-shell` · `cdw-spatial` · `claims` · `company-form` · `completed-work` · `email` · `engineer-dashboard` · `general-works` · `nas` · `payslip-templates` · `plan-purchase` · `project-create` · `project-form-import` · `trial-trench` · `worker-ot` (last 5 added by SRC_STRUCTURE_CLEANUP_PRD 2026-05-31). A surface used by ≥2 features lives here; single-feature surfaces stay in the feature. This tier is **how cross-feature import edges were driven to 0** (dependency-cruiser `no-cross-feature-imports`). |
| `src/components/ui/` | ✅ | shadcn/ui base + sanctioned domain wrappers (staff-select, company-select, contact-form, cdw-parts, etc). See `.claude/rules/universal-components-protocols.md`. |
| `src/services/` | ✅ | **DRAINED.** Down to **2 thin facades** (`claimableItemsService.ts`, `invoicesService.ts`) + **3 split subfolders** (`claimableItems/`, `email/`, `invoices/`). The bulk relocated to `src/lib/<domain>/` (multi-consumer) or `features/<x>/api/` (single-consumer). No longer the god-folder. |
| `src/lib/` | ✅ | Infra wrappers + queryClient + design tokens **+ domain logic** drained from services (`projects`, `nas`, `people`, `progress-claims`, `upload`, `merge`, `errors`, `templates`, `audit`, `email`, `holidays`, `client-contacts`…). |
| `src/pages/` | 🟡 | **Residual only — 2 files** (`NotFound`, `RouteError`). Most pages live in `features/<x>/pages/`; nearly all of `App.tsx`'s ~70 lazy routes load from `features/<x>`, only these 2 from `src/pages/`. (OTCalculator relocated to `features/otcalculator/`.) |
| `src/hooks/` | ✅ | Cross-feature hooks. |
| `src/utils/` | ✅ | Pure functions. |
| `src/contexts/` | ✅ | AuthContext etc. |
| `src/integrations/` | ✅ | Supabase client + generated DB types (`integrations/supabase/types.ts`). |
| ~~`src/types/`~~ | ✅ | **Removed** (2026-05-31) — root dir drained; generated types live in `integrations/supabase/`, feature types are flat `types.ts` files. |

### 🟡 Approved deviations (post-refactor reality — 4 tiers, not 2)
The blueprint originally described 2 component tiers (features/ vs components/). The real working model is **4 tiers**:

| Tier | Path | Rule |
|---|---|---|
| Primitive | `components/primitives/<group>/` | stateless, design-spec-backed; import when a Need→Import row exists |
| Sanctioned ui/ | `components/ui/` | shadcn + domain wrappers (already primitive-composed) |
| Shared cross-feature | `components/shared/<domain>/` | **REALIZED** — used by ≥2 features → promote here, don't mirror (drove cross-feature edges to 0) |
| Feature-local | `features/<x>/components/` | used by exactly 1 feature |

**Internal feature-folder convention** (actual pattern, not the blueprint's `types/` dir):
```
features/<name>/
  api/          ← Supabase queries + mutation hooks (single-consumer queries)
  components/   ← feature-only UI
  hooks/        ← feature-only hooks
  lib/          ← pure logic + decisions.md + lessons.md
  pages/        ← the page component(s) — NOT src/pages/
  types.ts      ← feature types (flat file, not types/ dir)
  index.ts      ← public barrel
  CONTEXT.md    ← routing doc
```

### 🟠 Transitional folders (residual — 2026-05-31)
| Folder | Blueprint target | Absorbed by | Current count |
|---|---|---|---|
| `src/services/` | `features/<x>/api/` (single-consumer) or `lib/<domain>/` (multi-consumer) | W25 | **DRAINED** → 2 facades (`claimableItemsService`, `invoicesService`) + 3 subfolders (`claimableItems/`, `email/`, `invoices/`) |
| `src/config/` | `src/lib/` | W25 sweep | already absent in this worktree |
| `src/constants/` | `lib/worker/` | SRC_STRUCTURE_CLEANUP_PRD | ✅ **drained + dir removed** (2026-05-31) |
| `src/styles/` | `features/payslip/styles/` | SRC_STRUCTURE_CLEANUP_PRD | ✅ **drained + dir removed** (2026-05-31) |
| `src/types/` | `lib/{cdw,nas,projects}` + feature `lib/` | SRC_STRUCTURE_CLEANUP_PRD | ✅ feature-specific types drained; dir removed (generated types live in `src/integrations/supabase/`) |

These residuals are **not** in the target shape and will absorb into the target via the listed card. **Do not add new files here** — put new files in the target location. The big remaining gap is the legacy `src/components/<domain>/` dirs, tracked separately below.

## ✅ Resolved drift (SRC_STRUCTURE_CLEANUP_PRD — 2026-05-31)

**The legacy `src/components/<domain>/` drift is ELIMINATED.** The structural-cleanup pass ran recon (importer-grep + knip on all 261 in-scope files) → deleted 105 dead files → relocated/promoted ~70 live surfaces in two waves. Outcome per former legacy folder:

| Former legacy folder | Disposition |
|---|---|
| `admin/` · `coordinator/` · `quotation/` · `tables/` · `template-files/` · `forms/` · `jltt/` · `meeting-projects/` | **100% dead → deleted** (knip-confirmed; whole folders removed) |
| `project-management/` (21) | `NASFilePicker`→`shared/nas/`, `useClientContactMultiSelectMutations`→`ui/`; rest dead→deleted |
| `trial-trench/` (14) | shared filters→`shared/trial-trench/` (merged); rest dead→deleted (incl. dead `TrialTrenchDetailPanel` chain) |
| `claims/` (14) | live surface→`shared/claims/` (12, via `lib/claims-components` barrel); 2 dead→deleted |
| `engineer-dashboard/` (13) | 2 modals→`shared/engineer-dashboard/`; 11 dead→deleted |
| `payslip/` (6) | `PayslipTemplateManagement`→`shared/payslip-templates/` (bridges pdf-templates+payslip); 5 dead→deleted |
| `client-management/` (6) | merge cluster→`features/companies/`; `CompanyForm`→`shared/company-form/` (used by `ui/company-select`) |
| `auth/` · `dashboard/` · `error-handling/` | `ProtectedRoute`+`DashboardLayout`+`GlobalCommandPalette`→`shared/app-shell/`; `EnhancedErrorBoundary` dead→deleted |
| loose root `.tsx` (13) | `ErrorBoundary`→`shared/app-shell/`; 9 dead→deleted; `ConfirmDialog`/`EmptyState` dead→deleted |
| `src/hooks/` root | 116→71: 16 dead→deleted, 29 single-feature→`features/<x>/hooks/`, rest are genuinely global |
| `src/types` · `src/constants` · `src/styles` | drained to `lib/{cdw,nas,projects,worker}` + owning features; **dirs removed** |
| `src/pages/OTCalculator.tsx` | shell deleted; `App.tsx` imports `@/features/otcalculator` directly → **baselined page→feature drift edge eliminated** (known-violations now `[]`) |

**Enforcement:** a `no-stray-domain-components` dependency-cruiser rule (`forbidden`, severity `error`, `.dependency-cruiser.cjs` ~line 65) now fails CI on any new top-level `src/components/<domain>/` folder or loose root file — only `primitives/`, `ui/`, `shared/` are allowed.

### Known minor deviation — loose root `.tsx` inside `shared/`

`src/components/shared/` has **16 domain subfolders + 6 loose root `.tsx`** (`DrawingListTable`, `DrawingFilesInlinePanel`, `NASStatusPill`, `MultiSelectDropdown`, `LinkReplacementFileDialog`, `SyncStatusIndicator`). The `no-stray-domain-components` rule only guards the `src/components/` root — it does **not** catch loose files under `shared/`. These should eventually move into a `shared/<domain>/` subfolder, but they don't break the rule today. Tracked as a minor deviation, not blocking.

### 🔴 If you find something NOT on these lists
Assume it's dead code until proven otherwise. Options:
1. Move it to the right blueprint location + update callers
2. Delete it (run `knip` to verify no callers)
3. Add it as a new approved deviation in this doc with rationale

**Never** silently create a new top-level `src/<folder>/`. Every new folder must be listed here.

## 🚀 Migration path (how we get from here to there)

Driven by the W## cards — this isn't a freeform refactor, it's a sequenced plan.

| Step | Card | What | When |
|---|---|---|---|
| 1 | **W02** | Inventory everything — produce `MODULE_MAP.md` (which module has which pages/components/hooks/services) + `DUPLICATION_CLUSTERS.md` (candidates for shared primitives) | Week 1 |
| 2 | **W06** | Dead-code purge via `knip`. Delete unused files before we start moving them around. | Week 1 |
| 3 | **W12** | Compliance sweeps (34 query violations, 8 role-check violations, 177 date-fns) — fix in-place first so we don't carry bugs into the new shape | Week 1 |
| 4 | **W07** | Design shared primitives. From W02's duplication clusters, design the target `src/components/` entries (StatusBadge, ContactPicker, FileUpload, DateRangeFilter, etc.). Don't write yet. | Week 3 |
| 5 | **W17** | Component library research (motion.dev / 21st.dev / shadcn) + `/design-lab` test page. Picks the visual language. **design-lab retired 2026-05-31 per REFACTOR_TOOLING_RETIREMENT_PRD.** | Week 2 |
| 6 | **W08** | Design tokens (fonts, colors, spacing, motion). Styles the primitives from W07/W17. | Week 3 |
| 7 | **W13** | Proof-of-recipe refactor: split `ProjectDetailPage.tsx` (3,200L) into 5 feature folders. Validates the pattern on the hardest target first. | Week 4 |
| 8 | **W09** | Per-module migration loop — one module at a time into `src/features/<name>/`. 7-day soak per module via feature flag. | Weeks 4–5 |
| 9 | **W10** | Scaffolding skill `/create-module` — generates a new module in the right shape so future work can't drift. | Week 5 |

## 🛡️ Discipline that prevents drift (enforced by W05 + W20)

1. **dependency-cruiser** (W05) fails CI if `src/features/A/` imports from `src/features/B/` internals. Cross-feature → only via public barrel (`index.ts`).
2. **drift detector** (W05) greps weekly for new hardcoded role checks, unbounded `.select()`, raw `date-fns` imports, `useToast` imports. Opens PRs.
3. **Claude cron watchdog** (W20) every 2h scans for new violations, auto-fixes low-risk, Telegram-escalates high-risk.
4. **ESLint rule (W21)** — hardcoded React Query keys banned.
5. **Playwright seatbelt (W04)** — no W09 module merge without the module's P0 workflows in CI.

## ❓ "Does this organisation need its own W## card?"

**It already has 2 cards**:
- **[W07_SHARED_PRIMITIVES.md](workflows/W07_SHARED_PRIMITIVES.md)** — the shared-primitives extraction plan
- **[W09_MODULE_MIGRATIONS.md](workflows/W09_MODULE_MIGRATIONS.md)** — the per-module migration umbrella

This blueprint is the *summary view* — a page you can point new eyes at (or a future Claude agent) to get the target shape in one read. Don't add another card; instead treat this as the north-star doc every card refers back to.

## ✅ Done-when (the refactor is done)

- Every module lives under `src/features/<name>/` with `api/` subfolder — `src/services/` drained ✅ (2 facades + 3 subfolders remain, scheduled to zero)
- `src/components/` holds only: `primitives/` (source of truth: PRIMITIVES_MANIFEST.json, grows via design spec only) · `ui/` (sanctioned wrappers) · `shared/` (≥2-feature surfaces) — **no legacy domain dirs ✅ DONE** (SRC_STRUCTURE_CLEANUP_PRD 2026-05-31; enforced by `no-stray-domain-components` dep-cruiser rule)
- `src/pages/` contains only residual cross-cutting route shells
- Zero hardcoded role checks · zero unbounded `.select()` · zero raw `date-fns` imports · zero `useToast` imports
- `drift:check` (dependency-cruiser) + ESLint (`--max-warnings` ≤15) + Playwright @p0 all green in CI; `drift:check` wired into `pre-push`
- W09 greps 6a–6e return 0 across `src/features/` + `src/components/` + `src/pages/` (sandboxes exempt)
- `/create-module` + `/check-module` + `/delete-module` commands in CLAUDE.md routing
- Canonical docs (entry CONTEXT routers, MODULE_CREATION_SOP, 6 canonical page-pattern docs in [docs/01-system-architecture/canonical-page-patterns/](../../01-system-architecture/canonical-page-patterns/)) within TOKEN_BUDGET ceilings

**Progress (2026-05-31):** features 51/51 migrated · primitives (manifest) · `components/shared/` realized (16 domains + 6 loose root `.tsx`) · services drained · pages residual-only (2 files: NotFound, RouteError) · **legacy `src/components/<domain>/` dirs ELIMINATED (SRC_STRUCTURE_CLEANUP_PRD): `src/components/` = {primitives, ui, shared} only; `src/{types,constants,styles}` drained; `src/hooks` root 116→71; drift a true 0; `no-stray-domain-components` rule enforces it.** Blueprint is now **REALIZED**, not just target.
