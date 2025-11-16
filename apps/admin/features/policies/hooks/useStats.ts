import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { StatsResponse } from '../schemas'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      // Use dedicated stats endpoint
      const stats = await apiClient.get<StatsResponse>('/admin/stats')
      return stats
    },
  })
}
