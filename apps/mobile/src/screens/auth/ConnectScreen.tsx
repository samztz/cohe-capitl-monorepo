/**
 * Connect Screen - Welcome Page
 * Matches design: docs/designs/欢迎页面.png
 * Implements SIWE (Sign-In with Ethereum) login flow using official AppKit hooks
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppKit, useAccount } from '@reown/appkit-react-native';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useSiweAuth } from '../../hooks/useSiweAuth';
import { resetAuth } from '../../dev/resetAuth';

type Props = NativeStackScreenProps<RootStackParamList, 'Connect'>;

const { width } = Dimensions.get('window');

export default function ConnectScreen({ navigation }: Props) {
  // AppKit hooks
  const { open, disconnect } = useAppKit();
  const { address, isConnected } = useAccount();

  // Auth hooks
  const { isAuthenticated, user, loadStoredAuth } = useAuthStore();
  const { login, isLoading: isSiweLoading, error: siweError, clearError } = useSiweAuth();

  // Local state
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Auto-trigger SIWE login when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated && !isSiweLoading) {
      console.log('[ConnectScreen] Wallet connected, starting SIWE login...');
      handleSiweLogin();
    }
  }, [isConnected, address, isAuthenticated]);

  // Navigate to Products when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[ConnectScreen] User authenticated:', user.address);
      setTimeout(() => {
        navigation.navigate('Products');
      }, 1000);
    }
  }, [isAuthenticated, user, navigation]);

  /**
   * Handle wallet connection
   */
  const handleConnectWallet = async () => {
    try {
      setLocalError(null);
      clearError();

      if (isConnected && !isAuthenticated) {
        // Already connected, just need SIWE login
        await handleSiweLogin();
      } else {
        // Open AppKit modal to connect wallet
        console.log('[ConnectScreen] Opening AppKit modal...');
        await open();
      }
    } catch (error) {
      console.error('[ConnectScreen] Error:', error);
      setLocalError('Failed to connect wallet');
    }
  };

  /**
   * Handle SIWE login
   */
  const handleSiweLogin = async () => {
    const success = await login();
    if (!success && siweError) {
      Alert.alert('Login Failed', siweError, [{ text: 'OK' }]);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('[ConnectScreen] Starting logout...');

      const result = await resetAuth({ disconnect });

      console.log('[ConnectScreen] Logout completed:', result);

      Alert.alert(
        'Logged Out',
        `Successfully logged out and cleared ${result.removedKeys.length} storage keys.`,
        [{ text: 'OK', onPress: () => setLocalError(null) }]
      );
    } catch (error) {
      console.error('[ConnectScreen] Logout error:', error);
      Alert.alert('Logout Error', 'Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Format address as 0xAb...1234
   */
  const getShortAddress = (): string => {
    const displayAddress = user?.address || address;
    if (!displayAddress) return '';
    return `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`;
  };

  // Get current error message
  const errorMessage = localError || siweError;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F111A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoTitleContainer}>
          <Image
            source={require('../../../assets/cohe-capitl-app-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titleText}>COHE.CAPITL</Text>
        </View>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleLogout}
          activeOpacity={0.8}
          disabled={isLoggingOut}
        >
          <Text style={styles.contactButtonText}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.shieldContainer}>
          <Image
            source={require('../../../assets/welcome-logo.png')}
            style={styles.shieldImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            THE <Text style={styles.titleHighlight}>FIRST</Text> CRYPTO
          </Text>
          <Text style={styles.title}>INSURANCE</Text>
          <Text style={styles.title}>ALTERNATIVE</Text>
        </View>

        <Text style={styles.subtitle}>COVERING CRYPTO SINCE 2025</Text>
      </View>

      {/* Connect Button or Status */}
      <View style={styles.bottomSection}>
        {isAuthenticated && user ? (
          // Authenticated - Show user address
          <View style={styles.connectedContainer}>
            <Text style={styles.connectedLabel}>Signed In</Text>
            <Text style={styles.connectedAddress}>{getShortAddress()}</Text>
            <Text style={styles.navigatingText}>Navigating to insurance products...</Text>
          </View>
        ) : isSiweLoading ? (
          // Signing In - Show loading
          <View style={styles.connectedContainer}>
            <ActivityIndicator size="large" color="#FFD54F" />
            <Text style={styles.signingInText}>Signing in with wallet...</Text>
            <Text style={styles.signingInSubtext}>Please check your wallet</Text>
          </View>
        ) : isConnected && !isAuthenticated ? (
          // Connected but not authenticated - Show signing prompt
          <View style={styles.connectedContainer}>
            <Text style={styles.connectedLabel}>Wallet Connected</Text>
            <Text style={styles.connectedAddress}>{getShortAddress()}</Text>
            <TouchableOpacity
              style={[styles.connectButton, styles.signButton]}
              onPress={handleSiweLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.connectButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Not connected - Show connect button
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectWallet}
            activeOpacity={0.9}
          >
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </TouchableOpacity>
        )}

        {/* Error Message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F111A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  logoTitleContainer: {
    width: 'auto',
    display: 'flex',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    borderRadius: 4,
  },
  titleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logo: {
    width: 32,
    height: 32,
  },
  contactButton: {
    backgroundColor: '#FFD54F',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#0F111A',
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  shieldContainer: {
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldImage: {
    width: width * 0.65,
    height: width * 0.65,
    maxWidth: 280,
    maxHeight: 280,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 36,
  },
  titleHighlight: {
    color: '#FFD54F',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#FFD54F',
    width: '70%',
    minWidth: 200,
    maxWidth: 280,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD54F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  connectButtonText: {
    color: '#0F111A',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  connectedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  connectedLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  connectedAddress: {
    color: '#FFD54F',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  navigatingText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
  signButton: {
    marginTop: 12,
  },
  signingInText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  signingInSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  errorContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    maxWidth: 280,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
});
