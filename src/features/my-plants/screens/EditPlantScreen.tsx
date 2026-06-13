import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlantsStore } from '../store/plantsStore';
import { updatePlantInCloud } from '../services/plantService';
import { useAuthStore } from '../../auth/store/authStore';
import { PLANT_LOCATIONS } from '../../../constants/plants';
import { track } from '../../../services/analytics/posthog';
import type { PlantsStackParamList } from '../../../navigation/types';
import { theme } from '@constants/designSystem';

const C = theme.color;

type Nav = StackNavigationProp<PlantsStackParamList, 'EditPlant'>;
type Route = RouteProp<PlantsStackParamList, 'EditPlant'>;

const WATERING_OPTIONS = [
  { label: 'Daily', value: 1 },
  { label: 'Every 2 days', value: 2 },
  { label: 'Every 3 days', value: 3 },
  { label: 'Weekly', value: 7 },
  { label: 'Every 10 days', value: 10 },
  { label: 'Fortnightly', value: 14 },
];

export const EditPlantScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { plantId } = route.params;

  const { plants, updatePlant } = usePlantsStore();
  const { user } = useAuthStore();
  const plant = plants.find((p) => p.plantId === plantId) ?? null;

  const [nickname, setNickname] = useState(plant?.nickname ?? '');
  const [notes, setNotes] = useState(plant?.notes ?? '');
  const [wateringDays, setWateringDays] = useState(plant?.wateringFrequencyDays ?? 7);
  const [location, setLocation] = useState<string | null>(plant?.location ?? null);
  const [isSaving, setIsSaving] = useState(false);

  const isValid = nickname.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!isValid || !plant) return;
    setIsSaving(true);
    try {
      const updates = {
        nickname: nickname.trim(),
        notes: notes.trim() || undefined,
        wateringFrequencyDays: wateringDays,
        location: location ?? undefined,
      };
      if (user) await updatePlantInCloud(user.uid, plantId, updates);
      updatePlant(plantId, updates);
      track('plant_updated', { plantId, watering_days: wateringDays, has_notes: !!notes.trim() });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isValid, plant, plantId, nickname, notes, wateringDays, location, updatePlant, user, navigation]);

  if (!plant) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.errorBody}>
          <Text style={styles.errorMark}>✦</Text>
          <Text style={styles.errorText}>Plant not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit plant</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Nickname ── */}
        <FormSection label="Nickname *" hint="How you'll refer to this plant">
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. Lucky, Basil Bhai, Luna"
            placeholderTextColor={C.textMuted}
            maxLength={32}
            autoCorrect={false}
          />
        </FormSection>

        {/* ── Watering frequency ── */}
        <FormSection label="Watering schedule" hint="How often does it need water?">
          <View style={styles.chipGrid}>
            {WATERING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, wateringDays === opt.value && styles.chipActive]}
                onPress={() => setWateringDays(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, wateringDays === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormSection>

        {/* ── Location ── */}
        <FormSection label="Location" hint="Where does it live?">
          <View style={styles.chipGrid}>
            {PLANT_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.chip, location === loc && styles.chipActive]}
                onPress={() => setLocation(location === loc ? null : loc)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, location === loc && styles.chipTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormSection>

        {/* ── Notes ── */}
        <FormSection label="Notes" hint="Any special care instructions?">
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Water more in summer, repot next March..."
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
        </FormSection>
      </ScrollView>

      {/* ── Save CTA ── */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, (!isValid || isSaving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isSaving}
          activeOpacity={0.88}
        >
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FormSection: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <View style={styles.formSection}>
    <Text style={styles.formLabel}>{label}</Text>
    {hint && <Text style={styles.formHint}>{hint}</Text>}
    {children}
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorMark: {
    fontSize: 36,
    color: 'rgba(200,162,78,0.4)',
  },
  errorText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: C.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerBack: {
    width: 32,
  },
  headerBackText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    color: C.textPrimary,
  },
  headerTitle: {
    fontFamily: 'Jakarta-SemiBold',
    fontSize: 20,
    color: C.textPrimary,
  },
  scroll: {
    padding: 20,
    gap: 24,
  },
  formSection: {
    gap: 8,
  },
  formLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    color: C.textPrimary,
  },
  formHint: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: C.textMuted,
    marginTop: -4,
  },
  input: {
    backgroundColor: C.input,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: C.textPrimary,
  },
  notesInput: {
    minHeight: 88,
    paddingTop: 14,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.input,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: C.textPrimary,
  },
  chipTextActive: {
    color: C.onPrimary,
  },
  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: C.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.35,
  },
  saveBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: C.onPrimary,
    letterSpacing: 0.2,
  },
});
