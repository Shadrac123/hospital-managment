import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text, Avatar, Badge } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { Booking, BookingStatus } from '@/types/models';
import { formatBookingDate } from '@/utils/validation';

const STATUS_TONE: Record<BookingStatus, 'warning' | 'success' | 'info' | 'neutral'> = {
  pending: 'warning',
  assigned: 'success',
  completed: 'info',
  cancelled: 'neutral',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export interface BookingCardProps {
  booking: Booking;
  /** 'patient' shows the doctor; 'admin' shows the patient. */
  perspective: 'patient' | 'admin';
  onPress?: () => void;
}

export function BookingCard({ booking, perspective, onPress }: BookingCardProps) {
  const assigned = booking.status === 'assigned' && !!booking.doctorName;

  // Primary line differs by viewer: patients care about their doctor, admins
  // about the patient.
  const title =
    perspective === 'patient'
      ? assigned
        ? booking.doctorName!
        : 'Awaiting doctor assignment'
      : booking.patientName;

  const subtitle =
    perspective === 'patient'
      ? assigned
        ? booking.doctorSpecialty ?? 'Specialist'
        : 'A doctor will be assigned soon'
      : booking.patientEmail;

  const avatarName = perspective === 'patient' ? booking.doctorName ?? 'Dr' : booking.patientName;

  const body = (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar name={avatarName} size={48} />
        <View style={styles.textBlock}>
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Badge label={STATUS_LABEL[booking.status]} tone={STATUS_TONE[booking.status]} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text variant="caption">{formatBookingDate(booking.date)}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text variant="caption">{booking.time}</Text>
        </View>
        {onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        ) : null}
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? styles.pressed : null)}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  textBlock: { flex: 1, gap: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: 0.7 },
});
