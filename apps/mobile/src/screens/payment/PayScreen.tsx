/**
 * Pay Screen
 * User confirms payment and submits transaction
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Pay'>;

export default function PayScreen({ navigation, route }: Props) {
  const { policyId } = route.params;

  const handlePay = () => {
    navigation.navigate('Ticket', { policyId });
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Payment
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Policy ID</Text>
          <Text style={styles.value}>{policyId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Cost</Text>
          <Text style={styles.value}>60 USDC</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>USDT (BSC)</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handlePay}
        style={styles.button}
      >
        Confirm Payment
      </Button>

      <Text variant="bodySmall" style={styles.hint}>
        Please confirm the transaction in your wallet
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  button: {
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
