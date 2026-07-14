/**
 * Centralized Query Key Factories (generic base).
 *
 * MANDATORY: All React Query keys MUST be defined here — never hardcode key
 * arrays in components/hooks (see .claude/rules/react-query.md).
 *
 * Hierarchical structure per entity:
 *   all          → ['entity']
 *   lists()      → ['entity', 'list']
 *   list(filters)→ ['entity', 'list', { ...filters }]
 *   details()    → ['entity', 'detail']
 *   detail(id)   → ['entity', 'detail', id]
 *
 * This base ships only the foundation entities (users / people / modules /
 * notifications). Add a new entity with `createQueryKeys('entityName')` and
 * register it on the `queryKeys` object below.
 */

export type QueryFilters = Record<string, unknown>;

/** Build the canonical 5-method key factory for an entity. */
export function createQueryKeys(entity: string) {
  const all = [entity] as const;
  return {
    all,
    lists: () => [...all, 'list'] as const,
    list: (filters: QueryFilters = {}) => [...all, 'list', filters] as const,
    details: () => [...all, 'detail'] as const,
    detail: (id: string) => [...all, 'detail', id] as const,
  };
}

const usersKeys = createQueryKeys('users');
const peopleBase = createQueryKeys('people');
const modulesKeys = createQueryKeys('modules');
const notificationsKeys = createQueryKeys('notifications');
const profilerResultsKeys = createQueryKeys('profilerResults');
const crmClientsBase = createQueryKeys('crmClients');

const peopleKeys = {
  ...peopleBase,
  unapprovedUsers: () => [...peopleBase.all, 'unapproved'] as const,
  pendingUsers: () => [...peopleBase.all, 'pending'] as const,
};

/**
 * CRM child collections (policies / interactions / bank history) nest under
 * `detail(id)` so a single `invalidateQueries({ queryKey: detail(id) })`
 * refetches the client AND every per-client child list (CRM_MODULE_PRD.md P3).
 */
const crmClientsKeys = {
  ...crmClientsBase,
  policies: (id: string) => [...crmClientsBase.detail(id), 'policies'] as const,
  interactions: (id: string) => [...crmClientsBase.detail(id), 'interactions'] as const,
  bankHistory: (id: string) => [...crmClientsBase.detail(id), 'bank-history'] as const,
  linkedResults: (id: string) => [...crmClientsBase.detail(id), 'linked-results'] as const,
  /** Batched "has a linked profiler result" flags for one page of client ids (/dashboard progress widget). */
  profiledFlags: (clientIds: string[]) => [...crmClientsBase.all, 'profiled-flags', clientIds] as const,
};

const crmDashboardBase = createQueryKeys('crmDashboard');
const crmDashboardKeys = {
  ...crmDashboardBase,
  stats: () => [...crmDashboardBase.all, 'stats'] as const,
};

const crmPortfolioBase = createQueryKeys('crmPortfolio');
const crmPortfolioKeys = {
  ...crmPortfolioBase,
  /** The /crm-reports book-wide report payload (REPORTS_LINK_PRD.md P3). */
  report: () => [...crmPortfolioBase.all, 'report'] as const,
};

export const queryKeys = {
  users: usersKeys,
  people: peopleKeys,
  modules: modulesKeys,
  notifications: notificationsKeys,
  profilerResults: profilerResultsKeys,
  crmClients: crmClientsKeys,
  crmDashboard: crmDashboardKeys,
  crmPortfolio: crmPortfolioKeys,
} as const;

// ---------------------------------------------------------------------------
// Debug / test helpers
// ---------------------------------------------------------------------------

/** True when `queryKey` starts with every element of `pattern`. */
export function matchesQueryKey(queryKey: unknown[], pattern: readonly unknown[]): boolean {
  if (queryKey.length < pattern.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    if (queryKey[i] !== pattern[i]) return false;
  }
  return true;
}

/** Human-readable description of a query key (debugging aid). */
export function describeQueryKey(queryKey: unknown[]): string {
  const [entity, type, ...rest] = queryKey;
  if (!type) return `${entity} (all)`;
  if (type === 'list') return `${entity} list${rest.length > 0 ? ' with filters' : ''}`;
  if (type === 'detail') return `${entity} detail ${rest[0] || ''}`.trim();
  return queryKey.join(' > ');
}
