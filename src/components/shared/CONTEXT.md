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

**One domain today** — verified against the filesystem 2026-07-27
(`find src/components/shared -name '*.tsx'`):

| Sub-domain / file | Holds | Used by (verified) |
|-------------------|-------|---------|
| `app-shell/` | `ProtectedRoute` · `DashboardLayout` · `GlobalCommandPalette` · `ErrorBoundary` | `src/App.tsx` (routing shell); `DashboardLayout` mounts `GlobalCommandPalette` |

There are no loose `.tsx` files at the root of `shared/` and no barrel `index.ts` —
import by explicit path, e.g. `@/components/shared/app-shell/ProtectedRoute`.

> **Historical (multi-domain era, retired 2026-07-27)** — this table previously listed 15
> further sub-domains (`agent/` · `cdw-spatial/` · `email/` · `nas/` · `project-create/` ·
> `project-form-import/` · `plan-purchase/` · `worker-ot/` · `trial-trench/` ·
> `general-works/` · `completed-work/`) plus loose widgets (`DrawingListTable.tsx` ·
> `DrawingFilesInlinePanel.tsx` · `NASStatusPill.tsx` · `SyncStatusIndicator.tsx` ·
> `LinkReplacementFileDialog.tsx` · `MultiSelectDropdown.tsx`). None of those paths exist
> in this repo — they left with the features they served when the app was merged down to
> `account-settings` · `crm` · `manage-accounts` · `profiler`. Do not cite them as live.

## 📚 Related

- [primitives/CONTEXT.md](../primitives/CONTEXT.md) — Tier 1
- [.claude/rules/ui-components.md](../../../.claude/rules/ui-components.md) — Tier 2 `ui/`
- [CANONICAL_FEATURE_FOLDER.md](../../../docs/01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md) — Tier 4 + promotion lane
