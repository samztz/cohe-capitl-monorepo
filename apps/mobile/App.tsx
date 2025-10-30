/**
 * Cohe Capital Mobile App
 * Web3 Insurance DApp
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppKit } from '@reown/appkit-react-native';
import AppProviders from './src/providers/AppProviders';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
      <AppKit />
    </AppProviders>
  );
}
