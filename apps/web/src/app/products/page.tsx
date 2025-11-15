'use client'

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { API_ENDPOINTS } from '@/api/client'
import * as Types from '@/types'
import * as Utils from '@/utils'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function ProductsPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Types.Product[]>(API_ENDPOINTS.PRODUCTS)
      return response.data
    },
  })

  // Mock product for display if API fails
  const mockProducts = [
    {
      id: 'mock-1',
      name: 'YULIY SHIELD INSURANCE',
      description: 'Coverage for Coinbase Custody claims',
      coverageAmount: '10000',
      premiumAmount: '100',
      termDays: 90,
    }
  ]

  const displayProducts = products || mockProducts

  // Show loading screen while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm font-medium">Checking auth...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F111A] flex flex-col">
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/cohe-capitl-app-logo.png"
            alt="Cohe Capital Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-white text-base font-semibold tracking-wide">
            COHE.CAPITL
          </span>
        </div>
        <div className="bg-[#FFD54F] text-[#0F111A] px-4 py-1.5 rounded-lg text-sm font-semibold h-8 flex items-center">
          0xAB...B064
        </div>
      </header>

      {/* Back Button */}
      <div className="px-5 py-4">
        <Link href="/" className="text-white text-sm flex items-center gap-2 hover:opacity-80">
          &lt; BACK
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8">
        {/* Title */}
        <h1 className="text-white text-2xl font-bold mb-2">
          Insurance Products
        </h1>
        <p className="text-[#9CA3AF] text-sm mb-8">
          Select an insurance product
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-[#9CA3AF] py-12">
            Loading products...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-500 text-sm">
              Error loading products. Showing mock data.
            </p>
          </div>
        )}

        {/* Product Cards */}
        <div className="space-y-4">
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151]"
            >
              <h2 className="text-white text-lg font-bold mb-2">
                {product.name}
              </h2>
              <p className="text-[#9CA3AF] text-sm mb-4">
                {product.description}
              </p>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Coverage:</span>
                  <span className="text-white font-semibold">
                    {Utils.formatCurrency(product.coverageAmount)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Premium:</span>
                  <span className="text-white font-semibold">
                    {Utils.formatCurrency(product.premiumAmount)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">Term:</span>
                  <span className="text-white font-semibold">{product.termDays} days</span>
                </div>
              </div>

              <Link
                href={`/policy/form/${product.id}`}
                className="block text-center px-4 py-3 bg-[#FFD54F] text-[#0F111A] rounded-lg hover:brightness-110 transition-all font-semibold text-sm"
              >
                Select
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && displayProducts.length === 0 && (
          <div className="text-center text-[#9CA3AF] py-12">
            No products available at the moment.
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
