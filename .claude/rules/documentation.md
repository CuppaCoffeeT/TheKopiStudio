---
paths:
  - docs/**/*.md
---

# Rule: Documentation Standards (MANDATORY)

**Last Updated**: 2026-07-27 SGT

## Summary

All documentation files must follow strict placement, naming, and formatting rules. Files go in the appropriate `docs/[category]/` folder, use `SCREAMING_SNAKE_CASE.md` naming, include a required header with metadata fields, and must be registered in `DOCUMENTATION_INDEX.md`. Every new doc requires bidirectional linking with related documentation.

## Detailed Patterns

### Directory Structure

Verified against the filesystem 2026-07-27. If a folder is not listed here, it does not exist — do not invent one.

```
docs/
├── 01-system-architecture/  # Core system design (MODULE_SYSTEM.md, CRM_DATA_SPINE.md, DATABASE_POLICY.md, …)
│   ├── authentication/           # Auth workspace
│   ├── canonical-page-patterns/  # The 6 CANONICAL_*_PATTERN.md docs (LIST_TABLE, DETAIL, FORM, DASHBOARD, SETTINGS, FEATURE_FOLDER)
│   ├── design-system/            # PHILOSOPHY · TYPOGRAPHY · COLORS · TOKENS · PRIMITIVES · ARCHETYPES · …
│   ├── query-patterns/           # Sub-guides of SUPABASE_QUERY_STANDARDS.md
│   └── react-query-cache/        # Cache-key + invalidation standard
├── 02-security/             # Security policies (AUTH_USER_ID_NORMALIZATION, USER_APPROVAL_WORKFLOW, …)
├── 03-features/             # Feature specs — profiler/ and crm/ (+ autonomous-agent/)
├── 04-integrations/         # External integrations (VERCEL_*, EDGE_FUNCTION_*, MCP_DB_ACCESS, TOAST_SYSTEM)
├── 05-implementation/       # Implementation plans — active/ · completed/ · design-handoffs/
├── 06-operations/           # Operations & maintenance (migrations/, SOPs, E2E runbooks)
├── 99-meta/                 # Meta documentation (standards, token budget, architecture)
├── 99-refactor/             # Refactor-program docs (_system/ W## cards, design catalogs, DEPRECATIONS.md)
├── CONTEXT.md / CONTEXT_MAP.md / ONBOARDING.md
└── DOCUMENTATION_INDEX.md   # Master index (root-level)
```

> Folder structure is now governed by [99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md](../../docs/99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md), which supersedes the older [99-meta/DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md](../../docs/99-meta/DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md) on directory layout.

### Required File Header (EVERY .md file)

```markdown
# Document Title

**Created**: YYYY-MM-DD HH:MM:SS SGT
**Last Updated**: YYYY-MM-DD HH:MM:SS SGT
**Status**: 🔵 Planning | ⚪ Draft | 🟢 Production | 🟡 Transitional | 🔴 Deprecated
**Priority**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low

## 📋 Overview
[Brief description and purpose]

## 📚 Related Documentation
- [Related Doc](../path/to/doc.md) - Brief description
```

### Naming Convention

- ✅ `SCREAMING_SNAKE_CASE.md` (e.g., `PROJECT_MANAGEMENT_SYSTEM.md`)
- ❌ kebab-case, camelCase, or PascalCase

### MANDATORY Process

1. ✅ Check if similar doc exists in [DOCUMENTATION_INDEX.md](../../docs/DOCUMENTATION_INDEX.md)
2. ✅ Place in correct `docs/[category]/` folder (see structure above)
3. ✅ Use required header format with all fields
4. ✅ Update [DOCUMENTATION_INDEX.md](../../docs/DOCUMENTATION_INDEX.md) with new entry
5. ✅ Link related documentation bidirectionally
6. ✅ **Verify every path, component, hook and token name you cite actually exists** — `ls` the path, `grep` the symbol, and check [DEPRECATIONS.md](../../docs/99-refactor/_system/DEPRECATIONS.md) that it was not deleted. A doc pointing at a deleted file is the failure this rule exists to prevent.
7. ✅ When retiring content, **retitle it `Historical (<era>, retired <date>)` and keep the text verbatim** — never delete "Errors Encountered" / "What NOT To Try Again" / debugging-history sections.

### Templates

- Feature Specification: See [DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md](../../docs/99-meta/DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md) lines 129-162
- Implementation Plan: Lines 165-204
- Policy/Standard: Lines 207-234

## Known Patterns


### Pattern: Stale doc status and file references after implementation phases
**Occurrences**: 5 (as of 2026-03-26)
**Files affected**: docs/05-implementation/active/ENGINEER_WORKLOAD_ASSIGNMENT_MODULE.md, docs/DOCUMENTATION_INDEX.md, docs/03-features/autonomous-agent/CREATING_SPECIALIST_AGENTS.md
**Problem**: Documentation status headers, file tables, and descriptions not updated after completing implementation phases. Examples: status still saying "Phase 1+2" after Phase 3 was done; DOCUMENTATION_INDEX.md showing "Planning" for a production module; referencing non-existent files (e.g., `src/config/agentPersonalityFiles.ts`); using wrong column names in SQL examples that don't match actual schema.
**Solution**: After completing any implementation phase: (1) update the doc header status, (2) update file tables to match current filenames, (3) verify all file paths exist with Glob before documenting them, (4) verify column names against actual schema before writing SQL examples. Also read MODULE_CREATION_SOP.md before building any new module — follow the CLAUDE.md routing table.

## References

- [docs/99-meta/DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md](../../docs/99-meta/DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md)
- [docs/99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md](../../docs/99-meta/WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md) — supersedes the PLAN for folder structure
- [docs/DOCUMENTATION_INDEX.md](../../docs/DOCUMENTATION_INDEX.md)
