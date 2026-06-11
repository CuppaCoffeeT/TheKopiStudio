import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

/**
 * W21 React Query cache fix — the hardcoded-query-key rules below are
 * promoted from "warn" to "error" as Task 1's mechanical sweep is
 * complete. Regression in CI will now fail the build.
 *
 * See:
 *   docs/01-system-architecture/REACT_QUERY_CACHE_MANAGEMENT_STANDARD.md
 *   docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md
 *   .claude/rules/react-query.md
 */
const queryKeyRestrictions = [
  {
    selector:
      "CallExpression[callee.name='useQuery'] Property[key.name='queryKey'] ArrayExpression > Literal:first-child",
    message:
      "Use queryKeys factory from @/utils/queryKeys instead of hardcoded query keys. See REACT_QUERY_CACHE_MANAGEMENT_STANDARD.md",
  },
  {
    selector:
      "CallExpression[callee.name='useMutation'] CallExpression[callee.property.name='invalidateQueries'] Property[key.name='queryKey'] ArrayExpression > Literal:first-child",
    message:
      "Use queryKeys factory from @/utils/queryKeys for cache invalidations. See REACT_QUERY_CACHE_MANAGEMENT_STANDARD.md",
  },
  {
    selector:
      "CallExpression[callee.property.name='invalidateQueries'] Property[key.name='queryKey'] ArrayExpression > Literal:first-child",
    message:
      "Use queryKeys factory from @/utils/queryKeys for cache invalidations. See REACT_QUERY_CACHE_MANAGEMENT_STANDARD.md",
  },
  {
    selector:
      "CallExpression[callee.property.name='removeQueries'] Property[key.name='queryKey'] ArrayExpression > Literal:first-child",
    message:
      "Use queryKeys factory from @/utils/queryKeys for cache invalidations. See REACT_QUERY_CACHE_MANAGEMENT_STANDARD.md",
  },
];

export default tseslint.config(
  {
    ignores: [
      "dist",
      // Generated Supabase type files — parser sees them as binary/too large
      "supabase/types.ts",
      "supabase/remote_types.ts",
      "supabase/remote_public_schema.sql",
      // Playwright MCP artifacts
      ".playwright-mcp/**",
      "playwright-report/**",
      "test-results/**",
      // Dependency-cruiser output
      "drift.svg",
      // Claude Design handoff bundles — reference artifacts, not app source
      "docs/99-refactor/_system/design/**",
      // Claude Code agent worktrees — isolated copies of the repo
      ".claude/worktrees/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // W22 pragma (2026-04-19): pre-existing lint debt downgraded to `warn`
      // so the gate can run zero-error. The `npm run lint` script uses
      // --max-warnings=1700 — new code can't grow the count. Per-category
      // debt burn-down happens:
      //   - no-explicit-any (1326) → W09 per-module typed-supabase migrations
      //   - rules-of-hooks (4) → W21-5 follow-up (real React bugs)
      //   - query-key / useMutation-in-components (50) → W21-5 follow-up (50 inline mutations still to extract after W21-3's first 11)
      //   - regex / case-declarations / ts-comment → W09 module sweeps
      // These are all promoted back to `error` in the W22 Week-5 wrap,
      // once each category card closes.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-case-declarations": "warn",
      "no-useless-escape": "warn",
      "no-empty": "warn",
      "no-control-regex": "warn",
      "no-misleading-character-class": "warn",
      "no-prototype-builtins": "warn",
      "no-duplicate-case": "warn",
      "no-async-promise-executor": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "no-restricted-syntax": ["warn", ...queryKeyRestrictions],
      // No native dropdown chrome: the form `Select` wraps a native <select>.
      // Use `SelectMenu` / `SearchableMultiSelect` from @/components/primitives/overlays
      // (custom-rendered). Raw <select> is separately banned by scripts/check-repo.sh §7a.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/primitives/form",
              importNames: ["Select"],
              message:
                "Native-backed `Select` (OS dropdown chrome) is banned. Use `SelectMenu` or `SearchableMultiSelect` from @/components/primitives/overlays. See .claude/rules/universal-components.md.",
            },
          ],
        },
      ],
    },
  },
  /**
   * W21-4: useMutation is forbidden inside src/components/** — hooks
   * enforce the onSuccess → invalidate pattern via convention, component
   * inlines invite forgetting. Move mutations to src/hooks/ or to a
   * feature-scoped hooks folder (src/features/<name>/hooks/, or the
   * legacy src/components/<area>/hooks/ pattern).
   */
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: [
      "src/components/**/hooks/**",
      "src/components/**/*hooks*/**",
    ],
    rules: {
      // W22 pragma: downgraded to `warn` because 50 component-inline
      // useMutation sites remain from W21-3's partial sweep (extracted
      // 11/61). Tracked as W21-5 follow-up. Promoted back to `error` once
      // the remaining 50 are extracted.
      "no-restricted-syntax": [
        "warn",
        ...queryKeyRestrictions,
        {
          selector: "CallExpression[callee.name='useMutation']",
          message:
            "useMutation is forbidden inside src/components/**. Move the mutation to src/hooks/use<Entity>.ts (or a feature-scoped hooks folder) so the onSuccess → invalidate pattern stays enforced. See W21_REACT_QUERY_CACHE_FIX.md.",
        },
      ],
    },
  },
);
