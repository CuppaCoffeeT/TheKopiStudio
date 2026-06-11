/**
 * Users list query — URL-driven params (search/page/rowsPerPage/tab) are part
 * of the query key so every distinct view is cached independently and
 * `keepPreviousData` keeps the table stable while a new page/tab loads.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import { getUsersPaginated, type UsersListParams } from '../api/usersService';

export function useUsersList(params: UsersListParams) {
  return useQuery({
    queryKey: queryKeys.users.list({
      search: params.search,
      page: params.page,
      rowsPerPage: params.rowsPerPage,
      tab: params.tab,
    }),
    queryFn: () => getUsersPaginated(params),
    placeholderData: keepPreviousData,
  });
}
