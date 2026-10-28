# src/lib — Shared Non-UI Primitives

**Related:** [W07_SHARED_PRIMITIVES.md](../../docs/99-refactor/_system/workflows/W07_SHARED_PRIMITIVES.md)

Cross-feature TypeScript helpers with no React component output. Bulletproof React layout. **Deep imports only** (Q-W07-b) — no barrel `index.ts`.

## Structure

Filesystem as of 2026-10-28:

```
src/lib/
├── design/          # tokens.ts (kpiTileTokens) + ThemeProvider.tsx
├── supabase/        # empty (.gitkeep) — typed-client.ts deleted 2026-10-28
├── __tests__/       # dailyQuote · masking
├── activityLog.ts   # recordActivity()
├── dailyQuote.ts    # quoteForDate() · DAILY_QUOTES
├── iconLookup.ts    # getModuleIcon()
├── masking.ts       # maskName · maskMoney · maskCount · maskText · maskInitial
├── product.ts       # PRODUCT_NAME
├── toolRoutes.ts    # tool route registry + toolHref()
└── utils.ts         # cn() classname merger (shadcn baseline)
```

**Deleted as unused (zero importers per knip)**: `queries/` (`queryOptions` · `mutationTemplate` · `invalidateHelpers`), `supabase/typed-client.ts` (`fetchPage` · `fetchOne` · `fetchDropdown` · `fetchCount` · `db`), `pagination.ts`, `design/emailCategoryTones.ts`, and the `ctaTokens` / `cardTokens` accessors. Feature code calls the Supabase client directly and terminates every `.select()` itself (rule: query-compliance). Record + restore commits: [DEPRECATIONS.md](../../docs/99-refactor/_system/DEPRECATIONS.md). Re-create only when a real consumer needs it.

### Design tokens

```tsx
import { kpiTileTokens } from '@/lib/design/tokens';

// OR prefer CSS var in className:
<div className="rounded-[var(--card-radius)] p-[var(--card-padding)]" />
```

Tokens are the single source of truth from [LOCKED_PICKS.md](../../docs/99-refactor/_system/LOCKED_PICKS.md). If you change a value, change both [tokens.ts](design/tokens.ts) and [index.css](../index.css) in the same commit.

## Rules that apply here

- **Deep imports** (Q-W07-b) — `@/lib/design/tokens`, never `@/lib/design`.
- **No barrels** — don't create `index.ts` in any of these folders.
- **Tokens only for visual values** — never hex literals.
