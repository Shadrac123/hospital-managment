import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, IconButton, Badge } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';
import { subscribeToAllReports } from '@/services/firebase';
import { AdminStackParamList } from '@/navigation/types';
import { Report, ReportStatus } from '@/types/models';

type Props = NativeStackScreenProps<AdminStackParamList, 'ReportsManagement'>;

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
type FilterType = typeof FILTERS[number];

export function ReportsManagementScreen({ navigation }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  useEffect(() => {
    const unsub = subscribeToAllReports(
      (data) => {
        setReports(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const filteredReports = useMemo(() => {
    if (activeFilter === 'All') return reports;
    return reports.filter(
      (r) => r.status.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [reports, activeFilter]);

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <IconButton
          name="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Text variant="h2">Reports Management</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterTab, active && styles.filterTabActive]}
              >
                <Text
                  variant="label"
                  color={active ? colors.textInverse : colors.textPrimary}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : filteredReports.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text variant="h3" style={styles.emptyTitle}>
              No reports found
            </Text>
            <Text variant="bodyMuted" style={styles.emptyText}>
              There are no report requests matching the filter &quot;{activeFilter}&quot;.
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {filteredReports.map((report) => (
              <Pressable
                key={report.id}
                onPress={() =>
                  navigation.navigate('AdminReportsDetails', { reportId: report.id })
                }
              >
                <Card style={styles.reportCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.patientInfo}>
                      <Text variant="h3">{report.patientName}</Text>
                      <Text variant="caption" color={colors.textSecondary}>
                        {report.patientEmail}
                      </Text>
                    </View>
                    <Badge
                      label={report.status.toUpperCase()}
                      tone={getStatusTone(report.status)}
                    />
                  </View>

                  <View style={styles.typeRow}>
                    <Ionicons name="folder-open-outline" size={16} color={colors.primary} />
                    <Text variant="body" style={styles.typeText}>
                      {report.reportType}
                    </Text>
                  </View>

                  {report.patientNote ? (
                    <Text variant="bodyMuted" numberOfLines={1} style={styles.notePreview}>
                      Patient: &quot;{report.patientNote}&quot;
                    </Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text variant="caption" color={colors.textTertiary}>
                      Requested:{' '}
                      {report.createdAt?.seconds
                        ? new Date(report.createdAt.seconds * 1000).toLocaleDateString()
                        : new Date().toLocaleDateString()}
                    </Text>
                    <View style={styles.actionLink}>
                      <Text variant="caption" color={colors.primary}>
                        Manage
                      </Text>
                      <Ionicons name="chevron-forward" size={12} color={colors.primary} />
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
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
  filterContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  filterScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
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
  },
  list: {
    gap: spacing.md,
  },
  reportCard: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  patientInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  typeText: {
    fontWeight: '600',
  },
  notePreview: {
    fontStyle: 'italic',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
