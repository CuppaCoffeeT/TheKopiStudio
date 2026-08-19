/**
 * useQueueRowAction — the single action each Overview queue row offers.
 *
 * Whatever the customer's chain says comes next, falling back to opening the
 * record. Split out of `DashboardHomePage` because it is a ROUTING decision
 * about one customer, not page layout — and because it is the only place that
 * has to get the profiler entry contract right.
 *
 * `/profiler` is checked for the "Start profiler" branch only: never advertise
 * a route the guard would then refuse.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { QueueCustomer } from '../api/customerQueueService';
import type { QueueRowAction } from '../components/CustomerQueueSection';
import { PROFILER_PATH, profilerHrefFor } from '../lib/profilerEntry';

export function useQueueRowAction(): (customer: QueueCustomer) => QueueRowAction {
  const navigate = useNavigate();
  const { modules } = useAuth();
  const canProfile = modules.some((mod) => mod.path === PROFILER_PATH);

  return useCallback(
    (customer: QueueCustomer): QueueRowAction => {
      if (customer.journey.nextStep === 'profiler' && canProfile) {
        // Carry BOTH halves of the entry contract: the name so the advisor
        // never retypes it, and the id so the saved profile lands ON this
        // customer. Name-only sent the advisor back to a row that still said
        // "never profiled" after they had just profiled them.
        return { label: 'Start profiler', onClick: () => navigate(profilerHrefFor(customer)) };
      }
      if (customer.journey.nextStep === 'info') {
        return { label: 'Complete info', onClick: () => navigate(`/clients/${customer.id}`) };
      }
      return { label: 'Open', onClick: () => navigate(`/clients/${customer.id}`) };
    },
    [canProfile, navigate],
  );
}
