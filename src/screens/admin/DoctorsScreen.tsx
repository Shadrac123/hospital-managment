import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  Pressable,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import {
  Screen,
  Text,
  IconButton,
  Card,
  Avatar,
  Badge,
  Input,
  Button,
} from '@/components/ui';
import { SearchBar, EmptyState } from '@/components/common';
import { colors, radius, spacing } from '@/theme';
import { useDoctors } from '@/hooks';
import {
  seedDoctorsIfEmpty,
  addDoctor,
  updateDoctor,
  deleteDoctor,
} from '@/services/firebase';
import { Doctor } from '@/types/models';

export function DoctorsScreen() {
  const { doctors, loading } = useDoctors();
  const [search, setSearch] = useState('');

  // Modal form states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bootstrap a real, assignable medical team on first run.
  useEffect(() => {
    seedDoctorsIfEmpty().catch(() => {
      /* ignored */
    });
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return doctors;
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.specialty.toLowerCase().includes(term),
    );
  }, [doctors, search]);

  const handleAddPress = () => {
    setEditingDoctor(null);
    setName('');
    setSpecialty('');
    setAvailable(true);
    setModalVisible(true);
  };

  const handleEditPress = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setAvailable(doctor.available ?? true);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !specialty.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    setSaving(true);
    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, name, specialty, available);
      } else {
        await addDoctor(name, specialty, available);
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save doctor details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingDoctor) return;

    Alert.alert(
      'Delete Doctor',
      `Are you sure you want to remove ${editingDoctor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteDoctor(editingDoctor.id);
              setModalVisible(false);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete doctor. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text variant="h1">Doctors</Text>
          <Text variant="bodyMuted" style={styles.subtitle}>
            Manage your medical team
          </Text>
        </View>
        <IconButton
          name="add"
          accessibilityLabel="Add doctor"
          onPress={handleAddPress}
        />
      </View>

      <SearchBar placeholder="Search doctors" value={search} onChangeText={setSearch} />

      <View style={styles.body}>
        {loading ? (
          <EmptyState icon="hourglass-outline" title="Loading…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="people-circle-outline"
            title="No doctors found"
            message="Doctors you add will appear here."
          />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(d) => d.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.gap} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleEditPress(item)}>
                <Card style={styles.doctorCard}>
                  <Avatar name={item.name} uri={item.photoURL ?? undefined} size={48} />
                  <View style={styles.doctorText}>
                    <Text variant="h3" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption">{item.specialty}</Text>
                  </View>
                  <Badge
                    label={item.available ? 'Available' : 'Off'}
                    tone={item.available ? 'success' : 'neutral'}
                  />
                </Card>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* Add / Edit Doctor Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h2">{editingDoctor ? 'Edit Doctor' : 'Add Doctor'}</Text>
              <IconButton name="close" onPress={() => setModalVisible(false)} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                <Input
                  label="Doctor Name"
                  placeholder="e.g. Dr. John Doe"
                  value={name}
                  onChangeText={setName}
                />

                <Input
                  label="Specialty"
                  placeholder="e.g. Cardiologist"
                  value={specialty}
                  onChangeText={setSpecialty}
                />

                <View style={styles.switchRow}>
                  <View style={styles.switchLabelBlock}>
                    <Text variant="body">Available for Bookings</Text>
                    <Text variant="caption" color={colors.textTertiary}>
                      If turned off, patients won't be able to book appointments with this doctor.
                    </Text>
                  </View>
                  <Switch
                    value={available}
                    onValueChange={setAvailable}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <Button
                    title={editingDoctor ? 'Save Changes' : 'Add Doctor'}
                    icon="checkmark-outline"
                    loading={saving}
                    disabled={saving}
                    onPress={handleSave}
                  />
                  {editingDoctor && (
                    <Button
                      title="Delete Doctor"
                      icon="trash-outline"
                      variant="destructive"
                      disabled={saving}
                      onPress={handleDelete}
                    />
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleBlock: { flex: 1 },
  subtitle: { marginTop: 2 },
  body: { flex: 1, marginTop: spacing.lg },
  list: { paddingBottom: spacing.lg },
  gap: { height: spacing.md },
  doctorCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doctorText: { flex: 1, gap: 2 },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    height: '75%',
    padding: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalScroll: {
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  switchLabelBlock: {
    flex: 1,
    gap: 2,
  },
  modalButtons: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
});
