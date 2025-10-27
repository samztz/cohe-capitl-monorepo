/**
 * Connect Screen (Landing + Wallet Connection)
 * User flow: Welcome page → Connect wallet
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Connect'>;

export default function ConnectScreen({ navigation }: Props) {
  const handleConnect = () => {
    // TODO: Implement wallet connection
    navigation.navigate('Products');
  };

  return (
    <View style={styles.container}>
      <Text variant="displaySmall" style={styles.title}>
        Connect Wallet
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Connect your wallet to get started
      </Text>
      <Button mode="contained" onPress={handleConnect} style={styles.button}>
        Connect Wallet
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    minWidth: 200,
  },
});
