import React, { useState } from 'react';
import { View, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Text, Card, Avatar, Badge, Divider } from '@/components/ui';
import { MenuRow } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { uploadAvatar, updateUserAvatar } from '@/services/firebase';
import { firebaseErrorMessage } from '@/utils/firebaseError';

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AdminTabParamList } from '@/navigation/types';

type Props = BottomTabScreenProps<AdminTabParamList, 'AdminProfile'>;

const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'people-outline', label: 'Manage Doctors' },
];

export function AdminProfileScreen({ navigation }: Props) {
  const { profile, user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [uploading, setUploading] = useState(false);

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
          <Text variant="h3">{profile?.displayName ?? 'Admin'}</Text>
          <Text variant="caption">{user?.email ?? '—'}</Text>
          <Badge label="Administrator" tone="primary" style={styles.roleBadge} />
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
                  if (item.label === 'Manage Doctors') {
                    navigation.navigate('Doctors');
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
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
  roleBadge: { marginTop: 4 },
  menuCard: { marginTop: spacing.lg },
  menuInner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
});
