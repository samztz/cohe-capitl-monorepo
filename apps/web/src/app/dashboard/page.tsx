'use client'

import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useCurrentUser } from '@/store/authStore'

// Mock data - 后续会从API获取
const mockPolicies = [
  {
    id: '1',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'active',
    coverageAmount: '600',
    premiumAmount: '60',
    endDate: '2026-05-03',
    daysRemaining: 89,
  },
  {
    id: '2',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'under_review',
    coverageAmount: '1000',
    premiumAmount: '100',
    endDate: null,
    daysRemaining: null,
  },
]

const stats = {
  activePolicies: 1,
  totalCoverage: 600,
  underReview: 1,
}

export default function DashboardPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()
  const user = useCurrentUser()

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

  // Format user address for display
  const displayAddress = user?.address
    ? `${user.address.slice(0, 4)}...${user.address.slice(-4)}`
    : '0xAB...B064'

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
          {displayAddress}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">
            Dashboard
          </h1>
          <p className="text-[#9CA3AF] text-sm">
            Welcome back! Here's your insurance overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151]">
            <div className="text-[#9CA3AF] text-xs mb-1">Active</div>
            <div className="text-white text-2xl font-bold">{stats.activePolicies}</div>
          </div>
          <div className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151]">
            <div className="text-[#9CA3AF] text-xs mb-1">Coverage</div>
            <div className="text-white text-xl font-bold">{stats.totalCoverage}</div>
            <div className="text-[#9CA3AF] text-[10px]">USDC</div>
          </div>
          <div className="bg-[#1A1D2E] rounded-lg p-4 border border-[#374151]">
            <div className="text-[#9CA3AF] text-xs mb-1">Pending</div>
            <div className="text-white text-2xl font-bold">{stats.underReview}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-white text-lg font-semibold mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/products"
              className="bg-[#FFD54F] text-[#0F111A] rounded-lg p-4 flex flex-col items-center justify-center hover:brightness-110 transition-all"
            >
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-semibold text-sm">Buy Insurance</span>
            </Link>
            <Link
              href="/my-policies"
              className="bg-[#1A1D2E] text-white rounded-lg p-4 flex flex-col items-center justify-center border border-[#374151] hover:bg-[#2D3748] transition-all"
            >
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold text-sm">My Policies</span>
            </Link>
          </div>
        </div>

        {/* Recent Policies */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-semibold">
              Recent Policies
            </h2>
            <Link href="/my-policies" className="text-[#FFD54F] text-sm hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {mockPolicies.map((policy) => (
              <Link
                key={policy.id}
                href={`/policy/detail/${policy.id}`}
                className="block bg-[#1A1D2E] rounded-lg p-4 border border-[#374151] hover:bg-[#2D3748] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-white text-sm font-semibold mb-1">
                      {policy.productName}
                    </h3>
                    <p className="text-[#9CA3AF] text-xs">
                      Coverage: {policy.coverageAmount} USDC
                    </p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      policy.status === 'active'
                        ? 'bg-green-500/20 text-green-500'
                        : policy.status === 'under_review'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {policy.status === 'active'
                      ? 'Active'
                      : policy.status === 'under_review'
                      ? 'Pending'
                      : 'Expired'}
                  </div>
                </div>
                {policy.status === 'active' && policy.daysRemaining && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-[#374151] h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FFD54F] h-full"
                        style={{ width: `${(policy.daysRemaining / 90) * 100}%` }}
                      />
                    </div>
                    <span className="text-[#9CA3AF] text-xs whitespace-nowrap">
                      {policy.daysRemaining} days left
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {mockPolicies.length === 0 && (
          <div className="bg-[#1A1D2E] rounded-lg p-8 border border-[#374151] text-center">
            <div className="w-16 h-16 bg-[#2D3748] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              No Policies Yet
            </h3>
            <p className="text-[#9CA3AF] text-sm mb-4">
              Get started by purchasing your first insurance policy
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#FFD54F] text-[#0F111A] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
