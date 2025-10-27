/**
 * Contract Sign Screen
 * User reviews contract, uploads credentials, adds signature
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ContractSign'>;

export default function ContractSignScreen({ navigation, route }: Props) {
  const { policyId } = route.params;

  const handleSign = () => {
    navigation.navigate('Pay', { policyId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Sign Contract
      </Text>

      {/* Contract content preview */}
      <View style={styles.contractBox}>
        <Text style={styles.contractText}>
          这里是合同内容
        </Text>
      </View>

      <Button mode="outlined" style={styles.confirmButton}>
        Have Read And Confirmed ✓
      </Button>

      <TextInput
        label="Insurance Tel"
        placeholder="Enter Tel"
        mode="outlined"
        style={styles.input}
      />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        UPLOAD CREDENTIALS
      </Text>
      <View style={styles.uploadBox}>
        <Text style={styles.uploadText}>📷</Text>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>
        SIGNATURE AUTHENTICATION
      </Text>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureText}>✏️ Click Add signature</Text>
      </View>

      <Button
        mode="contained"
        onPress={handleSign}
        style={styles.button}
      >
        Confirmed
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
  contractBox: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 12,
    minHeight: 200,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contractText: {
    color: colors.textSecondary,
  },
  confirmButton: {
    marginBottom: spacing.xl,
    borderColor: colors.olive,
  },
  input: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontSize: 12,
    letterSpacing: 1,
  },
  uploadBox: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 12,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadText: {
    fontSize: 48,
  },
  signatureBox: {
    backgroundColor: colors.olive,
    padding: spacing.xl,
    borderRadius: 12,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  signatureText: {
    color: colors.textPrimary,
  },
  button: {
    marginTop: spacing.lg,
  },
});
