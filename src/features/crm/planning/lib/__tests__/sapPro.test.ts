/**
 * SAP PRO — golden corpus.
 *
 * `fixtures/sapProGolden.json` is what the advisor's own
 * `income-illustrator2.html` DISPLAYED for nine input sets: the page's script
 * was run unmodified in jsdom, the inputs driven through its real controls
 * (tier / rate buttons, the flat field, the +250 stepper, the month grid and
 * "Fill all months"), and every rendered string read back — hints, equation,
 * year bars (incl. segment widths), grand total and all 39 table rows.
 *
 * The port is faithful, not "improved": if a line here moves, the React tool
 * now tells a recruit a different number from the sheet the advisor checked.
 * To regenerate after the advisor revises the sheet, re-run the same harness
 * against the new HTML and replace the fixture wholesale.
 */
import { describe, expect, it } from 'vitest';

import { money } from '../format';
import {
  averageMonth,
  barWidths,
  bonusLabel,
  equationTitle,
  grandTotal,
  monthTableRows,
  payHint,
  quarterText,
  tierHint,
  yearNote,
} from '../sapProCopy';
import { illustrateIncome, incomeSupport, monthlyBases, parseAmount, type SapTier } from '../sapProMath';
import golden from './fixtures/sapProGolden.json';

interface GoldenInput {
  tier: SapTier;
  rate: number;
  custom: boolean;
  flat?: number;
  months?: number[];
  year: number;
}

describe.each(golden.map((c) => [c.name, c] as const))('%s', (_name, { input, expected }) => {
  const i = input as GoldenInput;
  const flat = i.flat ?? 0;
  const result = illustrateIncome(i.tier, i.rate, monthlyBases(i.custom, flat, i.months ?? []));
  const y = averageMonth(result.years[i.year - 1]);

  it('hints', () => {
    expect(tierHint(i.tier)).toBe(expected.tierHint);
    const hint = payHint(i.tier, flat, i.custom);
    expect(hint?.text ?? '').toBe(expected.payHint);
    expect(hint?.warn ?? false).toBe(expected.payWarn);
  });

  it('equation for the chosen year', () => {
    expect(equationTitle(i.custom, i.year)).toBe(expected.eqTitle);
    expect(bonusLabel(i.tier, i.year)).toBe(expected.eBonL);
    expect([money(y.base), money(y.support), money(y.bonus), money(y.total)]).toEqual([
      expected.eBase,
      expected.eSup,
      expected.eBon,
      expected.eTot,
    ]);
    expect(quarterText(y.quarterBase, i.rate)).toBe(expected.qText);
    expect(money(y.quarterly)).toBe(expected.qAmt);
  });

  it('year bars and the three-year total', () => {
    const widths = barWidths(result.years);
    expect(
      result.years.map((s, index) => ({
        note: yearNote(index, i.tier),
        total: money(s.total),
        breakdown: `Base ${money(s.base)} · Monthly bonus ${money(s.bonus)} · Quarterly bonus ${money(s.quarterly)} · Support ${money(s.support)}`,
        widths: widths[index].map(parseFloat),
      })),
      // The browser serialises style widths ("0.00%" reads back "0%"), so
      // compare the numbers the page set, not the strings it echoed.
    ).toEqual(expected.years.map((row) => ({ ...row, widths: row.widths.map(parseFloat) })));
    expect(money(grandTotal(result.years))).toBe(expected.grand);
  });

  it('every month, with the year subtotals', () => {
    expect(monthTableRows(result).map((r) => [r.label, ...r.cells.map(money)])).toEqual(expected.rows);
  });
});

describe('incomeSupport — the tier edges', () => {
  it.each([
    [1000, 12, 200, 200],
    [1000, 12, 199, 0],
    [1000, 13, 5000, 0],
    [5000, 3, 500, 400],
    [5000, 4, 500, 0],
    [5000, 4, 1250, 1000],
    [5000, 24, 6250, 5000],
    [5000, 25, 6250, 0],
    [10000, 1, 99999, 10000],
  ] as const)('tier %i, month %i, base %i → %i', (tier, month, base, paid) => {
    expect(incomeSupport(tier, month, base)).toBe(paid);
  });
});

describe('parseAmount — the sheet’s num + round', () => {
  it.each([
    ['3000', 3000],
    ['1234.6', 1235],
    ['', 0],
    ['-250', 0],
    ['abc', 0],
    [-5, 0],
  ] as const)('%s → %i', (raw, value) => {
    expect(parseAmount(raw)).toBe(value);
  });
});
