# Shared Components — Cross-Feature Promotion Lane

**Last Updated**: 2026-05-31 SGT

`src/components/shared/` = presentation used by **2+ features**. Tier 3 of 4: primitives → `ui/` → **shared** → feature-local.

## The rule

- **≥2 features** → lives here. Never duplicate/mirror per feature.
- **1** feature → keep in `features/<x>/components/`.
- Generic + design-spec'd → promote to `primitives/`.
- Compose primitives; own a thin domain slice (query hook, domain dialog), stay presentation-first.
- Second feature needs a feature-local component → move it here, don't copy.

## Inventory

| Sub-domain / file | Holds | Used by (verified) |
|-------------------|-------|---------|
| `agent/` | workflow run UI (rail panel, confirm modal, input forms) + hooks + wire types | agent-runs, agent-setup, hr-applications |
| `cdw-spatial/` | CDW part cards + spatial-feature editor + modals + hooks | projects, quotations |
| `email/` | `EmailRecipientPicker` + recipient queries/actions + sub-modals | invoices, quotations |
| `nas/` | NAS folder picker/card/row + `LinkedNASPathPill` | projects, quotations |
| `project-create/` | `NewProjectIdentificationFields` · `ProjectClientContactsFields` | projects, quotations (accept-quote flow) |
| `project-form-import/` | project intake/import form fields + parsing helpers (shared create/import surface) | projects, quotations (accept-quote/import flow) |
| `plan-purchase/` | plan-purchase request UI (cards/table/rows + line-item editor + modals) | plan-purchase page, projects detail |
| `worker-ot/` | `WorkerOTTable` + `workerOTTableShared` (cell/column factories) | promoted shared OT-table layer (fieldops OT surfaces) |
| `trial-trench/` | `TrialTrenchExpandedPanel` + cells (`ProjectCell`/`PeopleCell`/`UpdatedCell`/…) + mode config + `trialTrenchTableShared` factories | jltt, fieldops review queues, projects detail; cells reused by worker-ot + general-works |
| `general-works/` | `GeneralWorksTable` · `GeneralWorksDetailSheet` · `GeneralWorksStatusTimeline` · `GeneralWorksFileManager` (+ `file-manager/`) · wizard `form/*` · `generalWorksTableShared`+`generalWorksTableColumns` factories · GW record types | fieldops (generalworks page/review/coordinator-review/work-entry submissions), drafterdashboard, projects detail |
| `completed-work/` | `CompletedWorkTab` · `CompletedWorkActionsProvider` · `CompletedWorkMobileActions` + claiming line-items/modals subtree | projects detail, payment-management claims detail |
| `DrawingListTable.tsx` · `DrawingFilesInlinePanel.tsx` | drawing list + inline files | projects, fieldops |
| `NASStatusPill.tsx` · `SyncStatusIndicator.tsx` | NAS/sync status widgets | fieldops |
| `LinkReplacementFileDialog.tsx` · `MultiSelectDropdown.tsx` | small cross-feature widgets | projects + others |

Subdomains expose a barrel `index.ts`; import from `@/components/shared/<domain>`. Loose `.tsx` files are pre-barrel widgets — import by path until barrelised.

## 📚 Related

- [primitives/CONTEXT.md](../primitives/CONTEXT.md) — Tier 1
- [universal-components-protocols.md](../../../.claude/rules/universal-components-protocols.md) — Tier 2 `ui/`
- [CANONICAL_FEATURE_FOLDER.md](../../../docs/01-system-architecture/CANONICAL_FEATURE_FOLDER.md) — Tier 4 + promotion lane
