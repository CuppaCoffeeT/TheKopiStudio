/**
 * AppHeaderLogo — AppBase logo + wordmark lockup; links to /dashboard.
 *
 * Extracted from AppHeader.tsx (W09 decomposition · ≤200 LOC primitive rule).
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-FmPJtwZw/project/preview/component-header.html
 * Locked: 18px image on desktop, 22px on mobile · Geist Mono 700 · letter-spacing 0.02em.
 */
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function AppHeaderLogo({ mobile = false }: { mobile?: boolean }) {
  return (
    <Link
      to="/dashboard"
      className={cn(
        'inline-flex items-center flex-shrink-0 uppercase text-zinc-900 dark:text-zinc-50',
        mobile ? 'gap-2 text-[14px]' : 'gap-1.5 text-[15px]',
      )}
      aria-label="AppBase — Home"
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}
    >
      <img
        src="/images/JlCompanyLogo.png"
        alt=""
        aria-hidden
        className={cn(
          'object-contain flex-shrink-0',
          mobile ? 'w-[22px] h-[22px]' : 'w-[18px] h-[18px]',
        )}
        style={{ imageRendering: 'auto' }}
      />
      AppBase
    </Link>
  );
}
