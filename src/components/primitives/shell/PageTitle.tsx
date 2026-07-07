/**
 * PageTitle — the locked page-title primitive (h1 for every archetype frame).
 *
 * Every archetype frame (ListPageFrame · DetailPageFrame/PageShellHero ·
 * DashboardHeader · future FORM/SETTINGS/TOOL frames) MUST render its page
 * title through this component. Single source of truth — change the typography
 * here, propagates to every adopter.
 *
 * Locked:
 *  - Size ramp: 32px mobile → 38px sm → 48px md+ (pixel grain visible from
 *    ≥32px at crisp rendering; 56px was too dominant — user feedback 2026-04-21).
 *  - Family: `--font-pixel` (Geist Pixel Square).
 *  - Weight: 500.
 *  - Crisp rendering (`-webkit-font-smoothing: none`) via `font-pixel-crisp`.
 *
 * Do NOT add `size` variants without explicit user sign-off — drift defeats
 * the purpose of consolidating into one primitive.
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  children: ReactNode;
  className?: string;
  /** Escape hatch for display-hero overrides (e.g. 404/error code clamp sizes).
   *  Merged on top of the locked font-family/weight defaults. */
  style?: CSSProperties;
}

export function PageTitle({ children, className, style }: PageTitleProps) {
  return (
    <h1
      className={cn(
        'font-pixel-crisp m-0 text-[32px] sm:text-[38px] md:text-5xl text-foreground leading-tight tracking-tight',
        className,
      )}
      style={{ fontFamily: 'var(--font-pixel, var(--font-sans))', fontWeight: 500, ...style }}
    >
      {children}
    </h1>
  );
}
