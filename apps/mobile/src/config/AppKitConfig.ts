/**
 * AppKit Configuration for Cohe Capital Mobile
 *
 * IMPORTANT: @walletconnect/react-native-compat MUST be imported first
 * before any other imports to ensure proper polyfills are loaded.
 */

import '@walletconnect/react-native-compat';

import { createAppKit } from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import { bsc, bscTestnet } from 'viem/chains';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Storage } from '@reown/appkit-react-native';

// Get PROJECT_ID from environment
const PROJECT_ID =
  Constants.expoConfig?.extra?.walletConnectProjectId ||
  process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  'e1d4344896342c6efb5aab6396d3ae24';

// Storage implementation using AsyncStorage
const storage: Storage = {
  async getKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys];
    } catch (error) {
      console.error('Failed to get AsyncStorage keys:', error);
      return []; // 错误时返回空数组
    }
  },

  async getEntries(): Promise<[string, any][]> {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    return entries.map(([key, value]) => [
      key,
      value ? JSON.parse(value) : undefined,
    ]);
  },

  async getItem(key: string): Promise<any> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : undefined;
  },

  async setItem(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

// Initialize Ethers adapter
const ethersAdapter = new EthersAdapter();

// Create AppKit instance
export const appKit = createAppKit({
  projectId: PROJECT_ID,
  networks: [bsc, bscTestnet], // BSC Mainnet and Testnet
  defaultNetwork: bscTestnet, // Use testnet by default for testing
  adapters: [ethersAdapter],
  storage,
  metadata: {
    name: 'COHE.CAPITL',
    description: 'The First Crypto Insurance Alternative',
    url: 'https://cohe.capital',
    icons: ['https://cohe.capital/icon.png'],
    redirect: {
      native: 'cohecapitl://',
      universal: 'https://cohe.capital',
    },
  },
});
