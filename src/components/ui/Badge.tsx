import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

export interface BadgeProps {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
