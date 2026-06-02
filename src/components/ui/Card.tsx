import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadows } from '@/theme';

export interface CardProps extends ViewProps {
  padded?: boolean;
  elevation?: keyof typeof shadows;
  style?: ViewStyle | ViewStyle[];
}

/** White rounded surface with a soft shadow — the core building block of the UI. */
export function Card({
  padded = true,
  elevation = 'sm',
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[styles.card, shadows[elevation], padded && styles.padded, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
});
