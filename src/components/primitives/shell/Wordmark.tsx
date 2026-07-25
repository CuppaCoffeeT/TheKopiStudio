/**
 * Wordmark — "The Kopi <i>Studio</i>", the single brand lockup.
 *
 * One source of truth for every surface that carries identity, so the three of
 * them can never drift apart:
 *   - `AppSidebar` — the desktop rail (22px), the only chrome since the 2a
 *     masthead was retired.
 *   - `AppHeaderLogo` — the `< lg` mobile bar (18px, the serif floor).
 *   - `WizardTopBar` — the PUBLIC /profiler route, which sits outside
 *     `DashboardLayout` and therefore never gets the rail. It carries this same
 *     lockup so the anonymous tool and the signed-in app read as one brand.
 *
 * Locked (KOPI_2A_SPEC → Type scale, "Sidebar wordmark"):
 *   - Instrument Serif (`--font-pixel`) weight 400 — the family ships roman +
 *     italic only, so this never asks for bold.
 *   - Second word italic, in brown. Brown is punctuation in 2a; this is one of
 *     its sanctioned appearances.
 *   - Size and the roman words' colour are the CALLER's, passed via className,
 *     because each surface sits on its own type scale. **Never below 18px** —
 *     the hard Instrument Serif floor.
 *
 * `accent` is the italic word's colour. The default is the raw brand brown,
 * sanctioned at display sizes >= 18px, where it clears AA on card cream (4.58).
 * A surface whose ground is translucent or the page cream must pass the
 * AA-darkened `--brand-red` (#806241) instead — see `AppHeaderLogo`.
 */

import { cn } from '@/lib/utils';

interface WordmarkProps {
  /** Size + roman colour live here — the lockup inherits both. */
  className?: string;
  /** Italic word's colour. Default: raw brand brown (>= 18px only). */
  accent?: string;
}

export function Wordmark({ className, accent = 'var(--brand-brown)' }: WordmarkProps) {
  return (
    <span
      className={cn('whitespace-nowrap', className)}
      style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
    >
      {'The Kopi '}
      <i style={{ color: accent }}>Studio</i>
    </span>
  );
}
