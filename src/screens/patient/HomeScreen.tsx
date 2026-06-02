import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, SectionHeader } from '@/components/ui';
import { GreetingHeader, SearchBar, EmptyState, BookingCard } from '@/components/common';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { usePatientBookings } from '@/hooks';
import { PatientTabParamList, PatientStackParamList } from '@/navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PatientTabParamList, 'Home'>,
  NativeStackScreenProps<PatientStackParamList>
>;

const QUICK_ACTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Doctor', icon: 'medkit-outline' },
  { label: 'Medicine', icon: 'medical-outline' },
  { label: 'Report', icon: 'document-text-outline' },
  { label: 'Emergency', icon: 'pulse-outline' },
];

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen({ navigation }: Props) {
  const { profile, user } = useAuth();
  // Prefer the Firestore profile name; fall back to the Auth display name so the
  // greeting is personal even before the profile doc resolves.
  const fullName =
    profile?.displayName?.trim() || user?.displayName?.trim() || 'there';
  const { bookings } = usePatientBookings(user?.uid);

  // Show the soonest active appointment (assigned preferred, else pending).
  const nextBooking = bookings.find(
    (b) => b.status === 'assigned' || b.status === 'pending',
  );

  return (
    <Screen scroll>
      <GreetingHeader
        greeting={`${greetingForNow()}, ${fullName}`}
        name={fullName}
        subtitle="Feeling happy today"
        hasNotifications
      />

      <SearchBar placeholder="Search doctors, symptoms..." />

      {/* Quick actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable key={a.label} style={styles.action}>
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={22} color={colors.primary} />
              </View>
              <Text variant="caption" color={colors.textPrimary}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Promo banner */}
      <View style={[styles.banner, shadows.md]}>
        <View style={styles.bannerText}>
          <Text variant="h3" color={colors.textInverse}>
            Get 50% off
          </Text>
          <Text variant="bodyMuted" color={colors.textInverse} style={styles.bannerSub}>
            on your first consultation
          </Text>
          <Pressable style={styles.bannerCta}>
            <Text variant="label" color={colors.primary}>
              Claim Now
            </Text>
          </Pressable>
        </View>
        <Ionicons name="medkit" size={64} color="rgba(255,255,255,0.25)" />
      </View>

      {/* Next appointment */}
      <View style={styles.section}>
        <SectionHeader
          title="Next Appointment"
          actionLabel="Book"
          onAction={() => navigation.navigate('Booking')}
        />
        {nextBooking ? (
          <BookingCard
            booking={nextBooking}
            perspective="patient"
            onPress={() => navigation.navigate('PatientTabs', { screen: 'Schedule' })}
          />
        ) : (
          <Card padded={false}>
            <EmptyState
              icon="calendar-outline"
              title="No upcoming appointments"
              message="Book a consultation and it will show up here."
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing['2xl'] },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: spacing.sm, flex: 1 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing['2xl'],
    overflow: 'hidden',
  },
  bannerText: { flex: 1 },
  bannerSub: { marginTop: 2, marginBottom: spacing.md, opacity: 0.9 },
  bannerCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
