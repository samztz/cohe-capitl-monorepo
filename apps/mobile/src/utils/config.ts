/**
 * Application configuration
 * Reads environment variables using expo-constants
 */

import Constants from 'expo-constants';

interface AppConfig {
  apiBaseUrl: string;
  chainId: string;
}

const config: AppConfig = {
  apiBaseUrl: Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3001',
  chainId: Constants.expoConfig?.extra?.chainId || '97',
};

export default config;
