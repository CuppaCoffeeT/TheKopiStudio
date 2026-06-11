# Deprecations Log

**Created**: 2026-05-25 SGT
**Last Updated**: 2026-05-25 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Purpose

Single source of truth for routes, components, hooks, and services that have been **deleted from the codebase**. Older docs across the repo still reference these names — that is documentation drift, not a signal that the code still exists.

**Rule when you find a deprecated name in source or tests**: delete the reference immediately. Do not "preserve for backward compatibility" — the symbols are gone, not soft-deprecated. If the reference is inside a doc, either delete it or add a `> ⚠️ DEPRECATED <date>` line pointing at this file.

## 📚 Related Documentation

- [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md) — full doc catalog
- [W09_MODULE_MIGRATIONS.md](./workflows/W09_MODULE_MIGRATIONS.md) — W09 program that drives most deprecations
- [.claude/rules/code-hygiene.md](../../../.claude/rules/code-hygiene.md) — "if you see stale references when touching a file, fix them"

---

## Active deprecations

### 2026-05-25 — `/projects/create` standalone page (W09 #12)

Project creation moved from a standalone full-page form to a primitive-composed modal opened from `/projectlist` and from `AcceptQuotationDialog`. All of the following were **deleted** in the same commit:

| Type | Name | Replaced by |
|---|---|---|
| Route | `/projects/create` (`App.tsx`) | Modal on `/projectlist` ("New project" CTA) |
| Page | `src/pages/ProjectCreate.tsx` (1473 lines) | `src/features/projects/components/NewProjectDialog.tsx` |
| Hook | `src/hooks/useProjectCopyData.ts` | — (Copy-from-existing flow deleted entirely) |
| Service | `createProjectFromCopy` in `src/services/projectService.ts` | — |
| Service | `getCopyProjectData` in `src/services/projectService.ts` | — |
| QueryKey | `queryKeys.projects.copyData` | — |
| QueryKey | `queryKeys.projects.forCreationLinking` | — |
| URL param | `?copy=<id>` on `/projects/create` | — (Copy Project button on project detail page removed) |
| Button | "Copy Project" on `src/pages/ProjectDetailPage.tsx` | — |
| Component | `src/components/project-management/ClientContactMultiSelect.tsx` | `src/components/ui/client-contact-multi-select.tsx` (rebuilt on `StarredMultiSelect` primitive) |

**Workflows affected** (from the legacy `ProjectCreate` flow that are NOT carried over):
- `WF-0406` — "Copy project (clone)" affordance on `/projectlist`/project detail. Removed entirely.
- Link-Related-Project section in the old form. Moved to project detail edit mode.
- Multi-select Area Types / Work Types / Job Types on create. Auto-copied from the linked quotation; manual edit deferred to project detail edit mode.

**If you find any of these names in src/ or tests/, delete the reference.**

**If you find them in a doc**, either delete the line OR add a `> ⚠️ DEPRECATED 2026-05-25 — see DEPRECATIONS.md` callout above it.

**Verification once cleaned**:
```bash
# All three should return zero hits in src/ + tests/:
grep -rn "projects/create\|ProjectCreate\|createProjectFromCopy\|getCopyProjectData\|useProjectCopyData\|forCreationLinking" src/ tests/ --include="*.tsx" --include="*.ts"
grep -rn "project-management/ClientContactMultiSelect" src/ tests/ --include="*.tsx" --include="*.ts"
grep -rn "/projects/create" src/ tests/ --include="*.tsx" --include="*.ts"
```

(One historical JSDoc line in `NewProjectDialog.tsx` mentioning "Replaces the standalone `/projects/create` page" is intentional and may stay.)
