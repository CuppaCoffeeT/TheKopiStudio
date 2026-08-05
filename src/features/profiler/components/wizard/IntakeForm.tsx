/**
 * IntakeForm — wizard screen 0 (legacy `homeHTML`): advisor + prospect
 * details. Blank names default to "Advisor"/"Prospect" downstream
 * (`effectiveIntake`); meeting defaults to '1'. Age and occupation optional.
 */

import { useRef } from 'react';
import { Card } from '@/components/primitives/shell/Card';
import { Button } from '@/components/primitives/shell/Button';
import { PageDescription } from '@/components/primitives/shell/PageDescription';
import { PageTitle } from '@/components/primitives/shell/PageTitle';
import { Field, Input } from '@/components/primitives/form';
import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuTrigger,
  SelectMenuValue,
} from '@/components/primitives/overlays/SelectMenu';
import { AGE_RANGES, MEETING_OPTIONS } from '../../lib/labels';
import type { IntakeInfo } from '../../hooks/useWizardState';
import { Eyebrow } from './WizardAtoms';

interface IntakeFormProps {
  intake: IntakeInfo;
  onChange: (next: IntakeInfo) => void;
  onStart: () => void;
}

export function IntakeForm({ intake, onChange, onStart }: IntakeFormProps) {
  const set = (patch: Partial<IntakeInfo>) => onChange({ ...intake, ...patch });

  const prospectRef = useRef<HTMLInputElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const focusProspect = () => {
    prospectRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    prospectRef.current?.focus({ preventScroll: true });
  };
  const showHowItWorks = () => {
    howRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };

  return (
    <div className="flex flex-col gap-6" data-testid="wizard-intake-screen">
      {/* Hero CTAs route INTO the flow rather than duplicating it: primary lands
          the cursor in the form (starting = entering the prospect); the bottom
          button remains the single advance to the questions. Smooth scroll is
          skipped under prefers-reduced-motion — the CSS override can't reach an
          explicit JS `behavior: 'smooth'`. */}
      {/* 2a masthead block: kicker over the serif display line, closed by one
          hairline. Left-aligned and illustration-free by direction — "no
          illustration, no icon" (KOPI_2A_SPEC → States), which is what retired
          the 42px 🎯 that used to sit above the kicker. It was the app's only
          saturated off-palette mark; the serif line carries the screen now.
          Hero step matches the app's fluid rhythm (2026-08-05 retune) —
          same clamp family as the login wordmark. */}
      <header className="border-b border-border pb-8 pt-4 motion-rise-hero">
        <Eyebrow className="text-[color:var(--brown-text)]">Prospect Profiling</Eyebrow>
        {/* V1 typographic hero (2026-08-05): the oversized serif line carries the
            section alone — no visual, no layers, per the 2a "no illustration"
            direction. Copy states the advisor's outcome; the sub carries the
            mechanism the headline can't. */}
        <PageTitle
          className="leading-[1.05] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(38px, 4vw + 22px, 56px)' }}
        >
          Know how they think before you pitch.
        </PageTitle>
        <PageDescription className="mt-4 max-w-[52ch] text-[15px] leading-[1.6]">
          Eight questions, plus the body language you can already see, build a
          full DISC × MBTI communication profile — before the meeting ends.
        </PageDescription>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={focusProspect} data-testid="wizard-hero-start">
            Start profiling →
          </Button>
          <Button size="lg" variant="ghost" onClick={showHowItWorks} data-testid="wizard-hero-how">
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

      <Card className="motion-rise motion-rise-2">
        <Eyebrow>Your Details</Eyebrow>
        <div className="flex flex-col gap-4">
          <Field label="Your Name (Advisor)">
            <Input
              value={intake.adv}
              onChange={(e) => set({ adv: e.target.value })}
              placeholder="Your name"
              autoComplete="off"
              aria-label="Your Name (Advisor)"
              data-testid="wizard-intake-advisor-input"
            />
          </Field>

          <Eyebrow className="mt-2 mb-0">Prospect Details</Eyebrow>
          <Field label="Prospect Name">
            <Input
              ref={prospectRef}
              value={intake.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Wei Jie, Priya, Ahmad..."
              autoComplete="off"
              aria-label="Prospect Name"
              data-testid="wizard-intake-prospect-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age Range">
              <SelectMenu value={intake.age || undefined} onValueChange={(v) => set({ age: v })}>
                <SelectMenuTrigger aria-label="Age Range" data-testid="wizard-intake-age-select">
                  <SelectMenuValue placeholder="Select..." />
                </SelectMenuTrigger>
                <SelectMenuContent>
                  {AGE_RANGES.map((a) => (
                    <SelectMenuItem key={a} value={a} data-testid={`wizard-intake-age-opt-${a}`}>
                      {a}
                    </SelectMenuItem>
                  ))}
                </SelectMenuContent>
              </SelectMenu>
            </Field>
            <Field label="Meeting #">
              <SelectMenu value={intake.meeting} onValueChange={(v) => set({ meeting: v })}>
                <SelectMenuTrigger aria-label="Meeting number" data-testid="wizard-intake-meeting-select">
                  <SelectMenuValue />
                </SelectMenuTrigger>
                <SelectMenuContent>
                  {MEETING_OPTIONS.map((m) => (
                    <SelectMenuItem key={m.value} value={m.value} data-testid={`wizard-intake-meeting-opt-${m.value}`}>
                      {m.label}
                    </SelectMenuItem>
                  ))}
                </SelectMenuContent>
              </SelectMenu>
            </Field>
          </div>

          <Field label="Occupation / Industry">
            <Input
              value={intake.occ}
              onChange={(e) => set({ occ: e.target.value })}
              placeholder="Engineer, Self-employed, Teacher..."
              autoComplete="off"
              aria-label="Occupation or industry"
              data-testid="wizard-intake-occupation-input"
            />
          </Field>
        </div>
      </Card>

      {/* Border-only accent. `bg-accent/10` composited brown over the PAGE cream
          (cn is twMerge, so it replaced Card's bg-card), which both inverted the
          raised-card ladder and dropped this block's copy to 3.68–4.06:1. On
          card cream the list reads 4.72:1 and the eyebrow 5.21:1. */}
      <Card ref={howRef} className="border-accent/30 motion-rise motion-rise-3 scroll-mt-24">
        <Eyebrow className="text-[color:var(--brown-text)]">How it works</Eyebrow>
        <ol className="m-0 list-decimal pl-4 text-[13px] leading-7 text-muted-foreground">
          <li>Answer 8 profiling questions</li>
          <li>Tick body language signals</li>
          <li>Get instant DISC + MBTI profile</li>
          <li>Save to database or download</li>
        </ol>
      </Card>

      <Button size="lg" className="w-full motion-rise motion-rise-4" onClick={onStart} data-testid="wizard-start-btn">
        Continue to questions →
      </Button>
    </div>
  );
}
