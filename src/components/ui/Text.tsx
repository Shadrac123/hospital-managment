import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, TypographyVariant, colors } from '@/theme';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  center?: boolean;
}

/** Themed Text. Defaults to the `body` variant. */
export function Text({
  variant = 'body',
  color,
  center,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        color ? { color } : null,
        center ? styles.center : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});

export { colors };
