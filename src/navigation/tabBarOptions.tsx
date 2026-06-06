import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';

/**
 * Shared bottom-tab styling matching the mockups (white bar, orange active).
 *
 * Pass the device's bottom safe-area inset (from `useSafeAreaInsets`) so the
 * bar floats above Android's system navigation bar (gesture/3-button) instead
 * of sitting underneath it. A minimum keeps spacing on devices that report 0.
 */
export const buildTabScreenOptions = (
  bottomInset: number
): BottomTabNavigationOptions => {
  const minPad = Platform.OS === 'ios' ? spacing['2xl'] : spacing.sm;
  const paddingBottom = Math.max(bottomInset, minPad);
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textTertiary,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: (Platform.OS === 'ios' ? 64 : 56) + paddingBottom,
      paddingTop: spacing.sm,
      paddingBottom,
    },
  };
};

/** Builds a tabBarIcon renderer for a given Ionicons glyph. */
export const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} size={size} color={color} />;
