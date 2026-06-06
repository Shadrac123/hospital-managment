import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { Screen, Text, Input, Button, IconButton, Avatar } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { db, updatePatientProfile } from '@/services/firebase';
import { AppUser, Gender } from '@/types/models';
import { AdminStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AdminStackParamList, 'PatientEdit'>;

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function PatientEditScreen({ navigation, route }: Props) {
  const { patientId } = route.params;
  const [original, setOriginal] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [address, setAddress] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [ecRelationship, setEcRelationship] = useState('');

  // Load patient once
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'users', patientId),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const p: AppUser = {
            uid: snap.id,
            email: d.email ?? '',
            displayName: d.displayName ?? '',
            role: d.role ?? 'patient',
            phone: d.phone,
            photoURL: d.photoURL ?? null,
            dateOfBirth: d.dateOfBirth,
            gender: d.gender,
            address: d.address,
            emergencyContact: d.emergencyContact,
            profileComplete: d.profileComplete ?? false,
            isActive: d.isActive !== false,
          };
          if (!original) {
            setOriginal(p);
            setDisplayName(p.displayName);
            setPhone(p.phone ?? '');
            setDateOfBirth(p.dateOfBirth ?? '');
            setGender((p.gender as Gender) ?? '');
            setAddress(p.address ?? '');
            setEcName(p.emergencyContact?.name ?? '');
            setEcPhone(p.emergencyContact?.phone ?? '');
            setEcRelationship(p.emergencyContact?.relationship ?? '');
          }
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const isValidDob = (val: string) =>
    !val || (/^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val)));

  const canSave =
    displayName.trim().length > 0 &&
    isValidDob(dateOfBirth) &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updatePatientProfile(patientId, {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        gender: (gender as Gender) || undefined,
        address: address.trim() || undefined,
        emergencyContact:
          ecName.trim()
            ? {
                name: ecName.trim(),
                phone: ecPhone.trim(),
                relationship: ecRelationship.trim(),
              }
            : undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Save failed', 'Could not update the patient profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton
          name="close"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Cancel"
        />
        <Text variant="h2">Edit Patient</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !original ? (
        <View style={styles.centered}>
          <Text variant="bodyMuted">Patient not found</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar (read-only in admin edit — patient controls their own photo) */}
            <View style={styles.avatarRow}>
              <Avatar
                name={original.displayName}
                uri={original.photoURL ?? undefined}
                size={64}
              />
              <Text variant="caption" color={colors.textTertiary} style={styles.avatarNote}>
                Photo can only be changed by the patient
              </Text>
            </View>

            <SectionLabel>Personal Details</SectionLabel>
            <View style={styles.fields}>
              <Input
                label="Full name"
                leftIcon="person-outline"
                autoCapitalize="words"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <Input
                label="Phone number"
                leftIcon="call-outline"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <SectionLabel>Date of Birth & Gender</SectionLabel>
            <View style={styles.fields}>
              <Input
                label="Date of birth (YYYY-MM-DD)"
                leftIcon="calendar-outline"
                keyboardType="numbers-and-punctuation"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                error={
                  dateOfBirth.length > 0 && !isValidDob(dateOfBirth)
                    ? 'Use YYYY-MM-DD format'
                    : undefined
                }
              />
              <Text variant="label">Gender</Text>
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
            </View>

            <SectionLabel>Address</SectionLabel>
            <View style={styles.fields}>
              <Input
                label="Home address"
                leftIcon="location-outline"
                autoCapitalize="words"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <SectionLabel>Emergency Contact</SectionLabel>
            <View style={styles.fields}>
              <Input
                label="Contact name"
                leftIcon="person-outline"
                autoCapitalize="words"
                value={ecName}
                onChangeText={setEcName}
              />
              <Input
                label="Contact phone"
                leftIcon="call-outline"
                keyboardType="phone-pad"
                value={ecPhone}
                onChangeText={setEcPhone}
              />
              <Input
                label="Relationship"
                leftIcon="heart-outline"
                autoCapitalize="words"
                value={ecRelationship}
                onChangeText={setEcRelationship}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title={saving ? 'Saving…' : 'Save Changes'}
              icon="checkmark-outline"
              onPress={handleSave}
              loading={saving}
              disabled={!canSave}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
      {String(children).toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  spacer: { width: 44 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg },
  avatarNote: { flex: 1 },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  fields: { gap: spacing.lg },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
});
