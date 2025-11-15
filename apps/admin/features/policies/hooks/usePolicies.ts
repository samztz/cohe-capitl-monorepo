import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { PoliciesResponse } from '../schemas'

interface UsePoliciesParams {
  status?: string
  q?: string
  page?: number
  pageSize?: number
}

export function usePolicies(params: UsePoliciesParams = {}) {
  const { status, q, page = 1, pageSize = 20 } = params

  return useQuery({
    queryKey: ['policies', status, q, page, pageSize],
    queryFn: () =>
      apiClient.get<PoliciesResponse>('/admin/policies', {
        status,
        q,
        page,
        pageSize,
      }),
  })
}
