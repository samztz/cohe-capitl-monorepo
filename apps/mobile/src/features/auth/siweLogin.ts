/**
 * SIWE Login Implementation
 * Handles the complete wallet login flow with SIWE (Sign-In with Ethereum)
 */

import { useProvider } from '@reown/appkit-react-native';
import { formatSiweMessage } from '../../lib/siweUtil';
import { useAuthStore } from '../../store/authStore';
import Constants from 'expo-constants';

// API Base URL from environment
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE ||
  'http://localhost:3001';

/**
 * SIWE API Service
 */
class SiweAuthService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get a fresh nonce from the backend
   */
  async getNonce(): Promise<{
    nonce: string;
    domain: string;
    uri: string;
    chainId: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/siwe/nonce`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get nonce: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SiweAuthService] Failed to get nonce:', error);
      throw error;
    }
  }

  /**
   * Verify the signed message with the backend
   */
  async verifySignature(message: string, signature: string): Promise<{
    accessToken: string;
    user: {
      id: string;
      address: string;
      createdAt: string;
      updatedAt: string;
    };
    expiresIn: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/siwe/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Verification failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SiweAuthService] Failed to verify signature:', error);
      throw error;
    }
  }
}

// Create singleton instance
const siweService = new SiweAuthService();

/**
 * Login error types
 */
export enum LoginErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  NONCE_FETCH_FAILED = 'NONCE_FETCH_FAILED',
  USER_REJECTED = 'USER_REJECTED',
  SIGNATURE_FAILED = 'SIGNATURE_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Login error with type
 */
export class LoginError extends Error {
  constructor(
    public type: LoginErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'LoginError';
  }
}

/**
 * Main login function - handles the complete SIWE login flow
 *
 * @returns Promise that resolves when login is successful
 * @throws LoginError with specific error type
 */
export async function loginWithWallet(): Promise<void> {
  const authStore = useAuthStore.getState();

  try {
    console.log('[loginWithWallet] Starting SIWE login flow...');
    authStore.setLoading(true);
    authStore.clearError();

    // Step 1: Get the wallet provider
    const { walletProvider } = useProvider();

    if (!walletProvider) {
      throw new LoginError(
        LoginErrorType.WALLET_NOT_CONNECTED,
        'Wallet not connected. Please connect your wallet first.'
      );
    }

    const signer = await walletProvider.getSigner();
    const address = await signer.getAddress();

    console.log('[loginWithWallet] Wallet connected, address:', address);

    // Step 2: Get nonce from backend
    console.log('[loginWithWallet] Fetching nonce...');
    let nonceData;
    try {
      nonceData = await siweService.getNonce();
    } catch (error) {
      throw new LoginError(
        LoginErrorType.NONCE_FETCH_FAILED,
        'Failed to connect to server. Please try again.',
        error
      );
    }

    console.log('[loginWithWallet] Got nonce:', nonceData.nonce);

    // Step 3: Format SIWE message
    const siweMessage = formatSiweMessage({
      domain: nonceData.domain,
      address: address,
      statement: 'Sign in to Cohe Capital',
      uri: nonceData.uri,
      version: '1',
      chainId: nonceData.chainId,
      nonce: nonceData.nonce,
      issuedAt: new Date().toISOString(),
    });

    console.log('[loginWithWallet] Formatted SIWE message');

    // Step 4: Request signature from wallet
    console.log('[loginWithWallet] Requesting signature...');
    let signature: string;
    try {
      signature = await signer.signMessage(siweMessage);
    } catch (error: any) {
      // Check if user rejected
      if (error?.code === 4001 || error?.message?.includes('rejected')) {
        throw new LoginError(
          LoginErrorType.USER_REJECTED,
          'Signature request was rejected',
          error
        );
      }
      throw new LoginError(
        LoginErrorType.SIGNATURE_FAILED,
        'Failed to sign message',
        error
      );
    }

    console.log('[loginWithWallet] Got signature');

    // Step 5: Verify signature with backend
    console.log('[loginWithWallet] Verifying signature...');
    let verificationResult;
    try {
      verificationResult = await siweService.verifySignature(siweMessage, signature);
    } catch (error: any) {
      // Check for specific error types
      if (error.message?.includes('expired') || error.message?.includes('nonce')) {
        throw new LoginError(
          LoginErrorType.VERIFICATION_FAILED,
          'Login expired. Please try again.',
          error
        );
      }
      throw new LoginError(
        LoginErrorType.VERIFICATION_FAILED,
        error.message || 'Verification failed',
        error
      );
    }

    console.log('[loginWithWallet] Verification successful, user:', verificationResult.user);

    // Step 6: Save auth data to store
    await authStore.setToken(verificationResult.accessToken, verificationResult.user);

    console.log('[loginWithWallet] Login complete!');
  } catch (error) {
    console.error('[loginWithWallet] Login failed:', error);

    // If it's already a LoginError, re-throw it
    if (error instanceof LoginError) {
      authStore.setError(getErrorMessage(error.type));
      throw error;
    }

    // Otherwise, wrap it as unknown error
    const unknownError = new LoginError(
      LoginErrorType.UNKNOWN_ERROR,
      'An unexpected error occurred',
      error
    );
    authStore.setError(getErrorMessage(unknownError.type));
    throw unknownError;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(errorType: LoginErrorType): string {
  switch (errorType) {
    case LoginErrorType.WALLET_NOT_CONNECTED:
      return 'Please connect your wallet first';
    case LoginErrorType.NONCE_FETCH_FAILED:
      return 'Network error. Please check your connection';
    case LoginErrorType.USER_REJECTED:
      return 'Signature request cancelled';
    case LoginErrorType.SIGNATURE_FAILED:
      return 'Failed to sign message';
    case LoginErrorType.VERIFICATION_FAILED:
      return 'Login expired. Please try again';
    case LoginErrorType.NETWORK_ERROR:
      return 'Network error. Please try again';
    default:
      return 'An error occurred. Please try again';
  }
}

/**
 * Hook to use login functionality in components
 */
export function useWalletLogin() {
  const { isLoading, error, clearError } = useAuthStore();

  return {
    login: loginWithWallet,
    isLoading,
    error,
    clearError,
  };
}