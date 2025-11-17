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

// Token logo mapping based on tokenSymbol from SKU
const getTokenLogo = (tokenSymbol: string): string => {
  const symbol = tokenSymbol.toUpperCase()
  switch (symbol) {
    case 'USDT':
      return '/assets/usdt.svg'
    case 'BNB':
      return '/assets/bnb.svg'
    case 'TBNB':
      return '/assets/bnb.svg'
    default:
      return '/assets/usdt.svg' // Default to USDT logo
  }
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
  const tokenSymbol = product?.tokenSymbol || 'USDT'
  const tokenLogo = getTokenLogo(tokenSymbol)

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
        const calculatedCost = amount * premiumRate
        // Keep precision to 6 decimal places, then trim unnecessary zeros
        const formattedCost = parseFloat(calculatedCost.toFixed(6))
        setValue('insuranceCost', String(formattedCost), { shouldValidate: true })
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
        const calculatedAmount = cost / premiumRate
        // Keep precision to 6 decimal places, then trim unnecessary zeros
        const formattedAmount = parseFloat(calculatedAmount.toFixed(6))
        setValue('insuranceAmount', String(formattedAmount), { shouldValidate: true })
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
      <header className="bg-[#050816] px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/assets/cohe-capitl-app-logo.png"
            alt="Cohe Capital Logo"
            width={40}
            height={40}
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
          <span className="text-white text-sm sm:text-base lg:text-lg font-semibold tracking-[1.5px] uppercase">
            COHE.CAPITL
          </span>
        </div>
        <div className="bg-[#FECF4C] text-[#111827] px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
          {user?.address ? Utils.formatAddress(user.address) : '0x...'}
        </div>
      </header>

      {/* Back Button */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <Link href="/products" className="text-white text-xs sm:text-sm uppercase tracking-[1.5px] flex items-center gap-1 sm:gap-1.5 hover:opacity-80">
          &lt; BACK
        </Link>
      </div>

      {/* Content - Responsive container */}
      <div className="flex-1 w-full sm:max-w-[640px] lg:max-w-[960px] mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-16 pb-6 sm:pb-8 lg:pb-12 overflow-y-auto lg:mt-0">
        {/* Title */}
        <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6">
          {product?.name || productNameFromQuery || 'YULILY SHIELD INSURANCE'}
        </h1>

        {/* Description */}
        <div className="text-[#9CA3AF] text-sm sm:text-base lg:text-[17px] mb-6 sm:mb-8 leading-relaxed">
          <p className="mb-2 sm:mb-3">
            A Coinbase Custody Cover claim is valid if Coinbase Custody incurs a loss due to Coin of 10% or more are passed on to all users OR if Coinbase Custody ceases to operate without prior notice and withdrawals are halted continuously for 100 days or more. Members who purchase Coinbase Custody Cover can claim...
          </p>
          <a href="mailto:cohe@gmail.com" className="text-[#FECF4C] underline">
            cohe@gmail.com
          </a>
          <span> Minimum cover purchase of USD is required for cover to avoid.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
          {/* Wallet Address Card (Read-only, auto-filled from auth) */}
          <div className="bg-[#111827] rounded-xl px-5 sm:px-6 lg:px-8 py-5 sm:py-5 lg:py-6 border border-[#1F2937] shadow-sm">
            <label className="text-[#9CA3AF] text-sm sm:text-base uppercase tracking-[1.5px] block mb-3 sm:mb-3">
              Insurance Wallet Address
            </label>
            <input
              {...register('walletAddress')}
              type="text"
              placeholder="Enter wallet address"
              readOnly
              disabled
              className="w-full h-12 sm:h-14 bg-transparent text-white text-lg sm:text-xl lg:text-2xl font-medium border-none px-0 cursor-not-allowed focus:outline-none"
            />
            {errors.walletAddress && (
              <p className="text-red-500 text-sm mt-2">{errors.walletAddress.message}</p>
            )}
          </div>

          {/* Insurance Amount Card (User editable) */}
          <div className="bg-[#111827] rounded-xl px-5 sm:px-6 lg:px-8 py-5 sm:py-5 lg:py-6 border border-[#1F2937] shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-3">
              <label className="text-[#9CA3AF] text-sm sm:text-base uppercase tracking-[1.5px]">
                Insurance Amount
              </label>
              <span className="text-[#6B7280] text-xs sm:text-sm">
                Max: {maxCoverage.toLocaleString()} {tokenSymbol}
              </span>
            </div>
            <div className="relative h-12 sm:h-14 flex items-center">
              <input
                {...register('insuranceAmount')}
                type="number"
                step="0.01"
                placeholder="0"
                onChange={(e) => {
                  setLastEditedField('amount')
                  register('insuranceAmount').onChange(e)
                }}
                className="w-full h-full bg-transparent text-white text-2xl sm:text-3xl lg:text-4xl font-semibold border-none p-0 pr-12 sm:pr-14 focus:outline-none placeholder-[#374151] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center">
                  <Image
                    src={tokenLogo}
                    alt={tokenSymbol}
                    width={32}
                    height={32}
                    className="w-6 h-6 sm:w-7 sm:h-7"
                  />
                </div>
              </div>
            </div>
            {errors.insuranceAmount && (
              <p className="text-red-500 text-sm mt-2">{errors.insuranceAmount.message}</p>
            )}
          </div>

          {/* Insurance Cost Card (User editable - bidirectional binding) */}
          <div className="bg-[#111827] rounded-xl px-5 sm:px-6 lg:px-8 py-5 sm:py-5 lg:py-6 border border-[#1F2937] shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-3">
              <label className="text-[#9CA3AF] text-sm sm:text-base uppercase tracking-[1.5px]">
                Premiem Amount
              </label>
              <span className="text-[#6B7280] text-xs sm:text-sm">
                Bidirectional
              </span>
            </div>
            <div className="relative h-12 sm:h-14 flex items-center">
              <input
                {...register('insuranceCost')}
                type="number"
                step="0.01"
                placeholder="0"
                onChange={(e) => {
                  setLastEditedField('cost')
                  register('insuranceCost').onChange(e)
                }}
                className="w-full h-full bg-transparent text-white text-2xl sm:text-3xl lg:text-4xl font-semibold border-none p-0 pr-12 sm:pr-14 focus:outline-none placeholder-[#374151] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center">
                  <Image
                    src={tokenLogo}
                    alt={tokenSymbol}
                    width={32}
                    height={32}
                    className="w-6 h-6 sm:w-7 sm:h-7"
                  />
                </div>
              </div>
            </div>
            {errors.insuranceCost && (
              <p className="text-red-500 text-sm mt-2">{errors.insuranceCost.message}</p>
            )}
          </div>

          {/* Insurance Period Card (Read-only display) */}
          <div className="bg-[#111827] rounded-xl px-5 sm:px-6 lg:px-8 py-5 sm:py-5 lg:py-6 border border-[#1F2937] shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-3">
              <label className="text-[#9CA3AF] text-sm sm:text-base uppercase tracking-[1.5px]">
                Insurance Period
              </label>
              <span className="text-[#6B7280] text-xs sm:text-sm">Days</span>
            </div>
            <div className="text-white text-2xl sm:text-3xl lg:text-4xl font-semibold h-12 sm:h-14 flex items-center">
              {watchedPeriod}
            </div>
          </div>
        </form>

        {/* Overview Section - Real-time sync with form */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-white text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Overview</h2>
          <div className="bg-[#111827] rounded-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 space-y-3 sm:space-y-4 border border-[#1F2937] shadow-sm">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#1F2937]">
              <span className="text-[#9CA3AF] text-sm sm:text-base">Listing</span>
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/cohe-capitl-app-logo.png"
                  alt="Logo"
                  width={16}
                  height={16}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-white text-sm sm:text-base font-semibold">COHE.CAPITL</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm sm:text-base">Insurance Amount</span>
              <span className="text-white text-sm sm:text-base lg:text-lg font-semibold">
                {watchedAmount && !isNaN(parseFloat(watchedAmount)) && parseFloat(watchedAmount) > 0
                  ? `${parseFloat(parseFloat(watchedAmount).toFixed(6)).toLocaleString()} ${tokenSymbol}`
                  : `0 ${tokenSymbol}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm sm:text-base">Insurance Period</span>
              <span className="text-white text-sm sm:text-base lg:text-lg font-semibold">
                2025-09-16 - 2026-05-03
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm sm:text-base">Insurance Cost</span>
              <span className="text-white text-sm sm:text-base lg:text-lg font-semibold">
                {watchedCost && !isNaN(parseFloat(watchedCost)) && parseFloat(watchedCost) > 0
                  ? `${parseFloat(parseFloat(watchedCost).toFixed(6)).toLocaleString()} ${tokenSymbol}`
                  : `0 ${tokenSymbol}`}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-white text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Terms & Conditions</h2>
          <div className="bg-[#111827] rounded-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 space-y-3 sm:space-y-4 text-sm sm:text-base lg:text-[17px] border border-[#1F2937] shadow-sm">
            <p className="text-white font-semibold mb-2">
              COHE Capitl insurance protects against a loss of funds due to:
            </p>
            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Smart Contract Exploits, Hacks</span>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Oracle Failure</span>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Governance Takeovers</span>
              </div>
            </div>
            <p className="text-white font-semibold mt-4 sm:mt-5 mb-2">
              COHE Capitl Insurance has these exclusions, including but limited to
            </p>
            <div className="space-y-2 sm:space-y-2.5">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">A Loss Of Value Of Any Asset (i.e., Depeg Event)</span>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <span className="text-[#9CA3AF] leading-relaxed">Losses Due To Phishing, Private Key Security Breaches, Malware, Etc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filing a claim */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-white text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Filing a claim</h2>
          <div className="bg-[#111827] rounded-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 space-y-2 sm:space-y-2.5 text-sm sm:text-base lg:text-[17px] border border-[#1F2937] shadow-sm">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-2 h-2 rounded-full bg-[#9CA3AF] mt-1.5 flex-shrink-0" />
              <span className="text-[#9CA3AF] leading-relaxed">You Must Provide Proof Of Loss When Submitting Your Claim</span>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-2 h-2 rounded-full bg-[#9CA3AF] mt-1.5 flex-shrink-0" />
              <span className="text-[#9CA3AF] leading-relaxed">You Must Provide Proof Of Loss When Submitting Your Claim</span>
            </div>
          </div>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-3 sm:mt-4 italic leading-relaxed">
            This cover is not a contract of insurance. Cover is provided on a discretionary basis with Nexus Mutual members having the final say on which claims are paid.
          </p>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className={`w-full h-12 sm:h-14 rounded-xl font-semibold text-base sm:text-lg transition-all ${
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
