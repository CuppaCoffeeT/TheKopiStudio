/**
 * IntakeForm — wizard screen 0 (legacy `homeHTML`): advisor + prospect
 * details. Blank names default to "Advisor"/"Prospect" downstream
 * (`effectiveIntake`); meeting defaults to '1'. Age and occupation optional.
 *
 * TWO OPENINGS (2026-08-19, tool-shell alignment). `showHero` renders
 * `IntakeHero`, the public landing masthead, for anonymous visitors; a
 * signed-in advisor gets `ToolPageHeader` + `ToolCustomerBar` from the page
 * instead and comes straight to the fields. Rationale in `ProfilerWizardPage`.
 * The How-it-works CTA only exists inside the hero, so with the hero hidden
 * `showHowItWorks` is simply never called — the panel it targets still renders,
 * since a first-time advisor benefits from it either way.
 *
 * The fields themselves sit in `ToolPanel`s — the same panel treatment tools
 * 04–06 use, and the one KOPI_2A_SPEC actually specifies for a panel label
 * (uppercase 11px `.12em`). They were `Card` + `Eyebrow`, which is the spec's
 * MASTHEAD kicker (600 11px `.14em`) doing a panel label's job. `Eyebrow`
 * survives where it belongs — in `IntakeHero`, on the page cream, where
 * `ToolPanel`'s muted label would not hold 4.5:1.
 *
 * "Your details" and "Prospect details" are now two panels rather than two
 * eyebrows inside one card — 2a: "Never nest boxed sub-cards."
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/primitives/shell/Button';
import { ToolPanel } from '@/components/primitives/tools';
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
import { IntakeHero } from './IntakeHero';

interface IntakeFormProps {
  intake: IntakeInfo;
  onChange: (next: IntakeInfo) => void;
  onStart: () => void;
  /** Public landing hero — anonymous visitors only. See the header note. */
  showHero?: boolean;
}

export function IntakeForm({ intake, onChange, onStart, showHero = true }: IntakeFormProps) {
  const set = (patch: Partial<IntakeInfo>) => onChange({ ...intake, ...patch });

  const prospectRef = useRef<HTMLInputElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const [howHighlighted, setHowHighlighted] = useState(false);
  const highlightTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);
  const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const focusProspect = () => {
    prospectRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    prospectRef.current?.focus({ preventScroll: true });
  };
  // The How-it-works panel sits at the BOTTOM of a short page, so
  // `scrollIntoView` alone is a near-no-op: on a 900px viewport the whole
  // document only has ~330px of scroll room, and on anything taller there is
  // none at all — the panel can never reach the top and the button reads as
  // dead. So the scroll is a nicety, not the payload: focus + a held outline are
  // what actually answer the click, and they fire whether or not the page
  // moved. Ring utilities can't be used for the highlight: the panel pins
  // `shadow-[var(--card-shadow-rest)]` and that token is `none`, which makes
  // Tailwind v4's composed box-shadow list invalid — the ring never paints.
  // Outline is independent of box-shadow (and is what index.css already uses
  // for focus). Timer is cleared on unmount and on re-click.
  const showHowItWorks = () => {
    howRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    howRef.current?.focus({ preventScroll: true });
    setHowHighlighted(true);
    window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHowHighlighted(false), 1600);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="wizard-intake-screen">
      {showHero && <IntakeHero onStart={focusProspect} onHowItWorks={showHowItWorks} />}

      <ToolPanel label="Your details" className="motion-rise motion-rise-2">
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
      </ToolPanel>

      <ToolPanel label="Prospect details" className="motion-rise motion-rise-3">
        <div className="flex flex-col gap-4">
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
                  <SelectMenuValue placeholder="e.g. 31-35" />
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
      </ToolPanel>

      {/* Advance CTA sits directly under the form — on a phone the thumb lands
          on it the moment the last field is filled, with no scroll past the
          supporting panel (2026-08-05 mobile pass: content before chrome,
          CTA before explanation). */}
      <Button size="lg" className="w-full motion-rise motion-rise-3" onClick={onStart} data-testid="wizard-start-btn">
        Continue to questions →
      </Button>

      {/* Border-only accent. `bg-accent/10` composited brown over the PAGE cream
          (cn is twMerge, so it replaced the panel's bg-card), which both inverted
          the raised-card ladder and dropped this block's copy to 3.68–4.06:1. On
          card cream the list reads 4.72:1 and the label 5.21:1. */}
      <ToolPanel
        ref={howRef}
        tabIndex={-1}
        label="How it works"
        labelClassName="text-[color:var(--brown-text)]"
        className={`border-accent/30 motion-rise motion-rise-4 scroll-mt-24 ${
          howHighlighted
            ? '[outline:2px_solid_hsl(var(--ring))] [outline-offset:3px]'
            : '[outline:none]'
        }`}
      >
        <ol className="m-0 list-decimal pl-4 text-[13px] leading-7 text-muted-foreground">
          <li>Answer 8 questions you can weave into any conversation</li>
          <li>Tick the body language you're already seeing</li>
          <li>Get the full DISC × MBTI communication read</li>
          <li>Save to your CRM, or export the PDF</li>
        </ol>
      </ToolPanel>
    </div>
  );
}
