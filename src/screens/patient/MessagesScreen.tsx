import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Avatar } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { colors, spacing, radius } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { usePatientBookings } from '@/hooks';
import { Booking } from '@/types/models';
import { formatBookingDate } from '@/utils/validation';
import { subscribeToUnreadCount } from '@/services/firebase';

function ThreadItem({ item, navigation }: { item: Booking; navigation: any }) {
  const isAssigned = item.status === 'assigned' && item.doctorName;
  const displayName = isAssigned ? item.doctorName! : 'Care Team (Pending Doctor)';
  const specialty = isAssigned ? item.doctorSpecialty! : 'Scheduling Desk';
  const appointmentText = `Appt: ${formatBookingDate(item.date)} at ${item.time}`;
  
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to unread count for patient on this booking thread
    const unsub = subscribeToUnreadCount(item.id, 'patient', (count) => {
      setUnreadCount(count);
    });
    return unsub;
  }, [item.id]);

  return (
    <Card style={styles.threadCard} padded={false}>
      <Pressable
        style={styles.pressable}
        android_ripple={{ color: colors.border }}
        onPress={() =>
          navigation.navigate('Chat', {
            bookingId: item.id,
            recipientName: displayName,
          })
        }
      >
        <View style={styles.avatarContainer}>
          <Avatar
            name={displayName}
            size={48}
            style={!isAssigned ? styles.supportAvatar : undefined}
          />
          {!isAssigned && (
            <View style={styles.badgeContainer}>
              <Ionicons name="help-circle" size={14} color={colors.textInverse} />
            </View>
          )}
        </View>

        <View style={styles.threadInfo}>
          <View style={styles.threadHeader}>
            <Text variant="h3" style={styles.recipientName}>
              {displayName}
            </Text>
            <Text variant="caption" color={colors.textTertiary}>
              {item.time}
            </Text>
          </View>
          <Text variant="caption" color={colors.primary} style={styles.specialty}>
            {specialty}
          </Text>
          <Text variant="bodyMuted" style={styles.appointmentText} numberOfLines={1}>
            {appointmentText}
          </Text>
        </View>

        {unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text variant="caption" style={styles.unreadText}>
              {unreadCount}
            </Text>
          </View>
        ) : (
          <Ionicons
            name="chevron-forward-outline"
            size={18}
            color={colors.textTertiary}
            style={styles.chevron}
          />
        )}
      </Pressable>
    </Card>
  );
}

export function MessagesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { bookings, loading } = usePatientBookings(user?.uid);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">Messages</Text>
        <Text variant="bodyMuted" style={styles.subtitle}>
          Secure messaging with your doctor or care desk
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ThreadItem item={item} navigation={navigation} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No chats available"
              message="Book an appointment first to initialize a secure chat thread with our care team."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.xs },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  threadCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  supportAvatar: {
    backgroundColor: colors.primarySoft,
  },
  badgeContainer: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  threadInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: '700',
  },
  specialty: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appointmentText: {
    fontSize: 12,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  unreadBadge: {
    backgroundColor: colors.danger,
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: spacing.sm,
  },
  unreadText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
});
