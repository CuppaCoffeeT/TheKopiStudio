/**
 * Money and percentage formatting for the planning tools.
 *
 * Separate from `components/PlanningAtoms` because these are pure functions:
 * exporting them beside components trips `react-refresh/only-export-components`
 * on every other export in that file.
 *
 * Money is WHOLE-DOLLAR here on purpose — these are projections over decades,
 * and cents imply a precision the assumptions do not have. Where an exact
 * figure matters (a premium, a balance) the CRM's `formatCurrency` with its two
 * decimals is the right call instead.
 */

/** Whole dollars, en-SG grouping — "$1,234". */
export function money(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-SG')}`;
}

/** Whole dollars with an explicit minus for deductions — "−$1,234". */
export function moneyNegative(amount: number): string {
  return `−$${Math.round(Math.abs(amount)).toLocaleString('en-SG')}`;
}

/** One percentage, trimmed of a trailing ".0" — "12.5%" / "7%". */
export function percent(value: number, dp = 1): string {
  return `${value.toFixed(dp).replace(/\.0+$/, '')}%`;
}
