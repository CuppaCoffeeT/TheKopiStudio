import { cn } from '@/lib/utils';

interface GreetingHeaderProps {
  name: string;
  role: string;
  /** ISO date or formatted string — rendered in the uppercase dateline */
  dateText: string;
  /** "morning" / "afternoon" / "evening" — caller computes in SGT */
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  /** Optional live context stat appended to the dateline (e.g. "4 reviews due this week"). */
  contextStat?: string;
  className?: string;
}

/**
 * Page hero for /dashboard — sits BELOW the AppHeader.
 *
 * 1a "Masthead" dateline greeting (2026-07-21 visual direction):
 * uppercase 600 11px tracking-.14em muted dateline (weekday · date · one
 * context stat) over a Georgia 34px cream greeting, hairline (--border-soft)
 * under the block. Spec: docs/05-implementation/design-handoffs/
 * 2026-07-21-visual-directions/1A_MASTHEAD_SPEC.md
 *
 * Pure presentation: no view-as, no logout. Those controls live in AppHeader's
 * user menu so the chrome stays consistent across every page.
 */
export function GreetingHeader({
  name,
  role,
  dateText,
  timeOfDay,
  contextStat,
  className,
}: GreetingHeaderProps) {
  const datelineParts = [dateText, role, contextStat].filter(Boolean);
  return (
    <div
      className={cn('w-full border-b pb-5', className)}
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ fontFamily: 'var(--font-sans)', color: 'var(--fg-muted)' }}
      >
        {datelineParts.join(' · ')}
      </div>
      <h1
        className="mt-2 text-[34px] leading-tight"
        style={{ fontFamily: 'Georgia, serif', color: 'var(--fg)' }}
      >
        Good {timeOfDay}, {name}.
      </h1>
    </div>
  );
}
