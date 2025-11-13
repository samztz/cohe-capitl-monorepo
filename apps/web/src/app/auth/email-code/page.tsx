'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const MOCK_CODE = '123456'
const COUNTDOWN_SECONDS = 30

function EmailCodeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [isResending, setIsResending] = useState(false)

  const isCodeValid = /^\d{6}$/.test(code)
  const isButtonEnabled = isCodeValid && !isVerifying

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerifyCode = async () => {
    if (!isCodeValid) {
      alert('Please enter a 6-digit verification code')
      return
    }

    try {
      setIsVerifying(true)
      await new Promise(resolve => setTimeout(resolve, 800))

      if (code === MOCK_CODE) {
        alert('Your email has been verified!')
        router.push('/products')
      } else {
        alert('Invalid verification code. Please try again.')
      }
    } catch (error) {
      alert('Failed to verify code')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0) return

    try {
      setIsResending(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      setCountdown(COUNTDOWN_SECONDS)
      alert(`A new verification code has been sent to ${email}`)
    } catch (error) {
      alert('Failed to resend verification code')
    } finally {
      setIsResending(false)
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
        <Link href="/auth/email-verify" className="text-white text-sm flex items-center gap-2 hover:opacity-80">
          &lt; BACK
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-12">
        {/* Title */}
        <h1 className="text-white text-2xl font-bold mb-12">
          Email Verification
        </h1>

        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-[#2D3748] flex items-center justify-center mb-12">
          <svg className="w-12 h-12 text-[#FFD54F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Subtitle */}
        <p className="text-[#9CA3AF] text-sm text-center mb-2 max-w-xs">
          Enter Your Email Address To Receive A Verification Code
        </p>

        {/* Email Display */}
        <p className="text-white text-sm font-semibold mb-8">
          {email}
        </p>

        {/* Form */}
        <div className="w-full max-w-sm">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const filtered = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                setCode(filtered)
              }}
              placeholder="Enter Email Code"
              maxLength={6}
              className="w-full bg-[#2D3748] text-white text-sm px-4 py-3 rounded-lg border border-[#374151] focus:border-[#FFD54F] focus:outline-none placeholder-[#6B7280] tracking-widest text-center"
              disabled={isVerifying}
            />
            {countdown > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">
                {countdown}s
              </div>
            )}
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={!isButtonEnabled}
            className={`w-full mt-8 py-4 rounded-lg text-[#0F111A] font-semibold text-sm transition-all ${
              isButtonEnabled
                ? 'bg-[#FFD54F] hover:brightness-110'
                : 'bg-[#374151] cursor-not-allowed'
            }`}
          >
            {isVerifying ? 'Verifying...' : 'Confirmed'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EmailCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailCodeForm />
    </Suspense>
  )
}
