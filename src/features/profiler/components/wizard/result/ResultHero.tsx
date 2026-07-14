/**
 * ResultHero — report hero band (legacy `resultHTML` hero block): gradient in
 * the primary profile's colour, identity line, DISC/MBTI badges and the
 * "Advisor Quick Read" strip.
 */

import type { ReactNode } from 'react';
import { PR } from '../../../lib/content';
import type { ProfileResult } from '../../../lib/scoring';

interface ResultHeroProps {
  profile: ProfileResult;
  prospectName: string;
  advisorName: string;
  /** Age range ('' when not provided). */
  ageRange: string;
  occupation: string;
  meetingLabel: string;
  /** Display date (en-SG, e.g. "11 Jun 2026"). */
  dateLabel: string;
}

function HeroBadge({ children, primary }: { children: ReactNode; primary?: boolean }) {
  return (
    <span
      className="rounded-full px-3 py-1"
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        fontWeight: 700,
        background: primary ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.22)',
        color: primary ? '#fff' : 'rgba(255,255,255,.8)',
      }}
    >
      {children}
    </span>
  );
}

export function ResultHero({
  profile,
  prospectName,
  advisorName,
  ageRange,
  occupation,
  meetingLabel,
  dateLabel,
}: ResultHeroProps) {
  const p = PR[profile.pri];
  const s = PR[profile.sec];

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: `${p.col}55` }}
      data-testid="result-hero"
    >
      <div className="px-4 pt-5 pb-3.5" style={{ background: `linear-gradient(135deg, ${p.col}EE, ${p.col}88)` }}>
        <span className="float-right text-4xl" aria-hidden="true">
          {p.em}
        </span>
        <div
          className="uppercase mb-1"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(255,255,255,.65)' }}
        >
          {meetingLabel} · {advisorName} · {dateLabel}
        </div>
        <div className="text-[22px] font-normal text-white">{prospectName}</div>
        <div className="mb-2.5" style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>
          {occupation}
          {ageRange ? `${occupation ? ' · ' : ''}Age ${ageRange}` : ''}
        </div>
        <div className="flex flex-wrap gap-2">
          <HeroBadge primary>
            DISC-{profile.pri} · {p.nm}
          </HeroBadge>
          <HeroBadge>
            Secondary: {profile.sec} · {s.nm}
          </HeroBadge>
          <HeroBadge>
            MBTI: {profile.mbs} · {p.mb}
          </HeroBadge>
        </div>
      </div>
      {/* Solid navy backing (page token) recesses the strip under the gradient band. */}
      <div className="bg-background px-4 py-3">
        <div
          className="uppercase mb-1 text-accent"
          style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, letterSpacing: '0.25em' }}
        >
          Advisor Quick Read
        </div>
        <div className="italic text-foreground/90" style={{ fontSize: 13, lineHeight: 1.7 }}>
          “{p.sg}”
        </div>
      </div>
    </div>
  );
}
