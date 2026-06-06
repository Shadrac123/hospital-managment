import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Screen,
  Text,
  Card,
  Avatar,
  Badge,
  Button,
  IconButton,
  Divider,
} from '@/components/ui';
import { EmptyState } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { useBooking, useDoctors } from '@/hooks';
import { assignDoctorToBooking, db } from '@/services/firebase';
import { Booking, BookingStatus, Doctor } from '@/types/models';
import { formatBookingDate } from '@/utils/validation';
import { AdminStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'BookingDetails'>;

const STATUS_TONE: Record<BookingStatus, 'warning' | 'success' | 'info' | 'neutral'> = {
  pending: 'warning',
  assigned: 'success',
  completed: 'info',
  cancelled: 'neutral',
};

export function BookingDetailsScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const { booking, loading } = useBooking(bookingId);
  const { doctors } = useDoctors();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Real-time capacity checks for doctors
  const [busyDoctorIds, setBusyDoctorIds] = useState<string[]>([]);
  const [loadingBusy, setLoadingBusy] = useState(false);

  useEffect(() => {
    if (!booking) return;

    setLoadingBusy(true);
    // Find all doctors who have an assigned booking at the exact same date and time
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', booking.date),
      where('time', '==', booking.time),
      where('status', '==', 'assigned')
    );

    getDocs(q)
      .then((snap) => {
        const ids = snap.docs
          .map((d) => d.data().doctorId)
          .filter((id): id is string => typeof id === 'string');
        setBusyDoctorIds(ids);
        setLoadingBusy(false);
      })
      .catch((err) => {
        console.error('Error checking busy doctors:', err);
        setLoadingBusy(false);
      });
  }, [booking]);

  const onAssign = async (doctor: Doctor) => {
    setPickerOpen(false);
    setAssigning(true);
    try {
      await assignDoctorToBooking(bookingId, doctor);
    } catch {
      Alert.alert('Assignment failed', 'Could not assign the doctor. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    const isBusy = busyDoctorIds.includes(doctor.id);
    if (isBusy && booking) {
      Alert.alert(
        'Double Booking Warning',
        `${doctor.name} is already assigned to another patient at ${booking.time} on ${formatBookingDate(booking.date)}. Are you sure you want to assign them anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Assign Anyway',
            style: 'destructive',
            onPress: () => onAssign(doctor),
          },
        ]
      );
    } else {
      onAssign(doctor);
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
        <Text variant="h2">Booking Details</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <EmptyState icon="hourglass-outline" title="Loading…" />
      ) : !booking ? (
        <EmptyState icon="alert-circle-outline" title="Booking not found" />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <Card style={styles.patientCard}>
              <Avatar name={booking.patientName} size={56} />
              <View style={styles.patientText}>
                <Text variant="h3">{booking.patientName}</Text>
                <Text variant="caption">{booking.patientEmail}</Text>
              </View>
              <Badge
                label={booking.status[0].toUpperCase() + booking.status.slice(1)}
                tone={STATUS_TONE[booking.status]}
              />
            </Card>

            <Card style={styles.infoCard} padded={false}>
              <View style={styles.infoInner}>
                <InfoRow
                  icon="calendar-outline"
                  label="Date & Time"
                  value={`${formatBookingDate(booking.date)} · ${booking.time}`}
                />
                <Divider inset={48} />
                <InfoRow
                  icon="medkit-outline"
                  label="Doctor"
                  value={
                    booking.doctorName
                      ? `${booking.doctorName}${
                          booking.doctorSpecialty ? ` · ${booking.doctorSpecialty}` : ''
                        }`
                      : 'Not assigned yet'
                  }
                  muted={!booking.doctorName}
                />
                <Divider inset={48} />
                <InfoRow
                  icon="pricetag-outline"
                  label="Reason"
                  value={booking.reason || '—'}
                  muted={!booking.reason}
                />
                <Divider inset={48} />
                <InfoRow icon="card-outline" label="Reference" value={`#${booking.id.slice(0, 8)}`} />
              </View>
            </Card>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Chat with Patient"
              icon="chatbubbles-outline"
              variant="secondary"
              style={styles.chatBtn}
              onPress={() =>
                navigation.navigate('Chat', {
                  bookingId: booking.id,
                  recipientName: booking.patientName,
                })
              }
            />
            <Button
              title={booking.status === 'assigned' ? 'Reassign Doctor' : 'Assign Doctor'}
              icon="person-add-outline"
              loading={assigning}
              onPress={() => setPickerOpen(true)}
            />
          </View>
        </>
      )}

      <DoctorPicker
        visible={pickerOpen}
        doctors={doctors}
        busyDoctorIds={busyDoctorIds}
        loadingBusy={loadingBusy}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectDoctor}
      />
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTextBlock}>
        <Text variant="caption">{label}</Text>
        <Text variant="body" color={muted ? colors.textTertiary : colors.textPrimary}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function DoctorPicker({
  visible,
  doctors,
  busyDoctorIds,
  loadingBusy,
  onClose,
  onSelect,
}: {
  visible: boolean;
  doctors: Doctor[];
  busyDoctorIds: string[];
  loadingBusy: boolean;
  onClose: () => void;
  onSelect: (d: Doctor) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeaderRow}>
          <Text variant="h3" style={styles.sheetTitle}>
            Assign a doctor
          </Text>
          {loadingBusy && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        {doctors.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No doctors available"
            message="Add doctors from the Doctors tab first."
          />
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={(d) => d.id}
            ItemSeparatorComponent={() => <Divider inset={56} />}
            renderItem={({ item }) => {
              const isBusy = busyDoctorIds.includes(item.id);
              return (
                <Pressable
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [styles.doctorRow, pressed && styles.pressed]}
                >
                  <Avatar name={item.name} size={44} />
                  <View style={styles.doctorText}>
                    <Text variant="h3">{item.name}</Text>
                    <Text variant="caption">{item.specialty}</Text>
                  </View>
                  {isBusy ? (
                    <Badge label="Double-Booked" tone="warning" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  spacer: { width: 44 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing['3xl'] },
  patientCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  patientText: { flex: 1 },
  infoCard: { marginTop: spacing.lg },
  infoInner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextBlock: { flex: 1, gap: 2 },
  chatBtn: {
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  // Bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(16,24,40,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.md,
    maxHeight: '70%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: { marginBottom: 0 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  doctorText: { flex: 1 },
  pressed: { opacity: 0.6 },
});
