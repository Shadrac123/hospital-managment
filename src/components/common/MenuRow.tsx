import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Text } from '@/components/ui';

export interface MenuRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  /** Override the left icon tint (e.g. danger for Log Out). */
  tint?: string;
  showChevron?: boolean;
}

export function MenuRow({
  icon,
  label,
  onPress,
  tint = colors.textPrimary,
  showChevron = true,
}: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.iconBg }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text variant="body" color={tint} style={styles.label}>
        {label}
      </Text>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.6 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: { flex: 1 },
});
