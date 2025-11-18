'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useTranslations } from '@/store/localeStore'

interface Policy {
  id: string
  skuId: string
  walletAddress: string
  premiumAmt: string
  coverageAmt: string
  status: string
  contractHash?: string
  startAt?: string
  endAt?: string
  paymentDeadline?: string
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  chainId: number
  tokenAddress: string
  premiumAmt: string
  coverageAmt: string
  termDays: number
}

type PolicyStatus = 'all' | 'ACTIVE' | 'PENDING_UNDERWRITING' | 'EXPIRED' | 'APPROVED_AWAITING_PAYMENT'

// Map backend status to filter category
const getFilterCategory = (status: string): PolicyStatus => {
  switch (status) {
    case 'ACTIVE':
      return 'ACTIVE'
    case 'PENDING_UNDERWRITING':
      return 'PENDING_UNDERWRITING'
    case 'APPROVED_AWAITING_PAYMENT':
      return 'APPROVED_AWAITING_PAYMENT'
    case 'EXPIRED':
    case 'EXPIRED_UNPAID':
    case 'REJECTED':
      return 'EXPIRED'
    default:
      return 'PENDING_UNDERWRITING'
  }
}

export default function MyPoliciesPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()
  const user = useAuthStore((state) => state.user)
  const t = useTranslations()

  const [policies, setPolicies] = useState<Policy[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<PolicyStatus>('all')

  // Map backend status to display label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return t.policies.active
      case 'PENDING_UNDERWRITING':
        return t.policies.pending
      case 'APPROVED_AWAITING_PAYMENT':
        return t.policies.awaitingPayment
      case 'EXPIRED':
      case 'EXPIRED_UNPAID':
        return t.policies.expired
      case 'REJECTED':
        return t.policies.rejected
      default:
        return status
    }
  }

  useEffect(() => {
    if (!isChecking && user) {
      loadPolicies()
      loadProducts()
    }
  }, [isChecking, user])

  async function loadPolicies() {
    try {
      setLoading(true)
      setError('')
      const response = await apiClient.get<Policy[]>('/policy/my/list')
      setPolicies(response.data)
    } catch (err: any) {
      console.error('[My Policies] Load error:', err)
      setError(err.response?.data?.message || t.policies.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    try {
      const response = await apiClient.get<Product[]>('/products')
      setProducts(response.data)
    } catch (err) {
      console.error('[My Policies] Products load error:', err)
    }
  }

  // Get product name by SKU ID
  const getProductName = (skuId: string) => {
    const product = products.find((p) => p.id === skuId)
    return product?.name || 'Insurance Policy'
  }

  // Calculate days remaining for active policies
  const calculateDaysRemaining = (endAt?: string) => {
    if (!endAt) return null
    const end = new Date(endAt)
    const now = new Date()
    const diffMs = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const filteredPolicies =
    selectedStatus === 'all'
      ? policies
      : policies.filter((p) => getFilterCategory(p.status) === selectedStatus)

  const statusCounts = {
    all: policies.length,
    ACTIVE: policies.filter((p) => p.status === 'ACTIVE').length,
    PENDING_UNDERWRITING: policies.filter(
      (p) => p.status === 'PENDING_UNDERWRITING'
    ).length,
    APPROVED_AWAITING_PAYMENT: policies.filter((p) => p.status === 'APPROVED_AWAITING_PAYMENT').length,
    EXPIRED: policies.filter(
      (p) =>
        p.status === 'EXPIRED' || p.status === 'EXPIRED_UNPAID' || p.status === 'REJECTED'
    ).length,
  }

  // Show loading screen while checking authentication
  if (isChecking || !user) {
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
    <div className="min-h-screen bg-[#0F111A] flex flex-col pb-20">
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
          {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-4">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">{t.policies.myPolicies}</h1>
          <p className="text-[#9CA3AF] text-sm">
            {t.policies.myPoliciesSubtitle}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={loadPolicies}
              className="mt-2 text-red-500 text-xs font-semibold underline"
            >
              {t.common.retry}
            </button>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'all'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            {t.policies.all} ({statusCounts.all})
          </button>
          <button
            onClick={() => setSelectedStatus('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'ACTIVE'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            {t.policies.active} ({statusCounts.ACTIVE})
          </button>
          <button
            onClick={() => setSelectedStatus('PENDING_UNDERWRITING')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'PENDING_UNDERWRITING'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            {t.policies.pending} ({statusCounts.PENDING_UNDERWRITING})
          </button>
          <button
            onClick={() => setSelectedStatus('APPROVED_AWAITING_PAYMENT')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'APPROVED_AWAITING_PAYMENT'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            {t.policies.awaitingPayment} ({statusCounts.APPROVED_AWAITING_PAYMENT})
          </button>
          <button
            onClick={() => setSelectedStatus('EXPIRED')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'EXPIRED'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            {t.policies.ended} ({statusCounts.EXPIRED})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151] animate-pulse"
              >
                <div className="h-4 bg-[#374151] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[#374151] rounded w-1/2 mb-2" />
                <div className="h-4 bg-[#374151] rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Policy List */}
        {!loading && (
          <div className="space-y-3 mb-6">
            {filteredPolicies.map((policy) => {
              const daysRemaining = calculateDaysRemaining(policy.endAt)
              const totalDays = products.find((p) => p.id === policy.skuId)?.termDays || 90

              return (
                <Link
                  key={policy.id}
                  href={`/policy/detail/${policy.id}`}
                  className="block bg-[#1A1D2E] rounded-lg p-4 border border-[#374151] hover:bg-[#2D3748] transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white text-base font-semibold mb-1">
                        {getProductName(policy.skuId)}
                      </h3>
                      <p className="text-[#9CA3AF] text-xs break-all">
                        {t.policies.idPrefix}{policy.id}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        policy.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-500'
                          : policy.status === 'PENDING_UNDERWRITING'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : policy.status === 'APPROVED_AWAITING_PAYMENT'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-gray-500/20 text-gray-500'
                      }`}
                    >
                      {getStatusLabel(policy.status)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[#9CA3AF] text-xs mb-1">{t.policies.coverage}</div>
                      <div className="text-white text-sm font-semibold">
                        {policy.coverageAmt} USDT
                      </div>
                    </div>
                    <div>
                      <div className="text-[#9CA3AF] text-xs mb-1">{t.policies.premium}</div>
                      <div className="text-white text-sm font-semibold">
                        {policy.premiumAmt} USDT
                      </div>
                    </div>
                  </div>

                  {/* Period */}
                  {policy.startAt && policy.endAt && (
                    <div className="mb-2">
                      <div className="text-[#9CA3AF] text-xs mb-1">{t.policies.period}</div>
                      <div className="text-white text-xs">
                        {new Date(policy.startAt).toLocaleDateString()} -{' '}
                        {new Date(policy.endAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Progress Bar for Active Policies */}
                  {policy.status === 'ACTIVE' && daysRemaining !== null && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#9CA3AF] text-xs">{t.policies.timeRemaining}</span>
                        <span className="text-[#FFD54F] text-xs font-semibold">
                          {daysRemaining} {t.common.days}
                        </span>
                      </div>
                      <div className="w-full bg-[#374151] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#FFD54F] h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (daysRemaining / totalDays) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* View Details Arrow */}
                  <div className="mt-3 flex items-center justify-end">
                    <span className="text-[#FFD54F] text-xs font-semibold flex items-center gap-1">
                      {t.policies.viewDetails}
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPolicies.length === 0 && (
          <div className="bg-[#1A1D2E] rounded-lg p-8 border border-[#374151] text-center">
            <div className="w-16 h-16 bg-[#2D3748] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#9CA3AF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">{t.policies.emptyTitle}</h3>
            <p className="text-[#9CA3AF] text-sm mb-4">
              {selectedStatus === 'all'
                ? t.policies.emptyNone
                : t.policies.emptyNoneWithFilter.replace('{status}', getStatusLabel(selectedStatus))}
            </p>
            {selectedStatus === 'all' && (
              <Link
                href="/products"
                className="inline-block bg-[#FFD54F] text-[#0F111A] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
              >
                {t.common.browseProducts}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
