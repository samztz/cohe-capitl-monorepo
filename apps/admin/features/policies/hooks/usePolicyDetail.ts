import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { Policy, ReviewRequest } from '../schemas'

export function usePolicyDetail(id: string) {
  return useQuery({
    queryKey: ['policy', id],
    queryFn: () => apiClient.get<Policy>(`/api/admin/policies/${id}`),
    enabled: !!id,
  })
}

export function useReviewPolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewRequest }) =>
      apiClient.patch<Policy>(`/api/admin/policies/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['policy', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
