/**
 * Auth Store (Zustand)
 * Manages authentication state (wallet address, JWT token)
 */

import { create } from 'zustand';

interface AuthState {
  // User wallet address (0x...)
  address: string | null;

  // JWT access token from backend
  jwt: string | null;

  // Is user authenticated?
  isAuthenticated: boolean;

  // Actions
  setAuth: (address: string, jwt: string) => void;
  logout: () => void;

  // Mock login (for development)
  mockLogin: (address?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  address: null,
  jwt: null,
  isAuthenticated: false,

  /**
   * Set authentication state
   * Called after successful SIWE login
   */
  setAuth: (address: string, jwt: string) => {
    set({
      address,
      jwt,
      isAuthenticated: true,
    });
  },

  /**
   * Clear authentication state
   */
  logout: () => {
    set({
      address: null,
      jwt: null,
      isAuthenticated: false,
    });
  },

  /**
   * Mock login for development
   * TODO: Remove in production, replace with SIWE flow
   */
  mockLogin: (address = '0x1111111111111111111111111111111111111111') => {
    set({
      address,
      jwt: 'mock-jwt-token-for-development',
      isAuthenticated: true,
    });
  },
}));
