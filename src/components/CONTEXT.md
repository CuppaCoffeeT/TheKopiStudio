# Components — Shared Primitive Root

**Last Updated**: 2026-05-31 SGT

`src/components/` holds **only three tiers** (src-structure cleanup, 2026-05-31 — that PRD is no longer in the repo). All legacy `src/components/<domain>/` folders were relocated into their owning `features/<x>/` (single-consumer) or promoted to `shared/<domain>/` (≥2 consumers), or deleted as dead. A `no-stray-domain-components` dependency-cruiser rule (severity `error`) now blocks any new top-level domain folder or loose root file. One of four shared lanes (`components` · `hooks` · `lib` · `utils`) per X5 (Bulletproof React).

## Scope

**Belongs** (the only three allowed subtrees):
- `primitives/` — design-system primitives (stateless, design-spec-backed)
- `ui/` — shadcn base components (54 files, all lowercase-kebab shadcn-generated; see [`.claude/rules/ui-components.md`](../../.claude/rules/ui-components.md))
- `shared/` — cross-feature surfaces used by **≥2 features**

**Doesn't**: single-feature components (→ `src/features/<name>/components/`); pages (`src/pages/`); data hooks (`src/hooks/` global, else `features/<x>/hooks/`); domain logic (`src/lib/<domain>/`). **No loose root files, no domain folders** — the dep-cruiser rule fails CI on them.

## Navigation

| Folder | Domain |
|--------|--------|
| **`primitives/` ⭐ READ [primitives/CONTEXT.md](./primitives/CONTEXT.md)** | Design-system primitives across 8 groups (shell · form · overlays · detail · dashboard · charts · ui · atoms). **Always check here first — reuse over rebuild.** Live count + inventory in primitives/CONTEXT.md (do not hardcode — it drifts). |
| `ui/` | shadcn base components only (54 files, lowercase-kebab). The old domain wrappers (`staff-select`, `company-select`, `cdw-parts`, `nce`, …) left with their features and no longer exist. Rule: [`.claude/rules/ui-components.md`](../../.claude/rules/ui-components.md). |
| **`shared/` ⭐ READ [shared/CONTEXT.md](./shared/CONTEXT.md)** | Tier-3 cross-feature surfaces (≥2 features). **One domain today**: `app-shell/` (ProtectedRoute · DashboardLayout · GlobalCommandPalette · ErrorBoundary). The other 15 domains left with the features they served. |

## Before working here

- **New code imports from `primitives/`** (not `ui/`) — see [`.claude/rules/ui-components.md`](../../.claude/rules/ui-components.md) (auto-loaded) and the Need→Import matrix in [UNIVERSAL_COMPONENTS.md](../../docs/99-refactor/_system/UNIVERSAL_COMPONENTS.md).
- **Single-feature component?** It does NOT belong here — put it in `src/features/<name>/components/`. The dep-cruiser rule will fail CI otherwise.
- **Cross-feature (≥2 features)?** Promote to `shared/<domain>/` — never mirror into a consuming feature (that re-creates a cross-feature edge).
- **Portals in dialogs**: dropdowns inside Dialog need `Portal` wrapper (rule: ui-components).
- **Toast**: `showSuccess`/`showError` from `@/utils/toastHelper` (rule: toast-system).
- **Dates**: `@/utils/timezoneUtils` (rule: timezone).
- **Module access**: `useAuth().modules.some(m => m.path === '/x')` (rule: module-access).
- **Mutations**: extract to a hook — `useMutation` is forbidden inside `src/components/**` by ESLint (W21-4).
- **Query keys**: `queryKeys` factory (rule: react-query). **Lists**: `.range()` + `useURLPagination` (rules: query-compliance · url-standards).

## 📚 Related

- [src/CONTEXT.md](../CONTEXT.md) · [primitives/CONTEXT.md](./primitives/CONTEXT.md) (Tier 1) · [shared/CONTEXT.md](./shared/CONTEXT.md) (Tier 3) · [docs/01-system-architecture/DESIGN_SYSTEM.md](../../docs/01-system-architecture/DESIGN_SYSTEM.md)
- [docs/99-refactor/_system/ARCHITECTURE_BLUEPRINT.md](../../docs/99-refactor/_system/ARCHITECTURE_BLUEPRINT.md) — target shape (now Realized)
