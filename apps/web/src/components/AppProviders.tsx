'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

// Import appkit to ensure it's initialized
import '@/config/appkit'

/**
 * App-wide providers wrapper
 * Includes:
 * - React Query for data fetching
 * - Global auth initialization (loadStoredAuth on mount)
 * - Reown AppKit is initialized globally via the import above
 *   (AppKit doesn't provide a separate Provider component - it's initialized once)
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Global auth initialization - load and validate stored auth once on app startup
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth)

  useEffect(() => {
    console.log('[AppProviders] Initializing auth on app startup...')
    loadStoredAuth()
  }, [loadStoredAuth])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
