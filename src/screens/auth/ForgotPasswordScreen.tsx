import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Input, Button, IconButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/services/firebase';
import { isValidEmail } from '@/utils/validation';
import { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const canSubmit = isValidEmail(email);

  const onSubmit = async () => {
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      // Don't reveal whether an account exists — treat "user not found" as success.
      const code =
        typeof e === 'object' && e !== null && 'code' in e
          ? String((e as { code: unknown }).code)
          : '';
      if (code === 'auth/user-not-found') {
        setSent(true);
      } else {
        setError(authErrorMessage(e));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Screen scroll>
        <View style={styles.topBar}>
          <IconButton
            name="chevron-back"
            onPress={() => navigation.navigate('Login')}
            accessibilityLabel="Back to sign in"
          />
        </View>

        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={40} color={colors.primary} />
          </View>
        </View>

        <View style={styles.header}>
          <Text variant="displayLg" center>
            Check your email
          </Text>
          <Text variant="bodyMuted" center style={styles.subtitle}>
            If an account exists for{'\n'}
            <Text variant="label" color={colors.textPrimary}>
              {email.trim()}
            </Text>
            , we&apos;ve sent a password reset link.
          </Text>
          <Text variant="bodyMuted" center style={styles.help}>
            Open the email and follow the link to choose a new password. Be sure to check
            your spam folder if you don&apos;t see it.
          </Text>
        </View>

        <Button
          title="Back to sign in"
          onPress={() => navigation.navigate('Login')}
          style={styles.cta}
        />
      </Screen>
    );
  }

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
          <Text variant="displayLg">Forgot password?</Text>
          <Text variant="bodyMuted" style={styles.subtitle}>
            Enter your email and we&apos;ll send you a link to reset your password.
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

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text variant="caption" color={colors.danger} style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            title="Send reset link"
            onPress={onSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={styles.cta}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMuted">Remembered it? </Text>
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
  iconWrap: { alignItems: 'center', marginTop: spacing.xl },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginTop: spacing.xl, marginBottom: spacing['2xl'] },
  subtitle: { marginTop: spacing.xs },
  help: { marginTop: spacing.md },
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
