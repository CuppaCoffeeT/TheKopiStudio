/**
 * CustomerToolLauncher — the three tools, as things you DO to this customer
 * (Kopi Studio Directions turn 3a: "tools are no longer navigation; they are
 * things you do to a customer, launched from the customer record").
 *
 * This is the load-bearing piece of the customer-centred IA. Before it, the
 * chain was invisible: the profiler lived in the sidebar with no idea which
 * customer you meant, and `/clients/:id/report` had NO entry point anywhere in
 * the app — the client report was reachable only by typing the URL.
 *
 * WHAT each card says and offers is decided by `lib/customerToolCards` (pure);
 * this file only renders it and maps the action discriminator to a handler.
 *
 * A card with no action renders its reason line rather than a disabled-looking
 * control: a clickable lock is a lie, and the route stays reachable by URL for
 * anyone who needs it. Disabled state uses the brand muted ink, never grey
 * (.claude/rules/light-theme.md — no cool neutrals on the warm ground).
 */

import { ArrowRight, Check, Lock } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { cn } from '@/lib/utils';
import { JOURNEY_STEP_LABEL, type CustomerJourney, type JourneyStepState } from '../../lib/customerJourney';
import { buildToolCards, type ToolCardAction } from '../../lib/customerToolCards';

const STATE_LABEL: Record<JourneyStepState, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'not-started': 'Not started',
  locked: 'Locked',
};

const STATE_TONE: Record<JourneyStepState, BadgeTone> = {
  done: 'success',
  'in-progress': 'accent',
  'not-started': 'neutral',
  locked: 'neutral',
};

interface CustomerToolLauncherProps {
  journey: CustomerJourney;
  /** Newest linked profiler result, when one is visible to this viewer. */
  linkedResultId: string | null;
  /** False for a manager reading another advisor's customer — write actions drop out. */
  isOwn: boolean;
  /** True when the viewer holds the `/profiler` module. */
  canProfile: boolean;
  onStartProfiler: () => void;
  onOpenProfile: (resultId: string) => void;
  onEditInformation: () => void;
  onOpenReport: () => void;
}

export function CustomerToolLauncher({
  journey,
  linkedResultId,
  isOwn,
  canProfile,
  onStartProfiler,
  onOpenProfile,
  onEditInformation,
  onOpenReport,
}: CustomerToolLauncherProps) {
  const cards = buildToolCards({
    journey,
    hasLinkedResult: Boolean(linkedResultId),
    isOwn,
    canProfile,
  });

  const runAction = (kind: ToolCardAction['kind']) => {
    if (kind === 'start-profiler') return onStartProfiler();
    if (kind === 'view-profile') return linkedResultId && onOpenProfile(linkedResultId);
    if (kind === 'edit-info') return onEditInformation();
    return onOpenReport();
  };

  return (
    <section
      aria-labelledby="customer-tools-heading"
      data-testid="customer-tool-launcher"
      className="mb-[22px]"
    >
      <h2
        id="customer-tools-heading"
        className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-dim)]"
      >
        Tools
      </h2>
      <ol className="m-0 grid list-none grid-cols-1 gap-[18px] p-0 lg:grid-cols-3">
        {cards.map((card) => {
          const dimmed = card.state === 'locked';
          return (
            <li
              key={card.key}
              data-testid={`customer-tool-${card.key}`}
              data-state={card.state}
              className={cn(
                'flex flex-col gap-2.5 rounded-xl border border-border bg-card px-[22px] py-5',
                'shadow-[var(--card-shadow-rest)]',
                dimmed && 'border-dashed',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    'text-[13px] font-semibold',
                    dimmed ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  <span
                    className="mr-1.5 text-[18px] leading-none text-[color:var(--brand-brown)]"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                    aria-hidden="true"
                  >
                    {card.index}
                  </span>
                  {JOURNEY_STEP_LABEL[card.key]}
                </span>
                <Badge
                  tone={STATE_TONE[card.state]}
                  dot={false}
                  className="flex-none"
                  data-testid={`customer-tool-${card.key}-state`}
                >
                  {card.state === 'done' ? (
                    <Check className="mr-1 h-3 w-3" aria-hidden="true" />
                  ) : card.state === 'locked' ? (
                    <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
                  ) : null}
                  {STATE_LABEL[card.state]}
                </Badge>
              </div>

              <p className="m-0 flex-1 text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
                {card.detail}
              </p>

              {card.action ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start pointer-coarse:min-h-11"
                  onClick={() => runAction(card.action!.kind)}
                  trailingIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                  data-testid={`customer-tool-${card.key}-action`}
                >
                  {card.action.label}
                </Button>
              ) : (
                <span className="text-[11.5px] text-muted-foreground">{card.reason}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
