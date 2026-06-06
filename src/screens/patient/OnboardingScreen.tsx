import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen, Text, Input, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { updatePatientProfile } from '@/services/firebase';
import { Gender } from '@/types/models';
import { OnboardingStackParamList } from '@/navigation/types';
import { firebaseErrorMessage } from '@/utils/firebaseError';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding'>;

const STEPS = 4;

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function OnboardingScreen({ navigation }: Props) {
  const { user, profile } = useAuth();

  // Step 1
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  // Step 2
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ?? '');
  const [gender, setGender] = useState<Gender | ''>((profile?.gender as Gender) ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step 3
  const [address, setAddress] = useState(profile?.address ?? '');

  // Step 4
  const [ecName, setEcName] = useState(profile?.emergencyContact?.name ?? '');
  const [ecPhone, setEcPhone] = useState(profile?.emergencyContact?.phone ?? '');
  const [ecRelationship, setEcRelationship] = useState(
    profile?.emergencyContact?.relationship ?? '',
  );

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const isValidDob = (val: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));

  const canProceed = () => {
    switch (step) {
      case 1:
        return displayName.trim().length > 0 && phone.trim().length >= 7;
      case 2:
        return isValidDob(dateOfBirth) && gender !== '';
      case 3:
        return address.trim().length > 3;
      case 4:
        return ecName.trim().length > 0 && ecPhone.trim().length >= 7 && ecRelationship.trim().length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updatePatientProfile(user.uid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender: gender as Gender,
        address: address.trim(),
        emergencyContact: {
          name: ecName.trim(),
          phone: ecPhone.trim(),
          relationship: ecRelationship.trim(),
        },
        profileComplete: true,
        isActive: true,
      });

      // Firestore onSnapshot in AuthContext will update the profile, which
      // triggers RootNavigator to re-evaluate and switch to PatientNavigator.
    } catch (e) {
      Alert.alert('Could not save profile', firebaseErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const getPickerDate = () => {
    if (dateOfBirth && isValidDob(dateOfBirth)) {
      const parts = dateOfBirth.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    // Default to 18 years ago for convenience
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setDateOfBirth(`${yyyy}-${mm}-${dd}`);
    }
  };

  const progressPct = ((step - 1) / (STEPS - 1)) * 100;

  return (
    <Screen scroll={false} padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          {step > 1 ? (
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text variant="caption" color={colors.textSecondary}>
            Step {step} of {STEPS}
          </Text>
          <View style={styles.backBtn} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <StepWrapper
              icon="person-circle-outline"
              title="Personal Details"
              subtitle="Let's start with your basic info"
            >
              <Input
                label="Full name"
                leftIcon="person-outline"
                placeholder="Jane Doe"
                autoCapitalize="words"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <Input
                label="Phone number"
                leftIcon="call-outline"
                placeholder="+1 555 000 0000"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper
              icon="calendar-outline"
              title="Date of Birth & Gender"
              subtitle="Helps us personalise your care"
            >
              <Input
                label="Date of birth (YYYY-MM-DD)"
                rightIcon="calendar-outline"
                onRightIconPress={() => setShowDatePicker(true)}
                placeholder="1990-06-15"
                keyboardType="numbers-and-punctuation"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                error={dateOfBirth.length > 0 && !isValidDob(dateOfBirth) ? 'Use YYYY-MM-DD format (e.g. 1990-06-15)' : undefined}
              />
              <Text variant="label" style={styles.fieldLabel}>
                Gender
              </Text>
              <View style={styles.genderGrid}>
                {GENDERS.map((g) => {
                  const active = gender === g.value;
                  return (
                    <Pressable
                      key={g.value}
                      onPress={() => setGender(g.value)}
                      style={[styles.genderChip, active && styles.genderChipActive]}
                    >
                      <Text
                        variant="caption"
                        color={active ? colors.primary : colors.textSecondary}
                      >
                        {g.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper
              icon="home-outline"
              title="Home Address"
              subtitle="Used for correspondence and records"
            >
              <Input
                label="Address"
                leftIcon="location-outline"
                placeholder="123 Main St, City, Country"
                autoCapitalize="words"
                value={address}
                onChangeText={setAddress}
              />
            </StepWrapper>
          )}

          {step === 4 && (
            <StepWrapper
              icon="people-outline"
              title="Emergency Contact"
              subtitle="Someone we can reach if needed"
            >
              <Input
                label="Contact name"
                leftIcon="person-outline"
                placeholder="John Doe"
                autoCapitalize="words"
                value={ecName}
                onChangeText={setEcName}
              />
              <Input
                label="Contact phone"
                leftIcon="call-outline"
                placeholder="+1 555 000 0000"
                keyboardType="phone-pad"
                value={ecPhone}
                onChangeText={setEcPhone}
              />
              <Input
                label="Relationship"
                leftIcon="heart-outline"
                placeholder="Spouse, Parent, Sibling…"
                autoCapitalize="words"
                value={ecRelationship}
                onChangeText={setEcRelationship}
              />
            </StepWrapper>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step < STEPS ? (
            <Button
              title="Continue"
              icon="arrow-forward-outline"
              onPress={handleNext}
              disabled={!canProceed()}
            />
          ) : (
            <Button
              title={saving ? 'Saving…' : 'Finish Setup'}
              icon="checkmark-circle-outline"
              onPress={handleFinish}
              loading={saving}
              disabled={saving || !canProceed()}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Component */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.modalBackdrop}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text variant="button" color={colors.primary}>Cancel</Text>
                  </Pressable>
                  <Text variant="h3">Pick Date of Birth</Text>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text variant="button" color={colors.primary}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={getPickerDate()}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  textColor={colors.textPrimary}
                  style={{ backgroundColor: colors.background }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={getPickerDate()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )
      )}
    </Screen>
  );
}

function StepWrapper({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View style={styles.stepIcon}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text variant="h2" style={styles.stepTitle}>
        {title}
      </Text>
      <Text variant="bodyMuted" style={styles.stepSubtitle}>
        {subtitle}
      </Text>
      <View style={styles.stepFields}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
    minWidth: '5%',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  stepIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  stepTitle: { marginBottom: spacing.xs },
  stepSubtitle: { marginBottom: spacing['2xl'] },
  stepFields: { gap: spacing.lg },
  fieldLabel: { marginBottom: spacing.sm },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genderChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
