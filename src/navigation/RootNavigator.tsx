import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/common';
import { colors } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { PatientNavigator } from './PatientNavigator';
import { AdminNavigator } from './AdminNavigator';

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

/**
 * Top-level router. Switches the entire tree based on auth + role:
 *  - restoring session  -> LoadingScreen
 *  - logged out         -> AuthNavigator
 *  - role === 'admin'   -> AdminNavigator
 *  - otherwise          -> PatientNavigator
 */
export function RootNavigator() {
  const { initializing, user, role } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      {initializing ? (
        <LoadingScreen />
      ) : !user ? (
        <AuthNavigator />
      ) : role === 'admin' ? (
        <AdminNavigator />
      ) : (
        <PatientNavigator />
      )}
    </NavigationContainer>
  );
}
