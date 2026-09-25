/**
 * FollowUpSections — prototype v6's answer-aware follow-up (2026-09-25):
 *
 * - `TailoredFollowUp` sits inside the Follow-Up Style panel: one message that
 *   echoes the prospect's OWN money worry (the money-anchor answer), framed by
 *   their horizon and decision style, plus the temperament and openness
 *   alternates — all tap-to-copy.
 * - `GamePlanCard` is the "Meeting 2 Game Plan": what to prepare, what to show
 *   first, the pace, and the line to open with.
 *
 * Both need the discovery tracks, so pre-v6 rows never render them. Copy
 * buttons follow the playbook's pattern (IconButton + `copyStatement`) rather
 * than v6's tap-the-whole-row: a row that copies on tap is not a control a
 * screen reader or keyboard user can find.
 */

import { Copy } from 'lucide-react';
import { IconButton } from '@/components/primitives/IconButton';
import { ToolPanel } from '@/components/primitives/tools';
import { TRACK_COPY } from '../../../lib/content';
import { gamePlan, tailoredFollowUp } from '../../../lib/discovery';
import type { DiscLetter, DiscoveryTracks } from '../../../types';
import { copyStatement } from './copyStatement';

const KICKER = 'mb-1.5 uppercase text-[color:var(--brown-text)]';
const KICKER_STYLE = { fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em' };

function CopyableLine({ text, label, testId }: { text: string; label: string; testId: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <p className="m-0 flex-1 text-[13px] italic leading-6 text-foreground">{text}</p>
      <IconButton
        size="md"
        className="print-hide -my-1 flex-shrink-0"
        aria-label={`Copy ${label}`}
        onClick={() => void copyStatement(text)}
        data-testid={testId}
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
}

interface DiscoveryProps {
  tracks: DiscoveryTracks;
  /** DISC letter of the money-anchor answer. */
  worry: DiscLetter | null;
}

export function TailoredFollowUp({ tracks, worry }: DiscoveryProps) {
  return (
    <div className="mt-3 border-t border-border pt-3" data-testid="result-tailored-follow-up">
      <div className={KICKER} style={KICKER_STYLE}>
        Their words, your follow-up
      </div>
      <CopyableLine
        text={tailoredFollowUp(worry, tracks)}
        label="tailored follow-up message"
        testId="result-copy-tailored"
      />
      <div className={`${KICKER} mt-2`} style={KICKER_STYLE}>
        Alternates
      </div>
      <CopyableLine
        text={TRACK_COPY[tracks.temperament].msg}
        label={`${tracks.temperament} alternate message`}
        testId="result-copy-alt-temperament"
      />
      <CopyableLine
        text={TRACK_COPY[tracks.openness].msg}
        label={`${tracks.openness} alternate message`}
        testId="result-copy-alt-openness"
      />
    </div>
  );
}

export function GamePlanCard({ tracks, worry }: DiscoveryProps) {
  const plan = gamePlan(worry, tracks);
  const rows: ReadonlyArray<readonly [string, string]> = [
    ['Prepare', plan.prepare],
    ['Show first', plan.showFirst],
    ['Pace', plan.pace],
    ['Open with', plan.openWith],
  ];
  return (
    <ToolPanel label="Meeting 2 Game Plan" className="border-accent/40" testId="result-game-plan">
      <dl className="m-0 flex flex-col gap-3">
        {rows.map(([label, text]) => (
          <div key={label}>
            <dt className={KICKER} style={KICKER_STYLE}>
              {label}
            </dt>
            <dd
              className={`m-0 text-[13px] leading-6 ${label === 'Open with' ? 'italic text-foreground' : 'text-muted-foreground'}`}
            >
              {text}
            </dd>
          </div>
        ))}
      </dl>
    </ToolPanel>
  );
}
