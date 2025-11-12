'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { API_ENDPOINTS } from '@/api/client'
import * as Types from '@/types'
import * as Utils from '@/utils'
import Link from 'next/link'

export default function ProductsPage() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Types.Product[]>(API_ENDPOINTS.PRODUCTS)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Error loading products: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Insurance Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <div
            key={product.id}
            className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {product.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Coverage:</span>
                <span className="font-semibold">
                  {Utils.formatCurrency(product.coverageAmount)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Premium:</span>
                <span className="font-semibold">
                  {Utils.formatCurrency(product.premiumAmount)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Term:</span>
                <span className="font-semibold">{product.termDays} days</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/policy/detail"
                className="flex-1 text-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                View Details
              </Link>
              <Link
                href={`/policy/form/${product.id}`}
                className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Purchase
              </Link>
            </div>
          </div>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="text-center text-gray-600 dark:text-gray-400">
          No products available at the moment.
        </div>
      )}
    </div>
  )
}
