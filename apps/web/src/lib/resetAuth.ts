/**
 * Reset Authentication Utility for Web
 *
 * Provides a comprehensive logout mechanism that:
 * 1. Disconnects WalletConnect session via AppKit
 * 2. Clears localStorage (JWT, user data)
 * 3. Clears WalletConnect/AppKit cache from localStorage
 *
 * Usage: Call resetAuth() for complete logout
 */

// Storage keys used by the app
const JWT_STORAGE_KEY = 'auth_jwt_token'
const USER_STORAGE_KEY = 'auth_user_data'

// Patterns to match WalletConnect/AppKit related keys
const WC_KEY_PATTERNS = [
  'wc@2:',           // WalletConnect v2 protocol
  '@reown',          // Reown/AppKit storage
  'walletconnect',   // Generic WalletConnect storage
  '@w3m',            // Web3Modal/AppKit
  'W3M_',            // Web3Modal prefix
  'WALLETCONNECT_',  // WalletConnect prefix
]

export interface ResetAuthOptions {
  close?: () => Promise<void>
}

export interface ResetAuthResult {
  success: boolean
  removedKeys: string[]
  errors: string[]
}

/**
 * Reset all authentication state and storage
 *
 * @param options - Optional disconnect function from AppKit
 * @returns Result object with removed keys and any errors
 */
export async function resetAuth(
  options: ResetAuthOptions = {}
): Promise<ResetAuthResult> {
  const removedKeys: string[] = []
  const errors: string[] = []

  console.log('[resetAuth] Starting full authentication reset...')

  try {
    // Step 1: Disconnect WalletConnect session
    if (options.close) {
      try {
        console.log('[resetAuth] Disconnecting WalletConnect session...')
        await options.close()
        console.log('[resetAuth] ✓ WalletConnect disconnected')
      } catch (error) {
        const errorMsg = `Failed to disconnect WalletConnect: ${error}`
        console.error(`[resetAuth] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // Step 2: Clear auth keys from localStorage
    try {
      console.log('[resetAuth] Clearing auth keys from localStorage...')
      localStorage.removeItem(JWT_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      removedKeys.push(JWT_STORAGE_KEY, USER_STORAGE_KEY)
      console.log('[resetAuth] ✓ Auth keys cleared')
    } catch (error) {
      const errorMsg = `Failed to clear auth keys: ${error}`
      console.error(`[resetAuth] ${errorMsg}`)
      errors.push(errorMsg)
    }

    // Step 3: Clear WalletConnect/AppKit keys from localStorage
    try {
      console.log('[resetAuth] Scanning localStorage for WalletConnect/AppKit keys...')
      const allKeys = Object.keys(localStorage)
      console.log(`[resetAuth] Found ${allKeys.length} total keys in localStorage`)

      // Filter keys that match WalletConnect/AppKit patterns
      const keysToRemove = allKeys.filter((key) => {
        // Check if key matches any WalletConnect pattern
        const matchesWcPattern = WC_KEY_PATTERNS.some((pattern) =>
          key.startsWith(pattern) || key.includes(pattern)
        )

        return matchesWcPattern
      })

      if (keysToRemove.length > 0) {
        console.log(`[resetAuth] Removing ${keysToRemove.length} WalletConnect/AppKit keys:`)
        console.log('[resetAuth] Keys to remove:', keysToRemove)

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key)
        })
        removedKeys.push(...keysToRemove)
        console.log('[resetAuth] ✓ WalletConnect/AppKit cache cleared')
      } else {
        console.log('[resetAuth] No WalletConnect/AppKit keys found in localStorage')
      }
    } catch (error) {
      const errorMsg = `Failed to clear WalletConnect/AppKit cache: ${error}`
      console.error(`[resetAuth] ${errorMsg}`)
      errors.push(errorMsg)
    }

    // Step 4: Log summary
    const success = errors.length === 0
    console.log('[resetAuth] ========================================')
    console.log(`[resetAuth] Reset completed: ${success ? 'SUCCESS' : 'WITH ERRORS'}`)
    console.log(`[resetAuth] Removed ${removedKeys.length} storage keys`)
    if (removedKeys.length > 0) {
      console.log('[resetAuth] Removed keys:', removedKeys)
    }
    if (errors.length > 0) {
      console.log(`[resetAuth] Encountered ${errors.length} errors:`, errors)
    }
    console.log('[resetAuth] ========================================')

    return {
      success,
      removedKeys,
      errors,
    }
  } catch (error) {
    const errorMsg = `Unexpected error during reset: ${error}`
    console.error(`[resetAuth] ${errorMsg}`)
    errors.push(errorMsg)

    return {
      success: false,
      removedKeys,
      errors,
    }
  }
}

/**
 * Get a summary of storage keys (for debugging)
 */
export function getStorageSummary(): {
  localStorageKeys: string[]
  wcRelatedKeys: string[]
  totalKeys: number
} {
  try {
    const allKeys = Object.keys(localStorage)
    const wcRelatedKeys = allKeys.filter((key) =>
      WC_KEY_PATTERNS.some((pattern) =>
        key.startsWith(pattern) || key.includes(pattern)
      )
    )

    return {
      localStorageKeys: allKeys,
      wcRelatedKeys,
      totalKeys: allKeys.length,
    }
  } catch (error) {
    console.error('[resetAuth] Failed to get storage summary:', error)
    return {
      localStorageKeys: [],
      wcRelatedKeys: [],
      totalKeys: 0,
    }
  }
}
