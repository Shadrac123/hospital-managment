import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Screen, Text, Card, Input, Button, IconButton, Badge, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import {
  subscribeToReport,
  approveReportRequest,
  rejectReportRequest,
  uploadReportFile,
} from '@/services/firebase';
import { AdminStackParamList } from '@/navigation/types';
import { Report } from '@/types/models';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminReportsDetails'>;

export function AdminReportsDetailsScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [adminNote, setAdminNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const unsub = subscribeToReport(
      reportId,
      (data) => {
        setReport(data);
        if (data) {
          setAdminNote(data.adminNote || '');
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [reportId]);

  const handleSelectFile = () => {
    Alert.alert(
      'Attach Report Document',
      'Choose the method to select the report file:',
      [
        {
          text: 'Upload PDF Document',
          onPress: handlePickDocument,
        },
        {
          text: 'Choose Image from Gallery',
          onPress: handlePickImageGallery,
        },
        {
          text: 'Take Photo with Camera',
          onPress: handleCaptureImageCamera,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || 'application/pdf',
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick the document.');
    }
  };

  const handlePickImageGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow photo library access to upload a report image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const name = asset.fileName || `report_image_${Date.now()}.jpg`;
      setSelectedFile({
        uri: asset.uri,
        name: name,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick an image.');
    }
  };

  const handleCaptureImageCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Please allow camera access to capture the report.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const name = `camera_report_${Date.now()}.jpg`;
      setSelectedFile({
        uri: asset.uri,
        name: name,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const handleApprove = async () => {
    if (!report || submitting) return;
    if (!selectedFile) {
      Alert.alert('File Required', 'Please select or capture a report document/image to approve.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload file to storage
      const downloadUrl = await uploadReportFile(
        report.patientId,
        report.id,
        selectedFile.uri,
        selectedFile.name
      );

      // 2. Approve request in Firestore
      await approveReportRequest(
        report.id,
        downloadUrl,
        selectedFile.name,
        selectedFile.mimeType,
        adminNote.trim()
      );

      Alert.alert('Approved', 'Report has been approved and shared with the patient.');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to approve report request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = () => {
    if (!report || submitting) return;

    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this report request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await rejectReportRequest(report.id, adminNote.trim());
              Alert.alert('Rejected', 'Report request has been rejected.');
              navigation.goBack();
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to reject request.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleShareFile = async () => {
    if (!report?.fileUrl || !report.fileName) return;

    setSharing(true);
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Unavailable', 'Sharing and saving files is not supported on this device.');
        setSharing(false);
        return;
      }

      const extension = report.fileName.split('.').pop() || 'pdf';
      const localUri = `${documentDirectory}${report.id}_report.${extension}`;

      const { uri } = await downloadAsync(report.fileUrl, localUri);
      await Sharing.shareAsync(uri, {
        mimeType: report.fileType || 'application/pdf',
        dialogTitle: report.fileName,
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not share file.');
    } finally {
      setSharing(false);
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

  const isPending = report.status === 'pending';
  const isApproved = report.status === 'approved';
  const isRejected = report.status === 'rejected';
  const requestedDate = report.createdAt?.seconds
    ? new Date(report.createdAt.seconds * 1000).toLocaleString()
    : new Date().toLocaleString();

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton name="chevron-back" onPress={() => navigation.goBack()} />
        <Text variant="h2">Manage Request</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Patient and request overview */}
        <Card style={styles.metaCard}>
          <View style={styles.headerRow}>
            <View style={styles.patientInfo}>
              <Text variant="h2">{report.patientName}</Text>
              <Text variant="bodyMuted">{report.patientEmail}</Text>
            </View>
            <Badge label={report.status.toUpperCase()} tone={getStatusTone(report.status)} />
          </View>
          <View style={styles.divider}><Divider /></View>
          <View style={styles.metaItem}>
            <Ionicons name="folder-outline" size={16} color={colors.textSecondary} />
            <Text variant="body" style={styles.bold}>
              Type: {report.reportType}
            </Text>
          </View>
          <View style={[styles.metaItem, { marginTop: 4 }]}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text variant="caption" color={colors.textSecondary}>
              Requested: {requestedDate}
            </Text>
          </View>
        </Card>

        {/* Patient's note */}
        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            PATIENT NOTE
          </Text>
          <Card>
            <Text variant="body">
              {report.patientNote || 'No notes provided by patient.'}
            </Text>
          </Card>
        </View>

        {/* Action workflow (Pending requests only) */}
        {isPending && (
          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
              PROCESS REPORT REQUEST
            </Text>
            <Card style={styles.formCard}>
              <Input
                label="Administrative Notes"
                placeholder="Add medical explanations, diagnosis, or remarks here..."
                value={adminNote}
                onChangeText={setAdminNote}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <Text variant="label" style={styles.fieldLabel}>
                Report Document / File
              </Text>

              {selectedFile ? (
                <View style={styles.selectedFileBox}>
                  <View style={styles.fileHeader}>
                    <Ionicons
                      name={
                        selectedFile.mimeType.startsWith('image/')
                          ? 'image-outline'
                          : 'document-outline'
                      }
                      size={24}
                      color={colors.primary}
                    />
                    <View style={styles.fileMeta}>
                      <Text variant="label" numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text variant="caption" color={colors.textTertiary}>
                        Selected File
                      </Text>
                    </View>
                    <IconButton
                      name="trash-outline"
                      color={colors.danger}
                      onPress={() => setSelectedFile(null)}
                    />
                  </View>

                  {selectedFile.mimeType.startsWith('image/') && (
                    <View style={styles.previewBox}>
                      <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
                    </View>
                  )}
                </View>
              ) : (
                <Pressable style={styles.filePickerButton} onPress={handleSelectFile}>
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                  <Text variant="label" color={colors.primary}>
                    Attach PDF or Image File
                  </Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    Choose from PDF, Gallery, or Camera
                  </Text>
                </Pressable>
              )}

              <View style={styles.buttonRow}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Reject"
                    variant="destructive"
                    disabled={submitting}
                    onPress={handleReject}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Button
                    title="Approve & Upload"
                    icon="checkmark-circle-outline"
                    loading={submitting}
                    disabled={!selectedFile || submitting}
                    onPress={handleApprove}
                  />
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Display completed outcomes */}
        {isApproved && (
          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
              APPROVED REPORT DETAILS
            </Text>
            <Card style={styles.approvedCard}>
              <View style={styles.outcomeHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text variant="label" color={colors.success}>
                  Approved & Made Available to Patient
                </Text>
              </View>

              <Text variant="body" style={styles.adminNoteText}>
                {report.adminNote || 'Approved without notes.'}
              </Text>

              <View style={styles.divider}><Divider /></View>

              <View style={styles.attachedFileRow}>
                <Ionicons
                  name={
                    isImageFile(report.fileType, report.fileName)
                      ? 'image-outline'
                      : 'document-outline'
                  }
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.attachedFileInfo}>
                  <Text variant="label" numberOfLines={1}>
                    {report.fileName || 'Report Document'}
                  </Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    {report.fileType || 'Document'}
                  </Text>
                </View>
              </View>

              {isImageFile(report.fileType, report.fileName) && report.fileUrl && (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: report.fileUrl }} style={styles.outcomePreviewImage} resizeMode="contain" />
                </View>
              )}

              <Button
                title={sharing ? 'Sharing...' : 'Download / Share File'}
                icon="share-outline"
                variant="outline"
                loading={sharing}
                disabled={sharing}
                onPress={handleShareFile}
                style={styles.shareBtn}
              />
            </Card>
          </View>
        )}

        {isRejected && (
          <View style={styles.section}>
            <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
              REJECTION RECORD
            </Text>
            <Card style={styles.rejectedCard}>
              <View style={styles.outcomeHeader}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
                <Text variant="label" color={colors.danger}>
                  Rejected Request
                </Text>
              </View>
              <Text variant="body" style={styles.adminNoteText}>
                Reason: {report.adminNote || 'No explanation reason documented.'}
              </Text>
            </Card>
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
  metaCard: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  patientInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  divider: {
    marginVertical: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bold: {
    fontWeight: '600',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    paddingLeft: spacing.xs,
  },
  formCard: {
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: -spacing.xs,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  filePickerButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft + '10',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  selectedFileBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fileMeta: {
    flex: 1,
    gap: 2,
  },
  previewBox: {
    width: '100%',
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  approvedCard: {
    borderColor: colors.successSoft,
    borderWidth: 1,
    backgroundColor: colors.successSoft + '10',
  },
  rejectedCard: {
    borderColor: colors.dangerSoft,
    borderWidth: 1,
    backgroundColor: colors.dangerSoft + '10',
  },
  outcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  adminNoteText: {
    marginTop: spacing.md,
    lineHeight: 20,
  },
  attachedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  attachedFileInfo: {
    flex: 1,
    gap: 2,
  },
  imagePreviewWrapper: {
    marginTop: spacing.md,
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  outcomePreviewImage: {
    width: '100%',
    height: '100%',
  },
  shareBtn: {
    marginTop: spacing.md,
  },
});
