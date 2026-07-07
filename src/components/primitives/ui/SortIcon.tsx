/**
 * SortIcon — asc/desc/unsorted chevron used in TableHeader.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 10×12 SVG · active vs faint fill driven by `dir` prop.
 */

export type SortDir = 'asc' | 'desc' | null;

export interface SortIconProps {
  dir?: SortDir;
  className?: string;
}

export function SortIcon({ dir = null, className }: SortIconProps) {
  const ascActive = dir === 'asc';
  const descActive = dir === 'desc';
  return (
    <svg
      width="10"
      height="12"
      viewBox="0 0 10 12"
      className={className}
      style={{ flexShrink: 0 }}
      aria-hidden
    >
      <path
        d="M5 1 L8 4 L2 4 Z"
        className={
          ascActive
            ? 'fill-foreground'
            : 'fill-muted-foreground'
        }
        opacity={ascActive ? 1 : 0.5}
      />
      <path
        d="M5 11 L8 8 L2 8 Z"
        className={
          descActive
            ? 'fill-foreground'
            : 'fill-muted-foreground'
        }
        opacity={descActive ? 1 : 0.5}
      />
    </svg>
  );
}
