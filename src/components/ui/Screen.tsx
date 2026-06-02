import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ViewStyle,
  StyleProp,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

export interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView. */
  scroll?: boolean;
  /** Apply default horizontal padding to the content. */
  padded?: boolean;
  background?: string;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

/** Safe-area aware screen wrapper. The app canvas color sits behind cards. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  background = colors.background,
  edges = ['top'],
  contentContainerStyle,
  refreshControl,
}: ScreenProps) {
  const padding = padded ? styles.padded : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }]} edges={edges}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          contentContainerStyle={[styles.scrollContent, padding, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.xl },
  scrollContent: { paddingBottom: spacing['4xl'] },
});
