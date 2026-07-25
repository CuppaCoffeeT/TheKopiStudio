# Primitives — Page composition + edit protocols

Patterns for composing primitives into pages, plus the rules for editing or creating one. Parent: [CONTEXT.md](./CONTEXT.md).

## Page composition pattern

- **Detail pages**: wrap with [`<DetailPageFrame>`](./detail/DetailPageFrame.tsx) — composes `AppHeaderMobileBar` + `PageShell` + `TabNav` + `ImpersonationBanner` internally. Pages pass flat props (breadcrumb · title · status · actions · tabs · sideRail · children). No chrome plumbing. Breadcrumb owns back nav — no back button. Fill the body with the 2a dossier vocabulary from [`detail/dossier`](./detail/dossier/index.ts) — `DossierPanel` (uppercase tracked label + cream card) wrapping `DossierStatGrid` / `DossierRampBar` / `DossierKeyValueList`, plus `DossierLoadingPanel` for transient states — never ad-hoc cards.
- **List pages**: `DashboardHeader` shim delegates to `AppHeader` + heading block — 71 pages inherit S-shell glass chrome with zero call-site edits. New list pages should use `<ListPageFrame>` from `primitives/ui` directly.
- **Form pages**: compose `Field` wrappers around `Input` / `Textarea` / `Select` / `DatePicker` etc. See [form/index.ts](./form/index.ts).
- **Tables**: compose `DataTable` + `TableHeader` (sortable) + `DataRow` + `Pagination`. Mobile breakpoint swaps `DataRow` for `MobileListCard`. See [ui/index.ts](./ui/index.ts).

## Before working here

- **New code**: check the [CONTEXT.md](./CONTEXT.md) inventory, pick the right group, `import` from its barrel. Never from `@/components/ui/**` (legacy shadcn raw).
- **Editing a primitive**: propagates to every adopter — grep [DESIGN_CATALOG.md](../../../docs/99-refactor/_system/DESIGN_CATALOG.md) matrix first. Follow [`.claude/rules/design-system.md`](../../../.claude/rules/design-system.md) 5-check protocol (spec read → 5 states → visual verify → catalog sync → JSDoc update).
- **Creating a new primitive**: requires a Claude Design spec (no spec, no build). Run `/design-prompt` → `/design-import` → `/design-import --promote`.

## Spec exception

Every primitive's JSDoc header cites its Claude Design spec. **Exception (2026-04-23): `AIInboxRail.tsx` does NOT have a spec — promoted directly from feature code when the pattern was needed across pages. Its JSDoc header documents the exception. Future redesigns should back-fill the spec.**

## 📚 Related

- [CONTEXT.md](./CONTEXT.md) — primitives router + inventory
- [CHANGELOG.md](./CHANGELOG.md) — promotion history
- [.claude/rules/design-system.md](../../../.claude/rules/design-system.md) — visual-verify protocol
- [.claude/rules/universal-components.md](../../../.claude/rules/universal-components.md) — use-primitive-over-shadcn cheat
- [DESIGN_CATALOG.md](../../../docs/99-refactor/_system/DESIGN_CATALOG.md) — canonical matrix
- [DESIGN_REUSE_PRINCIPLES.md](../../../docs/99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) — 11 hard rules
