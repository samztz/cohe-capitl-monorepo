'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { API_ENDPOINTS } from '@/api/client'
import * as Types from '@/types'
import * as Utils from '@/utils'
import { useState, useEffect } from 'react'

// Token symbol mapping (simple version)
const getTokenSymbol = (tokenAddress: string): string => {
  // BSC USDT address
  if (tokenAddress.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()) {
    return 'USDT'
  }
  // Default to USDT
  return 'USDT'
}

export default function PolicyFormPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()
  const user = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isLoading)

  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const productId = params.productId as string

  // Get product info from URL query (passed from products page)
  const productNameFromQuery = searchParams.get('name') || ''
  const termDaysFromQuery = searchParams.get('termDays') || ''
  const premiumFromQuery = searchParams.get('premium') || ''
  const coverageFromQuery = searchParams.get('coverage') || ''

  // State for submitting
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State to track which field was last edited (for bidirectional binding)
  const [lastEditedField, setLastEditedField] = useState<'amount' | 'cost'>('amount')

  // Fetch product details from API
  const { data: products, isLoading: isProductLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiClient.get<Types.BackendSku[]>(API_ENDPOINTS.PRODUCTS)
      return response.data.map(Utils.mapProduct)
    },
  })

  // Find the specific product
  const product = products?.find((p) => p.id === productId)

  // Calculate max coverage and token symbol
  const maxCoverage = product ? parseFloat(product.coverageAmount) : parseFloat(coverageFromQuery) || 8000000
  const tokenSymbol = product?.tokenAddress ? getTokenSymbol(product.tokenAddress) : 'USDT'

  // Calculate premium rate (premium / coverage)
  const premiumRate = product
    ? parseFloat(product.premiumAmount) / parseFloat(product.coverageAmount)
    : parseFloat(premiumFromQuery) / parseFloat(coverageFromQuery) || 0.01

  // Available period options (default to product termDays)
  const defaultTermDays = product?.termDays || parseInt(termDaysFromQuery) || 90
  const periodOptions = [30, 60, 90, defaultTermDays].filter((v, i, a) => a.indexOf(v) === i) // unique values

  // Form schema with zod
  const formSchema = z.object({
    walletAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address format'),
    insuranceAmount: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Please enter a valid amount',
      })
      .refine((val) => parseFloat(val) <= maxCoverage, {
        message: `Exceeds maximum coverage of ${maxCoverage.toLocaleString()} ${tokenSymbol}`,
      }),
    insuranceCost: z
      .string()
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: 'Please enter a valid cost',
      }),
    insurancePeriodDays: z
      .string()
      .refine((val) => periodOptions.map(String).includes(val), {
        message: 'Invalid insurance period',
      }),
  })

  type FormData = z.infer<typeof formSchema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      walletAddress: user?.address || '',
      insuranceAmount: '',
      insuranceCost: '0',
      insurancePeriodDays: String(defaultTermDays),
    },
  })

  // Auto-fill wallet address when user becomes available
  useEffect(() => {
    if (user?.address) {
      setValue('walletAddress', user.address)
    }
  }, [user?.address, setValue])

  // Watch form values for real-time calculation
  const watchedAmount = watch('insuranceAmount')
  const watchedCost = watch('insuranceCost')
  const watchedPeriod = watch('insurancePeriodDays')

  // Bidirectional calculation: when amount changes, update cost
  useEffect(() => {
    if (lastEditedField === 'amount') {
      const amount = parseFloat(watchedAmount)
      if (!isNaN(amount) && amount > 0 && premiumRate > 0) {
        const calculatedCost = Math.round(amount * premiumRate * 100) / 100
        setValue('insuranceCost', String(calculatedCost), { shouldValidate: true })
      } else {
        setValue('insuranceCost', '0', { shouldValidate: true })
      }
    }
  }, [watchedAmount, lastEditedField, premiumRate, setValue])

  // Bidirectional calculation: when cost changes, update amount
  useEffect(() => {
    if (lastEditedField === 'cost') {
      const cost = parseFloat(watchedCost)
      if (!isNaN(cost) && cost > 0 && premiumRate > 0) {
        const calculatedAmount = Math.round((cost / premiumRate) * 100) / 100
        setValue('insuranceAmount', String(calculatedAmount), { shouldValidate: true })
      } else {
        setValue('insuranceAmount', '', { shouldValidate: true })
      }
    }
  }, [watchedCost, lastEditedField, premiumRate, setValue])

  // Submit handler
  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Debug: Check if token exists
      const token = localStorage.getItem('auth_jwt_token')
      console.log('[PolicyForm] Token exists:', !!token)
      console.log('[PolicyForm] Token preview:', token?.substring(0, 20) + '...')
      console.log('[PolicyForm] User:', user)

      if (!token) {
        throw new Error('No authentication token found. Please log in again.')
      }

      // Create policy via POST /policy with user-specified amounts
      const response = await apiClient.post('/policy', {
        skuId: productId,
        premiumAmt: data.insuranceCost,
        coverageAmt: data.insuranceAmount,
      })

      const { id: policyId } = response.data

      // Navigate to contract sign page with query params for display
      const queryParams = new URLSearchParams({
        coverage: data.insuranceAmount,
        period: data.insurancePeriodDays,
        symbol: tokenSymbol,
        premium: data.insuranceCost,
      })

      router.push(`/policy/contract-sign/${policyId}?${queryParams.toString()}`)
    } catch (error: any) {
      console.error('Failed to create policy:', error)
      alert(error?.response?.data?.message || 'Failed to create policy. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading skeleton
  if (isChecking || isAuthLoading || isProductLoading) {
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
          {/* Title */}
          <div className="w-64 h-6 bg-[#374151] rounded animate-pulse mb-3" />

          {/* Description */}
          <div className="space-y-2 mb-5">
            <div className="w-full h-3 bg-[#374151] rounded animate-pulse" />
            <div className="w-full h-3 bg-[#374151] rounded animate-pulse" />
            <div className="w-3/4 h-3 bg-[#374151] rounded animate-pulse" />
          </div>

          {/* Form Fields */}
          <div className="space-y-3 mb-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#111827] rounded-xl border border-[#1F2937] p-4">
                <div className="w-32 h-3 bg-[#374151] rounded animate-pulse mb-2" />
                <div className="w-full h-10 bg-[#374151] rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Overview Skeleton */}
          <div className="mb-5">
            <div className="w-20 h-4 bg-[#374151] rounded animate-pulse mb-3" />
            <div className="w-full h-40 bg-[#111827] rounded-xl animate-pulse" />
          </div>

          {/* Button */}
          <div className="w-full h-14 bg-[#374151] rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

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
        <Link href="/products" className="text-white text-xs uppercase tracking-[1.5px] flex items-center gap-1 hover:opacity-80">
          &lt; BACK
        </Link>
      </div>

      {/* Content - Max width container for mobile-first design */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto max-w-md mx-auto w-full">
        {/* Title */}
        <h1 className="text-white text-lg font-bold mb-2">
          {product?.name || productNameFromQuery || 'YULILY SHIELD INSURANCE'}
        </h1>

        {/* Description */}
        <div className="text-[#9CA3AF] text-[10px] mb-4 leading-relaxed">
          <p className="mb-1.5">
            A Coinbase Custody Cover claim is valid if Coinbase Custody incurs a loss due to Coin of 10% or more are passed on to all users OR if Coinbase Custody ceases to operate without prior notice and withdrawals are halted continuously for 100 days or more. Members who purchase Coinbase Custody Cover can claim...
          </p>
          <a href="mailto:cohe@gmail.com" className="text-[#FECF4C] underline">
            cohe@gmail.com
          </a>
          <span> Minimum cover purchase of USD is required for cover to avoid.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 mb-4">
          {/* Wallet Address Card (Read-only, auto-filled from auth) */}
          <div className="bg-[#111827] rounded-xl px-4 py-3 border border-[#1F2937]">
            <label className="text-[#9CA3AF] text-xs uppercase tracking-[1.5px] block mb-1.5">
              Insurance Wallet Address
            </label>
            <input
              {...register('walletAddress')}
              type="text"
              placeholder="Enter wallet address"
              readOnly
              disabled
              className="w-full bg-transparent text-white text-sm font-medium border-none p-0 cursor-not-allowed focus:outline-none"
            />
            {errors.walletAddress && (
              <p className="text-red-500 text-xs mt-1">{errors.walletAddress.message}</p>
            )}
          </div>

          {/* Insurance Amount Card (User editable) */}
          <div className="bg-[#111827] rounded-xl px-4 py-3 border border-[#1F2937]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[#9CA3AF] text-xs uppercase tracking-[1.5px]">
                Insurance Amount
              </label>
              <span className="text-[#6B7280] text-[10px]">
                Max: {maxCoverage.toLocaleString()} {tokenSymbol}
              </span>
            </div>
            <div className="relative">
              <input
                {...register('insuranceAmount')}
                type="number"
                step="0.01"
                placeholder="0"
                onChange={(e) => {
                  setLastEditedField('amount')
                  register('insuranceAmount').onChange(e)
                }}
                className="w-full bg-transparent text-white text-2xl font-semibold border-none p-0 pr-8 focus:outline-none placeholder-[#374151] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-[#FECF4C] flex items-center justify-center">
                  <span className="text-[#111827] text-xs font-bold">$</span>
                </div>
              </div>
            </div>
            {errors.insuranceAmount && (
              <p className="text-red-500 text-xs mt-1">{errors.insuranceAmount.message}</p>
            )}
          </div>

          {/* Insurance Cost Card (User editable - bidirectional binding) */}
          <div className="bg-[#111827] rounded-xl px-4 py-3 border border-[#1F2937]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[#9CA3AF] text-xs uppercase tracking-[1.5px]">
                Insurance Cost
              </label>
              <span className="text-[#6B7280] text-[10px]">
                Bidirectional
              </span>
            </div>
            <div className="relative">
              <input
                {...register('insuranceCost')}
                type="number"
                step="0.01"
                placeholder="0"
                onChange={(e) => {
                  setLastEditedField('cost')
                  register('insuranceCost').onChange(e)
                }}
                className="w-full bg-transparent text-white text-2xl font-semibold border-none p-0 pr-8 focus:outline-none placeholder-[#374151] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-[#FECF4C] flex items-center justify-center">
                  <span className="text-[#111827] text-xs font-bold">$</span>
                </div>
              </div>
            </div>
            {errors.insuranceCost && (
              <p className="text-red-500 text-xs mt-1">{errors.insuranceCost.message}</p>
            )}
          </div>

          {/* Insurance Period Card (Read-only display) */}
          <div className="bg-[#111827] rounded-xl px-4 py-3 border border-[#1F2937]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[#9CA3AF] text-xs uppercase tracking-[1.5px]">
                Insurance Period
              </label>
              <span className="text-[#6B7280] text-[10px]">Days</span>
            </div>
            <div className="text-white text-2xl font-semibold">
              {watchedPeriod}
            </div>
          </div>
        </form>

        {/* Overview Section - Real-time sync with form */}
        <div className="mb-4">
          <h2 className="text-white text-sm font-semibold mb-2.5">Overview</h2>
          <div className="bg-[#111827] rounded-xl p-4 space-y-2.5 border border-[#1F2937]">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1F2937]">
              <span className="text-[#9CA3AF] text-xs">Listing</span>
              <div className="flex items-center gap-1.5">
                <Image
                  src="/assets/cohe-capitl-app-logo.png"
                  alt="Logo"
                  width={14}
                  height={14}
                />
                <span className="text-white text-xs font-semibold">COHE.CAPITL</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-xs">Insurance Amount</span>
              <span className="text-white text-xs font-semibold">
                {watchedAmount && !isNaN(parseFloat(watchedAmount)) && parseFloat(watchedAmount) > 0
                  ? `${Math.floor(parseFloat(watchedAmount)).toLocaleString()} ${tokenSymbol}`
                  : `0 ${tokenSymbol}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-xs">Insurance Period</span>
              <span className="text-white text-xs font-semibold">
                2025-09-16 - 2026-05-03
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-xs">Insurance Cost</span>
              <span className="text-white text-xs font-semibold">
                {watchedCost && !isNaN(parseFloat(watchedCost)) && parseFloat(watchedCost) > 0
                  ? `${Math.floor(parseFloat(watchedCost)).toLocaleString()} ${tokenSymbol}`
                  : `0 ${tokenSymbol}`}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-4">
          <h2 className="text-white text-sm font-semibold mb-2.5">Terms & Conditions</h2>
          <div className="bg-[#111827] rounded-xl p-4 space-y-2.5 text-[10px] border border-[#1F2937]">
            <p className="text-white font-semibold mb-1">
              COHE Capitl insurance protects against a loss of funds due to:
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Smart Contract Exploits, Hacks</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Oracle Failure</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Governance Takeovers</span>
              </div>
            </div>
            <p className="text-white font-semibold mt-2.5 mb-1">
              COHE Capitl Insurance has these exclusions, including but limited to
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">A Loss Of Value Of Any Asset (i.e., Depeg Event)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Losses Due To Phishing, Private Key Security Breaches, Malware, Etc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filing a claim */}
        <div className="mb-5">
          <h2 className="text-white text-sm font-semibold mb-2.5">Filing a claim</h2>
          <div className="bg-[#111827] rounded-xl p-4 space-y-1.5 text-[10px] border border-[#1F2937]">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#9CA3AF] mt-1 flex-shrink-0" />
              <span className="text-[#9CA3AF] leading-relaxed">You Must Provide Proof Of Loss When Submitting Your Claim</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-[#9CA3AF] mt-1 flex-shrink-0" />
              <span className="text-[#9CA3AF] leading-relaxed">You Must Provide Proof Of Loss When Submitting Your Claim</span>
            </div>
          </div>
          <p className="text-[#6B7280] text-[9px] mt-2 italic leading-relaxed">
            This cover is not a contract of insurance. Cover is provided on a discretionary basis with Nexus Mutual members having the final say on which claims are paid.
          </p>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
            isSubmitting || Object.keys(errors).length > 0
              ? 'bg-[#374151] text-[#6B7280] cursor-not-allowed'
              : 'bg-[#FECF4C] text-[#111827] hover:brightness-110 shadow-[0_4px_16px_rgba(254,207,76,0.45)]'
          }`}
        >
          {isSubmitting ? 'Creating Policy...' : 'Confirm Insurance'}
        </button>
      </div>
    </div>
  )
}
