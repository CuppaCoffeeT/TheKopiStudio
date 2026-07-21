/**
 * PageTitle — the locked page-title primitive (h1 for every archetype frame).
 *
 * Every archetype frame (ListPageFrame · DetailPageFrame/PageShellHero ·
 * DashboardHeader · future FORM/SETTINGS/TOOL frames) MUST render its page
 * title through this component. Single source of truth — change the typography
 * here, propagates to every adopter.
 *
 * Locked (1a Masthead, 2026-07-21):
 *  - Size: Georgia 28px, cream (`--fg` via text-foreground).
 *  - Family: `--font-pixel` (mapped to Georgia serif since de-AppBase).
 *  - Weight: 400 (serif carries the weight; 500+ muddies Georgia).
 *  - Optional inline `count` renders 15px `--fg-muted` beside the title.
 *
 * Do NOT add `size` variants without explicit user sign-off — drift defeats
 * the purpose of consolidating into one primitive.
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  children: ReactNode;
  className?: string;
  /** Optional inline record count (1a spec: 15px muted beside the title). */
  count?: ReactNode;
  /** Escape hatch for display-hero overrides (e.g. 404/error code clamp sizes).
   *  Merged on top of the locked font-family/weight defaults. */
  style?: CSSProperties;
}

export function PageTitle({ children, className, count, style }: PageTitleProps) {
  return (
    <h1
      className={cn(
        'm-0 text-[28px] text-foreground leading-tight tracking-tight',
        className,
      )}
      style={{ fontFamily: 'var(--font-pixel, Georgia, serif)', fontWeight: 400, ...style }}
    >
      {children}
      {count !== undefined && count !== null && (
        <span className="text-[15px] text-muted-foreground ml-2 align-baseline">{count}</span>
      )}
    </h1>
  );
}
