/**
 * AppHeaderLogo — "The Kopi Studio" wordmark; links to /dashboard.
 *
 * The `< lg` twin of AppSidebar's rail wordmark. Same words, same brown italic
 * second word: after the 2a masthead retirement (2026-07-25) the rail is the
 * only identity surface on desktop, so the mobile bar must not disagree with it
 * — it used to read "Insurance CRM".
 *
 * Instrument Serif 18px — the hard floor for the serif family
 * (KOPI_2A_SPEC → Type scale). Never set it lower.
 */
import { Link } from 'react-router-dom';

export function AppHeaderLogo() {
  return (
    <Link
      to="/dashboard"
      className="inline-flex flex-shrink-0 items-center text-[18px] text-foreground"
      aria-label="The Kopi Studio — Home"
      style={{
        fontFamily: 'var(--font-pixel)',
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: '0.01em',
      }}
    >
      The Kopi&nbsp;
      <i style={{ color: 'var(--brand-red)' }}>Studio</i>
    </Link>
  );
}
