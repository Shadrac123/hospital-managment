import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Screen, Text, Card, Button, IconButton, Badge, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { db, subscribeToReport } from '@/services/firebase';
import { PatientStackParamList } from '@/navigation/types';
import { Report } from '@/types/models';

type Props = NativeStackScreenProps<PatientStackParamList, 'ReportDetails'>;

export function ReportDetailsScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToReport(
      reportId,
      (data) => {
        setReport(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [reportId]);

  const handleDownloadAndShare = async () => {
    if (!report?.fileUrl || !report.fileName) return;

    setDownloading(true);
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Unavailable', 'Sharing and saving files is not supported on this device.');
        setDownloading(false);
        return;
      }

      // Create a stable local path to download the file into
      const extension = report.fileName.split('.').pop() || 'pdf';
      const localUri = `${documentDirectory}${report.id}_report.${extension}`;

      const { uri } = await downloadAsync(report.fileUrl, localUri);
      await Sharing.shareAsync(uri, {
        mimeType: report.fileType || 'application/pdf',
        dialogTitle: report.fileName,
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not retrieve report file. Please try again.');
    } finally {
      setDownloading(false);
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

  const isImageFile = (type: string | null | undefined, name: string | null | undefined) => {
    if (type?.startsWith('image/')) return true;
    const lowerName = name?.toLowerCase() || '';
    return (
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.gif')
    );
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!report) {
    return (
      <Screen>
        <View style={styles.topBar}>
          <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text variant="bodyMuted">Report not found</Text>
        </View>
      </Screen>
    );
  }

  const dateText = report.createdAt?.seconds
    ? new Date(report.createdAt.seconds * 1000).toLocaleString()
    : new Date().toLocaleString();

  const isApproved = report.status === 'approved';
  const isRejected = report.status === 'rejected';
  const showImagePreview = isApproved && report.fileUrl && isImageFile(report.fileType, report.fileName);

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <Text variant="h2">Request Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text variant="h2">{report.reportType}</Text>
              <Text variant="caption" color={colors.textTertiary} style={{ marginTop: 2 }}>
                ID: #{report.id.slice(0, 10).toUpperCase()}
              </Text>
            </View>
            <Badge label={report.status.toUpperCase()} tone={getStatusTone(report.status)} />
          </View>
          <View style={styles.divider}><Divider /></View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textSecondary}>
              Requested: {dateText}
            </Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            YOUR NOTE
          </Text>
          <Card>
            <Text variant="body">
              {report.patientNote || 'No notes provided by patient.'}
            </Text>
          </Card>
        </View>

        {isApproved && (
          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
              CLINICAL NOTE & DOCUMENT
            </Text>
            <Card style={styles.adminCard}>
              <View style={styles.doctorHeader}>
                <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                <Text variant="label" color={colors.success}>
                  Approved Medical Report
                </Text>
              </View>

              {report.adminNote ? (
                <Text variant="body" style={styles.adminNote}>
                  {report.adminNote}
                </Text>
              ) : (
                <Text variant="bodyMuted" style={styles.adminNote}>
                  Your request was approved. You can view the document below.
                </Text>
              )}

              <View style={styles.divider}><Divider /></View>

              <View style={styles.fileRow}>
                <Ionicons
                  name={
                    isImageFile(report.fileType, report.fileName)
                      ? 'image-outline'
                      : 'document-outline'
                  }
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.fileInfo}>
                  <Text variant="label" numberOfLines={1}>
                    {report.fileName || 'Report Document'}
                  </Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    {report.fileType?.split('/').pop()?.toUpperCase() || 'DOCUMENT'}
                  </Text>
                </View>
              </View>

              {showImagePreview && (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: report.fileUrl! }}
                    style={styles.imagePreview}
                    resizeMode="contain"
                  />
                </View>
              )}

              <Button
                title={downloading ? 'Downloading...' : 'Download / Share File'}
                icon="download-outline"
                loading={downloading}
                disabled={downloading}
                onPress={handleDownloadAndShare}
                style={styles.downloadBtn}
              />
            </Card>
          </View>
        )}

        {isRejected && (
          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
              REJECTION REASON
            </Text>
            <Card style={styles.rejectedCard}>
              <View style={styles.doctorHeader}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
                <Text variant="label" color={colors.danger}>
                  Request Rejected
                </Text>
              </View>
              <Text variant="body" style={styles.adminNote}>
                {report.adminNote || 'No explanation note provided by administrative staff.'}
              </Text>
            </Card>
          </View>
        )}

        {!isApproved && !isRejected && (
          <View style={styles.pendingContainer}>
            <Ionicons name="hourglass-outline" size={36} color={colors.warning} />
            <Text variant="bodyMuted" style={styles.pendingText}>
              Our clinical and administrative team is currently compiling your medical report.
              We will notify you once it has been processed.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    gap: spacing.lg,
  },
  headerCard: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    marginVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    paddingLeft: spacing.xs,
  },
  adminCard: {
    borderColor: colors.successSoft,
    borderWidth: 1,
    backgroundColor: colors.successSoft + '10', // 10% opacity
  },
  rejectedCard: {
    borderColor: colors.dangerSoft,
    borderWidth: 1,
    backgroundColor: colors.dangerSoft + '10', // 10% opacity
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  adminNote: {
    marginTop: spacing.md,
    lineHeight: 20,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  downloadBtn: {
    marginTop: spacing.md,
  },
  imagePreviewContainer: {
    marginTop: spacing.md,
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  pendingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  pendingText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
