import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { PoliciesResponse } from '../schemas'

interface UsePoliciesParams {
  status?: string
  q?: string
  page?: number
  limit?: number
}

export function usePolicies(params: UsePoliciesParams = {}) {
  const { status, q, page = 1, limit = 20 } = params

  return useQuery({
    queryKey: ['policies', status, q, page, limit],
    queryFn: () =>
      apiClient.get<PoliciesResponse>('/api/admin/policies', {
        status,
        q,
        page,
        limit,
      }),
  })
}
