/**
 * AppHeaderLogo — the `< lg` twin of AppSidebar's rail wordmark; links to
 * /dashboard.
 *
 * Renders the same `Wordmark` lockup as the rail: after the 2a masthead
 * retirement (2026-07-25) the rail is the only identity surface on desktop, so
 * the mobile bar must not disagree with it — it used to read "Insurance CRM".
 *
 * Two deliberate departures from the rail's rendering:
 *   - Instrument Serif 18px — the hard floor for the serif family
 *     (KOPI_2A_SPEC → Type scale). Never set it lower.
 *   - The italic word takes the AA-darkened `--brand-red` (#806241), not the
 *     raw brand brown. `AppHeaderMobileBar`'s ground is translucent
 *     (`bg-card/[0.72]`), so it composites lighter than card cream and the raw
 *     #8B6A47 lands on the wrong side of 4.5:1 there.
 */
import { Link } from 'react-router-dom';
import { Wordmark } from './Wordmark';

export function AppHeaderLogo() {
  return (
    <Link
      to="/dashboard"
      className="inline-flex flex-shrink-0 items-center text-[18px] text-foreground"
      aria-label="The Kopi Studio — Home"
    >
      <Wordmark className="leading-none tracking-[0.01em]" accent="var(--brand-red)" />
    </Link>
  );
}
