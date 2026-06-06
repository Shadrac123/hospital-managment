import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Avatar } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { colors, spacing, radius } from '@/theme';
import { useAllBookings } from '@/hooks';
import { Booking } from '@/types/models';
import { formatBookingDate } from '@/utils/validation';
import { subscribeToUnreadCount } from '@/services/firebase';

function AdminThreadItem({ item, navigation }: { item: Booking; navigation: any }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to unread count for admin on this booking thread
    const unsub = subscribeToUnreadCount(item.id, 'admin', (count) => {
      setUnreadCount(count);
    });
    return unsub;
  }, [item.id]);

  const isAssigned = item.status === 'assigned' && item.doctorName;
  const docText = isAssigned ? `Dr. Assigned: ${item.doctorName}` : 'No doctor assigned yet';

  return (
    <Card style={styles.threadCard} padded={false}>
      <Pressable
        style={styles.pressable}
        android_ripple={{ color: colors.border }}
        onPress={() =>
          navigation.navigate('Chat', {
            bookingId: item.id,
            recipientName: item.patientName,
          })
        }
      >
        <Avatar name={item.patientName} size={48} />
        
        <View style={styles.threadInfo}>
          <View style={styles.threadHeader}>
            <Text variant="h3" style={styles.patientName}>
              {item.patientName}
            </Text>
            <Text variant="caption" color={colors.textTertiary}>
              {item.time}
            </Text>
          </View>
          <Text variant="caption" color={isAssigned ? colors.success : colors.warning} style={styles.specialty}>
            {docText}
          </Text>
          <Text variant="bodyMuted" style={styles.appointmentText} numberOfLines={1}>
            Appt: {formatBookingDate(item.date)} · Ref: #{item.id.slice(0, 6)}
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

export function AdminChatsScreen({ navigation }: any) {
  const { bookings, loading } = useAllBookings();

  // Show bookings that have chat potential (both pending and assigned)
  const activeThreads = bookings.filter((b) => b.status === 'pending' || b.status === 'assigned');

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text variant="h1" style={styles.title}>Patient Chats</Text>
        </View>
        <Text variant="bodyMuted" style={styles.subtitle}>
          Active support and medical coordination threads
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeThreads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AdminThreadItem item={item} navigation={navigation} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No active chat threads"
              message="Active patient booking chats will display here once appointments are created."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.xl },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: -spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
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
  patientName: {
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
