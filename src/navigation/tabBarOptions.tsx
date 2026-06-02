import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';

/** Shared bottom-tab styling matching the mockups (white bar, orange active). */
export const sharedTabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textTertiary,
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.sm,
  },
};

/** Builds a tabBarIcon renderer for a given Ionicons glyph. */
export const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} size={size} color={color} />;
