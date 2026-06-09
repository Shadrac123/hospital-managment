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
  { label: 'Report', icon: 'document-text-outline' },
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
        showNotifications={false}
      />

      <SearchBar placeholder="Search doctors, symptoms..." />

      {/* Quick actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={styles.action}
              onPress={() => {
                if (a.label === 'Report') {
                  navigation.navigate('Reports');
                } else if (a.label === 'Doctor') {
                  navigation.navigate('Booking');
                }
              }}
            >
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
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  action: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 72,
  },
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
});
