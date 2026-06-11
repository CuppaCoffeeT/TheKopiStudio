/**
 * Meeting-stage labels — exact port of the legacy app's two label maps.
 *
 * `results.meeting` is stored as text '1'–'4' (legacy shape, frozen until
 * cutover). Sources of truth in the legacy bundle:
 *   - public/js/pages/home.js:93  → full labels (result print header)
 *   - public/js/pages/results.js:59 → short labels (history list badges)
 */

/** Full labels — result report header + list "Meeting" column. */
export const MEETING_LABELS: Record<string, string> = {
  '1': '1st Meeting',
  '2': '2nd Meeting',
  '3': '3rd Meeting',
  '4': 'Servicing',
};

/** Short labels — compact badges (mobile cards), legacy `results.js` map. */
export const MEETING_LABELS_SHORT: Record<string, string> = {
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
  '4': 'Svc',
};

/**
 * Resolve a stored `meeting` value to a display label.
 * Falls back to the raw value (legacy behavior: `mls[r.meeting] || r.meeting`)
 * and to an em-dash when the column is NULL.
 */
export function meetingLabel(
  meeting: string | null | undefined,
  variant: 'full' | 'short' = 'full',
): string {
  if (!meeting) return '—';
  const map = variant === 'short' ? MEETING_LABELS_SHORT : MEETING_LABELS;
  return map[meeting] ?? meeting;
}
