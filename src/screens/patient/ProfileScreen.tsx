import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Screen, Text, Card, Avatar, Divider, Input, Button, IconButton } from '@/components/ui';
import { MenuRow } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { uploadAvatar, updateUserAvatar, updatePatientProfile } from '@/services/firebase';
import { firebaseErrorMessage } from '@/utils/firebaseError';
import { PatientTabParamList, PatientStackParamList } from '@/navigation/types';
import { Gender } from '@/types/models';

type Props = CompositeScreenProps<
  BottomTabScreenProps<PatientTabParamList, 'Profile'>,
  NativeStackScreenProps<PatientStackParamList>
>;

const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'person-outline', label: 'Personal Information' },
  { icon: 'calendar-outline', label: 'Appointments' },
  { icon: 'settings-outline', label: 'Settings' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Not specified' },
];

export function ProfileScreen({ navigation }: Props) {
  const { profile, user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal visibilities
  const [personalModalVisible, setPersonalModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // Profile fields state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [address, setAddress] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [ecRelationship, setEcRelationship] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const isValidDob = (val: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));

  const openPersonalModal = () => {
    setDisplayName(profile?.displayName ?? '');
    setPhone(profile?.phone ?? '');
    setDateOfBirth(profile?.dateOfBirth ?? '');
    setGender((profile?.gender as Gender) ?? '');
    setAddress(profile?.address ?? '');
    setEcName(profile?.emergencyContact?.name ?? '');
    setEcPhone(profile?.emergencyContact?.phone ?? '');
    setEcRelationship(profile?.emergencyContact?.relationship ?? '');
    setPersonalModalVisible(true);
  };

  const openSettingsModal = () => {
    const s = (profile as any)?.settings;
    setEmailAlerts(s?.emailAlerts ?? true);
    setPushAlerts(s?.pushAlerts ?? true);
    setShowCompleted(s?.showCompleted ?? true);
    setSettingsModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user || savingProfile) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required.');
      return;
    }
    if (dateOfBirth && !isValidDob(dateOfBirth)) {
      Alert.alert('Error', 'Please enter a valid Date of Birth (YYYY-MM-DD).');
      return;
    }

    setSavingProfile(true);
    try {
      await updatePatientProfile(user.uid, {
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        gender: (gender || undefined) as Gender | undefined,
        address: address.trim() || undefined,
        emergencyContact: ecName.trim()
          ? {
              name: ecName.trim(),
              phone: ecPhone.trim(),
              relationship: ecRelationship.trim(),
            }
          : undefined,
      });
      setPersonalModalVisible(false);
      Alert.alert('Success', 'Profile details updated successfully.');
    } catch (e) {
      Alert.alert('Error', firebaseErrorMessage(e));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user || savingSettings) return;
    setSavingSettings(true);
    try {
      await updatePatientProfile(user.uid, {
        settings: {
          emailAlerts,
          pushAlerts,
          showCompleted,
        } as any,
      });
      setSettingsModalVisible(false);
      Alert.alert('Success', 'Settings preferences updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings configurations.');
    } finally {
      setSavingSettings(false);
    }
  };

  const getPickerDate = () => {
    if (dateOfBirth && isValidDob(dateOfBirth)) {
      const parts = dateOfBirth.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
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

  const onChangeAvatar = async () => {
    if (!user || uploading) return;

    Alert.alert(
      'Update Avatar',
      'Choose a source for your profile photo:',
      [
        {
          text: 'Take Photo',
          onPress: handleCaptureAvatarCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: handlePickAvatarGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCaptureAvatarCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow camera access to update your avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;
    await processAvatarUpload(result.assets[0].uri);
  };

  const handlePickAvatarGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to update your avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;
    await processAvatarUpload(result.assets[0].uri);
  };

  const processAvatarUpload = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(user.uid, uri);
      await updateUserAvatar(user.uid, url);
    } catch (e) {
      Alert.alert('Upload failed', firebaseErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const onSignOut = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1">Profile</Text>
        <Text variant="bodyMuted" style={styles.subtitle}>
          Manage your account and preferences
        </Text>
      </View>

      <Card style={styles.profileCard}>
        <Pressable onPress={onChangeAvatar} disabled={uploading}>
          <Avatar name={profile?.displayName} uri={profile?.photoURL ?? undefined} size={64} />
          <View style={styles.avatarBadge}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.textInverse} />
            )}
          </View>
        </Pressable>
        <View style={styles.profileText}>
          <Text variant="h3">{profile?.displayName ?? 'Patient'}</Text>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
            <Text variant="caption">{user?.email ?? '—'}</Text>
          </View>
          {profile?.phone ? (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <Text variant="caption">{profile.phone}</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card style={styles.menuCard} padded={false}>
        <View style={styles.menuInner}>
          {MENU.map((item, i) => (
            <View key={item.label}>
              <MenuRow
                icon={item.icon}
                label={item.label}
                onPress={() => {
                  if (item.label === 'Personal Information') {
                    openPersonalModal();
                  } else if (item.label === 'Appointments') {
                    navigation.navigate('Schedule');
                  } else if (item.label === 'Settings') {
                    openSettingsModal();
                  }
                }}
              />
              {i < MENU.length - 1 ? <Divider inset={50} /> : null}
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.menuCard} padded={false}>
        <View style={styles.menuInner}>
          <MenuRow
            icon="log-out-outline"
            label={signingOut ? 'Logging out…' : 'Log Out'}
            tint={colors.danger}
            showChevron={false}
            onPress={signingOut ? undefined : onSignOut}
          />
        </View>
      </Card>

      {/* Personal Information Modal */}
      <Modal
        visible={personalModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPersonalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text variant="h2">Edit Information</Text>
              <IconButton name="close" onPress={() => setPersonalModalVisible(false)} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <Input
                  label="Full Name"
                  leftIcon="person-outline"
                  placeholder="Jane Doe"
                  value={displayName}
                  onChangeText={setDisplayName}
                />

                <Input
                  label="Phone Number"
                  leftIcon="call-outline"
                  placeholder="+1 555 000 0000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <Input
                  label="Date of Birth (YYYY-MM-DD)"
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

                <Input
                  label="Home Address"
                  leftIcon="location-outline"
                  placeholder="123 Main St, City, Country"
                  value={address}
                  onChangeText={setAddress}
                />

                <Text variant="label" style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
                  EMERGENCY CONTACT
                </Text>
                <Input
                  label="Contact Name"
                  leftIcon="person-outline"
                  placeholder="John Doe"
                  value={ecName}
                  onChangeText={setEcName}
                />

                <Input
                  label="Contact Phone"
                  leftIcon="call-outline"
                  placeholder="+1 555 000 0000"
                  keyboardType="phone-pad"
                  value={ecPhone}
                  onChangeText={setEcPhone}
                />

                <Input
                  label="Relationship"
                  leftIcon="heart-outline"
                  placeholder="Spouse, Sibling, Parent..."
                  value={ecRelationship}
                  onChangeText={setEcRelationship}
                />

                <View style={styles.modalButtons}>
                  <Button
                    title="Save Changes"
                    icon="checkmark"
                    loading={savingProfile}
                    disabled={savingProfile}
                    onPress={handleSaveProfile}
                  />
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h2">App Settings</Text>
              <IconButton name="close" onPress={() => setSettingsModalVisible(false)} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text variant="label">Email Notifications</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Receive updates on report status and bookings via email.
                  </Text>
                </View>
                <Switch
                  value={emailAlerts}
                  onValueChange={setEmailAlerts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : colors.surface}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text variant="label">Push Alerts</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Enable notifications directly on your mobile device.
                  </Text>
                </View>
                <Switch
                  value={pushAlerts}
                  onValueChange={setPushAlerts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : colors.surface}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingText}>
                  <Text variant="label">Show Completed Consultations</Text>
                  <Text variant="caption" color={colors.textSecondary}>
                    Display past consultations inside your schedule lists.
                  </Text>
                </View>
                <Switch
                  value={showCompleted}
                  onValueChange={setShowCompleted}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={Platform.OS === 'ios' ? undefined : colors.surface}
                />
              </View>

              <View style={styles.modalButtons}>
                <Button
                  title="Save Preferences"
                  icon="checkmark"
                  loading={savingSettings}
                  disabled={savingSettings}
                  onPress={handleSaveSettings}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Component */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.modalBackdrop}>
              <View style={styles.iosPickerContent}>
                <View style={styles.iosPickerHeader}>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text variant="label" color={colors.primary}>Cancel</Text>
                  </Pressable>
                  <Text variant="h3">Pick Date of Birth</Text>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text variant="label" color={colors.primary}>Done</Text>
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

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: 2 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  profileText: { flex: 1, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  menuCard: { marginTop: spacing.lg },
  menuInner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalScroll: {
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  fieldLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingText: {
    flex: 1,
    paddingRight: spacing.md,
    gap: 2,
  },
  modalButtons: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  iosPickerContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing['3xl'],
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
