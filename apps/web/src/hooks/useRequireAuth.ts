/**
 * useRequireAuth Hook - Protected Route Guard for Web
 *
 * Ensures that the current page requires authentication.
 * If the user is not authenticated, redirects to /auth/connect.
 *
 * Note: Auth is initialized globally in AppProviders, so no need to call loadStoredAuth here.
 *
 * Usage in protected pages:
 * ```tsx
 * 'use client'
 * import { useRequireAuth } from '@/hooks/useRequireAuth'
 *
 * export default function ProtectedPage() {
 *   const { isChecking } = useRequireAuth()
 *
 *   if (isChecking) {
 *     return <LoadingScreen />
 *   }
 *
 *   return <YourPageContent />
 * }
 * ```
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export function useRequireAuth() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuthStore()

  useEffect(() => {
    // Wait for auth store to finish loading (initialized in AppProviders)
    if (isLoading) {
      return
    }

    // Check authentication status
    if (!isAuthenticated || !user) {
      // User is not authenticated - redirect to connect page
      console.log('[useRequireAuth] User not authenticated, redirecting to /auth/connect')
      router.replace('/auth/connect')
    } else {
      // User is authenticated - allow access
      console.log('[useRequireAuth] User authenticated, allowing access')
    }
  }, [isAuthenticated, user, isLoading, router])

  // Return isLoading as isChecking for backward compatibility
  return { isChecking: isLoading }
}
