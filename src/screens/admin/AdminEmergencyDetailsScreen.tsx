import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import {
  Screen,
  Text,
  Card,
  Avatar,
  Badge,
  Button,
  IconButton,
  Divider,
  Input,
} from '@/components/ui';
import { EmptyState } from '@/components/common';
import { colors, radius, spacing, shadows } from '@/theme';
import { subscribeToEmergency, updateEmergencyStatus, db } from '@/services/firebase';
import { EmergencyRequest, EmergencySeverity, EmergencyStatus, AppUser } from '@/types/models';
import { AdminStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminEmergencyDetails'>;

const STATUSES: { value: EmergencyStatus; label: string; tone: 'warning' | 'info' | 'primary' | 'success' }[] = [
  { value: 'pending', label: 'Pending', tone: 'warning' },
  { value: 'acknowledged', label: 'Acknowledged', tone: 'info' },
  { value: 'in-progress', label: 'In Progress', tone: 'primary' },
  { value: 'resolved', label: 'Resolved', tone: 'success' },
];

export function AdminEmergencyDetailsScreen({ navigation, route }: Props) {
  const { emergencyId } = route.params;
  const [emergency, setEmergency] = useState<EmergencyRequest | null>(null);
  const [patientProfile, setPatientProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPatient, setLoadingPatient] = useState(false);

  // Status edit states
  const [selectedStatus, setSelectedStatus] = useState<EmergencyStatus>('pending');
  const [adminNote, setAdminNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Subscribe to emergency request in real-time
    const unsub = subscribeToEmergency(
      emergencyId,
      (data) => {
        setEmergency(data);
        if (data) {
          setSelectedStatus(data.status);
          setAdminNote(data.notes || '');
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [emergencyId]);

  // Fetch detailed patient profile (e.g. DOB, gender, emergency contact)
  useEffect(() => {
    if (!emergency?.patientId) return;

    setLoadingPatient(true);
    const userDocRef = doc(db, 'users', emergency.patientId);
    getDoc(userDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setPatientProfile(docSnap.data() as AppUser);
        }
        setLoadingPatient(false);
      })
      .catch((err) => {
        console.error('Failed to load patient profile details:', err);
        setLoadingPatient(false);
      });
  }, [emergency?.patientId]);

  const handleUpdateStatus = async () => {
    if (!emergency || updating) return;

    setUpdating(true);
    try {
      await updateEmergencyStatus(
        emergencyId,
        selectedStatus,
        adminNote.trim(),
        'Admin Staff'
      );
      Alert.alert('Success', 'Emergency status updated successfully.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update emergency status.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusTone = (status: EmergencyStatus) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'acknowledged':
        return 'info';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getSeverityTone = (severity: EmergencySeverity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'neutral';
    }
  };

  const formatDateTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton
          name="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Text variant="h2">Emergency Request</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <EmptyState icon="hourglass-outline" title="Loading emergency..." />
      ) : !emergency ? (
        <EmptyState icon="alert-circle-outline" title="Emergency request not found" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Severity Banner */}
          {(emergency.severity === 'critical' || emergency.severity === 'high') && (
            <View style={styles.urgentBanner}>
              <Ionicons name="warning" size={24} color={colors.textInverse} />
              <Text variant="h3" color={colors.textInverse} style={styles.urgentBannerText}>
                {emergency.severity.toUpperCase()} EMERGENCY PRIORITY
              </Text>
            </View>
          )}

          {/* Patient Details Card */}
          <Card style={styles.sectionCard}>
            <Text variant="label" color={colors.textSecondary} style={styles.cardHeaderTitle}>
              PATIENT DEMOGRAPHICS
            </Text>
            <View style={styles.patientProfileRow}>
              <Avatar name={emergency.patientName} size={48} />
              <View style={styles.patientInfoBlock}>
                <Text variant="h3">{emergency.patientName}</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  {emergency.patientEmail}
                </Text>
              </View>
            </View>
            <View style={{ marginVertical: spacing.md }}><Divider /></View>
            {loadingPatient ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text variant="caption" color={colors.textSecondary}>Gender</Text>
                  <Text variant="body" style={styles.detailValue}>
                    {patientProfile?.gender ? patientProfile.gender.toUpperCase() : 'Not specified'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="caption" color={colors.textSecondary}>Date of Birth</Text>
                  <Text variant="body" style={styles.detailValue}>
                    {patientProfile?.dateOfBirth || 'Not specified'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="caption" color={colors.textSecondary}>Phone Number</Text>
                  <Text variant="body" style={styles.detailValue}>
                    {emergency.patientPhone || patientProfile?.phone || 'Not specified'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="caption" color={colors.textSecondary}>Home Address</Text>
                  <Text variant="body" style={styles.detailValue}>
                    {patientProfile?.address || 'Not specified'}
                  </Text>
                </View>
                {patientProfile?.emergencyContact && (
                  <View style={[styles.detailItem, { width: '100%' }]}>
                    <Text variant="caption" color={colors.textSecondary}>Emergency Contact</Text>
                    <Text variant="body" style={styles.detailValue}>
                      {patientProfile.emergencyContact.name} ({patientProfile.emergencyContact.relationship}) · {patientProfile.emergencyContact.phone}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>

          {/* Emergency Info Card */}
          <Card style={styles.sectionCard}>
            <View style={styles.titleRow}>
              <Text variant="h3" style={styles.emergencyTitle}>
                {emergency.title}
              </Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={emergency.severity.toUpperCase()}
                  tone={getSeverityTone(emergency.severity)}
                />
                <Badge
                  label={emergency.status.toUpperCase()}
                  tone={getStatusTone(emergency.status)}
                />
              </View>
            </View>

            <Text variant="body" style={styles.descriptionText}>
              {emergency.description}
            </Text>

            {emergency.imageUrl && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: emergency.imageUrl }} style={styles.attachmentImage} />
              </View>
            )}

            <Text variant="caption" color={colors.textTertiary} style={styles.reportedTime}>
              Reported: {formatDateTime(emergency.createdAt)}
            </Text>
          </Card>

          {/* Status Management Form */}
          <Card style={styles.sectionCard}>
            <Text variant="label" color={colors.textSecondary} style={styles.cardHeaderTitle}>
              STATUS MANAGEMENT & RESPONSE NOTES
            </Text>

            <Text variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              Update Current Status
            </Text>
            <View style={styles.statusesRow}>
              {STATUSES.map((s) => {
                const active = selectedStatus === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setSelectedStatus(s.value)}
                    style={[
                      styles.statusChip,
                      active && styles.statusChipActive,
                      active && { borderColor: colors[s.tone] },
                    ]}
                  >
                    <Text
                      variant="caption"
                      color={active ? colors[s.tone] : colors.textSecondary}
                      style={{ fontWeight: active ? '700' : '500' }}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Staff / Resolution Note"
              placeholder="e.g. Acknowledged, dispatcher sent, resolved over call..."
              value={adminNote}
              onChangeText={setAdminNote}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />

            <View style={styles.updateBtnContainer}>
              <Button
                title="Update Emergency Status"
                icon="checkmark-circle-outline"
                loading={updating}
                disabled={updating}
                onPress={handleUpdateStatus}
              />
            </View>
          </Card>

          {/* Resolution History / Tracking */}
          <Card style={styles.sectionCard}>
            <Text variant="label" color={colors.textSecondary} style={styles.cardHeaderTitle}>
              RESOLUTION HISTORY LOGS
            </Text>

            {(!emergency.history || emergency.history.length === 0) ? (
              <Text variant="bodyMuted" style={styles.noHistoryText}>
                No resolution logs found.
              </Text>
            ) : (
              <View style={styles.historyTimeline}>
                {emergency.history.map((log, index) => {
                  const isLast = index === emergency.history!.length - 1;
                  return (
                    <View key={index} style={styles.timelineRow}>
                      <View style={styles.timelineGraphic}>
                        <View style={[styles.timelineNode, { backgroundColor: colors[getStatusTone(log.status)] }]} />
                        {!isLast && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Badge label={log.status.toUpperCase()} tone={getStatusTone(log.status)} />
                          <Text variant="caption" color={colors.textTertiary}>
                            {formatDateTime(log.updatedAt)}
                          </Text>
                        </View>
                        <Text variant="body" style={styles.timelineUpdater}>
                          Updated by: {log.updatedBy}
                        </Text>
                        {log.notes ? (
                          <Text variant="caption" color={colors.textSecondary} style={styles.timelineNotes}>
                            Note: {log.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </ScrollView>
      )}
    </Screen>
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  urgentBannerText: {
    fontWeight: '800',
  },
  sectionCard: {
    padding: spacing.xl,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  patientProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  patientInfoBlock: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailItem: {
    width: '47%',
    gap: 2,
  },
  detailValue: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    minWidth: 150,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  descriptionText: {
    lineHeight: 22,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  imageContainer: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 250,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    backgroundColor: colors.background,
  },
  reportedTime: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  statusesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusChipActive: {
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  updateBtnContainer: {
    marginTop: spacing.md,
  },
  noHistoryText: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
  historyTimeline: {
    gap: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineGraphic: {
    alignItems: 'center',
    width: 16,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderStrong,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineUpdater: {
    fontWeight: '600',
    fontSize: 13,
  },
  timelineNotes: {
    fontStyle: 'italic',
    marginTop: 2,
  },
});
