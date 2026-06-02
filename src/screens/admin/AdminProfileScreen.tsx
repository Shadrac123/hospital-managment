import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Avatar, Badge, Divider } from '@/components/ui';
import { MenuRow } from '@/components/common';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';

const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'person-outline', label: 'Account Information' },
  { icon: 'people-outline', label: 'Manage Doctors' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'information-circle-outline', label: 'About' },
];

export function AdminProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

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
        <Avatar name={profile?.displayName} uri={profile?.photoURL ?? undefined} size={64} />
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
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  profileText: { flex: 1, gap: 4 },
  roleBadge: { marginTop: 4 },
  menuCard: { marginTop: spacing.lg },
  menuInner: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
});
