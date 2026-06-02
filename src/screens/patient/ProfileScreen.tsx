import React, { useState } from 'react';
import { View, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Text, Card, Avatar, Divider } from '@/components/ui';
import { MenuRow } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { uploadAvatar, updateUserAvatar } from '@/services/firebase';

// Phase 1 menu — only in-scope items. (No notifications, prescriptions, lab
// reports, billing, etc. — those are out of scope.)
const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'person-outline', label: 'Personal Information' },
  { icon: 'calendar-outline', label: 'Appointments' },
  { icon: 'lock-closed-outline', label: 'Privacy & Security' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'settings-outline', label: 'Settings' },
];

export function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onChangeAvatar = async () => {
    if (!user || uploading) return;

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

    setUploading(true);
    try {
      const url = await uploadAvatar(user.uid, result.assets[0].uri);
      await updateUserAvatar(user.uid, url);
      // Profile updates live via the Firestore onSnapshot in AuthContext.
    } catch {
      Alert.alert('Upload failed', 'Could not update your avatar. Please try again.');
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
              <MenuRow icon={item.icon} label={item.label} />
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
});
