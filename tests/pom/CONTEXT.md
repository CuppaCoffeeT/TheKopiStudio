# Page Object Models — Reusable Page Wrappers

Per-page interaction wrappers + cross-cutting UI helpers. Specs import these instead of inlining `page.getByTestId()` chains.

## Scope

**Belongs**: page-class POMs + reusable UI helpers used across ≥2 specs.
**Doesn't**: specs (`../workflows/`); DB / NAS / API runners (`../runners/`); fixtures (`../fixtures/`).

## Navigation

| File | Purpose |
|------|---------|
| `LoginPage.ts` | Login flow wrapper (used by storageState seeding + ad-hoc specs) |
| `QuotationCreatePage.ts` | Quotation creation flow — multi-step form helpers |
| `responsiveTabs.ts` | `switchResponsiveTab(page, prefix, value)` — handles desktop Tabs + mobile Select; required for any module using shared `ResponsiveTabsList` |

## Before working here

- **Naming**: `<Page>Page.ts` for page wrappers; `<helper>.ts` for cross-cutting helpers.
- **Selectors**: `data-testid` only inside POMs — when the underlying component changes, the POM is the single fix point.
- **Stateless**: POMs receive a `Page` and act on it; do not hold long-lived state.
- **Shared cross-cutting**: when a pattern appears in 2+ specs, lift it here (e.g. `switchResponsiveTab` was extracted after 5 modules adopted `ResponsiveTabsList`).
- **Don't leak runners**: POMs touch the UI only. DB/NAS/API checks belong in `../runners/`.

## 📚 Related

- [tests/CONTEXT.md](../CONTEXT.md) · [tests/workflows/CONTEXT.md](../workflows/CONTEXT.md) · [tests/runners/CONTEXT.md](../runners/CONTEXT.md)
