'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function PurchaseSuccessPage() {
  // Protected route - require authentication
  const { isChecking } = useRequireAuth()

  const params = useParams()
  const policyId = params.policyId as string

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

  return (
    <div className="min-h-screen bg-[#0F111A] flex flex-col">
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
        <Link
          href="/"
          className="bg-[#FFD54F] text-[#0F111A] px-4 py-1.5 rounded-lg text-sm font-semibold h-8 flex items-center hover:brightness-110 transition-all"
        >
          Contact us
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-12">
        {/* Shield Logo */}
        <div className="mb-12 flex items-center justify-center">
          <Image
            src="/assets/welcome-logo.png"
            alt="Shield Logo"
            width={180}
            height={180}
            className="w-[45vw] h-[45vw] max-w-[180px] max-h-[180px]"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-[#FFD54F] text-2xl font-bold mb-2 tracking-wide">
          CONGRATULATIONS
        </h1>
        <h2 className="text-white text-xl font-bold mb-12">
          YOU SUCCESSFULLY INSURED !!!
        </h2>

        {/* Status */}
        <div className="flex items-center gap-2 mb-12">
          <span className="text-green-500">✓</span>
          <span className="text-green-500 text-sm">Securiting</span>
        </div>

        {/* Policy Details */}
        <div className="w-full max-w-sm space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#9CA3AF]">Insurance Amount</span>
            <span className="text-white font-semibold">600 USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9CA3AF]">Insurance Cost</span>
            <span className="text-white font-semibold">60 USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9CA3AF]">Insurance Period</span>
            <span className="text-white font-semibold">2025-09-16 - 2026-05-03</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#9CA3AF]">Guarantee Countdown</span>
            <span className="text-white font-semibold">89DAYS 20H 59M 30S</span>
          </div>
        </div>
      </div>
    </div>
  )
}
