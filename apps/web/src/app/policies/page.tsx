'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { API_ENDPOINTS } from '@/api/client'
import * as Types from '@/types'
import * as Utils from '@/utils'
import Link from 'next/link'

export default function PoliciesPage() {
  const { data: policies, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await apiClient.get<Types.Policy[]>(API_ENDPOINTS.POLICIES)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading policies...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Please connect your wallet to view policies.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Policies</h1>

      <div className="space-y-4">
        {policies?.map((policy) => (
          <div
            key={policy.id}
            className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">Policy #{policy.id.slice(0, 8)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Holder: {Utils.formatAddress(policy.userAddress)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  policy.status === Types.PolicyStatus.ACTIVE
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : policy.status === Types.PolicyStatus.PENDING
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}
              >
                {policy.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                <p className="font-semibold">{Utils.formatCurrency(policy.coverageAmount)} USDT</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Premium</p>
                <p className="font-semibold">{Utils.formatCurrency(policy.premiumAmount)} USDT</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                <p className="font-semibold">
                  {policy.startDate ? Utils.formatDate(policy.startDate, 'MMM D, YYYY') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                <p className="font-semibold">
                  {policy.endDate ? Utils.formatDate(policy.endDate, 'MMM D, YYYY') : 'N/A'}
                </p>
              </div>
            </div>

            <Link
              href={`/policies/${policy.id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>

      {policies?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have any policies yet.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      )}
    </div>
  )
}
