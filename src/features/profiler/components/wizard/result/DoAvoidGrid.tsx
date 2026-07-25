/**
 * DoAvoidGrid — "✓ Do This" / "✕ Avoid" two-column grid (legacy `.ddg`).
 * Single column on small screens for readable line lengths.
 *
 * Do/Avoid is the report's positive/negative pair, so it takes the Kopi
 * semantic hues: sage for "do", terracotta for "avoid". Both are tint fills
 * with same-hue darkened type — every string here is under 18px, so the text
 * resolves to the AA-safe variants (`--sage-text` / `--negative-text`) and
 * never to the raw brand sage or terracotta.
 */

import { Card } from '@/components/primitives/shell/Card';
import type { DiscProfile } from '../../../types';

function ItemList({ items, tone }: { items: readonly string[]; tone: 'do' | 'avoid' }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          key={item}
          className={
            tone === 'do'
              ? 'rounded-lg bg-[color:var(--delta-positive-bg)] px-3 py-2 text-[12.5px] leading-5 text-[color:var(--sage-text)]'
              : 'rounded-lg bg-[color:var(--delta-negative-bg)] px-3 py-2 text-[12.5px] leading-5 text-[color:var(--negative-text)]'
          }
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function DoAvoidGrid({ profile }: { profile: DiscProfile }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-testid="result-do-avoid-grid">
      <Card className="border-[color:var(--status-accepted-border)]">
        <div
          className="mb-2.5 uppercase text-[color:var(--sage-text)]"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          ✓ Do This
        </div>
        <ItemList items={profile.dos} tone="do" />
      </Card>
      <Card className="border-[color:var(--status-rejected-border)]">
        <div
          className="mb-2.5 uppercase text-[color:var(--negative-text)]"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em' }}
        >
          ✕ Avoid
        </div>
        <ItemList items={profile.dnts} tone="avoid" />
      </Card>
    </div>
  );
}
