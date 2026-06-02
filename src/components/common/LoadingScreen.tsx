import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from '@/components/ui';

/** Full-screen splash shown while the persisted auth session is restored. */
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text variant="h2" style={styles.title}>
        Doctor Booking
      </Text>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: { marginTop: spacing.lg },
  spinner: { marginTop: spacing.xl },
});
