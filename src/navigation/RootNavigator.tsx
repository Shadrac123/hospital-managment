import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen } from '@/components/common';
import { colors } from '@/theme';
import { AuthNavigator } from './AuthNavigator';
import { PatientNavigator } from './PatientNavigator';
import { AdminNavigator } from './AdminNavigator';
import { OnboardingScreen } from '@/screens/patient';
import { VerifyEmailScreen } from '@/screens/auth/VerifyEmailScreen';
import { OnboardingStackParamList, VerifyEmailStackParamList } from './types';
import { useBookingNotifications } from '@/hooks';

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

// Standalone stack used while the patient hasn't completed onboarding.
// When profileComplete becomes true (Firestore onSnapshot → AuthContext),
// RootNavigator switches this entire tree out for PatientNavigator.
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Onboarding" component={OnboardingScreen} />
    </OnboardingStack.Navigator>
  );
}

// Standalone stack shown while a signed-in user has not verified their email.
// The app proper only mounts once emailVerified flips true (AuthContext).
const VerifyEmailStack = createNativeStackNavigator<VerifyEmailStackParamList>();

function VerifyEmailNavigator() {
  return (
    <VerifyEmailStack.Navigator screenOptions={{ headerShown: false }}>
      <VerifyEmailStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </VerifyEmailStack.Navigator>
  );
}

/**
 * Top-level router. Switches the entire tree based on auth + role + profile:
 *  - restoring session          → LoadingScreen
 *  - logged out                 → AuthNavigator
 *  - admin                      → AdminNavigator
 *  - patient, profile complete  → PatientNavigator
 *  - patient, profile missing   → OnboardingNavigator
 *
 * Using a state-driven switch here (not initialRouteName inside a child
 * navigator) ensures the gate is reliable for both new sign-ups and returning
 * patients who have not yet completed the questionnaire.
 */
export function RootNavigator() {
  const { initializing, user, role, profile, emailVerified } = useAuth();

  // Listen for real-time booking updates and show in-app alerts
  useBookingNotifications();

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      {initializing ? (
        <LoadingScreen />
      ) : !user ? (
        <AuthNavigator />
      ) : !emailVerified ? (
        // Signed in but email not yet verified — block the app behind verification.
        <VerifyEmailNavigator />
      ) : !profile ? (
        // Verified, waiting on the role/profile document to resolve.
        <LoadingScreen />
      ) : role === 'admin' ? (
        <AdminNavigator />
      ) : profile?.profileComplete ? (
        <PatientNavigator />
      ) : (
        // Patient without a completed profile → show onboarding.
        // Covers: brand-new sign-ups AND existing patients missing profileComplete.
        <OnboardingNavigator />
      )}
    </NavigationContainer>
  );
}
