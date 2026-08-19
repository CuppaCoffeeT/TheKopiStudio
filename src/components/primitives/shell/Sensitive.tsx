/**
 * Sensitive — the render-side half of the privacy eye.
 *
 * Three tiny components rather than one `<Sensitive kind="…">`: the CALLER has
 * to state what kind of value it is holding, and a `kind` prop makes that a
 * string that can be wrong silently. `<SensitiveName>` vs `<SensitiveMoney>` at
 * the call site also makes an audit of "what does this page leak?" a grep.
 *
 * Each renders `<span aria-hidden>` for the masked run plus a visually-hidden
 * real value ONLY when unmasked — a screen reader must never be handed the
 * plaintext that the screen is deliberately hiding, because the two users are
 * often the same person in the same café.
 *
 * `title` is deliberately NOT set to the real value while masked: a tooltip
 * that reveals on hover defeats the whole feature.
 */

import { useMask } from '@/contexts/MaskContext';
import { maskCount, maskMoney, maskName, maskText } from '@/lib/masking';
import { cn } from '@/lib/utils';

interface SensitiveProps {
  className?: string;
  /** Force-reveal regardless of the switch — for the print reports. */
  reveal?: boolean;
}

/**
 * Masked runs are tabular so a row of them doesn't jitter as values change.
 *
 * `--fg-dim` (#5D4F3F), NOT `text-muted-foreground` (#7D6B5B). The first draft
 * used muted and axe caught 14 colour-contrast violations on the Customers
 * list: muted measures 4.72 on CARD cream and only **4.12 on the PAGE cream**,
 * where these table rows actually sit — the exact failure
 * `.claude/rules/light-theme.md` records under "Open item — muted on page".
 * A masked value is still text a person has to read.
 */
const MASKED_CLASS = 'tabular-nums tracking-[0.12em] text-[color:var(--fg-dim)]';

/** A person's name: `Sky Tan` → `Sk***`. */
export function SensitiveName({
  value,
  className,
  reveal,
}: SensitiveProps & { value: string | null | undefined }) {
  const { masked } = useMask();
  const hide = masked && !reveal;
  return (
    <span className={cn(hide && MASKED_CLASS, className)}>{maskName(value, hide)}</span>
  );
}

/** A monetary figure. `value` is what would have been rendered in the clear. */
export function SensitiveMoney({
  value,
  className,
  reveal,
}: SensitiveProps & { value: string }) {
  const { masked } = useMask();
  const hide = masked && !reveal;
  return <span className={cn(hide && MASKED_CLASS, className)}>{maskMoney(value, hide)}</span>;
}

/** A count that sizes the book — total customers, policies held. */
export function SensitiveCount({
  value,
  className,
  reveal,
}: SensitiveProps & { value: number | string }) {
  const { masked } = useMask();
  const hide = masked && !reveal;
  return <span className={cn(hide && MASKED_CLASS, className)}>{maskCount(value, hide)}</span>;
}

/** Free text that may carry a name or a figure — hidden wholesale. */
export function SensitiveText({
  value,
  className,
  reveal,
}: SensitiveProps & { value: string | null | undefined }) {
  const { masked } = useMask();
  const hide = masked && !reveal;
  return <span className={cn(hide && MASKED_CLASS, className)}>{maskText(value, hide)}</span>;
}
