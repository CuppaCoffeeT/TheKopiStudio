/**
 * Singapore tax ladder — oracle corpus.
 *
 * Every expected figure is computed by hand from the published band table, NOT
 * copied from the port. That is the whole value of the file: if someone
 * "simplifies" the band loop, these catch it.
 *
 * Band boundaries: 20k · 30k · 40k · 80k · 120k · 160k · 200k · 240k · 280k ·
 * 320k · 500k · 1M, then 24%.
 */
import { describe, expect, it } from 'vitest';

import {
  computeTax,
  cpfEmployedRelief,
  earnedIncomeRelief,
  grossTax,
  marginalRate,
  seMedisaveRelief,
  wmcrFixed,
  wmcrPercentage,
} from '../singaporeTax';

describe('grossTax — the progressive ladder', () => {
  it('charges nothing on the first $20,000', () => {
    expect(grossTax(0)).toBe(0);
    expect(grossTax(20_000)).toBe(0);
  });

  it('never returns a negative figure for a negative income', () => {
    expect(grossTax(-5_000)).toBe(0);
  });

  it('charges 2% on the 20k–30k band', () => {
    // $5,000 into the band × 2%
    expect(grossTax(25_000)).toBeCloseTo(100, 6);
    expect(grossTax(30_000)).toBeCloseTo(200, 6);
  });

  it('accumulates across bands — $40,000 = $200 + $350', () => {
    expect(grossTax(40_000)).toBeCloseTo(550, 6);
  });

  it('$80,000 = $550 + 40k×7% = $3,350', () => {
    expect(grossTax(80_000)).toBeCloseTo(3_350, 6);
  });

  it('$120,000 = $3,350 + 40k×11.5% = $7,950', () => {
    expect(grossTax(120_000)).toBeCloseTo(7_950, 6);
  });

  it('$320,000 = the sum of every band up to 320k = $44,550', () => {
    // 0 + 200 + 350 + 2800 + 4600 + 6000 + 7200 + 7600 + 7800 + 8000
    expect(grossTax(320_000)).toBeCloseTo(44_550, 6);
  });

  it('$1,000,000 = $44,550 + 180k×22% + 500k×23% = $199,150', () => {
    expect(grossTax(1_000_000)).toBeCloseTo(199_150, 6);
  });

  it('applies 24% above $1,000,000', () => {
    expect(grossTax(1_100_000)).toBeCloseTo(199_150 + 24_000, 6);
  });
});

describe('computeTax — rebate', () => {
  it('gives 60% of gross while that is under the $200 cap', () => {
    // $25,000 chargeable → $100 gross → 60% = $60
    const t = computeTax(25_000);
    expect(t.gross).toBeCloseTo(100, 6);
    expect(t.rebate).toBeCloseTo(60, 6);
    expect(t.net).toBeCloseTo(40, 6);
  });

  it('caps the rebate at $200', () => {
    const t = computeTax(80_000);
    expect(t.gross).toBeCloseTo(3_350, 6);
    expect(t.rebate).toBe(200);
    expect(t.net).toBeCloseTo(3_150, 6);
  });

  it('never turns a rebate into a refund', () => {
    const t = computeTax(20_000);
    expect(t.gross).toBe(0);
    expect(t.rebate).toBe(0);
    expect(t.net).toBe(0);
  });
});

describe('marginalRate', () => {
  it('reads the rate the NEXT dollar attracts, not the average', () => {
    expect(marginalRate(0)).toBe(0);
    expect(marginalRate(19_999)).toBe(0);
    expect(marginalRate(20_000)).toBe(0.02);
    expect(marginalRate(120_000)).toBe(0.15);
    expect(marginalRate(2_000_000)).toBe(0.24);
  });
});

describe('earnedIncomeRelief — age bands', () => {
  it('is $1,000 under 55, $6,000 at 55–59, $8,000 at 60+', () => {
    expect(earnedIncomeRelief(40, 100_000)).toBe(1_000);
    expect(earnedIncomeRelief(54, 100_000)).toBe(1_000);
    expect(earnedIncomeRelief(55, 100_000)).toBe(6_000);
    expect(earnedIncomeRelief(59, 100_000)).toBe(6_000);
    expect(earnedIncomeRelief(60, 100_000)).toBe(8_000);
  });

  it('never exceeds the income it relieves', () => {
    expect(earnedIncomeRelief(65, 3_000)).toBe(3_000);
  });
});

describe('cpfEmployedRelief', () => {
  it('applies the age-banded rate to salary', () => {
    expect(cpfEmployedRelief(30, 60_000)).toBeCloseTo(12_000, 6); // 20%
    expect(cpfEmployedRelief(48, 60_000)).toBeCloseTo(11_400, 6); // 19%
    expect(cpfEmployedRelief(58, 60_000)).toBeCloseTo(8_700, 6); // 14.5%
    expect(cpfEmployedRelief(72, 60_000)).toBeCloseTo(4_500, 6); // 7.5%
  });

  it('caps the base at the $81,600 annual ceiling', () => {
    // Salary far above the ceiling still only relieves 20% of $81,600.
    expect(cpfEmployedRelief(30, 500_000)).toBeCloseTo(16_320, 6);
  });
});

describe('seMedisaveRelief', () => {
  it('is nil at or below $6,000 net trade income', () => {
    expect(seMedisaveRelief(40, 6_000)).toEqual({ amount: 0, capped: false });
  });

  it('applies the age-banded rate below the cap', () => {
    expect(seMedisaveRelief(30, 50_000)).toEqual({ amount: 4_000, capped: false }); // 8%
    expect(seMedisaveRelief(40, 50_000)).toEqual({ amount: 4_500, capped: false }); // 9%
  });

  it('reports the cap when the rate would exceed it', () => {
    const result = seMedisaveRelief(30, 200_000); // 8% = 16,000 > 7,680
    expect(result.amount).toBe(7_680);
    expect(result.capped).toBe(true);
  });

  it('uses the oldest band above 55', () => {
    const result = seMedisaveRelief(60, 200_000); // 10.5% capped at 10,080
    expect(result.amount).toBe(10_080);
    expect(result.capped).toBe(true);
  });
});

describe("Working Mother's Child Relief", () => {
  it('steps $8k / $10k / $12k under the from-2024 regime', () => {
    expect(wmcrFixed(0)).toBe(0);
    expect(wmcrFixed(1)).toBe(8_000);
    expect(wmcrFixed(2)).toBe(18_000); // 8 + 10
    expect(wmcrFixed(3)).toBe(30_000); // 8 + 10 + 12
    expect(wmcrFixed(4)).toBe(42_000);
  });

  it('steps 15% / 20% / 25% of earned income under the pre-2024 regime', () => {
    expect(wmcrPercentage(1, 100_000)).toBeCloseTo(15_000, 6);
    expect(wmcrPercentage(2, 100_000)).toBeCloseTo(35_000, 6);
    expect(wmcrPercentage(3, 100_000)).toBeCloseTo(60_000, 6);
  });

  it('can never exceed 100% of earned income', () => {
    // 5 children would be 110% — clamped to the income itself.
    expect(wmcrPercentage(5, 100_000)).toBeCloseTo(100_000, 6);
  });
});
