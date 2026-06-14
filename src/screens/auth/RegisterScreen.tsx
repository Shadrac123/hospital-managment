import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Input, Button, IconButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/services/firebase';
import {
  isValidEmail,
  isStrongPassword,
  isNonEmpty,
  PASSWORD_RULE_HINT,
} from '@/utils/validation';
import { UserRole } from '@/types/models';
import { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const ROLES: { value: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'patient', label: 'Patient', icon: 'person-outline' },
  { value: 'admin', label: 'Admin', icon: 'shield-checkmark-outline' },
];

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [adminCode, setAdminCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrong = isStrongPassword(password);
  const passwordsMatch = password === confirmPassword;
  // Only surface the inline field errors once the user has typed something, so
  // the form doesn't look "wrong" before they start.
  const passwordError =
    isNonEmpty(password) && !passwordStrong ? PASSWORD_RULE_HINT : undefined;
  const confirmError =
    isNonEmpty(confirmPassword) && !passwordsMatch
      ? 'Passwords do not match.'
      : undefined;

  const canSubmit =
    isNonEmpty(name) &&
    isValidEmail(email) &&
    passwordStrong &&
    passwordsMatch &&
    isNonEmpty(confirmPassword) &&
    (role !== 'admin' || isNonEmpty(adminCode));

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        email,
        password,
        displayName: name.trim(),
        role,
        adminCode: role === 'admin' ? adminCode.trim() : undefined,
      });
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <IconButton
            name="chevron-back"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          />
        </View>

        <View style={styles.header}>
          <Text variant="displayLg">Create account</Text>
          <Text variant="bodyMuted" style={styles.subtitle}>
            Join to book and manage appointments
          </Text>
        </View>

        {/* Role selector — determines the users/{uid}.role document for routing */}
        <View style={styles.roleRow}>
          {ROLES.map((r) => {
            const active = role === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => {
                  setRole(r.value);
                  setError(null);
                  if (r.value !== 'admin') setAdminCode('');
                }}
                style={[styles.roleCard, active && styles.roleCardActive]}
              >
                <Ionicons
                  name={r.icon}
                  size={20}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text
                  variant="label"
                  color={active ? colors.primary : colors.textSecondary}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          <Input
            label="Full name"
            leftIcon="person-outline"
            placeholder="Jane Doe"
            autoCapitalize="words"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(null);
            }}
          />
          <Input
            label="Email"
            leftIcon="mail-outline"
            placeholder="you@example.com"
            keyboardType="email-address"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
          />
          <Input
            label="Password"
            leftIcon="lock-closed-outline"
            placeholder="Create a strong password"
            secure
            value={password}
            error={passwordError}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
          />
          {!passwordError ? (
            <Text variant="caption" color={colors.textTertiary} style={styles.hint}>
              {PASSWORD_RULE_HINT}
            </Text>
          ) : null}
          <Input
            label="Confirm password"
            leftIcon="lock-closed-outline"
            placeholder="Re-enter your password"
            secure
            value={confirmPassword}
            error={confirmError}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setError(null);
            }}
          />

          {role === 'admin' ? (
            <Input
              label="Admin code"
              leftIcon="key-outline"
              placeholder="Enter the admin access code"
              secure
              value={adminCode}
              onChangeText={(t) => {
                setAdminCode(t);
                setError(null);
              }}
            />
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text variant="caption" color={colors.danger} style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            title="Create account"
            onPress={onSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={styles.cta}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMuted">Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')} hitSlop={6}>
            <Text variant="label" color={colors.primary}>
              Sign in
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { marginTop: spacing.sm, marginBottom: spacing.lg },
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.xs },
  roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  form: { gap: spacing.lg },
  hint: { marginLeft: spacing.xs, marginTop: -spacing.sm },
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
