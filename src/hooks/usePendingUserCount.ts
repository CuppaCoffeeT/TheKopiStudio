import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';

export const usePendingUserCount = () => {
  const query = useQuery({
    queryKey: queryKeys.people.unapprovedUsers(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unapproved_users_with_metadata');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  return {
    ...query,
    pendingUsers: Array.isArray(query.data) ? query.data.length : 0,
  };
};
