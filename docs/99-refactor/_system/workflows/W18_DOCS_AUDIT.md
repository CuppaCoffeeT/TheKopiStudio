# W18 — Docs audit + archive

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-18 SGT
**Status**: 🟢 CLOSED 2026-04-18 with reduced scope (13 archived + 6 link fixes) — per-module rewrites fold into W09
**Priority**: 🟡 High

**Goal**: Walk every file under `docs/` → decide keep / archive / update / merge → produce a clean `docs/_archive/` + refreshed `DOCUMENTATION_INDEX.md` so the docs surface matches reality.
**Tier**: Now · **Status**: 🟢 CLOSED 2026-04-18 — **scope reduced**. 13 dead-subsystem docs archived (openclaw, old email, deprecated pages) + 6 UPDATE link fixes applied. Full 167-doc audit deferred: per-module doc rewrites fold into W09 (rewrite doc alongside code refactor, from code), over-budget splits fold into W19. Standalone doc audit = low value vs workflow capture. · **Automation**: done
**Blocked by**: nothing (S1 parallel) · **Blocks**: ~~W19~~ (unblocked — W19 no longer waits on a blanket audit; each module's rewrite happens in-place)

## Why this exists

141 docs exist per DOCUMENTATION_INDEX. Many describe systems that have since changed (openclaw agent, old email inbox). Each stale doc:
- Misleads future AI agents — "docs say X, but X was removed 2 months ago"
- Inflates token budget when CONTEXT.md routes to it
- Creates a tax the W20 watchdog will otherwise waste cycles on

Per MWP methodology ([INTERPRETABLE_CONTEXT_METHODOLOGY.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/INTERPRETABLE_CONTEXT_METHODOLOGY.md)): signal-to-noise beats raw size. Clean docs first, then CONTEXT.md (W19), then watchdog (W20).

## Scope

**In:**
- Scan every `docs/**/*.md` — check last-modified, status line, link targets exist, content matches grep of actual code
- Auto-classify per heuristics table below
- Move archive candidates to `docs/_archive/<category>/` preserving original path
- HITL review every borderline case with user
- Update `DOCUMENTATION_INDEX.md` to match final set
- Flag files over per-file budget per [TOKEN_BUDGET_REFERENCE.md](/Volumes/YourVolume/META_FOLDER_STRUCTURE/reference/TOKEN_BUDGET_REFERENCE.md) (CONTEXT.md >1,600 chars, guide >8,000, reference >15,000)
- Record every archive action in `docs/_archive/ARCHIVE_LOG.md` (what + when + why)

**Out:**
- Deleting docs (archive ≠ delete — always recoverable from `_archive/` or git)
- Rewriting content (W19)
- CONTEXT.md refresh (W19)
- `decisions.md`/`lessons.md` rollout (W19)

## Classification heuristics

| Signal | Action |
|---|---|
| References a deleted code path (grep finds nothing) | archive |
| Status 🔴 Deprecated | archive |
| Status 🟡 Transitional + unchanged >90 days | HITL review → likely archive |
| Describes active feature (grep-confirmed) | keep |
| Duplicates another doc | merge — keep the more complete, archive the other |
| Over per-file budget | update (split or trim) — flagged for W19 |
| No Related Documentation section | update (add back-links) |
| openclaw-agent or old-email-inbox references | archive (confirmed dead per W06) |

## Dependencies on other cards

- S1 parallel — no blockers
- Blocks W19 (CONTEXT.md refresh works on the cleaned set)
- Informs W06 (dead code purge — docs for archived code can follow the code)
- Feeds W20 (watchdog uses this baseline to detect drift going forward)

## Open workflow questions

- **Q-W18-a** ✅ **Staleness threshold = 90 days + status-line mismatch + HITL confirm on each**.
- **Q-W18-b** ✅ **`_archive/` = `docs/_archive/`** in-repo — searchable, git-tracked, recoverable without branch-switching.
- **Q-W18-c** ✅ **Flag only; W19 owns rewrites**. User note: "should split and put them in a folder or sub folder" — logged as W19 input (over-budget files get split into a sub-folder during the MWP rewrite, not here).
- **Q-W18-d** ✅ **Walk every doc one-by-one** (whole tree, not per numbered category). W19 will take notes on needed rewrites as W18 progresses.

## Done-when

- `docs/_archive/` exists with categorized archived docs
- `ARCHIVE_LOG.md` records every move
- `DOCUMENTATION_INDEX.md` reflects the final set (minus archived)
- Every remaining doc passes: accurate status-line + valid links + within budget
- Sets DAG flag: **`docs_audited`**

## Scope reduction decision (2026-04-18)

After running the audit agent on 167 docs, **three failure modes surfaced**:
1. Agent over-archived 11/25 docs on first pass (restored manually)
2. Agent produced archive recommendations with "unclear" live-subsystem status on 4/30 HITL docs — zero `src/` grep evidence
3. Same keyword-scan failure mode as W06 DB column audit (8/8 wrong) and W14 RLS audit (33 phantom RLS-off tables)

**Re-framing**: a standalone doc audit cannot be done safely by agent keyword-scans, and doesn't prevent any production regression. Docs drift from code; the fix is to rewrite docs **alongside** code changes (W09 per-module), never standalone. W19's budget-splitting also belongs with the per-module rewrite, not as a bulk pass.

**What actually prevents regressions during refactor**: Playwright workflow tests (W03 + W04 paired track). Pivoted investment there.

**Residual doc debt**: 30 NEEDS-HITL docs remain in [research/W18_BORDERLINE_PREVIEW.md](../research/W18_BORDERLINE_PREVIEW.md) as reference; they get handled when their parent module reaches W09. No separate backlog ticket.

## Results (final)

| Pass | Docs moved | Files |
|---|---|---|
| Dead-subsystem archive (initial) | 24 archived → 11 reversed = 13 kept | `_archive/ARCHIVE_LOG.md` |
| UPDATE link fixes | 6 | 13 corrected links |
| **Total closure** | 13 archived + 6 updated | — |

## Related

- [W03_WORKFLOW_INVENTORY.md](W03_WORKFLOW_INVENTORY.md) + [W04_PLAYWRIGHT_SEATBELT.md](W04_PLAYWRIGHT_SEATBELT.md) — the **real** seatbelt work
- [W03_04_EXECUTION_PROTOCOL.md](W03_04_EXECUTION_PROTOCOL.md) — how the pair runs
- [W09_PER_MODULE_MIGRATION.md](W09_PER_MODULE_MIGRATION.md) — where per-module doc rewrites happen
- [W19_MWP_CONTEXT.md](W19_MWP_CONTEXT.md) — budget-split work (moved per-module)
- [`.claude/rules/documentation.md`](../../../../.claude/rules/documentation.md) — doc placement + header rules
- [W06_DEAD_CODE_PURGE.md](W06_DEAD_CODE_PURGE.md) — parallel code-side cleanup
