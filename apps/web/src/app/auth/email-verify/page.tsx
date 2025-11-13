'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EmailVerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)

  const isEmailValid = EMAIL_REGEX.test(email)
  const isButtonEnabled = email.length > 0 && isEmailValid && !isSending

  const handleSendCode = async () => {
    if (!isEmailValid) {
      alert('Please enter a valid email address')
      return
    }

    try {
      setIsSending(true)
      await new Promise(resolve => setTimeout(resolve, 800))

      alert(`Verification code sent to ${email}`)
      router.push(`/auth/email-code?email=${encodeURIComponent(email)}`)
    } catch (error) {
      alert('Failed to send verification code')
    } finally {
      setIsSending(false)
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
        <Link href="/auth/connect" className="text-white text-sm flex items-center gap-2 hover:opacity-80">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Subtitle */}
        <p className="text-[#9CA3AF] text-sm text-center mb-12 max-w-xs">
          Enter Your Email Address To Receive A Verification Code
        </p>

        {/* Form */}
        <div className="w-full max-w-sm">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Your Email Address"
            className="w-full bg-[#2D3748] text-white text-sm px-4 py-3 rounded-lg border border-[#374151] focus:border-[#FFD54F] focus:outline-none placeholder-[#6B7280]"
            disabled={isSending}
          />

          <button
            onClick={handleSendCode}
            disabled={!isButtonEnabled}
            className={`w-full mt-8 py-4 rounded-lg text-[#0F111A] font-semibold text-sm transition-all ${
              isButtonEnabled
                ? 'bg-[#FFD54F] hover:brightness-110'
                : 'bg-[#374151] cursor-not-allowed'
            }`}
          >
            {isSending ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
