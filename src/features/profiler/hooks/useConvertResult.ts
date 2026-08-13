/**
 * useConvertResult — convert a saved result into a client record.
 *
 * THREE modes, because a blind INSERT was creating duplicate people. The
 * default `auto` mode asks `findClientByName` first: on a hit it resolves
 * `{ kind: 'duplicate' }` and mutates nothing, leaving the caller to show the
 * choice ("link to the customer you already have" vs "create a second one").
 * `link` and `create` are the two answers, and both are explicit — the hook
 * never silently picks for the advisor, because both outcomes are legitimate
 * (a genuine second customer with the same name does happen).
 *
 * Non-atomic retry semantics (REPORTS_LINK_PRD P4): when the client INSERT
 * succeeded but the result link failed, `ConvertLinkError` carries the new
 * client id and it is kept in hook state — the next mutate() calls
 * `relinkResultToClient` with the kept id instead of inserting a duplicate
 * client. Success invalidates the profilerResults detail + lists (the row now
 * carries `client_id`) plus the crmClients lists and crmDashboard family via
 * the SHARED queryKeys factory (not a cross-feature import), then navigates
 * to the client.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import {
  ConvertLinkError,
  convertResultToClient,
  findClientByName,
  relinkResultToClient,
  type LinkableClient,
} from '../api/convertService';
import type { ProfilerResult } from '../types';

/** What the caller asks for. `auto` is the one the Convert button fires. */
export type ConvertMode =
  | { mode: 'auto' }
  | { mode: 'create' }
  | { mode: 'link'; clientId: string };

type ConvertOutcome =
  | { kind: 'converted'; clientId: string; linkedExisting: boolean }
  | { kind: 'duplicate'; client: LinkableClient };

export function useConvertResult(result: ProfilerResult | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  /** Set when `auto` found an existing customer — drives the choice modal. */
  const [duplicate, setDuplicate] = useState<LinkableClient | null>(null);

  const mutation = useMutation<ConvertOutcome, Error, ConvertMode>({
    mutationFn: async (request) => {
      if (!result) throw new Error('The result is still loading — try again in a moment');
      if (!user) throw new Error('You must be signed in to convert a result');

      // Retry after a half-done convert: the client exists, only the link is
      // missing. Takes precedence — re-asking about duplicates here would
      // offer to create a THIRD record.
      if (createdClientId) {
        await relinkResultToClient(result.id, createdClientId);
        return { kind: 'converted', clientId: createdClientId, linkedExisting: false };
      }

      if (request.mode === 'link') {
        await relinkResultToClient(result.id, request.clientId);
        return { kind: 'converted', clientId: request.clientId, linkedExisting: true };
      }

      if (request.mode === 'auto') {
        const existing = await findClientByName(result.prospect_name, user.id);
        if (existing) return { kind: 'duplicate', client: existing };
      }

      const clientId = await convertResultToClient(result, user.id);
      return { kind: 'converted', clientId, linkedExisting: false };
    },
    onSuccess: (outcome) => {
      if (outcome.kind === 'duplicate') {
        setDuplicate(outcome.client);
        return;
      }
      setDuplicate(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.profilerResults.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.profilerResults.detail(result?.id ?? ''),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmClients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.crmDashboard.all });
      showSuccess(
        outcome.linkedExisting ? 'Linked to customer' : 'Client created',
        outcome.linkedExisting
          ? 'This profile now sits on the customer record you already had.'
          : 'This result is now linked to the new client record.',
      );
      navigate(`/clients/${outcome.clientId}`);
    },
    onError: (error: Error) => {
      if (error instanceof ConvertLinkError) setCreatedClientId(error.createdClientId);
      showError('Failed to convert result', error);
    },
  });

  return {
    ...mutation,
    /** The existing same-name customer `auto` found, or null. */
    duplicate,
    dismissDuplicate: () => setDuplicate(null),
    linkToExisting: (clientId: string) => mutation.mutate({ mode: 'link', clientId }),
    createAnyway: () => mutation.mutate({ mode: 'create' }),
  };
}
