/**
 * Theme Configuration
 * Based on design specs: Dark theme with golden accents
 */

import { MD3DarkTheme } from 'react-native-paper';

/**
 * Color tokens from design
 */
export const colors = {
  // Primary brand colors
  primary: '#FDB022', // Golden yellow (buttons, highlights)
  primaryDark: '#E59E1A',
  primaryLight: '#FFBB3F',

  // Background colors
  background: '#1A1D29', // Main dark background
  surface: '#252836', // Card/surface background
  surfaceLight: '#2D3142',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B3C1',
  textTertiary: '#6C6F7E',

  // Accent colors
  success: '#4CAF50', // Green for checkmarks
  error: '#FF4444', // Red for errors
  warning: '#FFA726',
  info: '#29B6F6',

  // Special colors
  olive: '#7D7C4A', // Olive green for special buttons
  divider: '#3A3E52',

  // Status colors
  active: '#4CAF50',
  pending: '#FFA726',
  rejected: '#FF4444',
  underReview: '#29B6F6',
};

/**
 * Spacing scale (px)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Typography scale
 */
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

/**
 * Border radius tokens
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

/**
 * Shadow presets
 */
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * React Native Paper theme (MD3)
 */
export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.olive,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceLight,
    error: colors.error,
    onPrimary: colors.background,
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
    outline: colors.divider,
  },
  roundness: borderRadius.lg,
};

/**
 * Type exports
 */
export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
