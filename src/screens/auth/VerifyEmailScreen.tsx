import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { authErrorMessage } from '@/services/firebase';

type Banner = { kind: 'success' | 'error' | 'info'; text: string } | null;

const BANNER_STYLE = {
  success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' },
  error: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' },
  info: { bg: colors.infoSoft, fg: colors.info, icon: 'information-circle' },
} as const;

/**
 * Shown after signup (and on any login with an unverified email). The user must
 * click the link in their inbox; this screen lets them re-check status or resend
 * the email. Once verified, RootNavigator swaps in the real app automatically.
 */
export function VerifyEmailScreen() {
  const { user, refreshEmailVerified, resendVerification, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  const onCheck = async () => {
    if (checking || resending) return;
    setBanner(null);
    setChecking(true);
    try {
      const verified = await refreshEmailVerified();
      if (!verified) {
        setBanner({
          kind: 'info',
          text: "Not verified yet. Tap the link in your email, then try again.",
        });
      }
      // If verified, RootNavigator switches away from this screen automatically.
    } catch (e) {
      setBanner({ kind: 'error', text: authErrorMessage(e) });
    } finally {
      setChecking(false);
    }
  };

  const onResend = async () => {
    if (checking || resending) return;
    setBanner(null);
    setResending(true);
    try {
      await resendVerification();
      setBanner({
        kind: 'success',
        text: 'Verification email sent. Check your inbox and spam folder.',
      });
    } catch (e) {
      setBanner({ kind: 'error', text: authErrorMessage(e) });
    } finally {
      setResending(false);
    }
  };

  const bannerStyle = banner ? BANNER_STYLE[banner.kind] : null;

  return (
    <Screen scroll>
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-unread-outline" size={40} color={colors.primary} />
        </View>
      </View>

      <View style={styles.header}>
        <Text variant="displayLg" center>
          Verify your email
        </Text>
        <Text variant="bodyMuted" center style={styles.subtitle}>
          We sent a verification link to{'\n'}
          <Text variant="label" color={colors.textPrimary}>
            {user?.email ?? 'your email address'}
          </Text>
        </Text>
        <Text variant="bodyMuted" center style={styles.help}>
          Open the email and tap the link to activate your account. Don&apos;t forget to
          check your spam folder.
        </Text>
      </View>

      {banner && bannerStyle ? (
        <View style={[styles.banner, { backgroundColor: bannerStyle.bg }]}>
          <Ionicons name={bannerStyle.icon} size={16} color={bannerStyle.fg} />
          <Text variant="caption" color={bannerStyle.fg} style={styles.bannerText}>
            {banner.text}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="I've verified — check again"
          icon="refresh"
          onPress={onCheck}
          loading={checking}
          disabled={resending}
        />
        <Button
          title="Resend verification email"
          variant="secondary"
          onPress={onResend}
          loading={resending}
          disabled={checking}
        />
        <Button
          title="Use a different account"
          variant="ghost"
          onPress={signOut}
          disabled={checking || resending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginTop: spacing['4xl'] },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginTop: spacing['2xl'], marginBottom: spacing['2xl'] },
  subtitle: { marginTop: spacing.md },
  help: { marginTop: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: { flex: 1 },
  actions: { gap: spacing.md },
});
