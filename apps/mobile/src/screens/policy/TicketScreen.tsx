/**
 * Ticket Screen (Success / Policy Confirmation)
 * Shows insurance success and policy details
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Ticket'>;

export default function TicketScreen({ navigation, route }: Props) {
  const { policyId } = route.params;

  const handleViewStatus = () => {
    navigation.navigate('PolicyStatus', { policyId });
  };

  return (
    <View style={styles.container}>
      {/* Shield icon placeholder */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🛡️</Text>
      </View>

      <Text variant="displaySmall" style={styles.title}>
        CONGRATULATIONS
      </Text>
      <Text variant="headlineMedium" style={styles.subtitle}>
        YOU SUCCESSFULLY INSURED !!!
      </Text>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>✓ Securiting</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Amount</Text>
          <Text style={styles.value}>600 USDC</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Cost</Text>
          <Text style={styles.value}>60 USDC</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Period</Text>
          <Text style={styles.value}>2025-09-16 - 2026-05-03</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Guarantee Countdown</Text>
          <Text style={styles.value}>89DAYS 20H 59M 30S</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleViewStatus}
        style={styles.button}
      >
        View Policy Status
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textPrimary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  statusText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  details: {
    width: '100%',
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
    minWidth: 250,
  },
});
