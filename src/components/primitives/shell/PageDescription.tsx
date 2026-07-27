/**
 * PageDescription — the locked sub-text primitive paired with `<PageTitle>`.
 *
 * Every archetype frame that renders a description paragraph under the page
 * title (ListPageFrame · AppHeaderShell · future FORM/SETTINGS frames) MUST
 * render it through this component. Single source of truth for description
 * typography — change here, propagates everywhere.
 *
 * Scope:
 *  - Prose description only (e.g. "Manage quotations and track workflow …").
 *  - NOT for detail-page meta lines (record-id · dates · status pills) —
 *    those stay in `<PageShellHero>` because they're a different concept.
 *
 * Locked:
 *  - Size ramp: 14px mobile → 16px sm+.
 *  - Color: `--fg-dim` (#5D4F3F) — AA-safe on the page cream, where every
 *    list frame renders this paragraph.
 *  - Family: `--font-sans` (IBM Plex Sans).
 *  - Top margin: `mt-2` (stacks under PageTitle).
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function PageDescription({ children, className }: PageDescriptionProps) {
  return (
    <p
      className={cn(
        'mt-2 text-sm sm:text-base text-[color:var(--fg-dim)]',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {children}
    </p>
  );
}
