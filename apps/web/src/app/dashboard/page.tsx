'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useCurrentUser } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { useTranslations } from '@/store/localeStore'
import dayjs from 'dayjs'

interface PolicyData {
  id: string
  skuId: string
  walletAddress: string
  premiumAmt: string
  coverageAmt: string
  status: string
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
}

interface CountdownData {
  policyId: string
  status: string
  daysRemaining: number
  secondsRemaining: number
}

export default function DashboardPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()
  const user = useCurrentUser()
  const t = useTranslations()

  // State for policies data
  const [policies, setPolicies] = useState<PolicyData[]>([])
  const [countdowns, setCountdowns] = useState<Map<string, CountdownData>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user policies
  useEffect(() => {
    if (!user || isChecking) return

    async function fetchPolicies() {
      try {
        setIsLoading(true)
        const response = await apiClient.get<PolicyData[]>('/policy/my/list')
        setPolicies(response.data)

        // Fetch countdowns for active policies
        const countdownPromises = response.data
          .filter((p) => p.status === 'ACTIVE')
          .map(async (p) => {
            try {
              const countdownRes = await apiClient.get<CountdownData>(
                `/policy/${p.id}/countdown`
              )
              return [p.id, countdownRes.data] as const
            } catch (err) {
              console.error(`Failed to fetch countdown for ${p.id}:`, err)
              return null
            }
          })

        const countdownResults = await Promise.all(countdownPromises)
        const newCountdowns = new Map(
          countdownResults.filter((r): r is [string, CountdownData] => r !== null)
        )
        setCountdowns(newCountdowns)
      } catch (error) {
        console.error('Failed to fetch policies:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPolicies()
  }, [user, isChecking])

  // Calculate stats from real data
  const stats = {
    activePolicies: policies.filter((p) => p.status === 'ACTIVE').length,
    totalCoverage: policies
      .filter((p) => p.status === 'ACTIVE')
      .reduce((sum, p) => sum + parseFloat(p.coverageAmt || '0'), 0),
    underReview: policies.filter((p) => p.status === 'PENDING_UNDERWRITING').length,
  }

  // Show loading screen while checking authentication or fetching data
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm font-medium">
            {isChecking ? t.common.checkingAuth : t.dashboard.loadingPolicies}
          </p>
        </div>
      </div>
    )
  }

  // Format user address for display
  const displayAddress = user?.address
    ? `${user.address.slice(0, 4)}...${user.address.slice(-4)}`
    : '0xAB...B064'

  // Get status display text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return t.policies.active
      case 'PENDING_UNDERWRITING':
        return t.policies.pending
      case 'APPROVED_AWAITING_PAYMENT':
        return t.policies.awaitingPayment
      case 'REJECTED':
        return t.policies.rejected
      case 'EXPIRED':
      case 'EXPIRED_UNPAID':
        return t.policies.expired
      default:
        return status
    }
  }

  // Get status color classes
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-500'
      case 'PENDING_UNDERWRITING':
      case 'APPROVED_AWAITING_PAYMENT':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'REJECTED':
        return 'bg-red-500/20 text-red-500'
      default:
        return 'bg-gray-500/20 text-gray-500'
    }
  }

  // Get recent policies (last 5, sorted by creation date)
  const recentPolicies = [...policies]
    .sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix())
    .slice(0, 5)

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
          {displayAddress}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">
            {t.dashboard.title}
          </h1>
          <p className="text-[#9CA3AF] text-sm">
            {t.dashboard.welcomeBack}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151]">
            <div className="text-[#9CA3AF] text-xs mb-1">{t.dashboard.active}</div>
            <div className="text-white text-2xl font-bold">{stats.activePolicies}</div>
          </div>
          <div className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151]">
            <div className="text-[#9CA3AF] text-xs mb-1">{t.dashboard.coverage}</div>
            <div className="text-white text-xl font-bold">{stats.totalCoverage}</div>
            <div className="text-[#9CA3AF] text-[10px]">USDC</div>
          </div>
          <div className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151]">
            <div className="text-[#9CA3AF] text-xs mb-1">{t.dashboard.pending}</div>
            <div className="text-white text-2xl font-bold">{stats.underReview}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">
            {t.dashboard.quickActions}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/products"
              className="bg-[#FFD54F] text-[#0F111A] rounded-lg p-4 flex flex-col items-center justify-center hover:brightness-110 transition-all"
            >
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-semibold text-sm">{t.dashboard.buyInsurance}</span>
            </Link>
            <Link
              href="/my-policies"
              className="bg-[#1A1D2E] text-white rounded-lg p-4 flex flex-col items-center justify-center border border-[#374151] hover:bg-[#2D3748] transition-all"
            >
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold text-sm">{t.dashboard.myPolicies}</span>
            </Link>
          </div>
        </div>

        {/* Recent Policies */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-semibold">
              {t.dashboard.recentPolicies}
            </h2>
            {policies.length > 0 && (
              <Link href="/my-policies" className="text-[#FFD54F] text-sm hover:underline">
                {t.dashboard.viewAll}
              </Link>
            )}
          </div>

          {recentPolicies.length > 0 ? (
            <div className="space-y-3">
              {recentPolicies.map((policy) => {
                const countdown = countdowns.get(policy.id)
                const daysRemaining = countdown?.daysRemaining || 0
                const maxDays = 90 // Assuming 90 days term, could be dynamic from SKU

                return (
                  <Link
                    key={policy.id}
                    href={`/policy/detail/${policy.id}`}
                    className="block bg-[#1A1D2E] rounded-lg p-4 border border-[#374151] hover:bg-[#2D3748] transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-white text-sm font-semibold mb-1">
                          {t.dashboard.policyItemPrefix}{policy.id.slice(0, 8)}
                        </h3>
                        <p className="text-[#9CA3AF] text-xs">
                          {t.dashboard.coverage}: {parseFloat(policy.coverageAmt).toLocaleString()} USDC
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClass(policy.status)}`}>
                        {getStatusDisplay(policy.status)}
                      </div>
                    </div>
                    {policy.status === 'ACTIVE' && countdown && daysRemaining > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-[#374151] h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-[#FFD54F] h-full transition-all"
                            style={{ width: `${Math.min((daysRemaining / maxDays) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[#9CA3AF] text-xs whitespace-nowrap">
                          {t.dashboard.daysLeft.replace('{days}', daysRemaining.toString())}
                        </span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-[#1A1D2E] rounded-lg p-8 border border-[#374151] text-center">
              <div className="w-16 h-16 bg-[#2D3748] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">
                {t.dashboard.emptyTitle}
              </h3>
              <p className="text-[#9CA3AF] text-sm mb-4">
                {t.dashboard.emptySubtitle}
              </p>
              <Link
                href="/products"
                className="inline-block bg-[#FFD54F] text-[#0F111A] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
              >
                {t.common.browseProducts}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
