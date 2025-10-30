import { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Cohe Capital',
  slug: 'cohe-capital-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/cohe-capitl-app-logo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.cohecapital.mobile',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.cohecapital.mobile',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3001',
    chainId: process.env.EXPO_PUBLIC_CHAIN_ID || '97', // BSC Testnet
  },
});
