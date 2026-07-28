/**
 * CustomerToolLauncher — the six tools, as things you DO to this customer
 * (Kopi Studio Directions turn 3a: "tools are no longer navigation; they are
 * things you do to a customer, launched from the customer record").
 *
 * This is the load-bearing piece of the customer-centred IA. Before it, the
 * chain was invisible: the profiler lived in the sidebar with no idea which
 * customer you meant, and `/clients/:id/report` had NO entry point anywhere in
 * the app — the client report was reachable only by typing the URL.
 *
 * TWO GROUPS, rendered as one ladder but modelled separately (see
 * `lib/customerToolCards`): the chain 01–03 gates itself, the planning tools
 * 04–06 are always available. The "Planning" sub-heading is what tells the
 * reader that 04 is not waiting on 03.
 *
 * WHAT each card says and offers is decided in the lib (pure); this file only
 * renders it and maps the action discriminator to a handler.
 *
 * A card with no action renders its reason line rather than a disabled-looking
 * control: a clickable lock is a lie, and the route stays reachable by URL for
 * anyone who needs it. Disabled state uses the brand muted ink, never grey
 * (.claude/rules/light-theme.md — no cool neutrals on the warm ground).
 */

import type { CustomerJourney } from '../../lib/customerJourney';
import { buildPlanningCards, buildToolCards, type ToolCardKind } from '../../lib/customerToolCards';
import { ToolCardTile } from './ToolCardTile';

interface CustomerToolLauncherProps {
  journey: CustomerJourney;
  /** Newest linked profiler result, when one is visible to this viewer. */
  linkedResultId: string | null;
  /** False for a manager reading another advisor's customer — write actions drop out. */
  isOwn: boolean;
  /** True when the viewer holds the `/profiler` module. */
  canProfile: boolean;
  onStartProfiler: () => void;
  onOpenProfile: (resultId: string) => void;
  onEditInformation: () => void;
  onOpenReport: () => void;
  onOpenTax: () => void;
  onOpenSrs: () => void;
  onOpenLegacy: () => void;
}

export function CustomerToolLauncher({
  journey,
  linkedResultId,
  isOwn,
  canProfile,
  onStartProfiler,
  onOpenProfile,
  onEditInformation,
  onOpenReport,
  onOpenTax,
  onOpenSrs,
  onOpenLegacy,
}: CustomerToolLauncherProps) {
  const chain = buildToolCards({
    journey,
    hasLinkedResult: Boolean(linkedResultId),
    isOwn,
    canProfile,
  });
  const planning = buildPlanningCards();

  const runAction = (kind: ToolCardKind) => {
    switch (kind) {
      case 'start-profiler':
        return onStartProfiler();
      case 'view-profile':
        return linkedResultId ? onOpenProfile(linkedResultId) : undefined;
      case 'edit-info':
        return onEditInformation();
      case 'open-report':
        return onOpenReport();
      case 'open-tax':
        return onOpenTax();
      case 'open-srs':
        return onOpenSrs();
      case 'open-legacy':
        return onOpenLegacy();
    }
  };

  return (
    <section
      aria-labelledby="customer-tools-heading"
      data-testid="customer-tool-launcher"
      className="mb-[22px]"
    >
      <h2
        id="customer-tools-heading"
        className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-dim)]"
      >
        Tools
      </h2>
      <ol className="m-0 grid list-none grid-cols-1 gap-[18px] p-0 lg:grid-cols-3">
        {chain.map((card) => (
          <ToolCardTile key={card.key} card={card} onRun={runAction} />
        ))}
      </ol>

      <h3
        className="m-0 mb-3 mt-[22px] text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-dim)]"
        data-testid="customer-tools-planning-heading"
      >
        Planning · always available
      </h3>
      <ol className="m-0 grid list-none grid-cols-1 gap-[18px] p-0 lg:grid-cols-3">
        {planning.map((card) => (
          <ToolCardTile key={card.key} card={card} onRun={runAction} />
        ))}
      </ol>
    </section>
  );
}
