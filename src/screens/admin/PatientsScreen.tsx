import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Text, Card, Avatar, Badge } from '@/components/ui';
import { SearchBar, EmptyState } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { usePatients } from '@/hooks';
import { calculateAge } from '@/utils/patientCard';
import { AdminTabParamList, AdminStackParamList } from '@/navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'Patients'>,
  NativeStackScreenProps<AdminStackParamList>
>;

const FILTERS = ['All', 'Active', 'Archived'] as const;
type Filter = (typeof FILTERS)[number];

export function PatientsScreen({ navigation }: Props) {
  const { patients, loading } = usePatients();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return patients
      .filter((p) => {
        if (filter === 'Active') return p.isActive !== false;
        if (filter === 'Archived') return p.isActive === false;
        return true;
      })
      .filter((p) => {
        if (!term) return true;
        return (
          p.displayName.toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term) ||
          (p.phone ?? '').toLowerCase().includes(term) ||
          p.uid.toLowerCase().includes(term)
        );
      });
  }, [patients, search, filter]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">Patients</Text>
        <Text variant="bodyMuted" style={styles.subtitle}>
          {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <SearchBar
        placeholder="Search name, email, phone or ID"
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
          <EmptyState icon="hourglass-outline" title="Loading patients…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="people-circle-outline"
            title="No patients found"
            message={
              search
                ? 'Try a different search term.'
                : 'Registered patients will appear here.'
            }
          />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(p) => p.uid}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.gap} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const age = calculateAge(item.dateOfBirth);
              const archived = item.isActive === false;
              return (
                <Pressable
                  onPress={() =>
                    navigation.navigate('PatientDetails', { patientId: item.uid })
                  }
                >
                  <Card style={styles.row}>
                    <Avatar
                      name={item.displayName}
                      uri={item.photoURL ?? undefined}
                      size={46}
                    />
                    <View style={styles.rowText}>
                      <Text variant="h3" numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      <Text variant="caption" numberOfLines={1}>
                        {item.email}
                      </Text>
                      {age !== null ? (
                        <Text variant="caption" color={colors.textTertiary}>
                          Age {age}
                          {item.gender ? ` · ${item.gender}` : ''}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      label={archived ? 'Archived' : 'Active'}
                      tone={archived ? 'neutral' : 'success'}
                    />
                  </Card>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: 2 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
});
