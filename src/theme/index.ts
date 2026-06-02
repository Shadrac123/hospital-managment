export { colors } from './colors';
export type { ColorName } from './colors';
export { spacing, radius } from './spacing';
export { typography } from './typography';
export type { TypographyVariant } from './typography';
export { shadows } from './shadows';

import { colors } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

/** Single theme object for convenient destructuring. */
export const theme = { colors, spacing, radius, typography, shadows } as const;
export type Theme = typeof theme;
