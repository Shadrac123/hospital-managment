import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Screen, Text } from '@/components/ui';
import { SearchBar, EmptyState } from '@/components/common';
import { colors, spacing } from '@/theme';

const TABS = ['Inbox', 'Appointments'] as const;
type Tab = (typeof TABS)[number];

export function MessagesScreen() {
  const [tab, setTab] = useState<Tab>('Inbox');

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text variant="h1">Messages</Text>
      </View>

      <SearchBar placeholder="Search messages" />

      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={styles.tab}>
              <Text variant="label" color={active ? colors.primary : colors.textSecondary}>
                {t}
              </Text>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>

      <EmptyState
        icon="chatbubbles-outline"
        title="No messages yet"
        message={
          tab === 'Inbox'
            ? 'Messages from your care team will appear here.'
            : 'Appointment updates will appear here.'
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { marginBottom: spacing.lg },
  tabs: {
    flexDirection: 'row',
    gap: spacing['2xl'],
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: { alignItems: 'center', paddingBottom: spacing.md },
  indicator: {
    height: 2,
    width: 24,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: spacing.sm,
  },
  indicatorActive: { backgroundColor: colors.primary },
});
