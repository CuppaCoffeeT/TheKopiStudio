# Token Budget — Single Source of Truth

**Created**: 2026-04-19 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

Per-file size ceilings for `.md` files in this repo. Adapts JLCode's [TOKEN_BUDGET_REFERENCE.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/TOKEN_BUDGET_REFERENCE.md) to a single-app context. Every doc-budget rule lives here; checks (`/check-docs`, future CI) read from this file rather than hardcoding numbers.

**Why budgets exist**: Always-loaded files (root `CLAUDE.md`, `CONTEXT.md`) cost tokens on every conversation. Routing files should route — not carry detail. The MWP principle is *load on demand*: keep the index small, push detail into linked guides that load only when needed. Big files also force agents to scan instead of reading; small focused files compress better and survive context compaction.

**Budgets are CEILINGS, not targets.** A 1,000-char `CONTEXT.md` that routes correctly is better than a 1,600-char one that pads to "fill the budget." Aim for 60–70% utilization. Use the headroom only when the workspace genuinely needs it.

## Per-file limits

| File type | Max chars | Max lines | Over-budget action |
|---|---|---|---|
| Root `CLAUDE.md` | 3,200 | 90 | Extract detail to `docs/99-meta/` reference |
| Feature `CONTEXT.md` | 1,600 | 80 | Routing-only; extract detail to sibling guide |
| Category `CONTEXT.md` | 2,400 | 120 | Same — routing-only |
| Guide (SOP / spec) | 8,000 | 200 | Split into focused sub-guides |
| Feature doc | 12,000 | — | Split by sub-topic into linked sub-files |
| Reference doc | 15,000 | — | Split into focused sub-files |
| `decisions.md` / `lessons.md` | — | 50 entries | Archive entries older than 6 months to `_archive/` |

**Conversion**: ~4 chars ≈ 1 token. Measure with `wc -c <file>`.

**"Category" CONTEXT.md** = top-level routers like `docs/CONTEXT.md`, `src/CONTEXT.md`, `docs/03-features/CONTEXT.md`. They index multiple subfolders and need slightly more space.

**"Feature" CONTEXT.md** = leaf workspace routers like `src/features/serviceslist/CONTEXT.md`, `tests/pom/CONTEXT.md`, `docs/03-features/quotation/CONTEXT.md`. They cover one domain.

## CONTEXT.md shape (routing-only)

Every workspace `CONTEXT.md` should contain only:
1. **Purpose** — 1 sentence
2. **What belongs / what doesn't** — scope guardrails
3. **Navigation table** — file or subfolder → one-line purpose
4. **Before-working-here rules** — concise patterns + pitfalls specific to this folder
5. **Decisions & Lessons** — link to sibling `decisions.md` / `lessons.md` if they exist
6. **Related Documentation** — bidirectional back-links

If you find yourself writing prose, code samples, or full pattern explanations: extract them to a sibling guide and link back.

## Exemptions

A file is exempt from its char limit only when ALL of:
1. Loaded on demand (not always in context), AND
2. Cannot be decomposed without losing coherence, AND
3. Is structurally complex reference data (not prose that could be split)

Each exemption is documented inline with a one-line **why**:

| Path | Why exempt |
|---|---|
| Root `CLAUDE.md` | Always-loaded; carries Hard Rules table + Naming Conventions table + Routing table that must enforce in front of every session. Cannot decompose without losing enforcement; current size ~3,500 vs 3,200 ceiling. Trim opportunistically; do not move tables out |
| `docs/DOCUMENTATION_INDEX.md` | Project-wide manifest of 172+ docs — single-file lookup is the value; splitting breaks grep |
| `docs/99-refactor/_system/SYSTEM_OVERVIEW.md` | Refactor DAG + backlog table — must stay one-glance scannable |
| `docs/99-refactor/_system/SYSTEM_STATE.md` | Rolling dashboard; shape locked by parser |
| `docs/99-refactor/_system/ledgers/WORKFLOW_LEDGER.md` | 144-row CSV-shaped ledger — appended by `/explore-module`, parsed by dashboard |
| `docs/99-refactor/_system/RECENT_CHANGES.md` | Append-only changelog — grows with every refactor merge |
| `docs/03-features/project-management/file-tracking/FILE_TRACKING_SCHEMA.md` | Reference data — table-heavy (active categories · TUS systems · edge fn actions · queue CHECK constraints · service map). Structurally reference, ~137% of 8,000c guide ceiling but within 15,000c reference ceiling. Splitting further would fragment closely-coupled schema material. |
| `docs/03-features/project-management/file-tracking/FILE_TRACKING_UI_SPEC.md` | Reference data — required-features + reusable-component matrix + acceptance-criteria checklist + new-type recipe. ~123% of 8,000c guide ceiling, within 15,000c reference ceiling. Further split would separate acceptance criteria from the components they exercise. |
| `docs/03-features/project-management/file-tracking/FILE_TRACKING_OPERATIONS.md` | Reference data — code-block-heavy flow reference for upload/download/map/verify/soft-delete. ~114% of 8,000c guide ceiling, within 15,000c reference ceiling. Each flow builds on the prior one's context. |
| `src/components/primitives/CONTEXT.md` | Inventory table for **144 primitives** across 8 groups + page-composition patterns (filesystem count 2026-05-30; was 115). Splitting fragments the one-glance import-path lookup that agents use when writing new code. ~4.3Kc vs 1,600c feature-CONTEXT ceiling — structural inventory, not prose. |
| `docs/06-operations/MODULE_CREATION_SOP.md` | Single-read end-to-end build procedure (10 sequential steps: archetype → scaffold → DB/RLS → RBAC → queries → components → cross-cutting → docs → verify → delete). ~13.8Kc, within 15,000c reference ceiling. The audit half (DoD + greps + deletion) was already extracted to the standalone `MODULE_COMPLIANCE_CHECKLIST.md` (4.9Kc, under guide ceiling); splitting the build steps further fragments a coherent sequential procedure. Loaded on demand. |
| `docs/99-refactor/_system/DESIGN_CATALOG.md` | **Router** (sessions · W09 adoption · approval · composition · roll-up). ~14Kc as of 2026-04-28 — under 15Kc reference ceiling after split. |
| `docs/99-refactor/_system/DESIGN_CATALOG_PRIMITIVES.md` | Per-primitive Design · Impl · Adopted inventory (sections A–N). ~29Kc — single-grep adoption audit target. Splitting further fragments the matrix. Extracted from DESIGN_CATALOG.md 2026-04-28. |
| `docs/99-refactor/_system/DESIGN_CATALOG_MATRIX.md` | Module × primitive matrix (page × primitive-group · archetype rows). ~19Kc — single-grep matrix scan target. Extracted from DESIGN_CATALOG.md 2026-04-28. |
| `.claude/rules/universal-components.md` | Need → Import primary enforcement matrix (~60 rows). 15.3Kc vs 8,000c guide ceiling — protocols + exceptions already extracted to `universal-components-protocols.md`. Matrix itself cannot be split without fragmenting single-grep lookup used by compliance checks and agents to find the right file. **Watch**: 2026-04-28 it crossed 1.9× — if Email/AI/WhatsApp rows continue accreting, split the table along feature-domain lines into `universal-components/email-and-ai.md` per the hygiene-sweep refactor plan. Until then, exempt as a single-grep enforcement matrix. |
| `src/features/people/CONTEXT.md` | Structural one-row-per-file inventory regenerated by agents from JSDoc headers. ~7.6Kc vs 1,600c feature-CONTEXT ceiling (~475%). 30+ files across pages/components/hooks/api/lib + the `components/access/` sub-tree. Same pattern as `primitives/CONTEXT.md` already exempt — splitting fragments single-grep lookup that agents use to find the right file. To redeem the budget later, split `components/access/` subtree into its own `src/features/access/` (separate domain). |
| `src/features/auth/CONTEXT.md` | Structural one-row-per-file inventory regenerated by agents from JSDoc headers across 3 pages (PasswordReset · EmailVerification · EmailVerified) + 7 components (AuthShell + 3 PasswordReset states + 3 EmailVerification states) + 3 hooks + 1 lib schema. ~3.7Kc vs 1,600c feature-CONTEXT ceiling (~234%). Same pattern as `primitives/CONTEXT.md` + `features/people/CONTEXT.md` — splitting fragments the single-grep lookup agents use to find the right file. To redeem later, lift `AuthShell` to `primitives/shell/` (queued in `features/auth/lib/NOTES.md`) AND split the `EmailVerification` sub-tree once `Login.tsx` lands; until then, the pre-auth domain is one cohesive unit. |
| `src/features/invoices/CONTEXT.md` | Structural one-row-per-file inventory regenerated by agents from JSDoc headers across 2 pages (InvoiceCreate · InvoiceDetail) + ~37 components in `header/` + `view/` + `edit/` + root subfolders + 13 hooks + 4 lib + 1 api + types/index. ~9.9Kc vs 1,600c feature-CONTEXT ceiling (~620%). Same pattern as `primitives/CONTEXT.md` + `features/people/CONTEXT.md` already exempt — invoices/ is the heaviest detail+create combo (5,341 LOC pre-decomposition), splitting fragments single-grep lookup. To redeem later, the InvoiceCreate-flow components (~11 files) + their hooks (~8 files) could spin into a sibling `features/invoice-create/` once cross-share with InvoiceDetail clarifies; until then keep one feature folder per the W09 InvoiceDetail consolidation rule. |
| `src/features/materialinventory/CONTEXT.md` | Dense module reference for an actively-developed Material-Ordering-System module — route · RBAC capability matrix · stock-ledger data model · the 4 stock RPCs · file navigation. ~8.9Kc vs 1,600c feature ceiling. Same pattern as the `features/invoices/CONTEXT.md` exemption: the RBAC + data-model reference is load-bearing for the in-flight build, so gutting to routing-only would delete what the work needs. Re-trim to routing-only once the Material Ordering System work settles (W25+). |
| `src/features/purchaseorders/CONTEXT.md` | Dense module reference for Module B of the Material Ordering System — procurement workflow · 3 capabilities · per-line data model · PO-type picker rules · navigation. ~13.9Kc vs 1,600c ceiling. Same rationale as `materialinventory` above. Re-trim once the module settles (W25+). |
| `src/features/materialrequests/CONTEXT.md` | Dense module reference for Module A + the Material-Issuance extension — tabbed hub (Requests·Returns·Fuel·PPE) · 5 capabilities · 3-actor workflow · adaptive lines panel. ~21.3Kc vs 1,600c ceiling, heaviest because it spans 4 sub-workflows. Same rationale; re-trim/split once Material Issuance settles (W25+). |

To add an exemption: edit this table. Do not silently exceed budget without an entry here.

## Enforcement

**Today** (W19 close): `/check-docs` skill flags over-budget files but does not block. Solo-dev pace prefers a friendly nudge over a pre-commit wall.

**Future** (W22): CI gate via GH Actions on push. Husky pre-commit deferred — Q-W19-e accepted CI-only as the default. Revisit if drift returns.

## How over-budget gets fixed

`CLAUDE.md` over budget → extract to `docs/99-meta/<TOPIC>.md`, link from CLAUDE.md.
`CONTEXT.md` over budget → the workspace is doing two jobs; either split the workspace or move detail into a sibling guide and keep CONTEXT.md as a router.
Guide over budget → one guide = one job. Split by sub-topic.
Feature/reference doc over budget → split into focused sub-files; cross-link.
`decisions.md` / `lessons.md` past 50 entries → move entries older than 6 months to `_archive/decisions_archive.md` (same folder), keep the active file at ≤50.

## 📚 Related Documentation
- [INTERPRETABLE_CONTEXT_METHODOLOGY.md](./INTERPRETABLE_CONTEXT_METHODOLOGY.md) — full MWP paper this adapts
- [WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md](./WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md) — workspace architecture this enforces
- [DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md](./DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md) — doc structure standards
- [W19_MWP_CONTEXT.md](../99-refactor/_system/workflows/W19_MWP_CONTEXT.md) — refactor card that produced this file
- [JLCode TOKEN_BUDGET_REFERENCE.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/TOKEN_BUDGET_REFERENCE.md) — original cross-project version
- [JLCode CORE_PRINCIPLES.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/CORE_PRINCIPLES.md) — tenets 2 + 7 (load on demand, budgets are ceilings)
