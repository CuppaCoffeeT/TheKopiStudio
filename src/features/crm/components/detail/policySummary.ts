/**
 * The two text lines a policy card prints — coverage tiers and premium.
 * Split from PoliciesTab (200-LOC ceiling) when v42 made the premium line
 * Shield-aware. Pure; formatting only, sums come from lib.
 */

import { formatCurrency } from '@/utils/currencyHelper';
import { formatCoverage } from '../../lib/finance';
import { hospitalShieldPremiums } from '../../lib/financeReport';
import type { CrmPolicy } from '../../types';

/** Hospitalization plans show their ward class; everything else the coverage tiers. */
export function coverageSummary(policy: CrmPolicy): string {
  if (policy.isHospitalization) return policy.hospitalType || '—';
  const parts: string[] = [];
  if (Number(policy.coverageAmount) > 0) parts.push(`Death ${formatCoverage(Number(policy.coverageAmount))}`);
  if (Number(policy.tpdCoverage) > 0) parts.push(`TPD ${formatCoverage(Number(policy.tpdCoverage))}`);
  if (Number(policy.criticalIllnessCoverage) > 0) parts.push(`CI ${formatCoverage(Number(policy.criticalIllnessCoverage))}`);
  if (Number(policy.earlyCriticalIllnessCoverage) > 0) parts.push(`ECI ${formatCoverage(Number(policy.earlyCriticalIllnessCoverage))}`);
  return parts.length > 0 ? parts.join(' · ') : 'No coverage recorded';
}

/**
 * v42: a Shield plan's premium lives in its own fields (the main premium is
 * not used), always annual; the breakdown says what Medisave vs cash pays.
 * A zero premium reads "not recorded" rather than "$0.00".
 */
export function premiumSummary(policy: CrmPolicy): { line: string; detail?: string } {
  if (policy.isHospitalization) {
    const s = hospitalShieldPremiums(policy);
    if (s.totalAnnual <= 0) return { line: 'Premium not recorded' };
    const parts = [
      s.cpf > 0 ? `Medisave ${formatCurrency(s.cpf)}` : '',
      s.cashOutlay > 0 ? `Cash ${formatCurrency(s.cashOutlay)}` : '',
    ].filter(Boolean);
    return { line: `Premium ${formatCurrency(s.totalAnnual)} / Annual`, detail: parts.join(' · ') };
  }
  const premium = Number(policy.premium) || 0;
  return { line: premium > 0 ? `Premium ${formatCurrency(premium)} / ${policy.frequency}` : 'Premium not recorded' };
}
