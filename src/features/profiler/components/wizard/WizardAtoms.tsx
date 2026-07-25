/**
 * Tiny shared display atoms for the profiling wizard + result report.
 * Ports of the legacy `.ey` eyebrow and `.dbg` DISC badge styles, restyled
 * with AppBase tokens. Display-only — no interactivity.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PR } from '../../lib/content';
import type { DiscLetter } from '../../types';

/**
 * Uppercase sans section eyebrow (legacy `.ey`) — the 2a card/panel label.
 *
 * Defaults to --fg-dim, not --fg-muted (same swap StatusTabs and TabNav made).
 * At 10.5px --fg-muted needs a flat cream ground to reach 4.5:1, and the eyebrow
 * is used on grounds that are not flat: the wizard's page cream (4.12:1) and the
 * report's DISC tints (3.73–3.83:1). --fg-dim clears every one of them — 6.40 on
 * page cream, 7.34 on card, 5.78–5.95 on the four DISC tints.
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn('block uppercase text-[color:var(--fg-dim)] mb-2', className)}
      style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em' }}
    >
      {children}
    </span>
  );
}

/**
 * "DISC-X" pill tinted with the profile colour (legacy `.dbg`). The colour
 * identity lives in the tinted background/border only — the text stays on the
 * ink foreground token because the mid-tone DISC hexes fail WCAG AA 4.5:1 as
 * 10px text on their own tint (same rationale as DiscChip).
 */
export function DiscBadge({ d, className }: { d: DiscLetter; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 flex-shrink-0',
        'text-foreground',
        className,
      )}
      style={{
        fontFamily: 'var(--font-sans)',
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
