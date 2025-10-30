/**
 * Auth Store - Global Authentication State Management
 * Uses Zustand for state management and expo-secure-store for secure JWT storage
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const JWT_STORAGE_KEY = 'auth_jwt_token';
const USER_STORAGE_KEY = 'auth_user_data';

export interface User {
  id: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: User | null;
  error: string | null;

  // Actions
  setToken: (token: string, user: User) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Securely store data using expo-secure-store
 * Falls back to AsyncStorage for web platform
 */
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, use localStorage (SecureStore is not available)
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

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
  setToken: async (token: string, user: User) => {
    try {
      // Store token and user data securely
      await secureStorage.setItem(JWT_STORAGE_KEY, token);
      await secureStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      // Update state
      set({
        token,
        user,
        isAuthenticated: true,
        error: null,
      });

      console.log('[AuthStore] Token and user saved successfully');
    } catch (error) {
      console.error('[AuthStore] Failed to save auth data:', error);
      set({
        error: 'Failed to save authentication data',
      });
    }
  },

  // Load stored authentication data on app startup
  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      const storedToken = await secureStorage.getItem(JWT_STORAGE_KEY);
      const storedUserData = await secureStorage.getItem(USER_STORAGE_KEY);

      if (storedToken && storedUserData) {
        const user = JSON.parse(storedUserData) as User;

        // TODO: Optionally validate token with backend here
        // For now, we trust the stored token

        set({
          token: storedToken,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        console.log('[AuthStore] Loaded stored auth successfully');
      } else {
        set({
          isLoading: false,
          isAuthenticated: false,
        });
        console.log('[AuthStore] No stored auth found');
      }
    } catch (error) {
      console.error('[AuthStore] Failed to load stored auth:', error);
      set({
        isLoading: false,
        isAuthenticated: false,
        error: 'Failed to load authentication data',
      });
    }
  },

  // Logout and clear all auth data
  logout: async () => {
    try {
      // Clear secure storage
      await secureStorage.removeItem(JWT_STORAGE_KEY);
      await secureStorage.removeItem(USER_STORAGE_KEY);

      // Reset state
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        error: null,
      });

      console.log('[AuthStore] Logged out successfully');
    } catch (error) {
      console.error('[AuthStore] Failed to logout:', error);
      set({
        error: 'Failed to logout',
      });
    }
  },

  // Utility actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));

/**
 * Hook to get the current auth token for API calls
 */
export const useAuthToken = () => {
  return useAuthStore((state) => state.token);
};

/**
 * Hook to get the current user
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated);
};