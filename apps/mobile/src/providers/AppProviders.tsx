/**
 * App Providers
 * Wraps app with necessary context providers
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKitProvider, AppKit } from '@reown/appkit-react-native';
import { appKit } from '../config/AppKitConfig';
import { theme } from '../theme';

interface AppProvidersProps {
  children: React.ReactNode;
}

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider instance={appKit}>
          <PaperProvider theme={theme}>{children}</PaperProvider>
        </AppKitProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
