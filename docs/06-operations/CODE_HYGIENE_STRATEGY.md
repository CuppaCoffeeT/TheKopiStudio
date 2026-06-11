# Code Hygiene Strategy

**Created**: 2026-03-22 SGT
**Last Updated**: 2026-03-22 SGT
**Status**: 🟢 Production
**Priority**: 🟢 Medium

## 📋 Overview

Defines how this project stays lean and clean over time — without waiting for things to become bloated before fixing them. The strategy has two layers: a **continuous layer** (fires on every file edit) and a **periodic layer** (deep scan run monthly).

## 📚 Related Documentation
- [ROOT_CLEANUP_AND_FILE_STANDARDS.md](./ROOT_CLEANUP_AND_FILE_STANDARDS.md) - What belongs in root and why
- [DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md](../99-meta/DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md) - Doc structure and naming standards
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - Central doc index

---

## The Problem This Solves

Without consistent hygiene, codebases drift:
- Rules defined in CLAUDE.md get violated gradually, file by file
- Docs describe behaviour that changed 3 features ago
- The same query gets rewritten in 4 different components
- Error history that would prevent repeated mistakes gets deleted

Periodic "cleanup sprints" (fixing everything at once) are expensive and disruptive. The goal is to prevent accumulation, not react to it.

---

## Layer 1: Continuous Hygiene (Rule #11 in CLAUDE.md)

**Trigger**: Every time any file is edited.

Before finishing work on any file, apply these 4 checks to what you just touched:

| Criterion | What to Check |
|-----------|--------------|
| **Inconsistencies** | Does this file conflict with related files or CLAUDE.md rules? |
| **Redundancy** | Is the same logic/content duplicated elsewhere? Consolidate or cross-reference. |
| **Clarity** | Would an AI reading this for the first time know exactly what to do? |
| **Up-to-dateness** | Are all references (file paths, function names, rule names) still current? |

**Scope**: Only the file(s) being touched — not the whole codebase. This is lightweight by design.

**Why this works**: Every edit is both a feature change AND a hygiene pass on that file. Drift is fixed at the point of introduction rather than accumulating.

### What to Preserve (Never Delete)

- `## Errors Encountered` sections in feature docs
- `## What NOT To Try Again` sections
- Debugging history and failed-approach notes

These exist specifically so AI agents don't repeat expensive mistakes. Removing them costs future sessions hours of re-learning.

---

## Layer 2: Periodic Deep Scan (/code-hygiene)

**Trigger**: Monthly, or before major releases.

**Purpose**: Catch drift in areas not recently touched by Layer 1. The continuous layer only covers files being edited; areas of the codebase that haven't been touched in months can still accumulate inconsistencies.

**Command**: `/code-hygiene`

### What it scans (highest value first):
1. CLAUDE.md — the master reference; drift here misleads every session
2. `docs/01-system-architecture/` — live system rules
3. `src/utils/`, `src/hooks/` — shared utilities (widest blast radius)
4. `docs/03-features/` — feature docs go stale as features evolve
5. `src/pages/` — CLAUDE.md rule violations

### The same 4 criteria apply, system-wide.

---

## Command Reference

| Command | Layer | Scope | When |
|---------|-------|-------|------|
| Rule #11 (CLAUDE.md) | Continuous | Files being edited | Every edit |
| `/code-hygiene` | Periodic | Whole codebase (incl. root) | Monthly / pre-release |
| `/check-docs <topic>` | On-demand | Specific doc topic | When creating/updating docs |
| `/check-docs` | Every git-sync | Doc index only | Every commit |
| `/prd-write` | Pre-build | Module PRD + phases | Before building a module |

---

## Design Decisions

### Why a CLAUDE.md rule rather than a hook or script?
A shell script can grep for pattern violations but can't apply judgment about inconsistencies, redundancy, or whether content is still accurate. The 4-criteria check requires reading and understanding context — only an AI can do this. Making it a CLAUDE.md rule means it fires automatically on every edit without needing to invoke any command.

### Why not run /code-hygiene on every git-sync?
Too slow and too noisy. `/git-sync` already runs `/check-docs` (index health) and a quick tmpclaude root check. Adding a full codebase scan would make git-sync unusable. The continuous layer handles fresh edits; `/code-hygiene` handles areas not recently touched.

### Why preserve error history?
Every "What NOT To Try Again" section represents hours of debugging. Without it, future AI sessions will attempt the same approach, hit the same wall, and spend the same hours learning the same lesson. The preservation rule is non-negotiable.

---

## History

### 2026-03-22 — Strategy Created
- Added as Rule #11 in CLAUDE.md (continuous hygiene on every edit)
- Created `/code-hygiene` command for periodic deep scans
- Created this strategy doc
- Motivation: Previous root directory cleanup (17 items deleted) and CLAUDE.md overhaul showed that drift accumulates silently. The goal is to prevent accumulation rather than react to it.
