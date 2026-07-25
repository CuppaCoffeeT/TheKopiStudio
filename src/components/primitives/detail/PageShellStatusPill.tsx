/**
 * PageShellStatusPill — the detail hero's status pill (extracted from
 * PageShell.tsx 2026-07-25 to keep that file under the LOC ceiling).
 *
 * 2a status = three meanings — sage positive · brown in-progress · terracotta
 * error, with muted neutrals for inert. Tone NAMES are the frozen prop API;
 * each resolves to a `--status-*` pair (tint fill + darkened same-hue text),
 * never a saturated Tailwind swatch. Radius 99px, padding 3px 10px, 600
 * 11.5px per KOPI_2A_SPEC.md → "Status pills".
 *
 * These pills sit on PageShellHero's page cream — one step DARKER than the card
 * cream the pairs were tuned on. Only `info` is affected: brown@14% tint
 * composites to ~#E2D5C2 there and drops `--status-revised-fg` to 4.05:1, so it
 * takes the page-ground step (5.00:1); the other four clear unchanged. Deepen
 * the TEXT, not the tint — the pill sits on the lighter ground here.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageShellStatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const STATUS_PILL: Record<PageShellStatusTone, string> = {
  neutral: 'bg-[color:var(--status-expired-bg)] text-[color:var(--status-expired-fg)]',
  success: 'bg-[color:var(--status-accepted-bg)] text-[color:var(--status-accepted-fg)]',
  warning: 'bg-[color:var(--status-sent-bg)] text-[color:var(--status-sent-fg)]',
  danger: 'bg-[color:var(--status-rejected-bg)] text-[color:var(--status-rejected-fg)]',
  info: 'bg-[color:var(--status-revised-bg)] text-[color:var(--status-revised-fg-on-page)]',
};

export function PageShellStatusPill({
  tone,
  children,
}: {
  tone: PageShellStatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px]',
        'text-[11.5px] font-semibold uppercase leading-snug tracking-wide',
        STATUS_PILL[tone],
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
