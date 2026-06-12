import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, IconButton, Badge } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { subscribeToPatientEmergencies } from '@/services/firebase';
import { PatientStackParamList } from '@/navigation/types';
import { EmergencyRequest, EmergencySeverity, EmergencyStatus } from '@/types/models';

type Props = NativeStackScreenProps<PatientStackParamList, 'Emergency'>;

export function EmergencyScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeToPatientEmergencies(
      user.uid,
      (data) => {
        setEmergencies(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const getStatusTone = (status: EmergencyStatus) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'acknowledged':
        return 'info';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getSeverityTone = (severity: EmergencySeverity) => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'neutral';
    }
  };

  const formatDateTime = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton
          name="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Text variant="h2">Emergencies</Text>
        <IconButton
          name="add-circle-outline"
          onPress={() => navigation.navigate('EmergencyCreate')}
          accessibilityLabel="Report emergency"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Banner CTA */}
        <Card style={styles.promoCard}>
          <View style={styles.promoTextContainer}>
            <Text variant="h3" color={colors.textInverse}>
              Medical Emergency?
            </Text>
            <Text variant="caption" color={colors.textInverse} style={styles.promoSub}>
              Report it immediately. Our duty officers will acknowledge and dispatch assistance.
            </Text>
            <Pressable
              style={styles.requestCta}
              onPress={() => navigation.navigate('EmergencyCreate')}
            >
              <Text variant="label" color={colors.danger}>
                Report Emergency
              </Text>
            </Pressable>
          </View>
          <Ionicons name="alert-circle" size={64} color="rgba(255,255,255,0.2)" />
        </Card>

        <View style={styles.historySection}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            EMERGENCY LOGS
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : emergencies.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
              <Text variant="h3" style={styles.emptyTitle}>
                No emergencies logged
              </Text>
              <Text variant="bodyMuted" style={styles.emptyText}>
                No emergencies reported for your profile. Hopefully it stays that way!
              </Text>
            </Card>
          ) : (
            <View style={styles.list}>
              {emergencies.map((item) => (
                <Card key={item.id} style={styles.emergencyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleBlock}>
                      <Ionicons name="warning-outline" size={20} color={colors.primary} />
                      <Text variant="h3" style={styles.emergencyTitle}>
                        {item.title}
                      </Text>
                    </View>
                    <View style={styles.badgeRow}>
                      <Badge
                        label={item.severity.toUpperCase()}
                        tone={getSeverityTone(item.severity)}
                      />
                      <Badge
                        label={item.status.toUpperCase()}
                        tone={getStatusTone(item.status)}
                      />
                    </View>
                  </View>

                  <Text variant="bodyMuted" style={styles.cardDesc}>
                    {item.description}
                  </Text>

                  {item.imageUrl && (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: item.imageUrl }} style={styles.attachmentImage} />
                    </View>
                  )}

                  {item.notes ? (
                    <View style={styles.notesBlock}>
                      <Text variant="caption" style={styles.notesLabel}>
                        Admin Response Note:
                      </Text>
                      <Text variant="bodyMuted" style={styles.notesText}>
                        {item.notes}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text variant="caption" color={colors.textTertiary}>
                      Reported: {formatDateTime(item.createdAt)}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.danger,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  promoTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  promoSub: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    opacity: 0.9,
  },
  requestCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  historySection: {
    marginTop: spacing['2xl'],
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    marginTop: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  emergencyCard: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 150,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cardDesc: {
    lineHeight: 20,
  },
  imageContainer: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 150,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  notesBlock: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notesLabel: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
});
