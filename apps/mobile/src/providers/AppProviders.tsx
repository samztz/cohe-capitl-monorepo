/**
 * App Providers
 * Wraps app with necessary context providers
 */

import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </QueryClientProvider>
  );
}
