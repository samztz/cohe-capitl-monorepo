/**
 * Reset Authentication Utility (Dev Tool)
 *
 * Provides a comprehensive logout mechanism that:
 * 1. Disconnects WalletConnect session via AppKit
 * 2. Clears SecureStore (JWT, user data)
 * 3. Clears AsyncStorage (WalletConnect, AppKit cache)
 *
 * Usage: Call resetAuth() from dev screens or temporary logout buttons
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys used by the app
const JWT_STORAGE_KEY = 'auth_jwt_token';
const USER_STORAGE_KEY = 'auth_user_data';

// Patterns to match WalletConnect/AppKit related keys
const WC_KEY_PATTERNS = [
  'wc@2:',      // WalletConnect v2 protocol
  '@reown',     // Reown/AppKit storage
  'walletconnect', // Generic WalletConnect storage
  '@w3m',       // Web3Modal/AppKit
  'W3M_',       // Web3Modal prefix
];

export interface ResetAuthOptions {
  disconnect?: () => Promise<void>;
}

export interface ResetAuthResult {
  success: boolean;
  removedKeys: string[];
  errors: string[];
}

/**
 * Securely delete item from SecureStore or localStorage (web)
 */
async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      // Key might not exist, that's okay
      console.log(`[resetAuth] SecureStore key not found: ${key}`);
    }
  }
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
  const removedKeys: string[] = [];
  const errors: string[] = [];

  console.log('[resetAuth] Starting full authentication reset...');

  try {
    // Step 1: Disconnect WalletConnect session
    if (options.disconnect) {
      try {
        console.log('[resetAuth] Disconnecting WalletConnect session...');
        await options.disconnect();
        console.log('[resetAuth] ✓ WalletConnect disconnected');
      } catch (error) {
        const errorMsg = `Failed to disconnect WalletConnect: ${error}`;
        console.error(`[resetAuth] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Step 2: Clear SecureStore (JWT and user data)
    try {
      console.log('[resetAuth] Clearing SecureStore...');
      await secureDelete(JWT_STORAGE_KEY);
      await secureDelete(USER_STORAGE_KEY);
      removedKeys.push(JWT_STORAGE_KEY, USER_STORAGE_KEY);
      console.log('[resetAuth] ✓ SecureStore cleared');
    } catch (error) {
      const errorMsg = `Failed to clear SecureStore: ${error}`;
      console.error(`[resetAuth] ${errorMsg}`);
      errors.push(errorMsg);
    }

    // Step 3: Clear AsyncStorage (WalletConnect, AppKit, and auth keys)
    try {
      console.log('[resetAuth] Scanning AsyncStorage...');
      const allKeys = await AsyncStorage.getAllKeys();
      console.log(`[resetAuth] Found ${allKeys.length} total keys in AsyncStorage`);

      // Filter keys that match WalletConnect/AppKit patterns or auth keys
      const keysToRemove = allKeys.filter((key) => {
        // Check if key matches any WalletConnect pattern
        const matchesWcPattern = WC_KEY_PATTERNS.some((pattern) =>
          key.startsWith(pattern) || key.includes(pattern)
        );

        // Also remove auth keys if they exist in AsyncStorage
        const isAuthKey = [JWT_STORAGE_KEY, USER_STORAGE_KEY].includes(key);

        return matchesWcPattern || isAuthKey;
      });

      if (keysToRemove.length > 0) {
        console.log(`[resetAuth] Removing ${keysToRemove.length} keys from AsyncStorage:`);
        console.log('[resetAuth] Keys to remove:', keysToRemove);

        await AsyncStorage.multiRemove(keysToRemove);
        removedKeys.push(...keysToRemove);
        console.log('[resetAuth] ✓ AsyncStorage cleared');
      } else {
        console.log('[resetAuth] No WalletConnect/AppKit keys found in AsyncStorage');
      }
    } catch (error) {
      const errorMsg = `Failed to clear AsyncStorage: ${error}`;
      console.error(`[resetAuth] ${errorMsg}`);
      errors.push(errorMsg);
    }

    // Step 4: Log summary
    const success = errors.length === 0;
    console.log('[resetAuth] ========================================');
    console.log(`[resetAuth] Reset completed: ${success ? 'SUCCESS' : 'WITH ERRORS'}`);
    console.log(`[resetAuth] Removed ${removedKeys.length} storage keys`);
    if (removedKeys.length > 0) {
      console.log('[resetAuth] Removed keys:', removedKeys);
    }
    if (errors.length > 0) {
      console.log(`[resetAuth] Encountered ${errors.length} errors:`, errors);
    }
    console.log('[resetAuth] ========================================');

    return {
      success,
      removedKeys,
      errors,
    };
  } catch (error) {
    const errorMsg = `Unexpected error during reset: ${error}`;
    console.error(`[resetAuth] ${errorMsg}`);
    errors.push(errorMsg);

    return {
      success: false,
      removedKeys,
      errors,
    };
  }
}

/**
 * Get a summary of storage keys (for debugging)
 */
export async function getStorageSummary(): Promise<{
  asyncStorageKeys: string[];
  wcRelatedKeys: string[];
  totalKeys: number;
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const wcRelatedKeys = allKeys.filter((key) =>
      WC_KEY_PATTERNS.some((pattern) =>
        key.startsWith(pattern) || key.includes(pattern)
      )
    );

    return {
      asyncStorageKeys: allKeys,
      wcRelatedKeys,
      totalKeys: allKeys.length,
    };
  } catch (error) {
    console.error('[resetAuth] Failed to get storage summary:', error);
    return {
      asyncStorageKeys: [],
      wcRelatedKeys: [],
      totalKeys: 0,
    };
  }
}
