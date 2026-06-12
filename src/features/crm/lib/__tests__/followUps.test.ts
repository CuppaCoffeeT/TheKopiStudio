/**
 * Follow-up badge corpus — locks the legacy ClientCard.jsx semantics:
 * 'YYYY-MM-DD' parses at UTC midnight, day counts via Math.ceil against the
 * full refDate instant, selection picks the earliest follow-up >= refDate
 * else falls back to next_review_date. refDate is injected everywhere.
 */
import { describe, expect, it } from 'vitest';

import { followUpBadge, nextFollowUpDate, resolveClientFollowUp } from '../followUps';

/** Exactly UTC midnight of 2026-06-11 — same instant `new Date('2026-06-11')` parses to. */
const AT_MIDNIGHT = new Date('2026-06-11T00:00:00.000Z');
/** Mid-morning SGT on the same day (02:30 UTC). */
const MID_DAY = new Date('2026-06-11T02:30:00.000Z');

describe('followUpBadge — tone boundaries (legacy followUpStatus)', () => {
  it('returns null for missing dates (no badge)', () => {
    expect(followUpBadge(null, MID_DAY)).toBeNull();
    expect(followUpBadge(undefined, MID_DAY)).toBeNull();
    expect(followUpBadge('', MID_DAY)).toBeNull();
  });

  it('yesterday → overdue, "1 days overdue"', () => {
    expect(followUpBadge('2026-06-10', MID_DAY)).toEqual({
      tone: 'overdue', label: 'Overdue follow-up', detail: '1 days overdue',
    });
    expect(followUpBadge('2026-05-12', MID_DAY)?.detail).toBe('30 days overdue');
  });

  it('today → urgent with "0 days" (Math.ceil of a small negative diff)', () => {
    expect(followUpBadge('2026-06-11', MID_DAY)).toEqual({
      tone: 'urgent', label: 'Upcoming follow-up', detail: '0 days',
    });
    expect(followUpBadge('2026-06-11', AT_MIDNIGHT)?.detail).toBe('0 days');
  });

  it('7-day boundary → still urgent (days <= 7)', () => {
    expect(followUpBadge('2026-06-18', AT_MIDNIGHT)).toEqual({
      tone: 'urgent', label: 'Upcoming follow-up', detail: '7 days',
    });
    // Partial day still ceils to 7 from a mid-day refDate.
    expect(followUpBadge('2026-06-18', MID_DAY)?.detail).toBe('7 days');
  });

  it('8 days out → upcoming', () => {
    expect(followUpBadge('2026-06-19', AT_MIDNIGHT)).toEqual({
      tone: 'upcoming', label: 'Next follow-up', detail: '8 days',
    });
  });
});

describe('nextFollowUpDate — earliest FUTURE follow-up else next_review_date', () => {
  const interactions = [
    { followUp: '2026-07-01' },
    { followUp: '2026-06-15' },
    { followUp: '2026-06-01' }, // past — excluded
    { followUp: '' }, // none — excluded
    { followUp: null },
  ];

  it('picks the earliest future follow-up', () => {
    expect(nextFollowUpDate(interactions, '2026-09-01', MID_DAY)).toBe('2026-06-15');
  });

  it('falls back to next_review_date when every follow-up is past', () => {
    expect(nextFollowUpDate([{ followUp: '2026-06-01' }], '2026-09-01', MID_DAY)).toBe('2026-09-01');
  });

  it('no follow-ups and no review date → null (handles "" and undefined)', () => {
    expect(nextFollowUpDate([], '', MID_DAY)).toBeNull();
    expect(nextFollowUpDate([], undefined, MID_DAY)).toBeNull();
  });

  it("today's follow-up is included ONLY while refDate is before/at UTC midnight (legacy >= semantics)", () => {
    const today = [{ followUp: '2026-06-11' }];
    expect(nextFollowUpDate(today, '2026-09-01', AT_MIDNIGHT)).toBe('2026-06-11');
    expect(nextFollowUpDate(today, '2026-09-01', MID_DAY)).toBe('2026-09-01');
  });
});

describe('resolveClientFollowUp — combined date + badge', () => {
  it('badges the selected follow-up date', () => {
    const resolved = resolveClientFollowUp([{ followUp: '2026-06-15' }], '2026-09-01', MID_DAY);
    expect(resolved.date).toBe('2026-06-15');
    expect(resolved.badge?.tone).toBe('urgent');
  });

  it('an overdue next_review_date fallback still badges overdue (legacy behavior)', () => {
    const resolved = resolveClientFollowUp([], '2026-06-05', MID_DAY);
    expect(resolved.date).toBe('2026-06-05');
    expect(resolved.badge?.tone).toBe('overdue');
    expect(resolved.badge?.detail).toBe('6 days overdue');
  });

  it('no dates at all → null date, null badge', () => {
    expect(resolveClientFollowUp([], '', MID_DAY)).toEqual({ date: null, badge: null });
  });
});
