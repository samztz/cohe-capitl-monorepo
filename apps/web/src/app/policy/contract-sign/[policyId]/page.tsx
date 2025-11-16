'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BrowserProvider } from 'ethers'
import { useAppKitProvider } from '@reown/appkit/react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { API_ENDPOINTS } from '@/api/client'
import * as Utils from '@/utils'

// Environment configuration
const EXPECTED_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97', 10)

// Policy response type (from GET /policy/:id)
interface PolicyResponse {
  id: string
  userId: string
  skuId: string
  walletAddress: string
  premiumAmt: string
  status: 'DRAFT' | 'PENDING_UNDERWRITING' | 'APPROVED_AWAITING_PAYMENT' | 'ACTIVE' | 'REJECTED' | 'EXPIRED_UNPAID' | 'EXPIRED'
  paymentDeadline?: string
  startAt?: string
  endAt?: string
  createdAt: string
  updatedAt: string
  contractHash?: string
}

// Contract sign response type
interface ContractSignResponse {
  contractHash: string
}

export default function ContractSignPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()
  const user = useAuthStore((state) => state.user)
  const { walletProvider } = useAppKitProvider('eip155')

  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const policyId = params.policyId as string

  // Get query params from previous page (form)
  const coverageFromQuery = searchParams.get('coverage') || '0'
  const periodFromQuery = searchParams.get('period') || '90'
  const symbolFromQuery = searchParams.get('symbol') || 'USDT'
  const premiumFromQuery = searchParams.get('premium') || '0'

  // Local state
  const [agreed, setAgreed] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState<string | null>(null)
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)

  // Fetch policy details
  const { data: policy, isLoading: isPolicyLoading, error: policyError } = useQuery({
    queryKey: ['policy', policyId],
    queryFn: async () => {
      const response = await apiClient.get<PolicyResponse>(`${API_ENDPOINTS.POLICIES}/${policyId}`)
      return response.data
    },
    retry: 1,
  })

  // Check current chain ID on mount
  useState(() => {
    if (walletProvider) {
      const ethersProvider = new BrowserProvider(walletProvider as any)
      ethersProvider.getNetwork().then((network) => {
        setCurrentChainId(Number(network.chainId))
      }).catch((err) => {
        console.error('[ContractSign] Failed to get network:', err)
      })
    }
  })

  // Handle contract signing
  const handleSign = useCallback(async () => {
    if (!policy || !user || !walletProvider || !agreed) return

    setIsSigning(true)
    setSignError(null)

    try {
      console.log('[ContractSign] Starting contract signing for policy:', policyId)

      // Step 1: Verify chain ID
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const network = await ethersProvider.getNetwork()
      const chainId = Number(network.chainId)
      setCurrentChainId(chainId)

      if (chainId !== EXPECTED_CHAIN_ID) {
        throw new Error(`Please switch to ${EXPECTED_CHAIN_ID === 97 ? 'BSC Testnet' : 'BSC Mainnet'} (Chain ID: ${EXPECTED_CHAIN_ID})`)
      }

      // Step 2: Construct contract payload (canonical order)
      const contractPayload = {
        policyId: policy.id,
        walletAddress: user.address,
        coverageAmount: coverageFromQuery,
        premiumAmount: policy.premiumAmt, // Use backend value
        termDays: parseInt(periodFromQuery),
        symbol: symbolFromQuery,
        timestamp: Date.now(),
      }

      console.log('[ContractSign] Contract payload:', contractPayload)

      // Step 3: Sign the payload
      const signer = await ethersProvider.getSigner()
      const messageToSign = JSON.stringify(contractPayload)

      console.log('[ContractSign] Requesting signature from wallet...')
      const userSig = await signer.signMessage(messageToSign)
      console.log('[ContractSign] Signature obtained')

      // Step 4: Submit to backend
      const response = await apiClient.post<ContractSignResponse>('/policy/contract-sign', {
        policyId: policy.id,
        contractPayload,
        userSig,
      })

      console.log('[ContractSign] Contract signed successfully, hash:', response.data.contractHash)

      // Step 5: Navigate to detail page
      router.replace(`/policy/detail/${policyId}`)
    } catch (err: any) {
      console.error('[ContractSign] Signing failed:', err)

      // User-friendly error messages
      let errorMessage = 'Contract signing failed. Please try again.'
      if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('denied')) {
        errorMessage = 'Signature request was cancelled'
      } else if (err.message?.includes('chain') || err.message?.includes('Chain')) {
        errorMessage = err.message
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }

      setSignError(errorMessage)
    } finally {
      setIsSigning(false)
    }
  }, [policy, user, walletProvider, agreed, policyId, coverageFromQuery, periodFromQuery, symbolFromQuery, router])

  // Loading skeleton
  if (isChecking || isPolicyLoading) {
    return (
      <div className="min-h-screen bg-[#050816] flex flex-col">
        {/* Header Skeleton */}
        <header className="bg-[#050816] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#374151] rounded animate-pulse" />
            <div className="w-32 h-5 bg-[#374151] rounded animate-pulse" />
          </div>
          <div className="w-24 h-8 bg-[#374151] rounded-full animate-pulse" />
        </header>

        {/* Back Button Skeleton */}
        <div className="px-4 py-3">
          <div className="w-16 h-4 bg-[#374151] rounded animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 px-4 pb-6 max-w-md mx-auto w-full">
          {/* Contract box skeleton */}
          <div className="w-full h-[400px] bg-[#111827] rounded-xl animate-pulse mb-4" />
          {/* Button skeleton */}
          <div className="w-full h-12 bg-[#374151] rounded-xl animate-pulse mb-4" />
          {/* Confirm button skeleton */}
          <div className="w-full h-14 bg-[#374151] rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  // Error loading policy
  if (policyError) {
    return (
      <div className="min-h-screen bg-[#050816] flex flex-col">
        <header className="bg-[#050816] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/cohe-capitl-app-logo.png"
              alt="Cohe Capital Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-white text-sm font-semibold tracking-[1.5px] uppercase">
              COHE.CAPITL
            </span>
          </div>
          <div className="bg-[#FECF4C] text-[#111827] px-4 py-1.5 rounded-full text-xs font-semibold">
            {user?.address ? Utils.formatAddress(user.address) : '0x...'}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-[#111827] rounded-xl p-6 border border-[#1F2937] max-w-md w-full">
            <p className="text-red-500 text-center mb-4">Failed to load policy</p>
            <Link
              href="/my-policies"
              className="block text-center px-4 py-3 bg-[#FECF4C] text-[#111827] rounded-xl hover:brightness-110 transition-all font-semibold text-sm"
            >
              Back to My Policies
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Non-DRAFT status - show status page
  if (policy && policy.status !== 'DRAFT') {
    const statusMessages = {
      PENDING_UNDERWRITING: {
        title: 'Contract Signed',
        message: 'Your policy has been signed and is awaiting review',
        buttonText: 'View Details',
        buttonLink: `/policy/detail/${policyId}`,
      },
      APPROVED_AWAITING_PAYMENT: {
        title: 'Approved',
        message: 'Your policy has been approved. Please proceed to payment',
        buttonText: 'Go to Payment',
        buttonLink: `/policy/payment/${policyId}`,
      },
      ACTIVE: {
        title: 'Active Policy',
        message: 'This policy is already active',
        buttonText: 'View Details',
        buttonLink: `/policy/detail/${policyId}`,
      },
      REJECTED: {
        title: 'Policy Rejected',
        message: 'This policy has been rejected',
        buttonText: 'View Details',
        buttonLink: `/policy/detail/${policyId}`,
      },
      EXPIRED_UNPAID: {
        title: 'Expired (Unpaid)',
        message: 'This policy has expired without payment',
        buttonText: 'View Details',
        buttonLink: `/policy/detail/${policyId}`,
      },
      EXPIRED: {
        title: 'Expired',
        message: 'This policy has expired',
        buttonText: 'View Details',
        buttonLink: `/policy/detail/${policyId}`,
      },
    }

    const statusInfo = statusMessages[policy.status]

    return (
      <div className="min-h-screen bg-[#050816] flex flex-col">
        <header className="bg-[#050816] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/cohe-capitl-app-logo.png"
              alt="Cohe Capital Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-white text-sm font-semibold tracking-[1.5px] uppercase">
              COHE.CAPITL
            </span>
          </div>
          <div className="bg-[#FECF4C] text-[#111827] px-4 py-1.5 rounded-full text-xs font-semibold">
            {user?.address ? Utils.formatAddress(user.address) : '0x...'}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-[#111827] rounded-xl p-6 border border-[#1F2937] max-w-md w-full">
            <h2 className="text-white text-xl font-bold text-center mb-2">{statusInfo.title}</h2>
            <p className="text-[#9CA3AF] text-center mb-6">{statusInfo.message}</p>
            <Link
              href={statusInfo.buttonLink}
              className="block text-center px-4 py-3 bg-[#FECF4C] text-[#111827] rounded-xl hover:brightness-110 transition-all font-semibold text-sm shadow-[0_4px_16px_rgba(254,207,76,0.45)]"
            >
              {statusInfo.buttonText}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // DRAFT status - show signing page
  const isChainCorrect = currentChainId === null || currentChainId === EXPECTED_CHAIN_ID
  const canSign = agreed && isChainCorrect && !isSigning

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col">
      {/* Header */}
      <header className="bg-[#050816] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/cohe-capitl-app-logo.png"
            alt="Cohe Capital Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-white text-sm font-semibold tracking-[1.5px] uppercase">
            COHE.CAPITL
          </span>
        </div>
        <div className="bg-[#FECF4C] text-[#111827] px-4 py-1.5 rounded-full text-xs font-semibold">
          {user?.address ? Utils.formatAddress(user.address) : '0x...'}
        </div>
      </header>

      {/* Back Button */}
      <div className="px-4 py-3">
        <button
          onClick={() => router.back()}
          className="text-white text-xs uppercase tracking-[1.5px] flex items-center gap-1 hover:opacity-80"
        >
          &lt; BACK
        </button>
      </div>

      {/* Content - Max width container for mobile-first design */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto max-w-md mx-auto w-full">
        {/* Contract Content Box */}
        <div className="bg-[#2D3748] rounded-xl p-6 mb-4 h-[400px] overflow-y-auto border border-[#374151]">
          <h2 className="text-white text-lg font-bold mb-4 text-center">Insurance Contract</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Policy ID:</span>
              <span className="text-white font-mono text-xs">{policy?.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Coverage Amount:</span>
              <span className="text-white">{parseFloat(coverageFromQuery).toLocaleString()} {symbolFromQuery}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Premium:</span>
              <span className="text-white">{parseFloat(policy?.premiumAmt || premiumFromQuery).toLocaleString()} {symbolFromQuery}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Term:</span>
              <span className="text-white">{periodFromQuery} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Wallet Address:</span>
              <span className="text-white font-mono text-xs">{user?.address ? Utils.formatAddress(user.address) : ''}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#374151]">
            <p className="text-[#9CA3AF] text-xs leading-relaxed">
              By signing this contract, you agree to the terms and conditions of the insurance policy.
              This includes coverage terms, premium payment obligations, and claim procedures.
              The contract will be cryptographically signed using your wallet and recorded on the blockchain.
            </p>
          </div>
        </div>

        {/* Chain warning */}
        {!isChainCorrect && currentChainId !== null && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-4">
            <p className="text-red-500 text-xs text-center">
              Please switch to {EXPECTED_CHAIN_ID === 97 ? 'BSC Testnet' : 'BSC Mainnet'} (Chain ID: {EXPECTED_CHAIN_ID})
            </p>
          </div>
        )}

        {/* Error message */}
        {signError && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mb-4">
            <p className="text-red-500 text-xs text-center">{signError}</p>
            <button
              onClick={() => setSignError(null)}
              className="w-full mt-2 text-red-500 text-xs hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Confirmation Button */}
        <button
          onClick={() => setAgreed(!agreed)}
          className={`w-full py-3 rounded-xl text-sm font-semibold mb-4 border-2 transition-all ${
            agreed
              ? 'bg-[#5B7C4F] border-[#5B7C4F] text-white'
              : 'bg-transparent border-[#5B7C4F] text-[#5B7C4F]'
          }`}
        >
          Have Read And Confirmed {agreed ? '✓' : ''}
        </button>

        {/* Sign Button */}
        <button
          onClick={handleSign}
          disabled={!canSign}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            canSign
              ? 'bg-[#FECF4C] text-[#111827] hover:brightness-110 shadow-[0_4px_16px_rgba(254,207,76,0.45)]'
              : 'bg-[#374151] text-[#6B7280] cursor-not-allowed'
          }`}
        >
          {isSigning ? 'Signing Contract...' : 'Sign Contract'}
        </button>
      </div>
    </div>
  )
}
