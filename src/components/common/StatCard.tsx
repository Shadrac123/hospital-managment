import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tint?: string;
  tintBg?: string;
}

/** Small overview tile for the admin dashboard. Value is a placeholder until Phase 2. */
export function StatCard({
  icon,
  value,
  label,
  tint = colors.primary,
  tintBg = colors.primarySoft,
}: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text variant="h1" style={styles.value}>
        {value}
      </Text>
      <Text variant="caption">{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: spacing.sm },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { marginTop: spacing.xs },
});
