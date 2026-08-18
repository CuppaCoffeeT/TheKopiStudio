/**
 * The Overview's quote of the day.
 *
 * Deterministic, not random: the quote is picked from the SINGAPORE calendar
 * date, so it is the same all day, the same on a reload, and the same on the
 * advisor's laptop and phone. A `Math.random()` pick would reshuffle on every
 * render — which is how a "daily" quote becomes visual noise the eye learns to
 * skip, and would make the Overview untestable into the bargain.
 *
 * The index is the day number since the Unix epoch modulo the list length, so
 * the deck deals in order and wraps: consecutive days never repeat, and the
 * cycle is `QUOTES.length` days long. Adding a quote reshuffles which day gets
 * which — that is fine and deliberately not worth pinning.
 *
 * Tone: these are about the WORK — showing up, following through, the value of
 * the boring parts. Nothing about wealth, closing, or hustle. An advisor's
 * dashboard is a work queue, not a sales floor.
 */

export interface DailyQuote {
  text: string;
  attribution: string;
}

const QUOTES: readonly DailyQuote[] = [
  { text: 'The best way to find yourself is to lose yourself in the service of others.', attribution: 'Mahatma Gandhi' },
  { text: 'Trust is built in very small moments.', attribution: 'John Gottman' },
  { text: 'It is not the mountain we conquer, but ourselves.', attribution: 'Edmund Hillary' },
  { text: 'Quality is not an act, it is a habit.', attribution: 'Aristotle' },
  { text: 'Slow is smooth, and smooth is fast.', attribution: 'Proverb' },
  { text: 'The single biggest problem in communication is the illusion that it has taken place.', attribution: 'George Bernard Shaw' },
  { text: 'Care more than others think wise.', attribution: 'Howard Schultz' },
  { text: 'Discipline is choosing between what you want now and what you want most.', attribution: 'Abraham Lincoln' },
  { text: 'You can’t go back and change the beginning, but you can start where you are and change the ending.', attribution: 'C. S. Lewis' },
  { text: 'How we spend our days is, of course, how we spend our lives.', attribution: 'Annie Dillard' },
  { text: 'Do the hard jobs first. The easy jobs will take care of themselves.', attribution: 'Dale Carnegie' },
  { text: 'Small daily improvements are the key to staggering long-term results.', attribution: 'Robin Sharma' },
  { text: 'To listen well is as powerful a means of influence as to talk well.', attribution: 'John Marshall' },
  { text: 'The secret of getting ahead is getting started.', attribution: 'Mark Twain' },
  { text: 'Patience is not the ability to wait, but the ability to keep a good attitude while waiting.', attribution: 'Joyce Meyer' },
  { text: 'What gets measured gets managed.', attribution: 'Peter Drucker' },
  { text: 'People do not care how much you know until they know how much you care.', attribution: 'Theodore Roosevelt' },
  { text: 'Perfection is not attainable, but if we chase perfection we can catch excellence.', attribution: 'Vince Lombardi' },
  { text: 'An hour of planning can save you ten hours of doing.', attribution: 'Dale Carnegie' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', attribution: 'Robert Collier' },
  { text: 'Clarity is kindness.', attribution: 'Brené Brown' },
  { text: 'The way to get started is to quit talking and begin doing.', attribution: 'Walt Disney' },
  { text: 'Follow-up is the difference between interest and commitment.', attribution: 'Proverb' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', attribution: 'James Clear' },
  { text: 'A goal without a plan is just a wish.', attribution: 'Antoine de Saint-Exupéry' },
  { text: 'The obstacle is the way.', attribution: 'Marcus Aurelius' },
  { text: 'Never mistake motion for action.', attribution: 'Ernest Hemingway' },
  { text: 'Begin with the end in mind.', attribution: 'Stephen R. Covey' },
  { text: 'Simplicity is the ultimate sophistication.', attribution: 'Leonardo da Vinci' },
  { text: 'Compound interest is the eighth wonder of the world.', attribution: 'Attributed to Albert Einstein' },
  { text: 'Be so good they can’t ignore you.', attribution: 'Steve Martin' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * The quote for a given SG calendar date.
 *
 * @param localDate `YYYY-MM-DD` in Singapore time — pass
 *   `getLocalDateString()` from `utils/timezoneUtils`. Taking the string rather
 *   than a `Date` keeps this pure and keeps the timezone decision in the one
 *   module that owns it (.claude/rules/timezone.md).
 */
export function quoteForDate(localDate: string): DailyQuote {
  // `Date.UTC` on the parsed parts — never `new Date(str)`, whose behaviour for
  // a bare date string is timezone-dependent and would drift the quote at the
  // day boundary for anyone not sitting in UTC.
  const [year, month, day] = localDate.split('-').map(Number);
  const epochDays = Math.floor(Date.UTC(year, (month ?? 1) - 1, day ?? 1) / MS_PER_DAY);
  const index = ((epochDays % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[index];
}

/** Exposed for the unit test that asserts the deck is non-empty and unique. */
export const DAILY_QUOTES = QUOTES;
