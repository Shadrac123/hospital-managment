import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, SectionHeader } from '@/components/ui';
import { StatCard, EmptyState, BookingCard } from '@/components/common';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { useAllBookings, useDoctors, usePatientStats } from '@/hooks';
import { AdminTabParamList, AdminStackParamList } from '@/navigation/types';
import { subscribeToAllUnread, subscribeToAllReports } from '@/services/firebase';
import { Report } from '@/types/models';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AdminTabParamList, 'Dashboard'>,
  NativeStackScreenProps<AdminStackParamList>
>;

export function DashboardScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const firstName = profile?.displayName?.split(' ')[0] ?? 'Admin';
  const { bookings } = useAllBookings();
  const { doctors } = useDoctors();
  const patientStats = usePatientStats();

  const [totalUnread, setTotalUnread] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const unsub = subscribeToAllUnread((unreadMap) => {
      let sum = 0;
      Object.keys(unreadMap).forEach((bookingId) => {
        const counts = unreadMap[bookingId];
        if (counts && counts.admin) {
          sum += counts.admin;
        }
      });
      setTotalUnread(sum);
    });
    return unsub;
  }, []);

  // Subscribe to all report requests for dashboard stats
  useEffect(() => {
    const unsub = subscribeToAllReports((data) => {
      setReports(data);
    });
    return unsub;
  }, []);

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const assigned = bookings.filter((b) => b.status === 'assigned').length;
    return { pending, assigned };
  }, [bookings]);

  const reportStats = useMemo(() => {
    const pending = reports.filter((r) => r.status === 'pending').length;
    const approved = reports.filter((r) => r.status === 'approved').length;
    return { pending, approved };
  }, [reports]);

  const recent = bookings.slice(0, 3);

  return (
    <Screen scroll>
      {/* Custom Admin Greeting Header with Chat Icon */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextBlock}>
          <Text variant="h1">Dashboard</Text>
          <Text variant="bodyMuted" style={{ marginTop: 2 }}>
            Welcome back, {firstName}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AdminChats')}
          style={styles.chatIconBtn}
          android_ripple={{ color: colors.border }}
        >
          <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
          {totalUnread > 0 && (
            <View style={styles.badge}>
              <Text variant="caption" style={styles.badgeText}>
                {totalUnread}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Welcome banner */}
      <View style={[styles.banner, shadows.md]}>
        <View>
          <Text variant="h3" color={colors.textInverse}>
            Welcome back, {firstName}
          </Text>
          <Text variant="caption" color={colors.textInverse} style={styles.bannerSub}>
            Here&apos;s your hospital at a glance
          </Text>
        </View>
      </View>

      {/* Patient Statistics */}
      <View style={styles.section}>
        <SectionHeader
          title="Patient Statistics"
          actionLabel="View all"
          onAction={() => navigation.navigate('Patients')}
        />
        <View style={styles.statRow}>
          <StatCard
            icon="people-outline"
            value={String(patientStats.totalPatients)}
            label="Total Patients"
          />
          <StatCard
            icon="person-add-outline"
            value={String(patientStats.newThisMonth)}
            label="New This Month"
            tint={colors.info}
            tintBg={colors.infoSoft}
          />
        </View>
        <View style={[styles.statRow, styles.statRowGap]}>
          <StatCard
            icon="checkmark-circle-outline"
            value={String(patientStats.activePatients)}
            label="Active"
            tint={colors.success}
            tintBg={colors.successSoft}
          />
          <StatCard
            icon="archive-outline"
            value={String(patientStats.archivedPatients)}
            label="Archived"
            tint={colors.textSecondary}
            tintBg={colors.border}
          />
        </View>
      </View>

      {/* Booking Overview */}
      <View style={styles.section}>
        <SectionHeader
          title="Booking Overview"
          actionLabel="View all"
          onAction={() => navigation.navigate('Bookings')}
        />
        <View style={styles.statRow}>
          <StatCard
            icon="time-outline"
            value={String(bookingStats.pending)}
            label="Pending"
            tint={colors.warning}
            tintBg={colors.warningSoft}
          />
          <StatCard
            icon="checkmark-done-outline"
            value={String(bookingStats.assigned)}
            label="Assigned"
            tint={colors.success}
            tintBg={colors.successSoft}
          />
        </View>
        <View style={[styles.statRow, styles.statRowGap]}>
          <StatCard
            icon="medkit-outline"
            value={String(doctors.length)}
            label="Doctors"
            tint={colors.info}
            tintBg={colors.infoSoft}
          />
          <StatCard
            icon="documents-outline"
            value={String(bookings.length)}
            label="All Bookings"
          />
        </View>
      </View>

      {/* Reports Overview */}
      <View style={styles.section}>
        <SectionHeader
          title="Reports Overview"
          actionLabel="Manage"
          onAction={() => navigation.navigate('ReportsManagement')}
        />
        <View style={styles.statRow}>
          <StatCard
            icon="document-text-outline"
            value={String(reportStats.pending)}
            label="Pending Requests"
            tint={colors.warning}
            tintBg={colors.warningSoft}
          />
          <StatCard
            icon="checkmark-circle-outline"
            value={String(reportStats.approved)}
            label="Approved Reports"
            tint={colors.success}
            tintBg={colors.successSoft}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTextBlock: { flex: 1 },
  chatIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
  },
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
