/**
 * IntakeForm — wizard screen 0 (legacy `homeHTML`): advisor + prospect
 * details. Blank names default to "Advisor"/"Prospect" downstream
 * (`effectiveIntake`); meeting defaults to '1'. Age and occupation optional.
 */

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

  return (
    <div className="flex flex-col gap-5" data-testid="wizard-intake-screen">
      <div className="text-center pt-4">
        <div className="text-[42px] leading-none mb-2" aria-hidden="true">🎯</div>
        <Eyebrow className="text-[color:var(--brown-text)]">Prospect Profiling</Eyebrow>
        <PageTitle className="text-[26px] sm:text-[30px] md:text-[34px]">Read Any Prospect</PageTitle>
        <PageDescription className="mt-1">
          8 questions + body language = instant DISC &amp; MBTI profile
        </PageDescription>
      </div>

      <Card>
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
      <Card className="border-accent/30">
        <Eyebrow className="text-[color:var(--brown-text)]">How it works</Eyebrow>
        <ol className="m-0 list-decimal pl-4 text-[13px] leading-7 text-muted-foreground">
          <li>Answer 8 profiling questions</li>
          <li>Tick body language signals</li>
          <li>Get instant DISC + MBTI profile</li>
          <li>Save to database or download</li>
        </ol>
      </Card>

      <Button size="lg" className="w-full" onClick={onStart} data-testid="wizard-start-btn">
        Start Profiling →
      </Button>
    </div>
  );
}
