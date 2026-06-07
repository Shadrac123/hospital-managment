import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Text, Input, Button, IconButton } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { createBooking, db } from '@/services/firebase';
import { upcomingDays } from '@/utils/validation';
import { firebaseErrorMessage } from '@/utils/firebaseError';
import { PatientStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<PatientStackParamList, 'Booking'>;

const MORNING_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export function BookingScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const doctorId = route.params?.doctorId;
  
  const days = useMemo(() => upcomingDays(14), []);
  const [name, setName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [reason, setReason] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Real-time slot booking availability checks
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!doctorId) {
      setBookedSlots([]);
      return;
    }

    setLoadingSlots(true);
    // Reset slot selection when date changes to prevent booking a newly unavailable slot
    setSlot(null);

    const q = query(
      collection(db, 'bookings'),
      where('doctorId', '==', doctorId),
      where('date', '==', days[dayIndex].iso)
    );

    getDocs(q)
      .then((snap) => {
        const slots = snap.docs
          .map((d) => d.data().time)
          .filter((t): t is string => typeof t === 'string');
        setBookedSlots(slots);
        setLoadingSlots(false);
      })
      .catch((err) => {
        console.error('Error fetching booked slots:', err);
        setLoadingSlots(false);
      });
  }, [doctorId, dayIndex, days]);

  const onBook = async () => {
    if (!slot || !name.trim() || !email.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      await createBooking({
        patientId: user.uid,
        patientName: name.trim(),
        patientEmail: email.trim(),
        date: days[dayIndex].iso,
        time: slot,
        reason: reason.trim() || undefined,
        // Carry over doctor details if booked from doctor's card
        ...(doctorId ? { doctorId } : {}),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Booking failed', firebaseErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSlot = (s: string) => {
    const active = slot === s;
    const isBooked = bookedSlots.includes(s);

    return (
      <Pressable
        key={s}
        onPress={() => {
          if (!isBooked) setSlot(s);
        }}
        style={[
          styles.slot,
          active && styles.slotActive,
          isBooked && styles.slotBooked,
        ]}
        disabled={isBooked}
      >
        <Text
          variant="label"
          color={
            active
              ? colors.textInverse
              : isBooked
              ? colors.textTertiary
              : colors.textPrimary
          }
          style={isBooked ? styles.textBooked : undefined}
        >
          {s}
        </Text>
      </Pressable>
    );
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton
          name="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text variant="displayLg" style={styles.title}>
          Book{'\n'}Appointment
        </Text>

        <Text variant="label" style={styles.sectionLabel}>
          Enter Your Details
        </Text>
        <View style={styles.fields}>
          <Input leftIcon="person-outline" placeholder="Full name" value={name} onChangeText={setName} />
          <Input
            leftIcon="mail-outline"
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            leftIcon="document-text-outline"
            placeholder="Reason for visit (optional)"
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <Text variant="label" style={styles.sectionLabel}>
          Pick Date &amp; Weekday
        </Text>

        {/* Horizontal scrollable date strip */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          >
            {days.map((d, i) => {
              const active = i === dayIndex;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => setDayIndex(i)}
                  style={[styles.dateCell, active && styles.dateCellActive]}
                >
                  <Text
                    variant="caption"
                    color={active ? colors.textInverse : colors.textTertiary}
                    style={styles.weekdayText}
                  >
                    {d.weekday}
                  </Text>
                  <Text
                    variant="h3"
                    color={active ? colors.textInverse : colors.textPrimary}
                    style={styles.dayText}
                  >
                    {d.day}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.timeSectionHeaderRow}>
          <Text variant="label" style={styles.sectionLabel}>
            Pick Time Slot
          </Text>
          {loadingSlots && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {/* Morning Session */}
        <View style={styles.timeSection}>
          <View style={styles.sessionHeader}>
            <Ionicons name="sunny-outline" size={18} color={colors.warning} />
            <Text variant="h3" style={styles.sessionTitle}>Morning</Text>
          </View>
          <View style={styles.slotGrid}>
            {MORNING_SLOTS.map(renderSlot)}
          </View>
        </View>

        {/* Afternoon Session */}
        <View style={styles.timeSection}>
          <View style={styles.sessionHeader}>
            <Ionicons name="sunny" size={18} color={colors.primary} />
            <Text variant="h3" style={styles.sessionTitle}>Afternoon</Text>
          </View>
          <View style={styles.slotGrid}>
            {AFTERNOON_SLOTS.map(renderSlot)}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(spacing.xl, insets.bottom) }]}>
        <Button
          title="Book Now"
          icon="checkmark-circle-outline"
          loading={submitting}
          disabled={!slot || !name.trim() || !email.trim() || loadingSlots}
          onPress={onBook}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
  title: { marginTop: spacing.sm, marginBottom: spacing.xl },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.md },
  fields: { gap: spacing.md },
  dateScroll: {
    paddingRight: spacing.xl,
    gap: spacing.sm,
  },
  dateCell: {
    width: 65,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dateCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dayText: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.sm,
  },
  timeSection: {
    marginBottom: spacing.lg,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slot: {
    width: '22%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  slotBooked: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    opacity: 0.5,
  },
  textBooked: {
    textDecorationLine: 'line-through',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
