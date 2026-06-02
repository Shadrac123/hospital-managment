import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

/** Soft, low-opacity elevation matching the mockups' floating cards. */
const make = (
  elevation: number,
  radius: number,
  opacity: number,
  offsetY: number,
): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: colors.shadow,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;

export const shadows = {
  none: {} as ViewStyle,
  sm: make(2, 8, 0.05, 2),
  md: make(4, 16, 0.07, 6),
  lg: make(8, 24, 0.1, 10),
} as const;
