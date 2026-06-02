import React from 'react';
import { Image, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius } from '@/theme';
import { Text } from './Text';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  /** Background for the initials fallback. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

export function Avatar({ uri, name, size = 48, color = colors.primarySoft, style }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    // `style` is typed as ViewStyle for the common (fallback) case; Image accepts
    // the same layout props we use here (size/borderRadius).
    return <Image source={{ uri }} style={[dimension, style as object]} />;
  }

  return (
    <View style={[styles.fallback, dimension, { backgroundColor: color }, style]}>
      <Text
        style={{ fontSize: size * 0.4, fontWeight: '700', color: colors.primary }}
      >
        {initials(name).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
