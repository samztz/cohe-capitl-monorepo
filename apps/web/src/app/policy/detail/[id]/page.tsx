'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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

// Status label function moved to component to use t

export default function PolicyDetailPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()
  const user = useAuthStore((state) => state.user)
  const t = useTranslations()

  const params = useParams()
  const router = useRouter()
  const policyId = params.id as string

  const [policy, setPolicy] = useState<Policy | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  // Get status display text
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
    if (!isChecking && user && policyId) {
      loadPolicy()
    }
  }, [isChecking, user, policyId])

  async function loadPolicy() {
    try {
      setLoading(true)
      setError('')

      const response = await apiClient.get<Policy>(`/policy/${policyId}`)
      const policyData = response.data
      setPolicy(policyData)

      // Load product information
      const productsResponse = await apiClient.get<Product[]>('/products')
      const products = productsResponse.data
      const productData = products.find((p) => p.id === policyData.skuId)
      setProduct(productData || null)

      // Calculate days remaining for active policies
      if (policyData.status === 'ACTIVE' && policyData.endAt) {
        const end = new Date(policyData.endAt)
        const now = new Date()
        const diffMs = end.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        setDaysRemaining(Math.max(0, diffDays))
      }
    } catch (err: any) {
      console.error('[Policy Detail] Load error:', err)
      setError(err.response?.data?.message || t.policyDetail.errorLoadingTitle)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-500'
      case 'PENDING_UNDERWRITING':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'APPROVED_AWAITING_PAYMENT':
        return 'bg-blue-500/20 text-blue-500'
      case 'EXPIRED':
      case 'EXPIRED_UNPAID':
      case 'REJECTED':
        return 'bg-gray-500/20 text-gray-500'
      default:
        return 'bg-gray-500/20 text-gray-500'
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm font-medium">{t.policyDetail.loading}</p>
        </div>
      </div>
    )
  }

  if (!policy || error) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex flex-col">
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
            {user.address?.slice(0, 6)}...{user.address?.slice(-4)}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <h1 className="text-white text-xl font-bold mb-2">
              {error ? t.policyDetail.errorLoadingTitle : t.policyDetail.notFoundTitle}
            </h1>
            <p className="text-[#9CA3AF] text-sm mb-4">
              {error || t.policyDetail.notFoundSubtitle}
            </p>
            <Link
              href="/my-policies"
              className="inline-block bg-[#FFD54F] text-[#0F111A] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
            >
              {t.policyDetail.backToMyPolicies}
            </Link>
          </div>
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
          {policy.walletAddress.slice(0, 6)}...{policy.walletAddress.slice(-4)}
        </div>
      </header>

      {/* Back Button */}
      <div className="px-5 py-4">
        <Link
          href="/my-policies"
          className="text-white text-sm flex items-center gap-2 hover:opacity-80"
        >
          &lt; {t.common.backUpper}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Title and Status */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-white text-2xl font-bold flex-1">
              {product?.name || t.policyDetail.productFallbackName}
            </h1>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
              {getStatusLabel(policy.status)}
            </div>
          </div>
          <p className="text-[#9CA3AF] text-sm break-all">{t.policyDetail.policyIdPrefix}{policy.id}</p>
        </div>

        {/* Coverage Overview Card */}
        <div className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151] mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">{t.policyDetail.coverageOverview}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">{t.policyDetail.coverageAmount}</span>
              <span className="text-white text-lg font-bold">{policy?.coverageAmt || '0'} USDT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">{t.policyDetail.premiumPaid}</span>
              <span className="text-white text-sm font-semibold">{policy.premiumAmt} USDT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">{t.policyDetail.blockchain}</span>
              <span className="text-white text-sm font-semibold">
                {product?.chainId === 56 ? 'BSC' : product?.chainId === 97 ? 'BSC Testnet' : `Chain ${product?.chainId}`}
              </span>
            </div>
          </div>
        </div>

        {/* Period Information */}
        {policy.startAt && policy.endAt && (
          <div className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151] mb-6">
            <h2 className="text-white text-lg font-semibold mb-4">{t.policyDetail.coveragePeriod}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF] text-sm">{t.policyDetail.startDate}</span>
                <span className="text-white text-sm font-semibold">
                  {new Date(policy.startAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF] text-sm">{t.policyDetail.endDate}</span>
                <span className="text-white text-sm font-semibold">
                  {new Date(policy.endAt).toLocaleDateString()}
                </span>
              </div>
              {policy.status === 'ACTIVE' && daysRemaining !== null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF] text-sm">{t.policyDetail.daysRemaining}</span>
                    <span className="text-[#FFD54F] text-sm font-semibold">{daysRemaining} {t.policyDetail.days}</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-[#374151] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FFD54F] h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (daysRemaining / (product?.termDays || 90)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Transaction Information */}
        <div className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151] mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">{t.policyDetail.txDetails}</h2>
          <div className="space-y-3">
            <div>
              <div className="text-[#9CA3AF] text-xs mb-1">{t.policyDetail.walletAddress}</div>
              <div className="text-white text-sm font-mono break-all">{policy.walletAddress}</div>
            </div>
            {policy.contractHash && (
              <div>
                <div className="text-[#9CA3AF] text-xs mb-1">{t.policyDetail.contractHash}</div>
                <div className="text-white text-sm font-mono break-all">{policy.contractHash}</div>
              </div>
            )}
            <div>
              <div className="text-[#9CA3AF] text-xs mb-1">{t.policyDetail.createdAt}</div>
              <div className="text-white text-sm">
                {new Date(policy.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Policy Status Information */}
        {policy.status === 'PENDING_UNDERWRITING' && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="text-yellow-500 text-sm font-semibold mb-1">{t.policyDetail.pendingTitle}</h3>
                <p className="text-yellow-500/80 text-xs">
                  {t.policyDetail.pendingMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {policy.status === 'APPROVED_AWAITING_PAYMENT' && (
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-blue-500 text-sm font-semibold mb-1">{t.policyDetail.awaitingPaymentTitle}</h3>
                <p className="text-blue-500/80 text-xs mb-2">
                  {t.policyDetail.awaitingPaymentMessage}
                </p>
                {policy.paymentDeadline && (
                  <p className="text-blue-500/60 text-xs">
                    {t.policyDetail.paymentDeadlinePrefix}{new Date(policy.paymentDeadline).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(policy.status === 'EXPIRED' || policy.status === 'EXPIRED_UNPAID') && (
          <div className="bg-gray-500/10 border border-gray-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-gray-500 text-sm font-semibold mb-1">{t.policyDetail.expiredTitle}</h3>
                <p className="text-gray-500/80 text-xs">
                  {t.policyDetail.expiredMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {policy.status === 'REJECTED' && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-red-500 text-sm font-semibold mb-1">{t.policyDetail.rejectedTitle}</h3>
                <p className="text-red-500/80 text-xs">
                  {t.policyDetail.rejectedMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Document */}
        {policy.contractHash && (
          <div className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151] mb-6">
            <h2 className="text-white text-lg font-semibold mb-4">{t.policyDetail.contractTitle}</h2>
            <button className="w-full bg-[#2D3748] text-white px-4 py-3 rounded-lg border border-[#374151] hover:bg-[#374151] transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-semibold">{t.policyDetail.downloadContract}</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {policy.status === 'ACTIVE' && (
          <div className="space-y-3">
            <button className="w-full bg-[#FFD54F] text-[#0F111A] px-6 py-4 rounded-lg font-semibold text-sm hover:brightness-110 transition-all">
              {t.policyDetail.fileClaim}
            </button>
            <button className="w-full bg-[#1A1D2E] text-white px-6 py-4 rounded-lg font-semibold text-sm border border-[#374151] hover:bg-[#2D3748] transition-all">
              {t.policyDetail.contactSupport}
            </button>
          </div>
        )}

        {policy.status === 'APPROVED_AWAITING_PAYMENT' && (
          <Link
            href={`/policy/payment/${policy.id}`}
            className="block w-full bg-[#FFD54F] text-[#0F111A] px-6 py-4 rounded-lg font-semibold text-sm hover:brightness-110 transition-all text-center"
          >
            {t.policyDetail.completePayment}
          </Link>
        )}

        {(policy.status === 'EXPIRED' || policy.status === 'EXPIRED_UNPAID') && (
          <Link
            href="/products"
            className="block w-full bg-[#FFD54F] text-[#0F111A] px-6 py-4 rounded-lg font-semibold text-sm hover:brightness-110 transition-all text-center"
          >
            {t.policyDetail.purchaseNew}
          </Link>
        )}

        {policy.status === 'PENDING_UNDERWRITING' && (
          <button className="w-full bg-[#1A1D2E] text-white px-6 py-4 rounded-lg font-semibold text-sm border border-[#374151] hover:bg-[#2D3748] transition-all">
            {t.policyDetail.contactSupport}
          </button>
        )}
      </div>
    </div>
  )
}
