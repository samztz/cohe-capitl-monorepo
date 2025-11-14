/**
 * SIWE Authentication Hook for Web
 * Handles Sign-In with Ethereum using Reown AppKit
 */

import { useState, useCallback } from 'react'
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'
import { useAuthStore } from '@/store/authStore'
import { formatSiweMessage } from '@/lib/siweUtil'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'
const SIWE_DOMAIN = process.env.NEXT_PUBLIC_SIWE_DOMAIN || 'localhost'
const SIWE_URI = process.env.NEXT_PUBLIC_SIWE_URI || API_BASE_URL
const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97', 10) // BSC Testnet

/**
 * SIWE Authentication Hook
 */
export function useSiweAuth() {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const { setToken, logout: logoutStore } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevent indefinite hangs by adding simple timeouts to critical async steps
  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
    return await new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), ms)
      promise
        .then((val) => {
          clearTimeout(timer)
          resolve(val)
        })
        .catch((err) => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }, [])

  /**
   * Perform SIWE login
   */
  const login = useCallback(async () => {
    if (!isConnected || !address || !walletProvider) {
      setError('Wallet not connected')
      return false
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log('[useSiweAuth] Starting SIWE login for address:', address)

      // Step 1: Get nonce from backend
      const nonceResponse = await withTimeout(
        fetch(`${API_BASE_URL}/auth/siwe/nonce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address }),
        }),
        8000,
        'Timeout getting nonce from server'
      )

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce from server')
      }

      const { nonce } = await nonceResponse.json()
      console.log('[useSiweAuth] Got nonce')

      // Step 2: Format SIWE message
      // IMPORTANT: SIWE v3.0.0 REQUIRES a statement field!
      const siweMessage = formatSiweMessage({
        domain: SIWE_DOMAIN,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: SIWE_URI,
        version: '1',
        chainId: CHAIN_ID,
        nonce,
        issuedAt: new Date().toISOString(),
      })

      // Debug: Log the full SIWE message
      console.log('[useSiweAuth] === SIWE Message ===')
      console.log(siweMessage)
      console.log('[useSiweAuth] === End SIWE Message ===')
      console.log('[useSiweAuth] Message length:', siweMessage.length)
      console.log('[useSiweAuth] Message bytes:', new TextEncoder().encode(siweMessage).length)

      // Step 3: Sign message with wallet
      console.log('[useSiweAuth] Requesting signature from wallet...')
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const signer = await ethersProvider.getSigner()

      // Sign message (this may hang if user doesn't respond to wallet popup)
      const signature = await withTimeout(
        signer.signMessage(siweMessage),
        30000,
        'Timed out waiting for wallet signature'
      )
      console.log('[useSiweAuth] Got signature')

      // Step 4: Verify signature with backend
      const verifyResponse = await withTimeout(
        fetch(`${API_BASE_URL}/auth/siwe/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: siweMessage, signature }),
        }),
        10000,
        'Timeout verifying signature'
      )

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json()
        throw new Error(errorData.message || 'Verification failed')
      }

      const { token } = await verifyResponse.json()
      console.log('[useSiweAuth] Verification successful')

      // Step 5: Get user info
      const meResponse = await withTimeout(
        fetch(`${API_BASE_URL}/auth/siwe/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        10000,
        'Timeout fetching user info'
      )

      if (!meResponse.ok) {
        throw new Error('Failed to get user info')
      }

      const { userId, address: userAddress } = await meResponse.json()

      // Step 6: Store auth data
      const user = {
        id: userId,
        address: userAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setToken(token, user)
      console.log('[useSiweAuth] Login complete')

      return true
    } catch (err: any) {
      console.error('[useSiweAuth] Login failed:', err)

      // User-friendly error messages
      let errorMessage = 'Login failed. Please try again.'
      if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('denied')) {
        errorMessage = 'Signature request was cancelled'
      } else if (err.message?.includes('nonce') || err.message?.includes('expired')) {
        errorMessage = 'Login expired. Please try again'
      } else if (err.message?.includes('Timed out') || err.message?.includes('Timeout')) {
        errorMessage = err.message
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection'
      }

      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, walletProvider, setToken])

  /**
   * Logout and clear auth data
   */
  const logout = useCallback(async () => {
    logoutStore()
    setError(null)
  }, [logoutStore])

  return {
    login,
    logout,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
