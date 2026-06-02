import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Type scale. Uses the platform system font (clean healthcare look) so Phase 1
 * needs no font loading. Swap `fontFamily` here later to introduce a custom font.
 */
export const typography = {
  displayLg: { fontSize: 30, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4 },
  display: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
  h1: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  h3: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  bodyLg: { fontSize: 16, fontWeight: '400', color: colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400', color: colors.textPrimary },
  bodyMuted: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  button: { fontSize: 16, fontWeight: '700', color: colors.textInverse },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
