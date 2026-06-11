/**
 * Tiny shared display atoms for the profiling wizard + result report.
 * Ports of the legacy `.ey` eyebrow and `.dbg` DISC badge styles, restyled
 * with AppBase tokens. Display-only — no interactivity.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PR } from '../../lib/content';
import type { DiscLetter } from '../../types';

/** Uppercase mono section eyebrow (legacy `.ey`). */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn('block uppercase text-zinc-600 dark:text-zinc-400 mb-2', className)}
      style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em' }}
    >
      {children}
    </span>
  );
}

/**
 * "DISC-X" pill tinted with the profile colour (legacy `.dbg`). The colour
 * identity lives in the tinted background/border only — the text stays on the
 * zinc scale because the mid-tone brand hexes fail WCAG AA 4.5:1 as text
 * (same rationale as DiscChip).
 */
export function DiscBadge({ d, className }: { d: DiscLetter; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 flex-shrink-0',
        'text-zinc-800 dark:text-zinc-100',
        className,
      )}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 700,
        backgroundColor: `${PR[d].col}1A`,
        border: `1px solid ${PR[d].col}55`,
      }}
    >
      DISC-{d}
    </span>
  );
}
