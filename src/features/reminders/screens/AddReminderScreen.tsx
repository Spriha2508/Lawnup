import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { updatePlantInCloud } from '../../my-plants/services/plantService';
import { applyPlantReminder } from '../../../services/reminders/notificationScheduler';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import type { WeatherData } from '../../../services/weather/weatherService';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { ProfileStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;
type Nav = StackNavigationProp<ProfileStackParamList, 'AddReminder'>;
type Route = RouteProp<ProfileStackParamList, 'AddReminder'>;

const WATERING_OPTIONS = [
  { label: 'Daily', value: 1 },
  { label: 'Every 2 days', value: 2 },
  { label: 'Every 3 days', value: 3 },
  { label: 'Weekly', value: 7 },
  { label: 'Every 10 days', value: 10 },
  { label: 'Fortnightly', value: 14 },
];

export const AddReminderScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const preId = route.params?.plantId;

  const { plants, updatePlant } = usePlantsStore();
  const { user } = useAuthStore();
  const { city } = useOnboardingStore();

  const [selectedId, setSelectedId] = useState<string | null>(preId ?? null);
  const [freq, setFreq] = useState<number>(plants.find(p => p.plantId === preId)?.wateringFrequencyDays ?? 7);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (city) getCurrentWeather(city).then(setWeather).catch(() => {}); }, [city]);

  const plant = plants.find(p => p.plantId === selectedId) ?? null;

  const pick = (id: string) => {
    setSelectedId(id);
    const p = plants.find(pl => pl.plantId === id);
    if (p) setFreq(p.wateringFrequencyDays);
  };

  const handleSave = async () => {
    if (!plant || saving) return;
    setSaving(true);
    const updated = { ...plant, wateringFrequencyDays: freq };
    const res = await applyPlantReminder(updated, true, weather);
    if (!res.ok && res.needsPermission) {
      setSaving(false);
      Alert.alert(
        'Notifications are off',
        'Turn on notifications to get watering reminders.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open settings', onPress: () => Linking.openSettings().catch(() => {}) }],
      );
      return;
    }
    updatePlant(plant.plantId, { wateringFrequencyDays: freq, remindersEnabled: true });
    if (user) updatePlantInCloud(user.uid, plant.plantId, { wateringFrequencyDays: freq, remindersEnabled: true }).catch(() => {});
    setSaving(false);
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New reminder</Text>
          <View style={{ width: 32 }} />
        </View>

        {plants.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You'll need a plant in your garden first. Scan or add one, then come back to set a reminder.</Text>
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
              {/* Pick a plant */}
              <Text style={styles.sectionLabel}>WHICH PLANT?</Text>
              <View style={styles.plantList}>
                {plants.map((p) => {
                  const active = p.plantId === selectedId;
                  return (
                    <TouchableOpacity
                      key={p.plantId}
                      style={[styles.plantRow, active && styles.plantRowActive]}
                      onPress={() => pick(p.plantId)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.plantInitial, active && styles.plantInitialActive]}>
                        <Text style={[styles.plantInitialText, active && { color: C.onPrimary }]}>
                          {p.nickname.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plantName} numberOfLines={1}>{p.nickname}</Text>
                        <Text style={styles.plantSpecies} numberOfLines={1}>{p.speciesName}</Text>
                      </View>
                      <View style={[styles.radio, active && styles.radioActive]}>
                        {active && <View style={styles.radioFill} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Frequency */}
              {plant && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: S['2xl'] }]}>HOW OFTEN?</Text>
                  <View style={styles.chipGrid}>
                    {WATERING_OPTIONS.map((opt) => {
                      const active = freq === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => setFreq(opt.value)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, active && { color: C.onPrimary }]}>{opt.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            {/* CTA */}
            <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 16 }]}>
              <PressableScale
                style={[styles.cta, (!plant || saving) && styles.ctaDisabled]}
                onPress={handleSave}
                disabled={!plant || saving}
                to={0.97}
              >
                <Text style={styles.ctaText}>{saving ? 'Setting reminder…' : 'Set reminder'}</Text>
              </PressableScale>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 32 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: S.lg },

  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },

  plantList: { gap: 10 },
  plantRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    backgroundColor: C.card, borderRadius: R.lg, padding: S.md,
    borderWidth: 1.5, borderColor: C.border,
  },
  plantRowActive: { borderColor: C.primary, backgroundColor: C.primaryWash },
  plantInitial: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.input, alignItems: 'center', justifyContent: 'center' },
  plantInitialActive: { backgroundColor: C.primary },
  plantInitialText: { fontFamily: F.serifMedium, fontSize: 18, color: C.textSecondary },
  plantName: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 1 },
  plantSpecies: { ...T.caption, color: C.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.primary },
  radioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: R.pill,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.input,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { ...T.bodyMd, fontFamily: F.sansMedium, fontSize: 14, color: C.textPrimary },

  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.canvas,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
  },
  cta: { backgroundColor: C.primary, borderRadius: R.pill, height: 56, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { ...T.button, fontFamily: F.sansBold, color: C.onPrimary, letterSpacing: 0.2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyText: { ...T.bodyMd, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
});
