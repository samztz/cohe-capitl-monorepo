/**
 * Connect Screen (Landing + Wallet Connection)
 * User flow: Welcome page → Connect wallet
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { useAuthStore } from '../../store/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Connect'>;

export default function ConnectScreen({ navigation }: Props) {
  const mockLogin = useAuthStore((state) => state.mockLogin);

  // TODO: Implement real wallet connection with WalletConnect/MetaMask
  // 1. Show wallet selection modal (WalletConnect, MetaMask, etc.)
  // 2. Request wallet connection via WalletConnect SDK
  // 3. Get user's wallet address
  // 4. Call backend POST /auth/siwe/nonce to get nonce
  // 5. Request user to sign SIWE message with nonce
  // 6. Call backend POST /auth/siwe/verify with signature
  // 7. Receive JWT token and store in auth store
  // 8. Navigate to Products screen
  const handleConnectWallet = () => {
    // Placeholder for real wallet connection
    console.log('TODO: Implement WalletConnect/MetaMask connection');
  };

  /**
   * Mock login for development
   * Sets a fake wallet address and navigates to Products
   */
  const handleMockLogin = () => {
    mockLogin('0x1111111111111111111111111111111111111111');
    navigation.navigate('Products');
  };

  return (
    <View style={styles.container}>
      {/* Shield Icon Placeholder */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🛡️</Text>
      </View>

      <Text variant="displaySmall" style={styles.title}>
        THE FIRST CRYPTO{'\n'}INSURANCE{'\n'}ALTERNATIVE
      </Text>

      <Text variant="bodyMedium" style={styles.subtitle}>
        COVERING CRYPTO SINCE 2025
      </Text>

      {/* Real Wallet Connection (TODO) */}
      <Button
        mode="contained"
        onPress={handleConnectWallet}
        style={styles.button}
        disabled
      >
        Connect Wallet
      </Button>

      <Text variant="bodySmall" style={styles.comingSoon}>
        (WalletConnect integration coming soon)
      </Text>

      <Divider style={styles.divider} />

      {/* Mock Login for Development */}
      <Button
        mode="outlined"
        onPress={handleMockLogin}
        style={styles.mockButton}
        textColor={colors.primary}
      >
        Mock Login (Dev Only)
      </Button>

      <Text variant="bodySmall" style={styles.hint}>
        For development: Skip wallet connection
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 100,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
    letterSpacing: 2,
  },
  button: {
    minWidth: 250,
    marginBottom: spacing.sm,
  },
  comingSoon: {
    color: colors.textTertiary,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  divider: {
    width: '80%',
    marginVertical: spacing.xl,
    backgroundColor: colors.divider,
  },
  mockButton: {
    minWidth: 250,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  hint: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
