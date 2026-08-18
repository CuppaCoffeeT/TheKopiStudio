/**
 * AuthShell — the shared signed-out chrome for /login, /signup,
 * /forgot-password and /reset-password.
 *
 * Extracted from Login.tsx when the sign-up and password-reset screens came
 * back (2026-08-13) so the four screens can never drift: same cream ground,
 * same kicker + `Wordmark` lockup as the H1, one raised card carrying a serif
 * section head, a sans sub-line and a hairline above the form. Deviations from
 * the 2a comps are recorded in
 * docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/decisions.md.
 *
 * `title` is Instrument Serif at 22px — above the 18px serif floor. Everything
 * else on these screens is IBM Plex Sans. `footer` renders under the card for
 * the cross-links between screens; those are 12.5px, so any brown in them must
 * come from `--brown-text`, never the raw brand hex.
 */

import { Card, Wordmark } from '@/components/primitives/shell';

interface AuthShellProps {
  /** Serif card heading — "Sign in", "Create account", … */
  title: string;
  /** One-line sans sub-head under the title. */
  subtitle?: React.ReactNode;
  /** Card body — the form, or a post-submit confirmation panel. */
  children: React.ReactNode;
  /** Cross-links rendered under the card. */
  footer?: React.ReactNode;
  /** data-testid for the card body wrapper. */
  testId?: string;
}

export function AuthShell({ title, subtitle, children, footer, testId }: AuthShellProps) {
  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center bg-background px-4 py-12"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <main className="w-full max-w-sm">
        <header className="mb-10 motion-rise-hero">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--fg-dim)]"
            data-testid="login-kicker"
          >
            Advisor suite
          </p>
          <h1
            className="mt-2 leading-[1.05] tracking-[-0.02em] text-foreground"
            style={{ fontSize: 'clamp(38px, 3.5vw + 24px, 44px)' }}
          >
            <Wordmark />
          </h1>
        </header>

        <Card className="motion-rise motion-rise-2" data-testid={testId}>
          <h2
            className="text-[22px] leading-tight text-foreground m-0"
            style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
          {children}
        </Card>

        {/*
          The footer sits on the PAGE cream, not on the card — so it takes
          --fg-dim, not --fg-muted. Muted measures 4.17:1 against #F0E6D6 at
          12.5px and axe fails it (serious); --fg-dim clears AA on both creams.
          Same trap the Field primitive documents for labels and hints.
        */}
        {footer && (
          <div className="mt-5 text-center text-[12.5px] leading-relaxed text-[color:var(--fg-dim)]">
            {footer}
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * AuthLink — the one link style these screens use. Brown at 12.5px, so it
 * reads `--brown-text` (#806241) and not the raw 4.00:1 brand brown.
 */
export const AUTH_LINK_CLASS =
  'font-semibold text-[color:var(--brown-text)] underline underline-offset-2 ' +
  'hover:text-[color:var(--brown-text-on-wash)] rounded-sm';
