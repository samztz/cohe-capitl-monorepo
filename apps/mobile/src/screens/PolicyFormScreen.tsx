/**
 * Policy Form Screen (Insurance Details Form)
 * User fills in wallet address, insurance amount, period
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyForm'>;

export default function PolicyFormScreen({ navigation, route }: Props) {
  const { productId } = route.params;

  const handleSubmit = () => {
    navigation.navigate('ContractSign', { policyId: 'policy-123' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        YULIY SHIELD INSURANCE
      </Text>

      <TextInput
        label="Insurance Wallet Address"
        placeholder="Enter wallet address"
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Insurance Amount"
        placeholder="0"
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <Text variant="bodySmall" style={styles.hint}>
        Max: 8,000,000 USDC
      </Text>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Overview
      </Text>
      <View style={styles.overview}>
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Amount</Text>
          <Text style={styles.value}>600 USDC</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Period</Text>
          <Text style={styles.value}>2025-09-16 - 2026-05-03</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Insurance Cost</Text>
          <Text style={styles.value}>60 USDC</Text>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
      >
        Confirm Insurance
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
  input: {
    marginBottom: spacing.md,
  },
  hint: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  overview: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
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
  button: {
    marginTop: spacing.lg,
  },
});
