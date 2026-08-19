/**
 * IntakeHero — the masthead + CTA pair at the top of wizard screen 0.
 * Owns no state: both CTAs are handed down by `IntakeForm`, which owns the
 * refs they target. Split out of `IntakeForm` (2026-08-19) to keep that file
 * under the 200-LOC ceiling.
 */

import { Button } from '@/components/primitives/shell/Button';
import { PageDescription } from '@/components/primitives/shell/PageDescription';
import { PageTitle } from '@/components/primitives/shell/PageTitle';
import { Eyebrow } from './WizardAtoms';

interface IntakeHeroProps {
  /** Primary CTA — lands the cursor in the prospect field. */
  onStart: () => void;
  /** Secondary CTA — reveals the How-it-works card (scroll + focus + outline). */
  onHowItWorks: () => void;
}

export function IntakeHero({ onStart, onHowItWorks }: IntakeHeroProps) {
  /* Hero CTAs route INTO the flow rather than duplicating it: primary lands
     the cursor in the form (starting = entering the prospect); the bottom
     button remains the single advance to the questions. Smooth scroll is
     skipped under prefers-reduced-motion — the CSS override can't reach an
     explicit JS `behavior: 'smooth'`. */
  /* 2a masthead block: kicker over the serif display line, closed by one
     hairline. Left-aligned and illustration-free by direction — "no
     illustration, no icon" (KOPI_2A_SPEC → States), which is what retired
     the 42px 🎯 that used to sit above the kicker. It was the app's only
     saturated off-palette mark; the serif line carries the screen now.
     Hero step matches the app's fluid rhythm (2026-08-05 retune) —
     same clamp family as the login wordmark. */
  return (
    <header className="border-b border-border pb-8 pt-4 motion-rise-hero">
      <Eyebrow className="text-[color:var(--brown-text)]">Prospect Profiling</Eyebrow>
      {/* V1 typographic hero (2026-08-05): the oversized serif line carries the
          section alone — no visual, no layers, per the 2a "no illustration"
          direction. Copy states the advisor's outcome; the sub carries the
          mechanism the headline can't. */}
      <PageTitle
        className="leading-[1.05] tracking-[-0.02em]"
        style={{ fontSize: 'clamp(34px, 5vw + 15px, 56px)' }}
      >
        Know how they think before you pitch.
      </PageTitle>
      <PageDescription className="mt-4 max-w-[52ch] text-[15px] leading-[1.6]">
        Eight questions, plus the body language you can already see, build a
        full DISC × MBTI communication profile — before the meeting ends.
      </PageDescription>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onStart} data-testid="wizard-hero-start">
          Start profiling →
        </Button>
        <Button size="lg" variant="ghost" onClick={onHowItWorks} data-testid="wizard-hero-how">
          See how it works
        </Button>
      </div>
      {/* Trust line sits on the PAGE cream — --fg-dim, never --fg-muted (4.12:1
          there; see lessons.md 2026-07-27). Claims are product facts: the route
          is public/anonymous-capable, and nothing renders prospect-side. */}
      <p className="m-0 mt-3 text-[12px] text-[color:var(--fg-dim)]">
        No account needed — profiles stay on your side of the table.
      </p>
    </header>
  );
}
