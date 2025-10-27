/**
 * Products Screen (Insurance Product List)
 * Shows available insurance SKUs
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

export default function ProductsScreen({ navigation }: Props) {
  const handleSelectProduct = (productId: string) => {
    navigation.navigate('PolicyForm', { productId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Insurance Products
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Select an insurance product
      </Text>

      {/* Placeholder product cards */}
      <View style={styles.card}>
        <Text variant="titleLarge" style={styles.cardTitle}>
          YULIY SHIELD INSURANCE
        </Text>
        <Text variant="bodyMedium" style={styles.cardDescription}>
          Coverage for Coinbase Custody claims
        </Text>
        <Button
          mode="contained"
          onPress={() => handleSelectProduct('sku-1')}
          style={styles.button}
        >
          Select
        </Button>
      </View>
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
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});
