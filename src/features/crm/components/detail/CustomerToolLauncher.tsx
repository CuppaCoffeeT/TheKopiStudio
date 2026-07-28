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
 * Three cards in chain order, each showing state, the reason for that state, and
 * the ONE action that advances it:
 *
 *   01 Prospect Profiler   → run it, or open the profile it produced
 *   02 Customer information → edit the record's own fields
 *   03 Client report        → locked until 01 and 02 are done, then open it
 *
 * The locked card renders NO action rather than a disabled-looking link: a
 * clickable lock is a lie, and the route stays reachable by URL for anyone who
 * needs it. Disabled state uses the brand muted ink, never grey
 * (.claude/rules/light-theme.md — no cool neutrals on the warm ground).
 */

import { ArrowRight, Check, Lock } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { cn } from '@/lib/utils';
import {
  JOURNEY_STEP_LABEL,
  JOURNEY_STEP_ORDER,
  INFO_CHECK_COUNT,
  type CustomerJourney,
  type JourneyStepKey,
  type JourneyStepState,
} from '../../lib/customerJourney';

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
  clientId: string;
  /** False for a manager reading another advisor's customer — write actions drop out. */
  isOwn: boolean;
  /** True when the viewer holds the `/profiler` module. */
  canProfile: boolean;
  onStartProfiler: () => void;
  onOpenProfile: (resultId: string) => void;
  onEditInformation: () => void;
  onOpenReport: () => void;
}

interface ToolCard {
  key: JourneyStepKey;
  index: string;
  state: JourneyStepState;
  detail: string;
  action: { label: string; onClick: () => void } | null;
}

export function CustomerToolLauncher({
  journey,
  linkedResultId,
  clientId: _clientId,
  isOwn,
  canProfile,
  onStartProfiler,
  onOpenProfile,
  onEditInformation,
  onOpenReport,
}: CustomerToolLauncherProps) {
  const missingInfo = INFO_CHECK_COUNT - journey.infoFilled;

  const cards: ToolCard[] = [
    {
      key: 'profiler',
      index: '01',
      state: journey.steps.profiler,
      detail:
        journey.steps.profiler === 'done'
          ? 'Risk profile on file — the rest of the record reads from it.'
          : 'First interaction for every new customer. Produces the risk profile the other tools depend on.',
      action:
        journey.steps.profiler === 'done' && linkedResultId
          ? { label: 'View profile', onClick: () => onOpenProfile(linkedResultId) }
          : journey.steps.profiler === 'done'
            ? null
            : canProfile
              ? { label: 'Start profiler', onClick: onStartProfiler }
              : null,
    },
    {
      key: 'info',
      index: '02',
      state: journey.steps.info,
      detail:
        journey.steps.info === 'done'
          ? 'Contact, income, dependants and the review date are all on file.'
          : `${missingInfo} of ${INFO_CHECK_COUNT} checks still missing — ${journey.missingInfo.join(', ')}.`,
      action: isOwn
        ? {
            label: journey.steps.info === 'done' ? 'Edit information' : 'Complete information',
            onClick: onEditInformation,
          }
        : null,
    },
    {
      key: 'report',
      index: '03',
      state: journey.steps.report,
      detail:
        journey.steps.report === 'done'
          ? 'Ready to generate from the policies and balances on file.'
          : 'Needs steps 01 and 02 — the report reads the risk profile and the customer information.',
      action:
        journey.steps.report === 'done' ? { label: 'Open report', onClick: onOpenReport } : null,
    },
  ];

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
                  onClick={card.action.onClick}
                  trailingIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                  data-testid={`customer-tool-${card.key}-action`}
                >
                  {card.action.label}
                </Button>
              ) : (
                <span className="text-[11.5px] text-muted-foreground">
                  {card.state === 'locked'
                    ? `Finish ${JOURNEY_STEP_ORDER.filter((key) => key !== 'report' && journey.steps[key] !== 'done')
                        .map((key) => JOURNEY_STEP_LABEL[key])
                        .join(' and ')} first`
                    : 'No action available to you'}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
