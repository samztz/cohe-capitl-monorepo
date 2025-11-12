/**
 * SIWE Authentication Hook
 * Simplified implementation using official AppKit hooks
 */

import { useState, useCallback } from 'react';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { BrowserProvider } from 'ethers';
import { useAuthStore } from '../store/authStore';
import { formatSiweMessage } from '../lib/siweUtil';
import Constants from 'expo-constants';

// API Configuration
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE ||
  'http://localhost:3001';

const SIWE_DOMAIN = process.env.EXPO_PUBLIC_SIWE_DOMAIN || 'localhost';
const SIWE_URI = process.env.EXPO_PUBLIC_SIWE_URI || API_BASE_URL;
const CHAIN_ID = parseInt(process.env.EXPO_PUBLIC_CHAIN_ID || '97', 10);

/**
 * SIWE Authentication Hook
 * Handles the complete SIWE login flow using official AppKit hooks
 */
export function useSiweAuth() {
  const { address, isConnected } = useAccount();
  const { provider, providerType } = useProvider();
  const { setToken, logout: logoutStore } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Perform SIWE login
   */
  const login = useCallback(async () => {
    if (!isConnected || !address || !provider) {
      setError('Wallet not connected');
      return false;
    }

    if (providerType !== 'eip155') {
      setError('Only EVM chains are supported');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[useSiweAuth] Starting SIWE login for address:', address);

      // Step 1: Get nonce from backend
      const nonceResponse = await fetch(`${API_BASE_URL}/auth/siwe/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce from server');
      }

      const { nonce } = await nonceResponse.json();
      console.log('[useSiweAuth] Got nonce');

      // Step 2: Format SIWE message
      const siweMessage = formatSiweMessage({
        domain: SIWE_DOMAIN,
        address,
        statement: 'Sign in to Cohe Capital',
        uri: SIWE_URI,
        version: '1',
        chainId: CHAIN_ID,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      // Step 3: Sign message with wallet
      // Wrap the provider with BrowserProvider to access getSigner()
      const ethersProvider = new BrowserProvider(provider as any);
      const signer = await ethersProvider.getSigner();
      const signature = await signer.signMessage(siweMessage);
      console.log('[useSiweAuth] Got signature');

      // Step 4: Verify signature with backend
      const verifyResponse = await fetch(`${API_BASE_URL}/auth/siwe/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: siweMessage, signature }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      const { token } = await verifyResponse.json();
      console.log('[useSiweAuth] Verification successful');

      // Step 5: Get user info
      const meResponse = await fetch(`${API_BASE_URL}/auth/siwe/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!meResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const { userId, address: userAddress } = await meResponse.json();

      // Step 6: Store auth data
      const user = {
        id: userId,
        address: userAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setToken(token, user);
      console.log('[useSiweAuth] Login complete');

      return true;
    } catch (err: any) {
      console.error('[useSiweAuth] Login failed:', err);

      // User-friendly error messages
      let errorMessage = 'Login failed. Please try again.';
      if (err.code === 4001 || err.message?.includes('rejected')) {
        errorMessage = 'Signature request was cancelled';
      } else if (err.message?.includes('nonce') || err.message?.includes('expired')) {
        errorMessage = 'Login expired. Please try again';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection';
      }

      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, provider, providerType, setToken]);

  /**
   * Logout and clear auth data
   */
  const logout = useCallback(async () => {
    await logoutStore();
    setError(null);
  }, [logoutStore]);

  return {
    login,
    logout,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
