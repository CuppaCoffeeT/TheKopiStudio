/**
 * ToolCardTile — one card in the customer tool launcher.
 *
 * Split out of `CustomerToolLauncher` (W23 LOC ceiling): the launcher composes
 * two groups of these, so the tile is the repeated unit and belongs on its own.
 *
 * Presentation only. WHAT the card says, which state it carries and whether it
 * offers an action are all decided by `lib/customerToolCards`; this file maps
 * that model onto markup and reports the chosen action back by discriminator.
 */

import { ArrowRight, Check, Lock } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { cn } from '@/lib/utils';
import type { ToolCard, ToolCardKind, ToolCardState } from '../../lib/customerToolCards';

const STATE_LABEL: Record<ToolCardState, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  'not-started': 'Not started',
  locked: 'Locked',
  available: 'Ready',
};

const STATE_TONE: Record<ToolCardState, BadgeTone> = {
  done: 'success',
  'in-progress': 'accent',
  'not-started': 'neutral',
  locked: 'neutral',
  available: 'neutral',
};

export function ToolCardTile({
  card,
  onRun,
}: {
  card: ToolCard;
  onRun: (kind: ToolCardKind) => void;
}) {
  const dimmed = card.state === 'locked';
  return (
    <li
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
          {card.label}
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
          onClick={() => onRun(card.action!.kind)}
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
}
