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
import { useTranslations } from '@/store/localeStore'

export default function ProductsPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()
  const t = useTranslations()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Types.BackendSku[]>(API_ENDPOINTS.PRODUCTS)
      // Adapt backend SKU to frontend Product type
      return response.data.map(Utils.mapProduct)
    },
  })

  const displayProducts = products || []

  // Show loading screen while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm font-medium">{t.common.checkingAuth}</p>
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
            alt={t.common.coheLogoAlt}
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
          &lt; {t.common.backUpper}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8">
        {/* Title */}
        <h1 className="text-white text-2xl font-bold mb-2">
          {t.products.title}
        </h1>
        <p className="text-[#9CA3AF] text-sm mb-8">
          {t.products.subtitle}
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-[#9CA3AF] py-12">
            {t.products.loading}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-500 text-sm">
              {t.products.loadFailed}
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
              <h2 className="text-white text-lg font-bold mb-4">
                {product.name}
              </h2>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">{t.products.coverage}:</span>
                  <span className="text-white font-semibold">
                    {Utils.formatCurrency(product.coverageAmount)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">{t.products.premium}:</span>
                  <span className="text-white font-semibold">
                    {Utils.formatCurrency(product.premiumAmount)} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#9CA3AF]">{t.products.term}:</span>
                  <span className="text-white font-semibold">{product.termDays} {t.products.days}</span>
                </div>
              </div>

              <Link
                href={`/policy/form/${product.id}?name=${encodeURIComponent(product.name)}&termDays=${product.termDays}&premium=${product.premiumAmount}&coverage=${product.coverageAmount}`}
                className="block text-center px-4 py-3 bg-[#FFD54F] text-[#0F111A] rounded-lg hover:brightness-110 transition-all font-semibold text-sm"
              >
                {t.products.select}
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && displayProducts.length === 0 && (
          <div className="text-center text-[#9CA3AF] py-12">
            {t.products.empty}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
