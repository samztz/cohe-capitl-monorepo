/**
 * Cohe Capital Mobile App Entry Point
 *
 * IMPORTANT: @walletconnect/react-native-compat MUST be imported first
 * before any other imports to ensure proper polyfills are loaded.
 */

import '@walletconnect/react-native-compat';

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
