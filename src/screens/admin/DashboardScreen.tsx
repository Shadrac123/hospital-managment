import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, Text, Card, SectionHeader } from '@/components/ui';
import { GreetingHeader, StatCard, EmptyState, BookingCard } from '@/components/common';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { useAllBookings, useDoctors } from '@/hooks';
import { AdminTabParamList, AdminStackParamList } from '@/navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'Dashboard'>,
  NativeStackScreenProps<AdminStackParamList>
>;

export function DashboardScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Admin';
  const { bookings } = useAllBookings();
  const { doctors } = useDoctors();

  const stats = useMemo(() => {
    const uniquePatients = new Set(bookings.map((b) => b.patientId)).size;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const assigned = bookings.filter((b) => b.status === 'assigned').length;
    return { uniquePatients, pending, assigned };
  }, [bookings]);

  const recent = bookings.slice(0, 3);

  return (
    <Screen scroll>
      <GreetingHeader greeting="Dashboard" name={firstName} hasNotifications />

      {/* Welcome banner */}
      <View style={[styles.banner, shadows.md]}>
        <View>
          <Text variant="h3" color={colors.textInverse}>
            Welcome back, {firstName}
          </Text>
          <Text variant="caption" color={colors.textInverse} style={styles.bannerSub}>
            Here&apos;s your clinic at a glance
          </Text>
        </View>
      </View>

      {/* Overview */}
      <View style={styles.section}>
        <SectionHeader title="Overview" />
        <View style={styles.statRow}>
          <StatCard icon="people-outline" value={String(stats.uniquePatients)} label="Patients" />
          <StatCard
            icon="time-outline"
            value={String(stats.pending)}
            label="Pending"
            tint={colors.warning}
            tintBg={colors.warningSoft}
          />
        </View>
        <View style={[styles.statRow, styles.statRowGap]}>
          <StatCard
            icon="checkmark-done-outline"
            value={String(stats.assigned)}
            label="Assigned"
            tint={colors.success}
            tintBg={colors.successSoft}
          />
          <StatCard
            icon="medkit-outline"
            value={String(doctors.length)}
            label="Doctors"
            tint={colors.info}
            tintBg={colors.infoSoft}
          />
        </View>
      </View>

      {/* Recent bookings */}
      <View style={styles.section}>
        <SectionHeader
          title="Recent Bookings"
          actionLabel="View all"
          onAction={() => navigation.navigate('Bookings')}
        />
        {recent.length === 0 ? (
          <Card padded={false}>
            <EmptyState
              icon="reader-outline"
              title="No bookings yet"
              message="New patient bookings will appear here."
            />
          </Card>
        ) : (
          <View style={styles.recentList}>
            {recent.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                perspective="admin"
                onPress={() => navigation.navigate('BookingDetails', { bookingId: b.id })}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  bannerSub: { marginTop: 4, opacity: 0.9 },
  section: { marginTop: spacing['2xl'] },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statRowGap: { marginTop: spacing.md },
  recentList: { gap: spacing.md },
});
