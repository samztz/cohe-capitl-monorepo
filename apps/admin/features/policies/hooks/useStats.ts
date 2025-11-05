import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { StatsResponse } from '../schemas'

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => apiClient.get<StatsResponse>('/api/admin/stats'),
  })
}
