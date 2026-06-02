import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Text, Button } from '@/components/ui';
import { EmptyState, BookingCard } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { usePatientBookings } from '@/hooks';
import { PatientTabParamList, PatientStackParamList } from '@/navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PatientTabParamList, 'Schedule'>,
  NativeStackScreenProps<PatientStackParamList>
>;

const TABS = ['Upcoming', 'Past'] as const;
type Tab = (typeof TABS)[number];

export function ScheduleScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('Upcoming');
  const { bookings, loading } = usePatientBookings(user?.uid);

  const visible = useMemo(
    () =>
      bookings.filter((b) =>
        tab === 'Upcoming'
          ? b.status === 'pending' || b.status === 'assigned'
          : b.status === 'completed' || b.status === 'cancelled',
      ),
    [bookings, tab],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">Schedule</Text>
        <Text variant="bodyMuted" style={styles.subtitle}>
          Manage your appointments
        </Text>
      </View>

      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text variant="label" color={active ? colors.textInverse : colors.textSecondary}>
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {loading ? (
          <EmptyState icon="hourglass-outline" title="Loading…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            title={tab === 'Upcoming' ? 'No upcoming appointments' : 'No past appointments'}
            message={
              tab === 'Upcoming'
                ? 'Book a consultation and it will show up here.'
                : 'Your appointment history will appear here.'
            }
          />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.gap} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <BookingCard booking={item} perspective="patient" />
            )}
          />
        )}
      </View>

      <Button
        title="Book New Appointment"
        icon="add"
        onPress={() => navigation.navigate('Booking')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: { backgroundColor: colors.primary },
  body: { flex: 1, marginTop: spacing.lg },
  list: { paddingBottom: spacing.lg },
  gap: { height: spacing.md },
});
