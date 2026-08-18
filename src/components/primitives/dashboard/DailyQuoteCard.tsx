/**
 * DailyQuoteCard — the quote of the day, under the Overview greeting.
 *
 * A raised card on the cream page (`bg-card`, one step lighter — the cardinal
 * surface rule), with an oversized Instrument Serif open-quote as the only
 * ornament. The quote itself is serif at 19px, comfortably over the 18px floor
 * the type contract sets for `--font-pixel`; the attribution is IBM Plex Sans,
 * because it is under that floor.
 *
 * Semantics are a real `<figure>` / `<blockquote>` / `<figcaption>`, not three
 * divs: a screen reader should be able to skip it in one move, because it is
 * the one thing on this page that is not work.
 *
 * The quote is chosen by `lib/dailyQuote` from the SG date — see that module
 * for why it is deterministic rather than random.
 */

import type { DailyQuote } from '@/lib/dailyQuote';
import { cn } from '@/lib/utils';

interface DailyQuoteCardProps {
  quote: DailyQuote;
  className?: string;
}

export function DailyQuoteCard({ quote, className }: DailyQuoteCardProps) {
  return (
    <figure
      data-testid="home-daily-quote"
      className={cn(
        'relative m-0 overflow-hidden rounded-xl border border-border bg-card',
        'px-5 py-[18px] sm:px-7 sm:py-6',
        className,
      )}
    >
      {/* Decorative. `aria-hidden` because a screen reader announcing a lone
          quotation mark before the quote is noise, and <blockquote> already
          carries the meaning. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-3 right-4 select-none text-[92px] leading-none text-[color:var(--brand-brown)] opacity-[0.09]"
        style={{ fontFamily: 'var(--font-pixel)' }}
      >
        &rdquo;
      </span>

      <blockquote className="relative m-0">
        <p
          className="m-0 max-w-measure text-[19px] leading-[1.45] text-foreground sm:text-[21px]"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          {quote.text}
        </p>
      </blockquote>
      <figcaption className="relative mt-2.5 text-[11.5px] uppercase tracking-[0.12em] text-muted-foreground">
        {quote.attribution}
      </figcaption>
    </figure>
  );
}
