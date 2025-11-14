/**
 * Auth Store - Global Authentication State Management for Web
 * Uses Zustand for state management and localStorage for JWT storage
 */

import { create } from 'zustand'

const JWT_STORAGE_KEY = 'auth_jwt_token'
const USER_STORAGE_KEY = 'auth_user_data'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'

export interface User {
  id: string
  address: string
  createdAt: string
  updatedAt: string
}

interface AuthState {
  // State
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  user: User | null
  error: string | null

  // Actions
  setToken: (token: string, user: User) => void
  loadStoredAuth: () => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

/**
 * Storage utilities for web (localStorage)
 */
const storage = {
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },

  getItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  },

  removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  },
}

/**
 * Global auth store using Zustand
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  token: null,
  user: null,
  error: null,

  // Set authentication token and user
  setToken: (token: string, user: User) => {
    try {
      // Store token and user data
      storage.setItem(JWT_STORAGE_KEY, token)
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

      // Update state
      set({
        token,
        user,
        isAuthenticated: true,
        error: null,
      })

      console.log('[AuthStore] Token and user saved successfully')
    } catch (error) {
      console.error('[AuthStore] Failed to save auth data:', error)
      set({
        error: 'Failed to save authentication data',
      })
    }
  },

  // Load stored authentication data on app startup with backend validation
  loadStoredAuth: async () => {
    try {
      set({ isLoading: true })

      const storedToken = storage.getItem(JWT_STORAGE_KEY)

      if (!storedToken) {
        set({
          isLoading: false,
          isAuthenticated: false,
          token: null,
          user: null,
        })
        console.log('[AuthStore] No stored token found')
        return
      }

      // Validate token with backend by calling /auth/siwe/me
      console.log('[AuthStore] Validating stored token with backend...')

      try {
        const response = await fetch(`${API_BASE_URL}/auth/siwe/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
          },
        })

        if (!response.ok) {
          throw new Error('Token validation failed')
        }

        const { userId, address } = await response.json()

        // Token is valid, construct user object
        const user: User = {
          id: userId,
          address: address,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Update storage with validated user data
        storage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

        set({
          token: storedToken,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })

        console.log('[AuthStore] Token validated successfully, user:', address)
      } catch (validationError) {
        console.warn('[AuthStore] Token validation failed:', validationError)

        // Token is invalid or expired, clear storage
        storage.removeItem(JWT_STORAGE_KEY)
        storage.removeItem(USER_STORAGE_KEY)

        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })

        console.log('[AuthStore] Cleared invalid token')
      }
    } catch (error) {
      console.error('[AuthStore] Failed to load stored auth:', error)

      // On unexpected error, clear everything
      storage.removeItem(JWT_STORAGE_KEY)
      storage.removeItem(USER_STORAGE_KEY)

      set({
        isLoading: false,
        isAuthenticated: false,
        token: null,
        user: null,
        error: 'Failed to load authentication data',
      })
    }
  },

  // Logout and clear all auth data
  logout: () => {
    try {
      // Clear storage
      storage.removeItem(JWT_STORAGE_KEY)
      storage.removeItem(USER_STORAGE_KEY)

      // Reset state
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        error: null,
      })

      console.log('[AuthStore] Logged out successfully')
    } catch (error) {
      console.error('[AuthStore] Failed to logout:', error)
      set({
        error: 'Failed to logout',
      })
    }
  },

  // Utility actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}))

/**
 * Hook to get the current auth token for API calls
 */
export const useAuthToken = () => {
  return useAuthStore((state) => state.token)
}

/**
 * Hook to get the current user
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user)
}

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated)
}
