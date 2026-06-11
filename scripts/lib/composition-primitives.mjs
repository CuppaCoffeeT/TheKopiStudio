/**
 * Composition primitive whitelist — shared between the modules + primitives
 * manifest builders to avoid circular imports.
 *
 * Keys = repo-relative paths of wrapper components that internally render
 * other primitives. Values = display name for the `via` tag on indirect
 * adopter entries in the Primitives manifest.
 *
 * One-hop transitive adoption:
 *   Page → imports ListPageFrame → ListPageFrame imports AppHeader/FilterBar/...
 *   → Page is recorded as an INDIRECT adopter of AppHeader/FilterBar/... with
 *     source: 'via ui/ListPageFrame'.
 *
 * NEVER recurse beyond one hop (prevents chains + infinite loops).
 */
export const COMPOSITION_PRIMITIVES = {
  'src/components/primitives/ui/ListPageFrame.tsx': 'ui/ListPageFrame',
  'src/components/primitives/detail/DetailPageFrame.tsx': 'detail/DetailPageFrame',
  'src/components/DashboardHeader.tsx': 'DashboardHeader (shim)',
};
