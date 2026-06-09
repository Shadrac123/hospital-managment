import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Input, Button, IconButton, Badge } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { requestReport, subscribeToPatientReports } from '@/services/firebase';
import { PatientStackParamList } from '@/navigation/types';
import { Report, ReportType } from '@/types/models';

type Props = NativeStackScreenProps<PatientStackParamList, 'Reports'>;

const REPORT_TYPES: ReportType[] = [
  'Lab Exam',
  'Consultation Summary',
  'Medical Report',
  'General Report',
];

export function ReportsScreen({ navigation }: Props) {
  const { profile, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState<ReportType>('General Report');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToPatientReports(user.uid, (data) => {
      setReports(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const handleSubmit = async () => {
    if (!user || submitting) return;

    setSubmitting(true);
    try {
      const patientName = profile?.displayName || user.displayName || 'Patient';
      const patientEmail = user.email || '';

      await requestReport(user.uid, patientName, patientEmail, selectedType, note.trim());
      setNote('');
      setSelectedType('General Report');
      setModalVisible(false);
      Alert.alert('Success', 'Your report request has been submitted successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
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
        <Text variant="h2">Medical Reports</Text>
        <IconButton
          name="add-circle-outline"
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Request report"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Card style={styles.promoCard}>
          <View style={styles.promoTextContainer}>
            <Text variant="h3" color={colors.textInverse}>
              Need a medical document?
            </Text>
            <Text variant="caption" color={colors.textInverse} style={styles.promoSub}>
              Submit a request, and our clinical team will prepare it for you.
            </Text>
            <Pressable style={styles.requestCta} onPress={() => setModalVisible(true)}>
              <Text variant="label" color={colors.primary}>
                Request Report
              </Text>
            </Pressable>
          </View>
          <Ionicons name="document-text" size={64} color="rgba(255,255,255,0.2)" />
        </Card>

        <View style={styles.historySection}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            REQUEST HISTORY
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : reports.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
              <Text variant="h3" style={styles.emptyTitle}>
                No reports requested
              </Text>
              <Text variant="bodyMuted" style={styles.emptyText}>
                You haven&apos;t requested any reports yet. Tap the button below to start.
              </Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {reports.map((report) => (
                <Pressable
                  key={report.id}
                  onPress={() => navigation.navigate('ReportDetails', { reportId: report.id })}
                >
                  <Card style={styles.reportCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.typeBlock}>
                        <Ionicons
                          name={
                            report.reportType === 'Lab Exam'
                              ? 'flask-outline'
                              : report.reportType === 'Consultation Summary'
                              ? 'chatbubble-ellipses-outline'
                              : 'document-text-outline'
                          }
                          size={20}
                          color={colors.primary}
                        />
                        <Text variant="h3">{report.reportType}</Text>
                      </View>
                      <Badge
                        label={report.status.toUpperCase()}
                        tone={getStatusTone(report.status)}
                      />
                    </View>

                    {report.patientNote ? (
                      <Text
                        variant="bodyMuted"
                        numberOfLines={1}
                        style={styles.cardNote}
                      >
                        Note: {report.patientNote}
                      </Text>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <Text variant="caption" color={colors.textTertiary}>
                        Requested on:{' '}
                        {report.createdAt?.seconds
                          ? new Date(report.createdAt.seconds * 1000).toLocaleDateString()
                          : new Date().toLocaleDateString()}
                      </Text>
                      <View style={styles.detailsLink}>
                        <Text variant="caption" color={colors.primary}>
                          View Details
                        </Text>
                        <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Request Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h2">Request Report</Text>
              <IconButton name="close" onPress={() => setModalVisible(false)} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.fieldGroup}>
                  <Text variant="label" style={styles.fieldLabel}>
                    Report Type
                  </Text>
                  <View style={styles.typeSelector}>
                    {REPORT_TYPES.map((type) => {
                      const selected = selectedType === type;
                      return (
                        <Pressable
                          key={type}
                          onPress={() => setSelectedType(type)}
                          style={[
                            styles.typeOption,
                            selected && styles.typeOptionSelected,
                          ]}
                        >
                          <Ionicons
                            name={
                              type === 'Lab Exam'
                                ? 'flask-outline'
                                : type === 'Consultation Summary'
                                ? 'chatbubble-ellipses-outline'
                                : 'document-text-outline'
                            }
                            size={18}
                            color={selected ? colors.textInverse : colors.primary}
                          />
                          <Text
                            variant="label"
                            color={selected ? colors.textInverse : colors.textPrimary}
                          >
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Input
                  label="Optional Note / Reason"
                  placeholder="Describe what you need in the report..."
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  style={styles.textArea}
                />

                <View style={styles.modalButtons}>
                  <Button
                    title="Submit Request"
                    icon="send-outline"
                    loading={submitting}
                    disabled={submitting}
                    onPress={handleSubmit}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  promoTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  promoSub: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  requestCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  historySection: {
    marginTop: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    marginTop: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  reportCard: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardNote: {
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    height: '65%',
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    marginLeft: spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalScroll: {
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  modalButtons: {
    marginTop: spacing.xs,
  },
});
