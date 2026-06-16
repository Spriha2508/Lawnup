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
import { Timestamp } from 'firebase/firestore';
import { usePlantsStore } from '../store/plantsStore';
import { savePlantToCloud } from '../services/plantService';
import { useAuthStore } from '../../auth/store/authStore';
import { useScanStore } from '../../scan/store/scanStore';
import { PLANT_LOCATIONS } from '../../../constants/plants';
import { logger } from '../../../shared/utils/logger';
import { track } from '../../../services/analytics/posthog';
import type { PlantsStackParamList } from '../../../navigation/types';
import type { UserPlantDoc } from '../../../types/firestore.types';
import { theme } from '@constants/designSystem';

const C = theme.color;

type Nav = StackNavigationProp<PlantsStackParamList, 'AddPlant'>;
type Route = RouteProp<PlantsStackParamList, 'AddPlant'>;

const WATERING_OPTIONS = [
  { label: 'Daily', value: 1 },
  { label: 'Every 2 days', value: 2 },
  { label: 'Every 3 days', value: 3 },
  { label: 'Weekly', value: 7 },
  { label: 'Every 10 days', value: 10 },
  { label: 'Fortnightly', value: 14 },
];

// Real Firestore Timestamp — structurally satisfies the local Timestamp type
const fsTs = (date: Date) => Timestamp.fromDate(date);

export const AddPlantScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const { fromScanId, speciesName = '', nickname: paramNickname = '' } = route.params ?? {};
  const { scanResult } = useScanStore();
  const { addPlant } = usePlantsStore();
  const { user } = useAuthStore();

  // Pre-fill from scan context if available
  const initialNickname = paramNickname || scanResult?.commonName || '';
  const initialSpecies = speciesName || scanResult?.commonName || '';

  const [nickname, setNickname] = useState(initialNickname);
  const [species, setSpecies] = useState(initialSpecies);
  const [notes, setNotes] = useState('');
  const [wateringDays, setWateringDays] = useState(7);
  const [location, setLocation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isValid = nickname.trim().length > 0 && species.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!isValid || !user) return;
    setIsSaving(true);

    try {
      const now = new Date();
      const nextWater = new Date(now);
      nextWater.setDate(nextWater.getDate() + wateringDays);

      const plantId = `plant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const plant: UserPlantDoc = {
        plantId,
        userId: user.uid,
        nickname: nickname.trim(),
        speciesName: species.trim(),
        imageUrl: scanResult?.imageUri ?? '',
        healthStatus: scanResult?.isHealthy === false ? 'Needs Attention' : 'Healthy',
        wateringFrequencyDays: wateringDays,
        lastWateredAt: fsTs(now),
        nextWaterAt: fsTs(nextWater),
        notes: notes.trim() || undefined,
        location: location ?? undefined,
        addedFromScanId: fromScanId,
        createdAt: fsTs(now),
        updatedAt: fsTs(now),
      };

      // Persist first; addPlant keeps navigation instant while the
      // live snapshot reconciles the store.
      await savePlantToCloud(user.uid, plant);
      addPlant(plant);

      logger.scan.nicknamed(species.trim(), nickname.trim());
      track('plant_added', {
        species: species.trim(),
        nickname: nickname.trim(),
        watering_days: wateringDays,
        location,
        from_scan: !!fromScanId,
      });

      navigation.replace('PlantDetail', { plantId });
    } catch (err) {
      logger.app.error('Failed to add plant', err);
      Alert.alert('Error', 'Could not add plant. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isValid, user, nickname, species, wateringDays, location, notes, fromScanId, scanResult, addPlant, navigation]);

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
        <Text style={styles.headerTitle}>Add to My Garden</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* From scan info badge */}
        {fromScanId && scanResult && (
          <View style={styles.fromScanBadge}>
            <Text style={styles.fromScanText}>
              ✦  From scan · {scanResult.commonName}
            </Text>
          </View>
        )}

        {/* ── Nickname field ── */}
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

        {/* ── Species field ── */}
        <FormSection label="Plant species *" hint="Common name or species">
          <TextInput
            style={styles.input}
            value={species}
            onChangeText={setSpecies}
            placeholder="e.g. Money Plant, Aloe Vera"
            placeholderTextColor={C.textMuted}
            maxLength={64}
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
                <Text
                  style={[
                    styles.chipText,
                    wateringDays === opt.value && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormSection>

        {/* ── Location ── */}
        <FormSection label="Location" hint="Where does it live?">
          <View style={styles.locationGrid}>
            {PLANT_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.locationChip, location === loc && styles.chipActive]}
                onPress={() => setLocation(location === loc ? null : loc)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    location === loc && styles.chipTextActive,
                  ]}
                >
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
            {isSaving ? 'Adding...' : 'Add to My Garden'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'transparent',
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
  fromScanBadge: {
    backgroundColor: C.primaryWash,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.primary,
  },
  fromScanText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: C.primary,
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
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
