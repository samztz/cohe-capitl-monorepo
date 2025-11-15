'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRequireAuth } from '@/hooks/useRequireAuth'

// Mock policy data - will be replaced with API call later
const mockPolicyData: Record<string, any> = {
  '1': {
    id: '1',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'active',
    coverageAmount: '600',
    premiumAmount: '60',
    startDate: '2025-09-16',
    endDate: '2026-05-03',
    daysRemaining: 89,
    walletAddress: '0xABCD...B064',
    policyNumber: 'POL-2025-001',
    blockchain: 'BSC',
    token: 'USDT',
    transactionHash: '0x1234...5678',
  },
  '2': {
    id: '2',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'under_review',
    coverageAmount: '1000',
    premiumAmount: '100',
    startDate: null,
    endDate: null,
    daysRemaining: null,
    walletAddress: '0xABCD...B064',
    policyNumber: 'POL-2025-002',
    blockchain: 'BSC',
    token: 'USDT',
    transactionHash: '0xabcd...efgh',
  },
  '3': {
    id: '3',
    productName: 'YULIY SHIELD INSURANCE',
    status: 'expired',
    coverageAmount: '500',
    premiumAmount: '50',
    startDate: '2024-01-01',
    endDate: '2024-04-01',
    daysRemaining: 0,
    walletAddress: '0xABCD...B064',
    policyNumber: 'POL-2024-001',
    blockchain: 'BSC',
    token: 'USDT',
    transactionHash: '0x9876...5432',
  },
}

export default function PolicyDetailPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()

  const params = useParams()
  const router = useRouter()
  const policyId = params.id as string

  const policy = mockPolicyData[policyId]

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

  if (!policy) {
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
            0xAB...B064
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <h1 className="text-white text-xl font-bold mb-2">Policy Not Found</h1>
            <p className="text-[#9CA3AF] text-sm mb-4">
              The policy you're looking for doesn't exist.
            </p>
            <Link
              href="/my-policies"
              className="inline-block bg-[#FFD54F] text-[#0F111A] px-6 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
            >
              Back to My Policies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-500'
      case 'under_review':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'expired':
        return 'bg-gray-500/20 text-gray-500'
      default:
        return 'bg-gray-500/20 text-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'under_review':
        return 'Pending Review'
      case 'expired':
        return 'Expired'
      default:
        return status
    }
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
          {policy.walletAddress}
        </div>
      </header>

      {/* Back Button */}
      <div className="px-5 py-4">
        <Link href="/my-policies" className="text-white text-sm flex items-center gap-2 hover:opacity-80">
          &lt; BACK
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Title and Status */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-white text-2xl font-bold flex-1">
              {policy.productName}
            </h1>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
              {getStatusLabel(policy.status)}
            </div>
          </div>
          <p className="text-[#9CA3AF] text-sm">Policy #{policy.policyNumber}</p>
        </div>

        {/* Coverage Overview Card */}
        <div className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151] mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Coverage Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">Coverage Amount</span>
              <span className="text-white text-lg font-bold">{policy.coverageAmount} {policy.token}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">Premium Paid</span>
              <span className="text-white text-sm font-semibold">{policy.premiumAmount} {policy.token}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">Blockchain</span>
              <span className="text-white text-sm font-semibold">{policy.blockchain}</span>
            </div>
          </div>
        </div>

        {/* Period Information */}
        {policy.startDate && policy.endDate && (
          <div className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151] mb-6">
            <h2 className="text-white text-lg font-semibold mb-4">Coverage Period</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF] text-sm">Start Date</span>
                <span className="text-white text-sm font-semibold">{policy.startDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF] text-sm">End Date</span>
                <span className="text-white text-sm font-semibold">{policy.endDate}</span>
              </div>
              {policy.status === 'active' && policy.daysRemaining !== null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9CA3AF] text-sm">Days Remaining</span>
                    <span className="text-[#FFD54F] text-sm font-semibold">{policy.daysRemaining} days</span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-[#374151] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FFD54F] h-full rounded-full transition-all"
                        style={{ width: `${(policy.daysRemaining / 90) * 100}%` }}
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
          <h2 className="text-white text-lg font-semibold mb-4">Transaction Details</h2>
          <div className="space-y-3">
            <div>
              <div className="text-[#9CA3AF] text-xs mb-1">Wallet Address</div>
              <div className="text-white text-sm font-mono break-all">{policy.walletAddress}</div>
            </div>
            <div>
              <div className="text-[#9CA3AF] text-xs mb-1">Transaction Hash</div>
              <div className="text-white text-sm font-mono break-all">{policy.transactionHash}</div>
            </div>
          </div>
        </div>

        {/* Policy Status Information */}
        {policy.status === 'under_review' && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-yellow-500 text-sm font-semibold mb-1">Pending Review</h3>
                <p className="text-yellow-500/80 text-xs">
                  Your policy is currently under review. We'll notify you once it's approved and active.
                </p>
              </div>
            </div>
          </div>
        )}

        {policy.status === 'expired' && (
          <div className="bg-gray-500/10 border border-gray-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-gray-500 text-sm font-semibold mb-1">Policy Expired</h3>
                <p className="text-gray-500/80 text-xs">
                  This policy has expired. You can purchase a new policy to continue coverage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Document */}
        <div className="bg-[#1A1D2E] rounded-lg p-6 border border-[#374151] mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Policy Contract</h2>
          <button className="w-full bg-[#2D3748] text-white px-4 py-3 rounded-lg border border-[#374151] hover:bg-[#374151] transition-all flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-semibold">Download Contract (PDF)</span>
          </button>
        </div>

        {/* Action Buttons */}
        {policy.status === 'active' && (
          <div className="space-y-3">
            <button className="w-full bg-[#FFD54F] text-[#0F111A] px-6 py-4 rounded-lg font-semibold text-sm hover:brightness-110 transition-all">
              File a Claim
            </button>
            <button className="w-full bg-[#1A1D2E] text-white px-6 py-4 rounded-lg font-semibold text-sm border border-[#374151] hover:bg-[#2D3748] transition-all">
              Contact Support
            </button>
          </div>
        )}

        {policy.status === 'expired' && (
          <Link
            href="/products"
            className="block w-full bg-[#FFD54F] text-[#0F111A] px-6 py-4 rounded-lg font-semibold text-sm hover:brightness-110 transition-all text-center"
          >
            Purchase New Policy
          </Link>
        )}

        {policy.status === 'under_review' && (
          <button className="w-full bg-[#1A1D2E] text-white px-6 py-4 rounded-lg font-semibold text-sm border border-[#374151] hover:bg-[#2D3748] transition-all">
            Contact Support
          </button>
        )}
      </div>
    </div>
  )
}
