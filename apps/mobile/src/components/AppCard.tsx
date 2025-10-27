/**
 * AppCard Component
 * Card container following design specs
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../theme';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export default function AppCard({
  children,
  style,
  elevated = false,
}: AppCardProps) {
  return (
    <View style={[styles.card, elevated && shadows.medium, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
});
