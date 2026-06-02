import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Text } from '@/components/ui';
import { SearchBar, EmptyState, BookingCard } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { useAllBookings } from '@/hooks';
import { BookingStatus } from '@/types/models';
import { AdminTabParamList, AdminStackParamList } from '@/navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'Bookings'>,
  NativeStackScreenProps<AdminStackParamList>
>;

const FILTERS = ['All', 'Pending', 'Assigned', 'Completed'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_STATUS: Record<Exclude<Filter, 'All'>, BookingStatus> = {
  Pending: 'pending',
  Assigned: 'assigned',
  Completed: 'completed',
};

export function BookingsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const { bookings, loading } = useAllBookings();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings
      .filter((b) => (filter === 'All' ? true : b.status === FILTER_STATUS[filter]))
      .filter((b) =>
        term
          ? b.patientName.toLowerCase().includes(term) ||
            (b.doctorName ?? '').toLowerCase().includes(term)
          : true,
      );
  }, [bookings, filter, search]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">Bookings</Text>
        <Text variant="bodyMuted" style={styles.subtitle}>
          Manage all appointments
        </Text>
      </View>

      <SearchBar
        placeholder="Search patients or doctors"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text
                variant="caption"
                color={active ? colors.textInverse : colors.textSecondary}
              >
                {f}
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
            icon="documents-outline"
            title="No bookings"
            message={`No ${filter.toLowerCase()} bookings to show yet.`}
          />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.gap} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <BookingCard
                booking={item}
                perspective="admin"
                onPress={() =>
                  navigation.navigate('BookingDetails', { bookingId: item.id })
                }
              />
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: 2 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  body: { flex: 1, marginTop: spacing.lg },
  list: { paddingBottom: spacing.lg },
  gap: { height: spacing.md },
});
