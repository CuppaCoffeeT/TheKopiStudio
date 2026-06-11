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

const peopleKeys = {
  ...peopleBase,
  unapprovedUsers: () => [...peopleBase.all, 'unapproved'] as const,
  pendingUsers: () => [...peopleBase.all, 'pending'] as const,
};

export const queryKeys = {
  users: usersKeys,
  people: peopleKeys,
  modules: modulesKeys,
  notifications: notificationsKeys,
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
