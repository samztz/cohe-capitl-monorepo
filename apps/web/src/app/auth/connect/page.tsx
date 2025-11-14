'use client'

/**
 * Wallet Connect Page - Strict Binary State Logic
 *
 * Design Principles:
 * 1. BINARY states only: NOT CONNECTED or AUTHENTICATED (redirect to dashboard)
 * 2. NO "connected but not authenticated" state - if detected, auto-disconnect
 * 3. NO auto-login - user must explicitly click Connect Wallet
 * 4. Connect Wallet button triggers wallet modal AND SIWE login in one flow
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { useAuthStore } from '@/store/authStore'
import { useSiweAuth } from '@/hooks/useSiweAuth'
import { resetAuth } from '@/lib/resetAuth'

export default function ConnectPage() {
  // AppKit hooks
  const { open, close } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('eip155')

  // Router
  const router = useRouter()

  // Auth hooks
  const { isAuthenticated, user, isLoading: authStoreLoading } = useAuthStore()
  const { login, isLoading: isSiweLoading, error: siweError, clearError } = useSiweAuth()

  // Local state
  const [localError, setLocalError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Ref to track if we're in a login flow initiated by user
  const isUserInitiatedFlow = useRef(false)

  /**
   * Effect 1: Redirect to dashboard if already authenticated
   */
  useEffect(() => {
    if (!authStoreLoading && isAuthenticated && user) {
      console.log('[ConnectPage] User already authenticated, redirecting to dashboard:', user.address)
      router.replace('/dashboard')
    }
  }, [authStoreLoading, isAuthenticated, user, router])

  /**
   * Effect 2: Enforce binary state - disconnect stale wallet connections
   * If wallet is connected but user is NOT authenticated AND this is NOT a user-initiated flow,
   * it means we have a stale connection from a previous session - disconnect it immediately.
   */
  useEffect(() => {
    // Wait for auth store to finish loading
    if (authStoreLoading) {
      return
    }

    // Skip if user is authenticated
    if (isAuthenticated) {
      return
    }

    // Skip if this is a user-initiated connection flow
    if (isUserInitiatedFlow.current) {
      return
    }

    // Skip if we're in the middle of SIWE login
    if (isSiweLoading) {
      return
    }

    // If wallet is connected but not authenticated, it's a stale connection
    if (isConnected && address) {
      console.log('[ConnectPage] Detected stale wallet connection (connected but not authenticated), disconnecting...')
      close().catch(err => console.error('[ConnectPage] Error disconnecting stale wallet:', err))
    }
  }, [authStoreLoading, isAuthenticated, isConnected, address, isSiweLoading, close])

  /**
   * Effect 3: Handle user-initiated SIWE login after wallet connection
   * This only runs when user explicitly clicks Connect Wallet
   */
  useEffect(() => {
    // Only proceed if this is a user-initiated flow
    if (!isUserInitiatedFlow.current) {
      return
    }

    // Wait for wallet to be connected
    if (!isConnected || !address || !walletProvider) {
      return
    }

    // Skip if already authenticated
    if (isAuthenticated) {
      return
    }

    // Skip if already in SIWE flow
    if (isSiweLoading) {
      return
    }

    // Wallet just connected in user-initiated flow, start SIWE login
    console.log('[ConnectPage] Wallet connected via user action, starting SIWE login...')

    const handleSiweLogin = async () => {
      try {
        setLocalError(null)
        clearError()

        // Check network
        const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97', 10)
        if (chainId !== targetChainId) {
          const targetNetworkName = targetChainId === 97 ? 'BSC Testnet' : 'BNB Smart Chain Mainnet'
          const errorMsg = `Please switch to ${targetNetworkName} in your wallet`
          setLocalError(errorMsg)

          // Disconnect wallet and reset flag
          console.log('[ConnectPage] Wrong network, disconnecting wallet...')
          isUserInitiatedFlow.current = false
          await close()
          setIsConnecting(false)
          return
        }

        // Start SIWE login
        const success = await login()

        if (!success) {
          console.warn('[ConnectPage] SIWE login failed, disconnecting wallet...')
          // Login failed, disconnect wallet and reset flag
          isUserInitiatedFlow.current = false
          await close()
        } else {
          console.log('[ConnectPage] SIWE login successful')
        }

        setIsConnecting(false)
      } catch (error) {
        console.error('[ConnectPage] SIWE login error:', error)
        setLocalError('Failed to sign in. Please try again.')
        // Reset flag and disconnect
        isUserInitiatedFlow.current = false
        await close()
        setIsConnecting(false)
      }
    }

    handleSiweLogin()
  }, [isConnected, address, walletProvider, isAuthenticated, isSiweLoading, chainId, login, clearError, close])

  /**
   * Handle Connect Wallet button click
   * This is the ONLY entry point for user-initiated connection + login
   */
  const handleConnectWallet = async () => {
    try {
      setLocalError(null)
      clearError()
      setIsConnecting(true)

      console.log('[ConnectPage] User clicked Connect Wallet, marking as user-initiated flow...')

      // Mark this as a user-initiated flow
      isUserInitiatedFlow.current = true

      // Open wallet modal
      await open()

      // After modal closes, Effect 3 will handle SIWE login if wallet is connected
    } catch (error) {
      console.error('[ConnectPage] Error opening wallet modal:', error)
      setLocalError('Failed to open wallet modal')
      isUserInitiatedFlow.current = false
      setIsConnecting(false)
    }
  }

  /**
   * Handle logout - comprehensive reset
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log('[ConnectPage] Starting logout...')

      // Reset user-initiated flag
      isUserInitiatedFlow.current = false

      // Call resetAuth to clear all storage and disconnect wallet
      const result = await resetAuth({ close })

      console.log('[ConnectPage] Logout completed:', result)

      if (result.success) {
        console.log(`[ConnectPage] Successfully logged out and cleared ${result.removedKeys.length} storage keys`)
      } else {
        console.warn('[ConnectPage] Logout completed with warnings:', result.errors)
      }

      setLocalError(null)
    } catch (error) {
      console.error('[ConnectPage] Logout error:', error)
      setLocalError('Failed to logout. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Get current error message
  const errorMessage = localError || siweError

  // Show loading screen while auth store is initializing
  if (authStoreLoading) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9CA3AF] text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show brief "redirecting" message (rarely seen due to useEffect redirect)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-[#0F111A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-sm font-medium">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // Main UI - Only shown when NOT authenticated
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
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="bg-[#FFD54F] text-[#0F111A] px-4 py-1.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all h-8 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-5">
        {/* Shield Logo */}
        <div className="mb-8 flex items-center justify-center">
          <Image
            src="/assets/welcome-logo.png"
            alt="Shield Logo"
            width={280}
            height={280}
            className="w-[65vw] h-[65vw] max-w-[280px] max-h-[280px]"
            priority
          />
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-white text-[28px] md:text-[36px] lg:text-[42px] font-bold leading-tight tracking-wide">
            THE <span className="text-[#FFD54F]">FIRST</span> CRYPTO
          </h1>
          <h1 className="text-white text-[28px] md:text-[36px] lg:text-[42px] font-bold leading-tight tracking-wide">
            INSURANCE
          </h1>
          <h1 className="text-white text-[28px] md:text-[36px] lg:text-[42px] font-bold leading-tight tracking-wide">
            ALTERNATIVE
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-[#9CA3AF] text-xs font-medium tracking-[2px] text-center mb-10">
          COVERING CRYPTO SINCE 2025
        </p>

        {/* Action Section - Binary states: Loading OR Connect Button */}
        <div className="w-full flex flex-col items-center">
          {isSiweLoading || isConnecting ? (
            // Loading state - Connecting wallet or signing in
            <div className="text-center py-4">
              <div className="w-8 h-8 border-4 border-[#FFD54F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white text-sm font-semibold">
                {isSiweLoading ? 'Signing in with wallet...' : 'Connecting wallet...'}
              </p>
              <p className="text-[#9CA3AF] text-xs mt-1">Please check your wallet</p>
            </div>
          ) : (
            // Not connected - Show Connect Wallet button
            <button
              onClick={handleConnectWallet}
              className="bg-[#FFD54F] text-[#0F111A] w-[70%] min-w-[200px] max-w-[280px] h-12 rounded-lg flex items-center justify-center text-base font-semibold tracking-wide hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(255,213,79,0.3)]"
            >
              Connect Wallet
            </button>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 px-4 py-2 bg-red-500 rounded-lg max-w-[280px]">
              <p className="text-white text-sm text-center">{errorMessage}</p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Spacer */}
      <div className="pb-12"></div>
    </div>
  )
}
