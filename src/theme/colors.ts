/**
 * Color palette derived from the UI mockups.
 * Healthcare style: white surfaces, soft neutrals, a warm orange primary accent.
 */
export const colors = {
  // Brand
  primary: '#FF7A00', // orange CTA / active accent
  primaryDark: '#E56E00',
  primarySoft: '#FFF3E9', // tinted background behind orange elements

  // Surfaces
  background: '#F6F7FB', // app canvas behind cards
  surface: '#FFFFFF', // cards, sheets, inputs
  surfaceAlt: '#F2F4F8', // chips / subtle fills

  // Text
  textPrimary: '#1A1D26',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Lines & borders
  border: '#ECEEF3',
  borderStrong: '#E2E5EC',

  // Status
  success: '#16A34A',
  successSoft: '#E7F6EC',
  warning: '#F59E0B',
  warningSoft: '#FEF3E2',
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
  info: '#6366F1',
  infoSoft: '#EEF0FE',

  // Misc accents used by avatars / category icons
  iconBg: '#F4F5F9',
  shadow: '#101828',
} as const;

export type ColorName = keyof typeof colors;
