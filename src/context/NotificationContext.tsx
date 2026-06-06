import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';

interface NotificationContextValue {
  showNotification: (
    message: string,
    options?: {
      type?: 'info' | 'success' | 'warning';
      onPress?: () => void;
    }
  ) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning'>('info');
  const [onPressCallback, setOnPressCallback] = useState<(() => void) | undefined>(undefined);

  const translateY = useRef(new Animated.Value(-120)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (
    msg: string,
    options?: {
      type?: 'info' | 'success' | 'warning';
      onPress?: () => void;
    }
  ) => {
    // Clear any existing dismissal timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(msg);
    setType(options?.type ?? 'info');
    setOnPressCallback(() => options?.onPress);
    setVisible(true);

    // Slide down animation
    Animated.spring(translateY, {
      toValue: Platform.OS === 'ios' ? insets.top + spacing.sm : spacing.sm + (StatusBar.currentHeight ?? 0),
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // Auto dismiss after 4.5 seconds
    timeoutRef.current = setTimeout(() => {
      dismissNotification();
    }, 4500);
  };

  const dismissNotification = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setMessage('');
      setOnPressCallback(undefined);
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Floating Animated Banner */}
      {visible && (
        <Animated.View
          style={[
            styles.bannerContainer,
            { transform: [{ translateY }] },
          ]}
        >
          <Pressable
            style={styles.banner}
            onPress={() => {
              if (onPressCallback) onPressCallback();
              dismissNotification();
            }}
          >
            <View style={styles.bannerRow}>
              <Ionicons name={getIcon()} size={24} color={getIconColor()} />
              <View style={styles.textContainer}>
                <Text variant="label" style={styles.bannerTitle}>
                  Notification
                </Text>
                <Text variant="caption" color={colors.textPrimary} style={styles.bannerMessage}>
                  {message}
                </Text>
              </View>
              <Pressable onPress={dismissNotification} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 9999,
  },
  banner: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 2,
  },
});
