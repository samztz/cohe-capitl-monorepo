'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'

// Mock data
const mockPolicies = [
  {
    id: '1',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'active',
    coverageAmount: '600',
    premiumAmount: '60',
    startDate: '2025-09-16',
    endDate: '2026-05-03',
    daysRemaining: 89,
  },
  {
    id: '2',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'under_review',
    coverageAmount: '1000',
    premiumAmount: '100',
    startDate: null,
    endDate: null,
    daysRemaining: null,
  },
  {
    id: '3',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'expired',
    coverageAmount: '500',
    premiumAmount: '50',
    startDate: '2024-01-01',
    endDate: '2024-04-01',
    daysRemaining: 0,
  },
]

type PolicyStatus = 'all' | 'active' | 'under_review' | 'expired'

export default function MyPoliciesPage() {
  const [selectedStatus, setSelectedStatus] = useState<PolicyStatus>('all')

  const filteredPolicies =
    selectedStatus === 'all'
      ? mockPolicies
      : mockPolicies.filter((p) => p.status === selectedStatus)

  const statusCounts = {
    all: mockPolicies.length,
    active: mockPolicies.filter((p) => p.status === 'active').length,
    under_review: mockPolicies.filter((p) => p.status === 'under_review').length,
    expired: mockPolicies.filter((p) => p.status === 'expired').length,
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
          0xAB...B064
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-5 pt-4">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-white text-2xl font-bold mb-1">My Policies</h1>
          <p className="text-[#9CA3AF] text-sm">
            View and manage your insurance policies
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'all'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setSelectedStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'active'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            Active ({statusCounts.active})
          </button>
          <button
            onClick={() => setSelectedStatus('under_review')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'under_review'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            Pending ({statusCounts.under_review})
          </button>
          <button
            onClick={() => setSelectedStatus('expired')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              selectedStatus === 'expired'
                ? 'bg-[#FFD54F] text-[#0F111A]'
                : 'bg-[#1A1D2E] text-[#9CA3AF] border border-[#374151]'
            }`}
          >
            Expired ({statusCounts.expired})
          </button>
        </div>

        {/* Policy List */}
        <div className="space-y-3 mb-6">
          {filteredPolicies.map((policy) => (
            <Link
              key={policy.id}
              href={`/policy/detail/${policy.id}`}
              className="block bg-[#1A1D2E] rounded-lg p-4 border border-[#374151] hover:bg-[#2D3748] transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white text-base font-semibold mb-1">
                    {policy.productName}
                  </h3>
                  <p className="text-[#9CA3AF] text-xs">ID: #{policy.id}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
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

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[#9CA3AF] text-xs mb-1">Coverage</div>
                  <div className="text-white text-sm font-semibold">
                    {policy.coverageAmount} USDC
                  </div>
                </div>
                <div>
                  <div className="text-[#9CA3AF] text-xs mb-1">Premium</div>
                  <div className="text-white text-sm font-semibold">
                    {policy.premiumAmount} USDC
                  </div>
                </div>
              </div>

              {/* Period */}
              {policy.startDate && policy.endDate && (
                <div className="mb-2">
                  <div className="text-[#9CA3AF] text-xs mb-1">Period</div>
                  <div className="text-white text-xs">
                    {policy.startDate} - {policy.endDate}
                  </div>
                </div>
              )}

              {/* Progress Bar for Active Policies */}
              {policy.status === 'active' && policy.daysRemaining !== null && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#9CA3AF] text-xs">Time Remaining</span>
                    <span className="text-[#FFD54F] text-xs font-semibold">
                      {policy.daysRemaining} days
                    </span>
                  </div>
                  <div className="w-full bg-[#374151] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FFD54F] h-full rounded-full transition-all"
                      style={{ width: `${(policy.daysRemaining / 90) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* View Details Arrow */}
              <div className="mt-3 flex items-center justify-end">
                <span className="text-[#FFD54F] text-xs font-semibold flex items-center gap-1">
                  View Details
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
          ))}
        </div>

        {/* Empty State */}
        {filteredPolicies.length === 0 && (
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
            <h3 className="text-white text-lg font-semibold mb-2">No Policies Found</h3>
            <p className="text-[#9CA3AF] text-sm mb-4">
              {selectedStatus === 'all'
                ? "You don't have any policies yet"
                : `No ${selectedStatus.replace('_', ' ')} policies`}
            </p>
            {selectedStatus === 'all' && (
              <Link
                href="/products"
                className="inline-block bg-[#FFD54F] text-[#0F111A] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
              >
                Browse Products
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
