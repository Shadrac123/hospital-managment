import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Text, Card, Input, Button, IconButton } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { createEmergencyRequest } from '@/services/firebase';
import { PatientStackParamList } from '@/navigation/types';
import { EmergencySeverity } from '@/types/models';

type Props = NativeStackScreenProps<PatientStackParamList, 'EmergencyCreate'>;

const SEVERITIES: { value: EmergencySeverity; label: string; color: string; bg: string }[] = [
  { value: 'low', label: 'Low', color: colors.textSecondary, bg: colors.surfaceAlt },
  { value: 'medium', label: 'Medium', color: colors.primary, bg: colors.primarySoft },
  { value: 'high', label: 'High', color: colors.warning, bg: colors.warningSoft },
  { value: 'critical', label: 'Critical', color: colors.danger, bg: colors.dangerSoft },
];

export function EmergencyCreateScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<EmergencySeverity>('medium');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectImage = () => {
    Alert.alert(
      'Attach Image',
      'Choose the source of the emergency image:',
      [
        { text: 'Take Photo', onPress: handleCaptureCamera },
        { text: 'Choose from Gallery', onPress: handlePickGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCaptureCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;

    if (!title.trim()) {
      Alert.alert('Error', 'Please provide an emergency title.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a detailed description of the emergency.');
      return;
    }

    setSubmitting(true);
    try {
      await createEmergencyRequest(
        user.uid,
        title.trim(),
        description.trim(),
        severity,
        imageUri || undefined
      );

      Alert.alert(
        'Emergency Logged',
        'Your emergency request has been successfully filed. A clinical desk operator will contact you shortly if necessary.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert('Failed to report', err.message || 'An error occurred while logging the emergency.');
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
        <Text variant="h2">Report Emergency</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.formCard}>
            <Input
              label="Emergency Title / Subject"
              placeholder="e.g. Sharp chest pain, Fall injury"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            <Input
              label="Description of Emergency / Symptoms"
              placeholder="Provide detail on the patient state, location, symptoms, and if there are immediate injuries..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={1000}
              style={styles.textArea}
            />

            {/* Severity Level */}
            <View style={styles.fieldGroup}>
              <Text variant="label" style={styles.fieldLabel}>
                Severity Level
              </Text>
              <View style={styles.severityGrid}>
                {SEVERITIES.map((s) => {
                  const isSelected = severity === s.value;
                  return (
                    <Pressable
                      key={s.value}
                      onPress={() => setSeverity(s.value)}
                      style={[
                        styles.severityChip,
                        { borderColor: s.color },
                        isSelected && { backgroundColor: s.bg, borderWidth: 2 },
                      ]}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={14}
                        color={s.color}
                      />
                      <Text
                        variant="caption"
                        style={[styles.severityLabel, { color: s.color, fontWeight: isSelected ? '700' : '500' }]}
                      >
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Image Attachment */}
            <View style={styles.fieldGroup}>
              <Text variant="label" style={styles.fieldLabel}>
                Photo Attachment (Optional)
              </Text>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <Pressable style={styles.removeImageBtn} onPress={handleRemoveImage}>
                    <Ionicons name="close-circle" size={24} color={colors.danger} />
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.attachBtn} onPress={handleSelectImage}>
                  <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
                  <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                    Tap to capture or choose photo
                  </Text>
                </Pressable>
              )}
            </View>

            <View style={styles.submitContainer}>
              <Button
                title="Submit Emergency Request"
                icon="send-outline"
                loading={submitting}
                disabled={submitting}
                variant="destructive"
                onPress={handleSubmit}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 44,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  formCard: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  severityLabel: {
    fontSize: 12,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  attachBtn: {
    width: '100%',
    height: 100,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  submitContainer: {
    marginTop: spacing.sm,
  },
});
