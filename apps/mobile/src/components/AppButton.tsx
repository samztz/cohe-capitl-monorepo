/**
 * AppButton Component
 * Custom button following design specs
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, ButtonProps } from 'react-native-paper';
import { colors, borderRadius, spacing } from '../theme';

interface AppButtonProps extends Omit<ButtonProps, 'children'> {
  children: string;
  variant?: 'primary' | 'secondary' | 'olive';
}

export default function AppButton({
  children,
  variant = 'primary',
  mode = 'contained',
  style,
  ...props
}: AppButtonProps) {
  const buttonStyle = [
    styles.button,
    variant === 'olive' && styles.olive,
    style,
  ];

  const buttonColor =
    variant === 'olive'
      ? colors.olive
      : variant === 'secondary'
      ? colors.surface
      : colors.primary;

  return (
    <Button
      mode={mode}
      buttonColor={buttonColor}
      textColor={colors.textPrimary}
      style={buttonStyle}
      contentStyle={styles.content}
      labelStyle={styles.label}
      {...props}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
  },
  content: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  olive: {
    backgroundColor: colors.olive,
  },
});
