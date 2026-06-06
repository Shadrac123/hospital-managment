import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Input, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/services/firebase';
import { isValidEmail, isNonEmpty } from '@/utils/validation';
import { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isValidEmail(email) && isNonEmpty(password);

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      // Navigation switches automatically once auth state + role resolve.
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="h2">Hospital Management System</Text>
        </View>

        <View style={styles.header}>
          <Text variant="displayLg">Welcome back</Text>
          <Text variant="bodyMuted" style={styles.subtitle}>
            Sign in to manage your appointments
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            leftIcon="mail-outline"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
          />
          <Input
            label="Password"
            leftIcon="lock-closed-outline"
            placeholder="••••••••"
            secure
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text variant="caption" color={colors.danger} style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            title="Sign In"
            onPress={onSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={styles.cta}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMuted">Don&apos;t have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={6}>
            <Text variant="label" color={colors.primary}>
              Create one
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  logo: {
    width: 48,
    height: 48,
  },
  header: { marginBottom: spacing['2xl'] },
  subtitle: { marginTop: spacing.xs },
  form: { gap: spacing.lg },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { flex: 1 },
  cta: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
});
