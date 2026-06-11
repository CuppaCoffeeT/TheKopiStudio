/**
 * W05 Drift Detector — dependency-cruiser config
 *
 * Enforces Bulletproof React boundaries (X5/X7 locked picks):
 *   - src/features/<name>/ — feature workspaces, colocated subfolders
 *   - src/components/, src/hooks/, src/lib/, src/utils/ — the only cross-feature lanes
 *   - src/pages/ — thin route entries; never pulled from features
 *
 * Tuning policy: 6 rules — not 30. Advisory during refactor; CI-wired in W22.
 * See docs/99-refactor/_system/workflows/W05_DRIFT_DETECTOR.md
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-cross-feature-imports",
      comment:
        "Feature workspaces are islands. src/features/<A> may not import from src/features/<B>. " +
        "Cross-feature reuse goes through src/components/, src/hooks/, src/lib/, or src/utils/. " +
        "Narrow exception: cross-feature consumption of a domain barrel is allowed when the " +
        "barrel path matches the explicit allowlist below (currently: salary). Deep paths still " +
        "blocked — consumers must hit `index.ts` only.",
      severity: "error",
      from: {
        path: "^src/features/([^/]+)/",
      },
      to: {
        path: "^src/features/([^/]+)/",
        pathNot: "^src/features/$1/|^src/features/salary/index\\.ts$",
      },
    },
    {
      name: "no-pages-to-features",
      comment:
        "src/pages/ must stay thin — route components that compose shared primitives. " +
        "Do not pull logic from src/features/. Move the page into the feature instead.",
      severity: "error",
      from: { path: "^src/pages/" },
      to: { path: "^src/features/" },
    },
    {
      name: "no-pages-import-outside-pages",
      comment:
        "Nothing outside src/pages/ or src/App.tsx should import from @/pages/* or src/pages/*. " +
        "Pages are route terminals, not a shared module.",
      severity: "error",
      from: {
        path: "^src/",
        pathNot: "^src/(pages/|App\\.tsx$|main\\.tsx$)",
      },
      to: { path: "^src/pages/" },
    },
    {
      name: "no-circular",
      comment:
        "Circular dependencies cause unpredictable init order, inflate bundle size, and block tree-shaking.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-stray-domain-components",
      comment:
        "src/components/ may only contain primitives/, ui/, shared/. Domain code belongs in " +
        "src/features/<x>/; cross-feature surfaces in src/components/shared/<domain>/. A new " +
        "top-level src/components/<domain>/ folder (or loose root file) is structural drift — fails CI. " +
        "Guards the SRC_STRUCTURE_CLEANUP_PRD end-state (2026-05-31).",
      severity: "error",
      from: { path: "^src/components/(?!primitives/|ui/|shared/)" },
      to: {},
    },
  ],
  // NOTE: rule (d) from W05 card — "warn on src/components/<sub>/<file> imported by >3 features"
  // is computed post-hoc in scripts/drift_weekly_digest.sh via `depcruise --output-type json`.
  // The dep-cruiser schema doesn't allow numberOfDependentsMoreThan under `forbidden.to`, and a
  // module-level `forbidden` rule without `from` is rejected. Keeping the detection in the digest
  // avoids bloating the rule set and keeps oversharing advisory — not a blocking violation.
  allowed: [
    {
      comment:
        "Features MAY import from the four shared lanes — components, hooks, lib, utils.",
      from: { path: "^src/features/" },
      to: { path: "^src/(components|hooks|lib|utils)/" },
    },
    {
      comment: "Features may import from themselves.",
      from: { path: "^src/features/([^/]+)/" },
      to: { path: "^src/features/$1/" },
    },
    {
      comment: "Any module may import from shared lanes, types, integrations, constants, config, contexts, services.",
      from: { path: "^src/" },
      to: {
        path: "^src/(components|hooks|lib|utils|types|integrations|constants|config|contexts|services|styles|features)/",
      },
    },
    {
      comment: "Pages and App.tsx drive route composition.",
      from: { path: "^src/(pages/|App\\.tsx$|main\\.tsx$)" },
      to: { path: "^src/" },
    },
  ],
  allowedSeverity: "warn",
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "(^|/)(__tests__|\\.test\\.|\\.spec\\.|stories\\.)",
    },
    includeOnly: "^src/",
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
      mainFields: ["module", "main", "types", "typings"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
      archi: {
        collapsePattern:
          "^(packages|src|node_modules)/(@[^/]+/[^/]+|[^/]+)",
      },
    },
  },
};
