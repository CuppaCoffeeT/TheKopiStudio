import { cn } from '@/lib/utils';
import { PageTitle } from '@/components/primitives/shell';

interface GreetingHeaderProps {
  name: string;
  role: string;
  /** ISO date or formatted string — displayed under the greeting */
  dateText: string;
  /** "morning" / "afternoon" / "evening" — caller computes in SGT */
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  className?: string;
}

/**
 * Page hero for /dashboard — sits BELOW the AppHeader.
 *
 * H1 renders via `<PageTitle>` — size/font locked there (40/48/56 ramp). Prior
 * bespoke clamp(26-36px) retired 2026-04-21 to consolidate page-title typography.
 *
 * Pure presentation: no view-as, no logout. Those controls live in AppHeader's
 * user menu so the chrome stays consistent across every page.
 */
export function GreetingHeader({
  name,
  role,
  dateText,
  timeOfDay,
  className,
}: GreetingHeaderProps) {
  return (
    <div className={cn('w-full', className)} style={{ fontFamily: 'var(--font-sans)' }}>
      <PageTitle>Good {timeOfDay}, {name}.</PageTitle>
      <div className="mt-1.5 text-[12.5px] text-zinc-600 dark:text-zinc-400">{dateText}</div>
      <div className="mt-2.5">
        <span className="inline-block px-2.5 py-[3px] rounded-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300">
          {role}
        </span>
      </div>
    </div>
  );
}
