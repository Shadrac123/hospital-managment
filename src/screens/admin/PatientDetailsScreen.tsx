import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
import { colors, radius, spacing } from '@/theme';
import {
  archivePatient,
  restorePatient,
  fetchPatientBookingsSummary,
  db,
} from '@/services/firebase';
import { AppUser } from '@/types/models';
import { calculateAge, formatDob, buildPatientCardHtml } from '@/utils/patientCard';
import { AdminStackParamList } from '@/navigation/types';
import { doc, onSnapshot } from 'firebase/firestore';

type Props = NativeStackScreenProps<AdminStackParamList, 'PatientDetails'>;

type BookingSummaryItem = { id: string; status: string; date: string; doctorName?: string | null };

export function PatientDetailsScreen({ navigation, route }: Props) {
  const { patientId } = route.params;
  const [patient, setPatient] = useState<AppUser | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [bookings, setBookings] = useState<BookingSummaryItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Real-time patient snapshot
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'users', patientId),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setPatient({
            uid: snap.id,
            email: d.email ?? '',
            displayName: d.displayName ?? '',
            role: d.role ?? 'patient',
            phone: d.phone ?? undefined,
            photoURL: d.photoURL ?? null,
            createdAt: d.createdAt?.seconds ? d.createdAt.seconds * 1000 : d.createdAt ?? undefined,
            dateOfBirth: d.dateOfBirth ?? undefined,
            gender: d.gender ?? undefined,
            address: d.address ?? undefined,
            emergencyContact: d.emergencyContact ?? undefined,
            profileComplete: d.profileComplete ?? false,
            isActive: d.isActive !== false,
          });
        }
        setLoadingPatient(false);
      },
      () => setLoadingPatient(false),
    );
    return unsub;
  }, [patientId]);

  // One-time booking summary fetch
  useEffect(() => {
    fetchPatientBookingsSummary(patientId)
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, [patientId]);

  const handleArchiveToggle = () => {
    if (!patient) return;
    const isArchived = patient.isActive === false;
    const action = isArchived ? 'Restore' : 'Archive';
    const message = isArchived
      ? 'This will mark the patient as active again.'
      : 'This will deactivate the patient. Their data is preserved.';
    Alert.alert(`${action} Patient`, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: isArchived ? 'default' : 'destructive',
        onPress: async () => {
          setArchiving(true);
          try {
            if (isArchived) {
              await restorePatient(patientId);
            } else {
              await archivePatient(patientId);
            }
          } catch {
            Alert.alert('Error', 'Could not update patient status. Please try again.');
          } finally {
            setArchiving(false);
          }
        },
      },
    ]);
  };

  const handlePrintCard = useCallback(async () => {
    if (!patient) return;
    setPrinting(true);
    try {
      const html = buildPatientCardHtml(patient, bookings);
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Patient Card – ${patient.displayName}`,
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch {
      Alert.alert('Print failed', 'Could not generate the patient card.');
    } finally {
      setPrinting(false);
    }
  }, [patient, bookings]);

  const age = calculateAge(patient?.dateOfBirth);
  const isArchived = patient?.isActive === false;

  const totalB = bookings.length;
  const pendingB = bookings.filter((b) => b.status === 'pending').length;
  const assignedB = bookings.filter((b) => b.status === 'assigned').length;
  const completedB = bookings.filter((b) => b.status === 'completed').length;

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton
          name="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Text variant="h2">Patient Details</Text>
        <IconButton
          name="create-outline"
          onPress={() => navigation.navigate('PatientEdit', { patientId })}
          accessibilityLabel="Edit patient"
        />
      </View>

      {loadingPatient ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !patient ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text variant="bodyMuted">Patient not found</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Profile header */}
          <Card style={styles.profileCard}>
            <Avatar
              name={patient.displayName}
              uri={patient.photoURL ?? undefined}
              size={72}
            />
            <View style={styles.profileText}>
              <Text variant="h2">{patient.displayName}</Text>
              <Text variant="caption" color={colors.textSecondary}>
                #{patient.uid.slice(0, 8).toUpperCase()}
              </Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={isArchived ? 'Archived' : 'Active'}
                  tone={isArchived ? 'neutral' : 'success'}
                />
                {patient.profileComplete && (
                  <Badge label="Profile complete" tone="info" />
                )}
              </View>
            </View>
          </Card>

          {/* Basic info */}
          <SectionCard title="Basic Information">
            <InfoRow icon="calendar-outline" label="Date of Birth" value={formatDob(patient.dateOfBirth)} />
            {age !== null && <InfoRow icon="hourglass-outline" label="Age" value={`${age} years`} />}
            <InfoRow
              icon="male-female-outline"
              label="Gender"
              value={
                patient.gender
                  ? { male: 'Male', female: 'Female', other: 'Other', prefer_not_to_say: 'Not specified' }[patient.gender]
                  : '—'
              }
            />
          </SectionCard>

          {/* Contact */}
          <SectionCard title="Contact Information">
            <InfoRow icon="mail-outline" label="Email" value={patient.email} />
            <InfoRow icon="call-outline" label="Phone" value={patient.phone || '—'} />
            <InfoRow icon="location-outline" label="Address" value={patient.address || '—'} />
          </SectionCard>

          {/* Emergency contact */}
          {patient.emergencyContact && (
            <SectionCard title="Emergency Contact">
              <InfoRow icon="person-outline" label="Name" value={patient.emergencyContact.name} />
              <InfoRow icon="call-outline" label="Phone" value={patient.emergencyContact.phone} />
              <InfoRow icon="heart-outline" label="Relationship" value={patient.emergencyContact.relationship} />
            </SectionCard>
          )}

          {/* Booking stats */}
          <View style={styles.sectionHeader}>
            <Text variant="label" color={colors.textSecondary}>
              BOOKING SUMMARY
            </Text>
          </View>
          {loadingBookings ? (
            <ActivityIndicator color={colors.primary} style={styles.loadingBookings} />
          ) : (
            <View style={styles.statRow}>
              <MiniStat value={totalB} label="Total" color={colors.primary} />
              <MiniStat value={pendingB} label="Pending" color={colors.warning} />
              <MiniStat value={assignedB} label="Assigned" color={colors.success} />
              <MiniStat value={completedB} label="Done" color={colors.info} />
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title={printing ? 'Generating…' : 'Print Patient Card'}
              icon="print-outline"
              onPress={handlePrintCard}
              loading={printing}
              disabled={printing}
            />
            <Button
              title={
                archiving
                  ? 'Updating…'
                  : isArchived
                  ? 'Restore Patient'
                  : 'Archive Patient'
              }
              icon={isArchived ? 'refresh-outline' : 'archive-outline'}
              variant={isArchived ? 'outline' : 'destructive'}
              onPress={handleArchiveToggle}
              loading={archiving}
              disabled={archiving}
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text variant="label" color={colors.textSecondary}>
          {title.toUpperCase()}
        </Text>
      </View>
      <Card padded={false}>
        <View style={styles.cardInner}>{children}</View>
      </Card>
    </>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <View style={styles.infoText}>
          <Text variant="caption">{label}</Text>
          <Text variant="body">{value}</Text>
        </View>
      </View>
      <Divider inset={48} />
    </>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.miniStat}>
      <Text variant="h2" color={color}>{String(value)}</Text>
      <Text variant="caption" color={colors.textSecondary}>{label}</Text>
    </View>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing['3xl'], gap: spacing.md },
  profileCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  profileText: { flex: 1, gap: spacing.xs },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.xs },
  cardInner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, gap: 2 },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingBookings: { marginVertical: spacing.lg },
  actions: { gap: spacing.md, marginTop: spacing.lg },
});
