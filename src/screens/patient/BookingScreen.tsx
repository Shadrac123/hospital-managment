import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Input, Button, IconButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { createBooking } from '@/services/firebase';
import { upcomingDays } from '@/utils/validation';
import { PatientStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<PatientStackParamList, 'Booking'>;

// Available time slots. (Real per-doctor availability is a later-phase concern.)
const SLOTS = ['09:00', '10:00', '10:30', '11:00', '11:30', '12:00'];

export function BookingScreen({ navigation }: Props) {
  const { profile, user } = useAuth();
  const days = useMemo(() => upcomingDays(5), []);
  const [name, setName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [reason, setReason] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      });
      navigation.goBack();
    } catch {
      Alert.alert('Booking failed', 'Could not create your appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          Pick Date &amp; Time
        </Text>

        {/* Date strip */}
        <View style={styles.dateRow}>
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
                >
                  {d.weekday}
                </Text>
                <Text
                  variant="h3"
                  color={active ? colors.textInverse : colors.textPrimary}
                >
                  {d.day}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Time slots */}
        <View style={styles.slotGrid}>
          {SLOTS.map((s) => {
            const active = slot === s;
            return (
              <Pressable
                key={s}
                onPress={() => setSlot(s)}
                style={[styles.slot, active && styles.slotActive]}
              >
                <Text
                  variant="label"
                  color={active ? colors.textInverse : colors.textPrimary}
                >
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Book Now"
          icon="checkmark-circle-outline"
          loading={submitting}
          disabled={!slot || !name.trim() || !email.trim()}
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
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  dateCell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dateCellActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  slot: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
