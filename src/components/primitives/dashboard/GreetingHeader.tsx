import { cn } from '@/lib/utils';

interface GreetingHeaderProps {
  name: string;
  /** Optional — 2a's dateline is `weekday · date · one live stat`, no role. */
  role?: string;
  /** ISO date or formatted string — rendered in the uppercase dateline */
  dateText: string;
  /** "morning" / "afternoon" / "evening" — caller computes in SGT */
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  /** Optional live context stat appended to the dateline (e.g. "4 reviews due this week"). */
  contextStat?: string;
  className?: string;
}

/**
 * Page hero for /dashboard — the first thing in the content column.
 *
 * Kopi Studio 2a dateline greeting (2026-07-25 visual direction):
 * uppercase 600 11px tracking-.14em dateline (weekday · date · one context
 * stat) over an Instrument Serif ink greeting, hairline (--border-soft)
 * under the block. Spec: docs/05-implementation/design-handoffs/
 * 2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md — the comp's fixed 36px greeting
 * was superseded 2026-08-05 by the fluid 38–50px hero step (see that
 * handoff's decisions.md).
 *
 * Pure presentation: no view-as, no logout. Those controls live in the sidebar
 * rail's account footer (and in AppHeaderMobileBar's account menu below lg), so
 * the chrome stays consistent across every page.
 */
export function GreetingHeader({
  name,
  role,
  dateText,
  timeOfDay,
  contextStat,
  className,
}: GreetingHeaderProps) {
  // The dateline is middot-separated end to end, so the comma en-GB puts after
  // the weekday ("Saturday, 25 July 2026") becomes one too. A no-op on an ISO
  // date or an already-clean string.
  const datelineParts = [dateText.replace(', ', ' · '), role, contextStat].filter(Boolean);
  return (
    <div
      className={cn('w-full border-b pb-8', className)}
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ fontFamily: 'var(--font-sans)', color: 'var(--fg-dim)' }}
      >
        {datelineParts.join(' · ')}
      </div>
      <h1
        className="mt-3 leading-[1.05] tracking-[-0.02em]"
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(38px, 2.2vw + 22px, 50px)',
          color: 'var(--fg)',
        }}
      >
        Good {timeOfDay}, {name}.
      </h1>
    </div>
  );
}
