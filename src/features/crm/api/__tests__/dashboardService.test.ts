/**
 * computeDashboardStats unit tests — the PRD-documented divergence: the
 * "annual premium" tile uses the CORRECT annualised formula (frequency
 * multiplier + ILP inclusion percent via `summariseClient`), not the legacy
 * raw sum; follow-ups count ALL strictly-future dates (no window).
 */

import { describe, expect, it } from 'vitest';
import { computeDashboardStats } from '../dashboardService';

const policies = [
  // Monthly 250 → 3000 annualised
  {
    premium: 250,
    frequency: 'Monthly',
    status: 'Active',
    is_investment_linked: false,
    ilp_premium_inclusion_percent: 0,
  },
  // ILP Quarterly 1000 → 4000 × 50% = 2000
  {
    premium: 1000,
    frequency: 'Quarterly',
    status: 'Active',
    is_investment_linked: true,
    ilp_premium_inclusion_percent: 50,
  },
  // Lapsed Semi-Annual 600 → 1200 (still in the premium sum, not Active count)
  {
    premium: 600,
    frequency: 'Semi-Annual',
    status: 'Lapsed',
    is_investment_linked: false,
    ilp_premium_inclusion_percent: 0,
  },
];

describe('computeDashboardStats', () => {
  it('annualises premiums (frequency × ILP percent) and counts Active only', () => {
    const refDate = new Date('2026-06-11T04:00:00Z');
    const stats = computeDashboardStats(7, policies, [], refDate);

    expect(stats.totalClients).toBe(7);
    expect(stats.activePolicies).toBe(2);
    expect(stats.totalAnnualPremium).toBe(3000 + 2000 + 1200);
    expect(stats.upcomingFollowUps).toBe(0);
  });

  it('counts ALL strictly-future follow-ups — today and the past never count', () => {
    const refDate = new Date('2026-06-11T04:00:00Z');
    const stats = computeDashboardStats(0, [], [
      '2026-06-10', // past
      '2026-06-11', // today (UTC midnight ≤ refDate instant) — excluded
      '2026-06-12', // tomorrow
      '2027-01-01', // far future (no window)
      null, // cleared follow-up
    ], refDate);

    expect(stats.upcomingFollowUps).toBe(2);
  });

  it('treats a 0-percent ILP as excluded from the premium total', () => {
    const stats = computeDashboardStats(1, [
      {
        premium: 500,
        frequency: 'Monthly',
        status: 'Active',
        is_investment_linked: true,
        ilp_premium_inclusion_percent: 0,
      },
    ], [], new Date('2026-06-11T04:00:00Z'));

    expect(stats.totalAnnualPremium).toBe(0);
    expect(stats.activePolicies).toBe(1);
  });
});
