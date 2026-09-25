/**
 * TrackSections — the report panels prototype v6 added for its four
 * discovery tracks (2026-09-25): the Combined Read headline, "Track 3-4"
 * (temperament + openness meters) and "Time Horizon & Decision Style". Each
 * renders only when the result HAS tracks — rows saved before v6 do not, and
 * their report is unchanged.
 *
 * v6 coloured its meters with four categorical hues (anxious red, calm green,
 * familiar khaki, curious purple). 2a admits no categorical hues, so the
 * meters are the neutral bar track with a brown marker, and the chosen pole is
 * named in ink while the other drops to --fg-dim. The marker is decoration;
 * the pole name carries the read.
 */

import { ToolPanel } from '@/components/primitives/tools';
import { cn } from '@/lib/utils';
import { DISCOVERY_AXES, TRACK_COPY } from '../../../lib/content';
import { combinedRead } from '../../../lib/discovery';
import type { DiscoveryTracks, TrackKey } from '../../../types';

function SoWhat({ label = 'So what', children }: { label?: string; children: string }) {
  return (
    <p className="m-0 mt-1.5 text-[12.5px] leading-6 text-muted-foreground">
      <strong className="font-semibold text-foreground">{label}:</strong> {children}
    </p>
  );
}

/** v6 `sliderHTML`: a two-pole meter with the marker at 22% or 78%. */
function TrackMeter({ trackKey, value }: { trackKey: TrackKey; value: DiscoveryTracks[TrackKey] }) {
  const axis = DISCOVERY_AXES[trackKey];
  const isLeft = value === axis.left;
  const pole = (name: string, chosen: boolean) => (
    <span className={cn(chosen ? 'font-bold text-foreground' : 'text-[color:var(--fg-dim)]')}>{name}</span>
  );
  return (
    <div data-testid={`result-track-${trackKey}`}>
      <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-[color:var(--fg-dim)]">{axis.axis}</div>
      <div className="mb-1.5 flex justify-between text-[12px]">
        {pole(axis.left, isLeft)}
        {pole(axis.right, !isLeft)}
      </div>
      <div
        className="relative h-2 rounded-full bg-[color:var(--border-faint)]"
        role="img"
        aria-label={`${axis.axis}: ${value}`}
      >
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-accent bg-card"
          style={{ left: isLeft ? '22%' : '78%' }}
        />
      </div>
    </div>
  );
}

export function CombinedReadCard({ tracks }: { tracks: DiscoveryTracks }) {
  return (
    <ToolPanel
      label="Combined Read — all four tracks"
      labelClassName="text-[color:var(--brown-text)]"
      className="border-accent/40"
      testId="result-combined-read"
    >
      <p className="m-0 text-[14px] leading-7 text-foreground">
        {combinedRead(tracks).map((segment, i) =>
          segment.strong ? <strong key={i}>{segment.text}</strong> : <span key={i}>{segment.text}</span>,
        )}
      </p>
    </ToolPanel>
  );
}

export function TemperamentOpennessCard({ tracks }: { tracks: DiscoveryTracks }) {
  return (
    <ToolPanel label="Track 3-4 · Temperament & Openness" testId="result-tracks">
      <TrackMeter trackKey="temperament" value={tracks.temperament} />
      <SoWhat>{TRACK_COPY[tracks.temperament].so}</SoWhat>
      <div className="mt-5">
        <TrackMeter trackKey="openness" value={tracks.openness} />
        <SoWhat>{TRACK_COPY[tracks.openness].so}</SoWhat>
      </div>
    </ToolPanel>
  );
}

export function HorizonDecisionCard({ tracks }: { tracks: DiscoveryTracks }) {
  const tile = (label: string, value: string, testId: string) => (
    <div className="flex-1 rounded-xl border border-border/80 bg-secondary p-3" data-testid={testId}>
      <div className="mb-1 text-[10px] uppercase tracking-[0.1em] text-[color:var(--fg-dim)]">{label}</div>
      <div className="text-[15px] font-semibold text-foreground">{value}</div>
    </div>
  );
  return (
    <ToolPanel label="Time Horizon & Decision Style" testId="result-horizon-decision">
      <div className="mb-3 flex gap-2.5">
        {tile('Horizon', tracks.horizon, 'result-track-horizon')}
        {tile('Decision', tracks.decision, 'result-track-decision')}
      </div>
      <SoWhat label="Horizon">{TRACK_COPY[tracks.horizon].so}</SoWhat>
      <SoWhat label="Decision">{TRACK_COPY[tracks.decision].so}</SoWhat>
    </ToolPanel>
  );
}
