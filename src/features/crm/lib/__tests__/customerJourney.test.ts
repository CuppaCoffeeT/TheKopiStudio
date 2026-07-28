/**
 * Customer journey corpus — locks the rules the Overview queue, the Customers
 * list checklist and the customer detail launcher ALL read. These three
 * surfaces disagreeing is the failure this file exists to prevent, so the
 * boundaries (14 quiet days, 30 review days, 5 info checks, report gating) are
 * asserted directly rather than through any one caller.
 *
 * `refDate` is injected everywhere — no test may depend on the wall clock.
 */
import { describe, expect, it } from 'vitest';

import {
  deriveAttention,
  describeAttention,
  QUIET_DAYS,
  REVIEW_WINDOW_DAYS,
} from '../customerAttention';
import {
  countInfoChecks,
  deriveJourney,
  missingInfoChecks,
  INFO_CHECK_COUNT,
  type JourneyInput,
} from '../customerJourney';

/** Mid-morning SGT on 2026-07-28 (02:30 UTC) — the reference instant throughout. */
const NOW = new Date('2026-07-28T02:30:00.000Z');

const EMPTY: JourneyInput = {
  hasProfile: false,
  email: null,
  phone: null,
  dateOfBirth: null,
  occupation: null,
  annualIncome: null,
  nextReviewDate: null,
};

const COMPLETE_INFO: JourneyInput = {
  hasProfile: true,
  email: 'marcus.t@gmail.com',
  phone: '+65 9887 2210',
  dateOfBirth: '1991-04-02',
  occupation: 'Marketing manager',
  annualIncome: 96000,
  nextReviewDate: '2026-11-01',
};

describe('countInfoChecks — the five information checks', () => {
  it('counts nothing on an empty record', () => {
    expect(countInfoChecks(EMPTY)).toBe(0);
  });

  it('counts everything on a complete record', () => {
    expect(countInfoChecks(COMPLETE_INFO)).toBe(INFO_CHECK_COUNT);
  });

  it('accepts EITHER email or phone as the contact check', () => {
    const emailOnly = { ...EMPTY, email: 'a@b.com' };
    const phoneOnly = { ...EMPTY, phone: '+65 1234 5678' };
    const both = { ...EMPTY, email: 'a@b.com', phone: '+65 1234 5678' };
    expect(countInfoChecks(emailOnly)).toBe(1);
    expect(countInfoChecks(phoneOnly)).toBe(1);
    // Both present is still ONE check — a referral with only a mobile number
    // must be able to reach a complete record.
    expect(countInfoChecks(both)).toBe(1);
  });

  it('treats whitespace-only strings as unset', () => {
    expect(countInfoChecks({ ...EMPTY, occupation: '   ' })).toBe(0);
  });

  it('treats a zero income as unset, not as a filled check', () => {
    expect(countInfoChecks({ ...EMPTY, annualIncome: 0 })).toBe(0);
    expect(countInfoChecks({ ...EMPTY, annualIncome: 1 })).toBe(1);
  });
});

describe('missingInfoChecks — names only the real gaps', () => {
  it('names all five on an empty record', () => {
    expect(missingInfoChecks(EMPTY)).toEqual([
      'contact',
      'date of birth',
      'occupation',
      'annual income',
      'next review',
    ]);
  });

  it('names nothing on a complete record', () => {
    expect(missingInfoChecks(COMPLETE_INFO)).toEqual([]);
  });

  it('omits the checks that ARE filled', () => {
    // A phone number satisfies contact, so it must not be reported missing.
    expect(missingInfoChecks({ ...COMPLETE_INFO, email: null, occupation: null })).toEqual([
      'occupation',
    ]);
  });

  it('is the same list deriveJourney publishes', () => {
    const input = { ...COMPLETE_INFO, dateOfBirth: null, annualIncome: null };
    expect(deriveJourney(input).missingInfo).toEqual(missingInfoChecks(input));
  });
});

describe('deriveJourney — the three-step chain', () => {
  it('an empty, unprofiled record starts nothing and locks the report', () => {
    const journey = deriveJourney(EMPTY);
    expect(journey.steps).toEqual({
      profiler: 'not-started',
      info: 'not-started',
      report: 'locked',
    });
    expect(journey.completed).toBe(0);
    expect(journey.nextStep).toBe('profiler');
  });

  it('a complete record completes all three steps', () => {
    const journey = deriveJourney(COMPLETE_INFO);
    expect(journey.steps).toEqual({ profiler: 'done', info: 'done', report: 'done' });
    expect(journey.completed).toBe(3);
    expect(journey.nextStep).toBeNull();
  });

  it('partially filled information reads in-progress, never done', () => {
    const journey = deriveJourney({ ...COMPLETE_INFO, occupation: null });
    expect(journey.steps.info).toBe('in-progress');
    expect(journey.infoFilled).toBe(INFO_CHECK_COUNT - 1);
    expect(journey.nextStep).toBe('info');
  });

  it('keeps the report LOCKED when only the profiler is done', () => {
    const journey = deriveJourney({ ...EMPTY, hasProfile: true });
    expect(journey.steps.profiler).toBe('done');
    expect(journey.steps.report).toBe('locked');
  });

  it('keeps the report LOCKED when the information is complete but no profile exists', () => {
    const journey = deriveJourney({ ...COMPLETE_INFO, hasProfile: false });
    expect(journey.steps.info).toBe('done');
    expect(journey.steps.report).toBe('locked');
    // Profiler outranks info in the chain, so it is what the queue asks for.
    expect(journey.nextStep).toBe('profiler');
  });

  it('the profiler step is binary — the schema persists no partial run', () => {
    expect(deriveJourney({ ...EMPTY, hasProfile: true }).steps.profiler).toBe('done');
    expect(deriveJourney({ ...EMPTY, hasProfile: false }).steps.profiler).toBe('not-started');
  });
});

describe('deriveAttention — the queue rule', () => {
  const complete = deriveJourney(COMPLETE_INFO);

  it('falls back to the added date when no contact was ever logged', () => {
    const attention = deriveAttention(
      {
        lastContactDate: null,
        addedDate: '2026-07-01',
        nextReviewDate: null,
        journey: complete,
      },
      NOW,
    );
    expect(attention.quietDays).toBe(27);
    expect(attention.isQuiet).toBe(true);
  });

  it('prefers the last contact over the added date', () => {
    const attention = deriveAttention(
      {
        lastContactDate: '2026-07-27',
        addedDate: '2024-02-12',
        nextReviewDate: null,
        journey: complete,
      },
      NOW,
    );
    expect(attention.quietDays).toBe(1);
    expect(attention.isQuiet).toBe(false);
    expect(attention.reason).toBeNull();
  });

  it('goes quiet exactly ON the boundary, not a day later', () => {
    const onBoundary = deriveAttention(
      { lastContactDate: '2026-07-14', addedDate: null, nextReviewDate: null, journey: complete },
      NOW,
    );
    const dayInside = deriveAttention(
      { lastContactDate: '2026-07-15', addedDate: null, nextReviewDate: null, journey: complete },
      NOW,
    );
    expect(onBoundary.quietDays).toBe(QUIET_DAYS);
    expect(onBoundary.isQuiet).toBe(true);
    expect(dayInside.isQuiet).toBe(false);
  });

  it('flags a review inside the window and one already lapsed', () => {
    const upcoming = deriveAttention(
      {
        lastContactDate: '2026-07-27',
        addedDate: null,
        nextReviewDate: '2026-08-10',
        journey: complete,
      },
      NOW,
    );
    expect(upcoming.reviewInDays).toBe(13);
    expect(upcoming.isReviewDue).toBe(true);
    expect(upcoming.reason).toBe('review-due');

    const lapsed = deriveAttention(
      {
        lastContactDate: '2026-07-27',
        addedDate: null,
        nextReviewDate: '2026-07-01',
        journey: complete,
      },
      NOW,
    );
    expect(lapsed.reviewInDays).toBeLessThan(0);
    expect(lapsed.isReviewDue).toBe(true);
  });

  it('leaves a review beyond the window out of the queue entirely', () => {
    const attention = deriveAttention(
      {
        lastContactDate: '2026-07-27',
        addedDate: null,
        nextReviewDate: '2026-12-01',
        journey: complete,
      },
      NOW,
    );
    expect(attention.reviewInDays).toBeGreaterThan(REVIEW_WINDOW_DAYS);
    expect(attention.isReviewDue).toBe(false);
    expect(attention.reason).toBeNull();
  });

  it('assigns ONE reason, worst first — quiet outranks unfinished and review', () => {
    const attention = deriveAttention(
      {
        lastContactDate: '2026-06-01',
        addedDate: null,
        nextReviewDate: '2026-08-01',
        journey: deriveJourney(EMPTY),
      },
      NOW,
    );
    expect(attention.isQuiet).toBe(true);
    expect(attention.hasUnfinishedWork).toBe(true);
    expect(attention.isReviewDue).toBe(true);
    // One customer, one queue section — the three bands never double-count.
    expect(attention.reason).toBe('quiet');
  });

  it('unfinished outranks an upcoming review', () => {
    const attention = deriveAttention(
      {
        lastContactDate: '2026-07-27',
        addedDate: null,
        nextReviewDate: '2026-08-01',
        journey: deriveJourney(EMPTY),
      },
      NOW,
    );
    expect(attention.reason).toBe('unfinished');
  });

  it('a customer with nothing outstanding stays out of the way', () => {
    const attention = deriveAttention(
      {
        lastContactDate: '2026-07-27',
        addedDate: null,
        nextReviewDate: '2026-12-01',
        journey: complete,
      },
      NOW,
    );
    expect(attention.reason).toBeNull();
  });

  it('never crashes on an unparseable date column', () => {
    const attention = deriveAttention(
      { lastContactDate: 'not-a-date', addedDate: null, nextReviewDate: '', journey: complete },
      NOW,
    );
    expect(attention.quietDays).toBeNull();
    expect(attention.isQuiet).toBe(false);
    expect(attention.reviewInDays).toBeNull();
  });
});

describe('describeAttention — the row subtitle', () => {
  it('names the wait for a quiet customer', () => {
    const journey = deriveJourney(COMPLETE_INFO);
    const attention = deriveAttention(
      { lastContactDate: '2026-07-01', addedDate: null, nextReviewDate: null, journey },
      NOW,
    );
    expect(describeAttention(attention, journey)).toBe('No contact logged for 27 days');
  });

  it('names the missing step for an unfinished customer', () => {
    const journey = deriveJourney(EMPTY);
    const attention = deriveAttention(
      { lastContactDate: '2026-07-27', addedDate: null, nextReviewDate: null, journey },
      NOW,
    );
    expect(describeAttention(attention, journey)).toBe(
      'Never profiled — no risk profile on file',
    );
  });

  it('NAMES the missing information fields rather than listing all five', () => {
    const journey = deriveJourney({ ...COMPLETE_INFO, occupation: null, dateOfBirth: null });
    const attention = deriveAttention(
      { lastContactDate: '2026-07-27', addedDate: null, nextReviewDate: null, journey },
      NOW,
    );
    // Contact / income / next review are filled and must NOT be named.
    expect(describeAttention(attention, journey)).toBe(
      'Customer information incomplete · missing date of birth, occupation',
    );
  });

  it('says nothing when the customer needs nothing', () => {
    const journey = deriveJourney(COMPLETE_INFO);
    const attention = deriveAttention(
      { lastContactDate: '2026-07-27', addedDate: null, nextReviewDate: null, journey },
      NOW,
    );
    expect(describeAttention(attention, journey)).toBe('');
  });
});
