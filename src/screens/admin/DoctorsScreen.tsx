import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Screen, Text, IconButton, Card, Avatar, Badge } from '@/components/ui';
import { SearchBar, EmptyState } from '@/components/common';
import { spacing } from '@/theme';
import { useDoctors } from '@/hooks';
import { seedDoctorsIfEmpty } from '@/services/firebase';

export function DoctorsScreen() {
  const { doctors, loading } = useDoctors();
  const [search, setSearch] = useState('');

  // Bootstrap a real, assignable medical team on first run (one-time Firestore
  // write, not in-memory mock data).
  useEffect(() => {
    seedDoctorsIfEmpty().catch(() => {
      /* ignored — rules or offline; admins can add doctors manually later */
    });
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.specialty.toLowerCase().includes(term),
    );
  }, [doctors, search]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text variant="h1">Doctors</Text>
          <Text variant="bodyMuted" style={styles.subtitle}>
            Manage your medical team
          </Text>
        </View>
        <IconButton name="add" accessibilityLabel="Add doctor" />
      </View>

      <SearchBar placeholder="Search doctors" value={search} onChangeText={setSearch} />

      <View style={styles.body}>
        {loading ? (
          <EmptyState icon="hourglass-outline" title="Loading…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="people-circle-outline"
            title="No doctors found"
            message="Doctors you add will appear here."
          />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(d) => d.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.gap} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Card style={styles.doctorCard}>
                <Avatar name={item.name} uri={item.photoURL ?? undefined} size={48} />
                <View style={styles.doctorText}>
                  <Text variant="h3" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="caption">{item.specialty}</Text>
                </View>
                <Badge
                  label={item.available ? 'Available' : 'Off'}
                  tone={item.available ? 'success' : 'neutral'}
                />
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleBlock: { flex: 1 },
  subtitle: { marginTop: 2 },
  body: { flex: 1, marginTop: spacing.lg },
  list: { paddingBottom: spacing.lg },
  gap: { height: spacing.md },
  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doctorText: { flex: 1, gap: 2 },
});
