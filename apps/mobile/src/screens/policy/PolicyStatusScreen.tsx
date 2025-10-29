/**
 * Policy Status Screen
 * Shows policy details with countdown
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyStatus'>;

export default function PolicyStatusScreen({ navigation, route }: Props) {
  const { policyId } = route.params;

  const handleBackToHome = () => {
    navigation.navigate('Connect');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Policy Status
      </Text>

      <View style={styles.card}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.policyId}>
            Policy #{policyId}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Coverage Details
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Insurance Amount</Text>
            <Text style={styles.value}>600 USDC</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Premium Paid</Text>
            <Text style={styles.value}>60 USDC</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Start Date</Text>
            <Text style={styles.value}>2025-09-16</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>End Date</Text>
            <Text style={styles.value}>2026-05-03</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Time Remaining
          </Text>
          <Text variant="displaySmall" style={styles.countdown}>
            89d 20h 59m 30s
          </Text>
        </View>
      </View>

      <Button
        mode="outlined"
        onPress={handleBackToHome}
        style={styles.button}
      >
        Back to Home
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  policyId: {
    color: colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
  },
  value: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  countdown: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    borderColor: colors.primary,
  },
});
