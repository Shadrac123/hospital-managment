import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/theme';
import { Text, IconButton } from '@/components/ui';

export interface GreetingHeaderProps {
  greeting: string;
  name: string;
  subtitle?: string;
  onBellPress?: () => void;
  hasNotifications?: boolean;
  showNotifications?: boolean;
}

/** Top header used on Home/Dashboard: greeting block + notification bell. */
export function GreetingHeader({
  greeting,
  name,
  subtitle,
  onBellPress,
  hasNotifications,
  showNotifications = true,
}: GreetingHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text variant="h1">{greeting}</Text>
        {subtitle ? (
          <Text variant="bodyMuted" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showNotifications ? (
        <IconButton
          name="notifications-outline"
          onPress={onBellPress}
          badge={hasNotifications}
          accessibilityLabel="Notifications"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  textBlock: { flex: 1, paddingRight: spacing.md },
  subtitle: { marginTop: 2 },
});
