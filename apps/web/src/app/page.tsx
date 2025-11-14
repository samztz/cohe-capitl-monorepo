'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'

/**
 * Home Page - Smart Router Entry Point
 * Automatically redirects based on authentication status:
 * - Authenticated users -> /dashboard
 * - Unauthenticated users -> /auth/connect
 *
 * Note: Auth is initialized globally in AppProviders
 */
export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // Wait for auth store to finish loading
    if (isLoading) {
      return
    }

    // Route based on authentication status
    if (isAuthenticated) {
      console.log('[HomePage] User authenticated, redirecting to dashboard...')
      router.replace('/dashboard')
    } else {
      console.log('[HomePage] User not authenticated, redirecting to connect page...')
      router.replace('/auth/connect')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading splash screen while checking authentication
  return (
    <div className="min-h-screen bg-[#0F111A] flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <Image
          src="/assets/cohe-capitl-app-logo.png"
          alt="Cohe Capital Logo"
          width={48}
          height={48}
          className="w-12 h-12"
          priority
        />
        <span className="text-white text-2xl font-bold tracking-wide">
          COHE.CAPITL
        </span>
      </div>

      {/* Shield Logo */}
      <div className="mb-8">
        <Image
          src="/assets/welcome-logo.png"
          alt="Shield Logo"
          width={200}
          height={200}
          className="w-[200px] h-[200px] animate-pulse"
          priority
        />
      </div>

      {/* Loading indicator */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#9CA3AF] text-sm font-medium">
          Loading...
        </p>
      </div>
    </div>
  )
}
