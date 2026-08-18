/**
 * Privacy masking — the pure string half of the banking-app style eye toggle.
 *
 * WHAT IS MASKED is a named list, not "everything that looks like data". An
 * advisor works in cafés and on trains; what must not be shoulder-readable is
 * WHO the customer is and HOW MUCH money is involved. What must stay readable
 * is everything that tells them where they are and what to do — nav labels,
 * tool names, section headings, instructions, status words, dates, counts of
 * *tasks*. Masking those would make the app unusable while protecting nothing:
 * "3 reviews coming up" tells a stranger nothing, and hiding it hides the point
 * of the page.
 *
 *   Masked      names · money · income · portfolio value · assets · liabilities
 *               · customer counts (they size the advisor's book)
 *   Not masked  navigation · tool names · instructions · statuses · queue copy
 *
 * The functions are pure and take the flag rather than reading context, so the
 * rules can be unit-tested and so a report page — which must NEVER mask, the
 * printed artifact is the point — can simply pass `false`.
 */

/** The character the comps use for a hidden run. Six of them, always. */
const BULLET = '*';
const HIDDEN_RUN = BULLET.repeat(6);

/**
 * A person's name, keeping the first two characters as the recognition hook the
 * brief asks for: `Sky Tan → Sk***`.
 *
 * Two characters is a deliberate floor rather than a percentage: a percentage
 * leaks progressively more of a longer name, and a single initial is not enough
 * for an advisor to recognise their own customer in a list they wrote.
 * Anything shorter than the floor is hidden outright — revealing "all of it but
 * the last letter" is not masking.
 */
export function maskName(name: string | null | undefined, masked: boolean): string {
  const value = (name ?? '').trim();
  if (!masked || value === '') return value;
  if (value.length <= 2) return '***';
  return `${value.slice(0, 2)}***`;
}

/** A person's initial for an avatar. Never masked — one letter reveals nothing
 *  and the avatar is how a row stays scannable. */
export function maskInitial(name: string | null | undefined): string {
  return (name ?? '').trim().charAt(0).toUpperCase() || '?';
}

/**
 * Any monetary figure — premium, income, portfolio value, asset, liability.
 * The caller passes what it WOULD have rendered, so currency formatting,
 * rounding and the em-dash empty state all stay in one place upstream.
 */
export function maskMoney(formatted: string, masked: boolean): string {
  return masked ? HIDDEN_RUN : formatted;
}

/**
 * A count that sizes the book (total customers, policies held). Masked because
 * "how many clients do you have" is commercially sensitive in a way that "how
 * many of them need you today" is not — the queue figures stay in the clear.
 */
export function maskCount(value: number | string, masked: boolean): string {
  return masked ? HIDDEN_RUN : String(value);
}

/** Free text that may carry a name or a figure (an interaction note, a report
 *  section body). Hidden wholesale — there is no safe partial. */
export function maskText(text: string | null | undefined, masked: boolean): string {
  const value = text ?? '';
  if (!masked || value === '') return value;
  return HIDDEN_RUN;
}
