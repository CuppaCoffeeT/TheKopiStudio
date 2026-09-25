/**
 * DiscoveryScreen — wizard screen 9, the money talk (prototype v6
 * `discoveryHTML`, 2026-09-25).
 *
 * Two parts in one panel: the MONEY ANCHOR (Q7, the money-worry question — a
 * scored DISC question that moved here from question screen 2) and the four
 * TRACKS (temperament, openness, horizon, decision — two poles each, not
 * scored). Every track question is worded for the pit stop's provisional DISC
 * letter (`voice`), so a C-type hears "capital preservation" where an I-type
 * hears "chill let-it-grow". "Generate Profile" stays disabled until all five
 * are answered.
 */

import { ToolPanel } from '@/components/primitives/tools';
import { DISCOVERY_AXES, MONEY_ANCHOR_QI, QS, TRACK_KEYS } from '../../lib/content';
import type { DiscLetter, DiscoveryTracks, RawAnswer, TrackKey, TrackValue } from '../../types';
import { DiscQuestionOptions, QuestionBlock } from './QuestionBlock';
import { OptionRow } from './OptionRow';

interface DiscoveryScreenProps {
  /** The pit stop's provisional DISC letter — which wording to ask in. */
  voice: DiscLetter;
  prospectName: string;
  answers: ReadonlyArray<RawAnswer | null>;
  onSelect: (qi: number, oi: number) => void;
  tracks: Partial<DiscoveryTracks>;
  onSelectTrack: (key: TrackKey, value: TrackValue) => void;
}

/** The selected pole, named — the track equivalent of the DISC-X badge. */
function PoleBadge({ value }: { value: TrackValue }) {
  return (
    <span
      className="mt-0.5 inline-flex flex-shrink-0 items-center rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[color:var(--brown-text-on-wash)]"
      style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700 }}
    >
      {value}
    </span>
  );
}

export function DiscoveryScreen({
  voice,
  prospectName,
  answers,
  onSelect,
  tracks,
  onSelectTrack,
}: DiscoveryScreenProps) {
  const anchor = QS[MONEY_ANCHOR_QI];

  return (
    <div className="flex flex-col gap-3" data-testid="wizard-discovery-screen">
      <div className="border-b border-border pb-4">
        <h2
          className="m-0 text-[22px] leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
        >
          Understanding {prospectName}
        </h2>
        <p className="m-0 mt-1.5 text-[13px] leading-6 text-[color:var(--fg-dim)]">
          Worded for a {voice}-type. Tap the closest match — these flow naturally once you are
          already talking money, not before.
        </p>
      </div>

      <ToolPanel label="Discovery · the money talk">
        <QuestionBlock
          tag="Money Anchor"
          tone="discovery"
          tip={anchor.tip}
          ask={anchor.ask}
          divided={false}
          testId={`wizard-question-${MONEY_ANCHOR_QI}`}
        >
          <DiscQuestionOptions qi={MONEY_ANCHOR_QI} answers={answers} onSelect={onSelect} />
        </QuestionBlock>

        {TRACK_KEYS.map((key) => {
          const axis = DISCOVERY_AXES[key];
          return (
            <QuestionBlock
              key={key}
              tag={axis.axis}
              tone="discovery"
              tip={axis.tip}
              ask={axis.frames[voice]}
              divided
              testId={`wizard-track-${key}`}
            >
              {axis.opts.map((opt, oi) => (
                <OptionRow
                  key={opt.v}
                  name={`wizard-track-${key}`}
                  value={opt.v}
                  checked={tracks[key] === opt.v}
                  onSelect={() => onSelectTrack(key, opt.v)}
                  label={opt.t}
                  badge={<PoleBadge value={opt.v} />}
                  testId={`wizard-track-${key}-opt-${oi}`}
                />
              ))}
            </QuestionBlock>
          );
        })}
      </ToolPanel>
    </div>
  );
}
