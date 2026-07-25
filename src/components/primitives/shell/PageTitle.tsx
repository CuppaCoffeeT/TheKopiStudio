/**
 * PageTitle — the locked page-title primitive (h1 for every archetype frame).
 *
 * Every archetype frame (ListPageFrame · DetailPageFrame/PageShellHero ·
 * DashboardHeader · future FORM/SETTINGS/TOOL frames) MUST render its page
 * title through this component. Single source of truth — change the typography
 * here, propagates to every adopter.
 *
 * Locked (2a Kopi House, 2026-07-25):
 *  - Size: 28px ink (`--fg` via text-foreground) — well above the 18px
 *    Instrument Serif floor.
 *  - Family: `--font-pixel` (mapped to Instrument Serif).
 *  - Weight: 400 (Instrument Serif ships roman + italic only).
 *  - Optional inline `count` renders 15px `--fg-dim` beside the title, in
 *    `--font-sans` — 15px sits under the 18px Instrument Serif floor, so the
 *    count must NOT inherit the h1's serif family.
 *
 * Do NOT add `size` variants without explicit user sign-off — drift defeats
 * the purpose of consolidating into one primitive.
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  children: ReactNode;
  className?: string;
  /** Optional inline record count (2a spec: 15px `--fg-dim` sans beside the title). */
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
      style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400, ...style }}
    >
      {children}
      {count !== undefined && count !== null && (
        <span
          className="text-[15px] text-[color:var(--fg-dim)] ml-2 align-baseline"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {count}
        </span>
      )}
    </h1>
  );
}
