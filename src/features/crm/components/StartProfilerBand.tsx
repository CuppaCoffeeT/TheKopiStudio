/**
 * StartProfilerBand — the Overview launcher (Kopi Studio Directions turn 4a,
 * "Overview gets a launcher band so a profiler can be started without going
 * through the list").
 *
 * The customer-centred IA takes the tools out of the sidebar, so the profiler
 * needs ONE unmissable entry point on the page an advisor lands on. This is it:
 * a full-width card carrying the serif head, the one-line explanation of what
 * happens to the record, and the brown CTA.
 *
 * Renders only for viewers who hold `/profiler` — the caller checks, so the
 * band never advertises a tool the route guard would then refuse.
 */

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';

interface StartProfilerBandProps {
  onStart: () => void;
}

export function StartProfilerBand({ onStart }: StartProfilerBandProps) {
  return (
    <section
      data-testid="home-start-profiler-band"
      aria-labelledby="home-start-profiler-heading"
      className="mb-[26px] flex flex-col gap-4 rounded-xl border border-border bg-card px-[22px] py-5 shadow-[var(--card-shadow-rest)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <h2
          id="home-start-profiler-heading"
          className="m-0 text-[22px] leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          Start a Prospect Profiler
        </h2>
        <p className="m-0 mt-1.5 max-w-[62ch] text-[12.5px] leading-[1.6] text-[color:var(--fg-dim)]">
          Sitting with someone new? Profile them here — the risk profile it produces is what unlocks
          the rest of the customer record.
        </p>
      </div>
      <Button
        className="flex-none pointer-coarse:min-h-11"
        onClick={onStart}
        trailingIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
        data-testid="home-start-profiler-btn"
      >
        Start profiler
      </Button>
    </section>
  );
}
