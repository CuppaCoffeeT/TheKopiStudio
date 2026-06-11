# W02 — Module inventory audit

**Goal**: Generate a verifiable map of every module, component, hook, service, route, and DB table in the current repo — the evidence base for W07/W09.
**Tier**: Now · **Status**: 🟢 DONE 2026-04-18 — 3 deliverables shipped · **Automation**: 🤖 auto
**Blocked by**: nothing · **Blocks**: ~~W06~~ ~~W07~~ ~~W09~~ all unblocked

## Why this exists

You can't refactor what you haven't mapped. User flagged: "some modules unused", "some components I thought were the same but aren't". The inventory is what makes those calls defensible instead of guesses.

## Scope

**In:**
- Machine-generated module → files → routes → tables mapping (done by REPO_AUDIT agent, in flight)
- Duplication map: same-concept components in ≥2 locations (e.g. "add client contact")
- Usage heatmap: imports in / imports out per file
- Dead-file candidates (zero inbound imports)
- Output: [research/REPO_AUDIT.md](../research/REPO_AUDIT.md) + [research/DUPLICATION_MAP.md](../research/DUPLICATION_MAP.md)
- Re-run before each W09 PR via drift detector (W05)

**Out:**
- Deciding *what* to refactor (W07 primitives / W09 per-module)
- Deleting dead code (W06)

## Inputs / Outputs

| What | From | To |
|---|---|---|
| File tree + AST | `src/` | `research/REPO_AUDIT.md` |
| Duplication clusters | grep + ast-grep/jscpd | `research/DUPLICATION_MAP.md` |
| Orphan file list | knip/ts-prune | inline in REPO_AUDIT.md §7 |

## Dependencies on other cards

- None upstream
- Downstream: W06 (dead code), W07 (primitives), W09 (migrations)

## Open workflow questions

- **Q-W02-a** ✅ Duplication detection tool — `jscpd` (string), `ast-grep` (AST), or both? → **jscpd only** (user-accepted 2026-04-18). Zero-config, catches 80% of clusters. ast-grep deferred as opt-in if jscpd misses obvious structural dupes.
- **Q-W02-b** ✅ Include test files in scan? → **exclude tests** (user-accepted 2026-04-18). Reason: test fixtures contain intentional duplicates; including them adds noise to the cluster count.

## Done-when

- [x] REPO_AUDIT.md lists every module with routes + tables (completed 2026-04-16)
- [x] MODULE_MAP.md shipped — 22 core modules + 2 special, every route/page/component/hook/service/table enumerated (457 lines)
- [x] COMPONENT_MAP.md shipped — 644 files indexed (559 components + 85 pages), owner module + import count per file, orphans + hotspots flagged (690 lines)
- [x] DUPLICATION_CLUSTERS.md shipped — jscpd ran clean, 102 clones / 1,847 duplicated lines / 4.4% codebase, top 10 clusters ranked with W07 extraction targets (287 lines)
- [ ] User review (next action — open the 3 deliverables, sanity-check, flag anything off)

## Results summary (2026-04-18)

- **Files scanned**: 665 (src/ excluding tests + refactor-dashboard)
- **Modules identified**: 22 core + 2 special (dashboard, auth)
- **Top duplication clusters** (biggest W07 extraction wins):
  1. Supervisor OT workflows — 264 duplicated lines
  2. Trial-trench row patterns — 198 lines
  3. Email dialogs — 157 lines
  4. NAS folder browsers — 142 lines
  5. General works tables — 131 lines
- **W07 primitive candidates**: StatusBadge · TrialTrenchRow · SendEmailDialog · NASFolderBrowser · GeneralWorksTable
- **Orphan modules** (<5 files, dead-code candidates for W06): template-files · email-settings · site-form-templates · forms
- **Hotspot files** (refactor carefully — many imports): ProjectDetailPage (7 imports) · QuotationDetailPage (9) · SupervisorPage (15)
- **High-coupling modules** (complex W09 migrations): project-management (61 components) · supervisor (67 components) · quotation (31)

## Deliverables

- [research/MODULE_MAP.md](../research/MODULE_MAP.md)
- [research/COMPONENT_MAP.md](../research/COMPONENT_MAP.md)
- [research/DUPLICATION_CLUSTERS.md](../research/DUPLICATION_CLUSTERS.md)
- [research/REPO_AUDIT.md](../research/REPO_AUDIT.md) — prior research base, still valid
