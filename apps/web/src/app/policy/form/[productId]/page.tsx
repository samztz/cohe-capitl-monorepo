'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function PolicyFormPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.productId as string

  const [walletAddress, setWalletAddress] = useState('')
  const [insuranceAmount, setInsuranceAmount] = useState('')

  const maxAmount = 8000000
  const insurancePeriod = 90
  const coverageAmount = insuranceAmount ? parseFloat(insuranceAmount) : 0
  const premiumAmount = coverageAmount * 0.1 // 10% premium rate

  const isValid = walletAddress && insuranceAmount && coverageAmount > 0 && coverageAmount <= maxAmount

  const handleSubmit = () => {
    if (!isValid) return
    router.push(`/policy/contract-sign/mock-policy-id`)
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
        <div className="bg-[#FFD54F] text-[#0F111A] px-4 py-1.5 rounded-lg text-sm font-semibold h-8 flex items-center">
          0xAB...B064
        </div>
      </header>

      {/* Back Button */}
      <div className="px-5 py-4">
        <Link href="/products" className="text-white text-sm flex items-center gap-2 hover:opacity-80">
          &lt; BACK
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Title */}
        <h1 className="text-white text-xl font-bold mb-4">
          YULIY SHIELD INSURANCE
        </h1>

        {/* Description */}
        <div className="text-[#9CA3AF] text-xs mb-6 leading-relaxed">
          <p className="mb-2">
            A Coinbase Custody Cover claim is valid if Coinbase Custody incurs a loss due to Coin of 10% or more are passed on to all users OR if Coinbase Custody ceases to operate without prior notice and withdrawals are halted continuously for 100 days or more.Members who purchase Coinbase Custody Cover can claim...
          </p>
          <a href="mailto:cohe@gmail.com" className="text-[#FFD54F] underline">
            cohe@gmail.com
          </a>
          <span> Minimum cover purchase of USD is required for cover to avoid:</span>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Wallet Address Input */}
          <div>
            <label className="text-white text-sm font-semibold block mb-2">
              Insurance Wallet Address
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address"
              className="w-full bg-[#2D3748] text-white text-sm px-4 py-3 rounded-lg border border-[#374151] focus:border-[#FFD54F] focus:outline-none placeholder-[#6B7280]"
            />
          </div>

          {/* Insurance Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-semibold">
                Insurance Amount
              </label>
              <span className="text-[#9CA3AF] text-xs">
                Max: {maxAmount.toLocaleString()} USDC
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={insuranceAmount}
                onChange={(e) => setInsuranceAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[#2D3748] text-white text-2xl font-bold px-4 py-4 rounded-lg border border-[#374151] focus:border-[#FFD54F] focus:outline-none placeholder-[#6B7280]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-[#FFD54F] flex items-center justify-center">
                  <span className="text-[#0F111A] text-xs font-bold">$</span>
                </div>
              </div>
            </div>
            {parseFloat(insuranceAmount) > maxAmount && (
              <p className="text-red-500 text-xs mt-2">Please enter a valid number</p>
            )}
          </div>

          {/* Second Amount Input (shown in design but same as above) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-sm font-semibold">
                Insurance Amount
              </label>
              <span className="text-[#9CA3AF] text-xs">
                Max: {maxAmount.toLocaleString()} USDC
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                className="w-full bg-[#2D3748] text-gray-500 text-2xl font-bold px-4 py-4 rounded-lg border border-[#374151] focus:border-[#FFD54F] focus:outline-none placeholder-[#6B7280]"
                disabled
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-[#FFD54F] flex items-center justify-center">
                  <span className="text-[#0F111A] text-xs font-bold">$</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Period */}
          <div>
            <label className="text-white text-sm font-semibold block mb-2">
              Insurance Period
            </label>
            <div className="bg-[#2D3748] text-white text-2xl font-bold px-4 py-4 rounded-lg border border-[#374151]">
              {insurancePeriod}
            </div>
            <p className="text-[#9CA3AF] text-xs mt-1">Days</p>
          </div>
        </div>

        {/* Overview Section */}
        <div className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3">Overview</h2>
          <div className="bg-[#1A1D2E] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
              <span className="text-[#9CA3AF] text-sm">Listing</span>
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/cohe-capitl-app-logo.png"
                  alt="Logo"
                  width={16}
                  height={16}
                />
                <span className="text-white text-sm font-semibold">COHE.CAPITL</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">Insurance Amount</span>
              <span className="text-white text-sm font-semibold">{coverageAmount.toFixed(0)} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">Insurance Period</span>
              <span className="text-white text-sm font-semibold">2025-09-16 - 2026-05-03</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9CA3AF] text-sm">Insurance Cost</span>
              <span className="text-white text-sm font-semibold">{premiumAmount.toFixed(0)} USDC</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-6">
          <h2 className="text-white text-base font-semibold mb-3">Terms & Conditions</h2>
          <div className="bg-[#1A1D2E] rounded-lg p-4 space-y-3 text-xs">
            <p className="text-white font-semibold">
              COHE Capitl insurance protects against a loss of funds due to:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-[#9CA3AF]">Smart Contract Exploits, Hacks</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-[#9CA3AF]">Oracle Failure</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-[#9CA3AF]">Governance Takeovers</span>
              </div>
            </div>
            <p className="text-white font-semibold mt-4">
              COHE Capitl Insurance has these exclusions, including but limited to
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-red-500">●</span>
                <span className="text-[#9CA3AF]">A Loss Of Value Of Any Asset (i.e., Depeg Event)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500">●</span>
                <span className="text-[#9CA3AF]">Losses Due To Phishing, Private Key Security Breaches, Malware, Etc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filing a claim */}
        <div className="mb-8">
          <h2 className="text-white text-base font-semibold mb-3">Filing a claim</h2>
          <div className="bg-[#1A1D2E] rounded-lg p-4 space-y-2 text-xs text-[#9CA3AF]">
            <p>● You Must Provide Proof Of Loss When Submitting Your Claim</p>
            <p>● You Must Provide Proof Of Loss When Submitting Your Claim</p>
          </div>
          <p className="text-[#6B7280] text-[10px] mt-2 italic">
            This cover is not a contract of insurance. Cover is provided on a discretionary basis with Nexus Mutual members having the final say on which claims are paid.
          </p>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full py-4 rounded-lg font-semibold text-sm transition-all ${
            isValid
              ? 'bg-[#FFD54F] text-[#0F111A] hover:brightness-110'
              : 'bg-[#374151] text-[#6B7280] cursor-not-allowed'
          }`}
        >
          Confirm Insurance
        </button>
      </div>
    </div>
  )
}
