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
  activity: (id: string) => [...crmClientsBase.detail(id), 'activity'] as const,
  /** The customer's saved Legacy Map — nests under detail(id) like the others. */
  legacyPlan: (id: string) => [...crmClientsBase.detail(id), 'legacy-plan'] as const,
  /**
   * Journey signals (profiled? last contact?) for ONE page of the Customers
   * list. Keyed by the page's ids so paging is a cache miss, not a refetch of
   * the whole book — and so a client mutation invalidating `.all` clears it.
   */
  signals: (ids: readonly string[]) => [...crmClientsBase.all, 'signals', ids.join(',')] as const,
  /**
   * Owning-advisor names for ONE page of the Customers list — keyed by the
   * distinct owner ids on screen, same page-scoped shape as `signals`. Only
   * fetched for viewers who can see other advisors' customers.
   */
  owners: (ids: readonly string[]) => [...crmClientsBase.all, 'owners', ids.join(',')] as const,
  /**
   * id + name of the viewer's OWN customers, for the Overview tool-shortcut
   * picker. Keyed by advisor because the list is `user_id`-filtered rather than
   * RLS-scoped, and impersonation swaps that advisor without a remount — a
   * shared key would serve the previous advisor's book from cache.
   */
  ownOptions: (userId: string) => [...crmClientsBase.all, 'own-options', userId] as const,
};

const crmDashboardBase = createQueryKeys('crmDashboard');
const crmDashboardKeys = {
  ...crmDashboardBase,
  stats: () => [...crmDashboardBase.all, 'stats'] as const,
  /** Newest saved profiler results feeding the /dashboard "Latest additions" table. */
  recentResults: (limit: number) => [...crmDashboardBase.all, 'recent-results', limit] as const,
  /**
   * The customer-centred Overview action queue (who is waiting on you).
   * Keyed by the advisor whose book it is — the queue is own-book only, and
   * impersonation swaps that advisor without unmounting the page.
   */
  customerQueue: (userId: string) =>
    [...crmDashboardBase.all, 'customer-queue', userId] as const,
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
