# AppBase Design System — Router

**Created**: 2026-04-22 SGT
**Last Updated**: 2026-04-22 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The single entry point for every design decision in the AppBase portal — tokens, fonts, colors, spacing, primitives, archetypes, and the W17 locked picks that govern all of them. This file **routes**. All detail lives in sub-guides so this page stays scannable.

Supersedes the deprecated Tadao-Ando-era guide, archived at [_archive/DESIGN_SYSTEM.md](./_archive/DESIGN_SYSTEM.md).

## 🧭 Sub-guides

| Topic | Where | When to read |
|---|---|---|
| **Philosophy** + 11 reuse principles | [design-system/PHILOSOPHY.md](./design-system/PHILOSOPHY.md) | Before building anything new |
| **Typography** — Roboto · Geist Mono · Geist Pixel rules | [design-system/TYPOGRAPHY.md](./design-system/TYPOGRAPHY.md) | Any heading or label |
| **Colors** — brand red · zinc scale · semantic · status | [design-system/COLORS.md](./design-system/COLORS.md) | Any color decision |
| **Spacing / radius / shadow / motion** | [design-system/SPACING_MOTION.md](./design-system/SPACING_MOTION.md) | Any layout or animation |
| **Tokens** — all 11 @theme groups, exact values | [design-system/TOKENS.md](./design-system/TOKENS.md) | Authoring a primitive |
| **Primitives** — 79-component inventory | [design-system/PRIMITIVES.md](./design-system/PRIMITIVES.md) | Before building a component |
| **Archetypes** — 6 page shapes (list/detail/form/dashboard/settings/tool) | [design-system/ARCHETYPES.md](./design-system/ARCHETYPES.md) | Starting a new page |
| **Design-lab previews** — HTML visual source-of-truth | [design-system/DESIGN_LAB_CATALOG.md](./design-system/DESIGN_LAB_CATALOG.md) | Visual verification |

## 🧱 Authoritative sources (do not duplicate — read directly)

| What | Where |
|---|---|
| Runtime tokens | [src/index.css](../../src/index.css) `@theme` block + [src/lib/design/tokens.ts](../../src/lib/design/tokens.ts) |
| W17 component locks | [LOCKED_PICKS.md](../99-refactor/_system/LOCKED_PICKS.md) |
| Primitive inventory | [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md) |
| Design · Impl · Adopted matrix | [DESIGN_CATALOG.md](../99-refactor/_system/DESIGN_CATALOG.md) |
| Need → Import matrix | [.claude/rules/universal-components.md](../../.claude/rules/universal-components.md) |
| 11 reuse principles | [DESIGN_REUSE_PRINCIPLES.md](../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) |
| Handoff previews (HTML) | [docs/99-refactor/_system/design/](../99-refactor/_system/design/) |

## 🔐 Hard rules

1. **New code imports from `@/components/primitives/**`** — never `@/components/ui/**` (legacy shadcn raw). Sanctioned exceptions in [.claude/rules/universal-components-protocols.md](../../.claude/rules/universal-components-protocols.md).
2. **Tokens not hex** — consume v4 `@theme` tokens, not raw `#rrggbb`. Primitive-specific token groups in [TOKENS.md](./design-system/TOKENS.md).
3. **Fonts by role** — Roboto body · Geist Mono labels/kbd · Geist Pixel Square h1 ≤48px · Geist Pixel Grid ≥140px. [Details](./design-system/TYPOGRAPHY.md).
4. **Grey CTA, red accent only** — `--cta-primary-bg` = slate-800; red-700 is destructive / focus ring only. Locked 2026-04-19.
5. **5 states always** — default · hover · active · focus-visible · disabled (per [DESIGN_REUSE_PRINCIPLES.md](../99-refactor/_system/DESIGN_REUSE_PRINCIPLES.md) rule 11).
6. **Every W09-migrated feature = 100% primitive** — compliance greps defined in [docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md](../06-operations/MODULE_COMPLIANCE_CHECKLIST.md).

## 📚 Related

- [URL_STANDARDS.md](./URL_STANDARDS.md) — routing conventions
- [MODULE_SYSTEM.md](./MODULE_SYSTEM.md) — RBAC patterns
- [WORKFLOW_SYSTEM.md](./WORKFLOW_SYSTEM.md) — status/state machines
- [SEARCHABLE_SELECT_COMPONENT.md](./SEARCHABLE_SELECT_COMPONENT.md) — dropdown pattern
- [SUPABASE_QUERY_STANDARDS.md](./SUPABASE_QUERY_STANDARDS.md) — server-side pagination
