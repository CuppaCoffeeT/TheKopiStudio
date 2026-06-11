# Components — Shared Primitive Root

**Last Updated**: 2026-05-31 SGT

`src/components/` holds **only three tiers** (SRC_STRUCTURE_CLEANUP_PRD, 2026-05-31). All legacy `src/components/<domain>/` folders were relocated into their owning `features/<x>/` (single-consumer) or promoted to `shared/<domain>/` (≥2 consumers), or deleted as dead. A `no-stray-domain-components` dependency-cruiser rule (severity `error`) now blocks any new top-level domain folder or loose root file. One of four shared lanes (`components` · `hooks` · `lib` · `utils`) per X5 (Bulletproof React).

## Scope

**Belongs** (the only three allowed subtrees):
- `primitives/` — design-system primitives (stateless, design-spec-backed)
- `ui/` — shadcn base + sanctioned domain wrappers (see `.claude/rules/universal-components-protocols.md`)
- `shared/` — cross-feature surfaces used by **≥2 features**

**Doesn't**: single-feature components (→ `src/features/<name>/components/`); pages (`src/pages/`); data hooks (`src/hooks/` global, else `features/<x>/hooks/`); domain logic (`src/lib/<domain>/`). **No loose root files, no domain folders** — the dep-cruiser rule fails CI on them.

## Navigation

| Folder | Domain |
|--------|--------|
| **`primitives/` ⭐ READ [primitives/CONTEXT.md](./primitives/CONTEXT.md)** | Design-system primitives across 8 groups (shell · form · overlays · detail · dashboard · charts · ui · atoms). **Always check here first — reuse over rebuild.** Live count + inventory in primitives/CONTEXT.md (do not hardcode — it drifts). |
| `ui/` | shadcn primitives + sanctioned domain wrappers (`staff-select`, `company-select`, `contact-form`, `cdw-parts`, `nce`, `client-contact-multi-select`, …). Sanctioned exceptions tracked in `.claude/rules/universal-components-protocols.md`. |
| **`shared/` ⭐ READ [shared/CONTEXT.md](./shared/CONTEXT.md)** | Tier-3 cross-feature surfaces (≥2 features). 16 domains incl. `app-shell` (ProtectedRoute · DashboardLayout · GlobalCommandPalette · ErrorBoundary) · `claims` · `trial-trench` · `engineer-dashboard` · `nas` · `company-form` · `payslip-templates` · `agent` · `email` · `cdw-spatial` · `general-works` · `plan-purchase` · `project-create` · `project-form-import` · `worker-ot` · `completed-work`. |

## Before working here

- **New code imports from `primitives/`** (not `ui/`) — see `.claude/rules/universal-components.md` Need→Import matrix.
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
- [docs/99-refactor/_system/ARCHITECTURE_BLUEPRINT.md](../../docs/99-refactor/_system/ARCHITECTURE_BLUEPRINT.md) — target shape (now Realized) · [docs/05-implementation/active/SRC_STRUCTURE_CLEANUP_PRD.md](../../docs/05-implementation/active/SRC_STRUCTURE_CLEANUP_PRD.md) — the cleanup that produced this shape
