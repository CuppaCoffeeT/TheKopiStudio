/**
 * useClientDetail — one client + its child collections, each on its own
 * sub-key under `crmClients.detail(id)` so a single detail(id) invalidation
 * refetches everything together (child-mutation contract, CRM_MODULE_PRD.md).
 *
 * `client.data === null` after a successful fetch means missing, soft-deleted
 * OR RLS-hidden — the page renders not-found for all three (indistinguishable
 * by design). Child queries are RLS-scoped the same way and resolve empty —
 * including `linkedResults` (REPORTS_LINK_PRD P4), where the legacy results
 * policy prunes linked-but-foreign rows to an empty list (neutral empty state
 * downstream).
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { listBankHistoryByClient } from '../api/bankService';
import { getClientById } from '../api/clientsService';
import { listInteractionsByClient } from '../api/interactionsService';
import { listLinkedResultsByClient } from '../api/linkedResultsService';
import { listPoliciesByClient } from '../api/policiesService';

export function useClientDetail(id: string | undefined) {
  const clientId = id ?? '';
  const enabled = Boolean(id);

  const client = useQuery({
    queryKey: queryKeys.crmClients.detail(clientId),
    queryFn: () => getClientById(clientId),
    enabled,
  });

  const policies = useQuery({
    queryKey: queryKeys.crmClients.policies(clientId),
    queryFn: () => listPoliciesByClient(clientId),
    enabled,
  });

  const interactions = useQuery({
    queryKey: queryKeys.crmClients.interactions(clientId),
    queryFn: () => listInteractionsByClient(clientId),
    enabled,
  });

  const bankHistory = useQuery({
    queryKey: queryKeys.crmClients.bankHistory(clientId),
    queryFn: () => listBankHistoryByClient(clientId),
    enabled,
  });

  const linkedResults = useQuery({
    queryKey: queryKeys.crmClients.linkedResults(clientId),
    queryFn: () => listLinkedResultsByClient(clientId),
    enabled,
  });

  return { client, policies, interactions, bankHistory, linkedResults };
}
