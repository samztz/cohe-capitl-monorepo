'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ContractSignPage() {
  const router = useRouter()
  const params = useParams()
  const policyId = params.policyId as string

  const [agreed, setAgreed] = useState(false)
  const [tel, setTel] = useState('')
  const [hasUploadedCredentials, setHasUploadedCredentials] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const isValid = agreed && tel && hasUploadedCredentials && hasSignature

  const handleSign = () => {
    if (isValid) {
      router.push(`/policy/success/${policyId}`)
    }
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
        <Link href="/policy/form/mock-product-id" className="text-white text-sm flex items-center gap-2 hover:opacity-80">
          &lt; BACK
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Contract Content Box */}
        <div className="bg-[#2D3748] rounded-lg p-6 mb-6 h-[400px] flex items-center justify-center border border-[#374151]">
          <p className="text-[#9CA3AF] text-sm text-center">
            这里是合同内容
          </p>
        </div>

        {/* Confirmation Button */}
        <button
          onClick={() => setAgreed(!agreed)}
          className={`w-full py-3 rounded-lg text-sm font-semibold mb-6 border-2 transition-all ${
            agreed
              ? 'bg-[#5B7C4F] border-[#5B7C4F] text-white'
              : 'bg-transparent border-[#5B7C4F] text-[#5B7C4F]'
          }`}
        >
          Have Read And Confirmed {agreed ? '✓' : ''}
        </button>

        {/* Tel Input */}
        <div className="mb-6">
          <label className="text-white text-sm font-semibold block mb-2">
            Insurance Tel
          </label>
          <input
            type="tel"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            placeholder="Enter Tel"
            className="w-full bg-[#2D3748] text-white text-sm px-4 py-3 rounded-lg border border-[#374151] focus:border-[#FFD54F] focus:outline-none placeholder-[#6B7280]"
          />
        </div>

        {/* Upload Credentials */}
        <div className="mb-6">
          <h2 className="text-white text-xs font-semibold tracking-wider mb-3">
            UPLOAD CREDENTIALS
          </h2>
          <button
            onClick={() => setHasUploadedCredentials(!hasUploadedCredentials)}
            className={`w-full h-32 rounded-lg border border-[#374151] flex items-center justify-center transition-all ${
              hasUploadedCredentials ? 'bg-[#2D3748]' : 'bg-[#1A1D2E]'
            }`}
          >
            <span className="text-4xl">{hasUploadedCredentials ? '✓' : '📷'}</span>
          </button>
        </div>

        {/* Signature Authentication */}
        <div className="mb-8">
          <h2 className="text-white text-xs font-semibold tracking-wider mb-3">
            SIGNATURE AUTHENTICATION
          </h2>
          <button
            onClick={() => setHasSignature(!hasSignature)}
            className={`w-full h-40 rounded-lg flex items-center justify-center transition-all ${
              hasSignature ? 'bg-[#5B7C4F]' : 'bg-[#5B7C4F] opacity-60'
            }`}
          >
            <span className="text-white text-sm">
              {hasSignature ? '✓ Signature Added' : '✏️ Click Add signature'}
            </span>
          </button>
        </div>

        {/* Confirmed Button */}
        <button
          onClick={handleSign}
          disabled={!isValid}
          className={`w-full py-4 rounded-lg font-semibold text-sm transition-all ${
            isValid
              ? 'bg-[#FFD54F] text-[#0F111A] hover:brightness-110'
              : 'bg-[#374151] text-[#6B7280] cursor-not-allowed'
          }`}
        >
          Confirmed
        </button>
      </div>
    </div>
  )
}
