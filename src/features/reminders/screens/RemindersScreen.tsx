import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Switch, Alert, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { updatePlantInCloud } from '../../my-plants/services/plantService';
import { getWaterInfo } from '../../../services/reminders/reminderService';
import {
  applyPlantReminder, hasNotificationPermission, requestNotificationPermission,
} from '../../../services/reminders/notificationScheduler';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import type { WeatherData } from '../../../services/weather/weatherService';
import { getNextWaterDate } from '../../../shared/utils/plantUtils';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { ProfileStackParamList } from '../../../navigation/types';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;
type Nav = StackNavigationProp<ProfileStackParamList, 'Reminders'>;

const shortDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const toneFor = (status: string) =>
  status === 'overdue' ? C.criticalFg : status === 'today' ? C.waterFg : C.primary;

export const RemindersScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { plants, updatePlant } = usePlantsStore();
  const { user } = useAuthStore();
  const { city } = useOnboardingStore();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [permitted, setPermitted] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (city) getCurrentWeather(city).then(setWeather).catch(() => {});
    hasNotificationPermission().then(setPermitted);
  }, [city]);

  const sorted = useMemo(
    () => [...plants].sort((a, b) => getWaterInfo(a).daysUntil - getWaterInfo(b).daysUntil),
    [plants],
  );
  const summary = useMemo(() => {
    let overdue = 0, today = 0, upcoming = 0;
    for (const p of plants) {
      const s = getWaterInfo(p).status;
      if (s === 'overdue') overdue++;
      else if (s === 'today') today++;
      else upcoming++;
    }
    return { overdue, today, upcoming };
  }, [plants]);
  const enabledCount = plants.filter(p => p.remindersEnabled).length;

  const toggle = useCallback(async (plant: UserPlantDoc, value: boolean) => {
    setBusyId(plant.plantId);
    const res = await applyPlantReminder(plant, value, weather);
    if (!res.ok && res.needsPermission) {
      setPermitted(false);
      Alert.alert(
        'Notifications are off',
        'Turn on notifications to get watering reminders.',
        [{ text: 'Not now', style: 'cancel' }, { text: 'Open settings', onPress: () => Linking.openSettings().catch(() => {}) }],
      );
      setBusyId(null);
      return;
    }
    updatePlant(plant.plantId, { remindersEnabled: value });
    if (user) updatePlantInCloud(user.uid, plant.plantId, { remindersEnabled: value }).catch(() => {});
    if (value) setPermitted(true);
    setBusyId(null);
  }, [weather, updatePlant, user]);

  const requestPerm = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setPermitted(granted);
    if (!granted) Linking.openSettings().catch(() => {});
  }, []);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reminders</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.lead}>Never miss a watering.</Text>

          {/* Permission prompt */}
          {!permitted && (
            <Animated.View entering={FadeInDown.duration(theme.motion.duration.standard)} style={styles.permCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.permTitle}>Turn on notifications</Text>
                <Text style={styles.permBody}>Allow notifications so we can remind you when each plant needs water.</Text>
              </View>
              <PressableScale style={styles.permBtn} onPress={requestPerm} to={0.95}>
                <Text style={styles.permBtnText}>Enable</Text>
              </PressableScale>
            </Animated.View>
          )}

          {/* Summary */}
          {plants.length > 0 && (
            <View style={styles.summaryRow}>
              <Summary n={summary.overdue} label="Overdue" tone={C.criticalFg} />
              <View style={styles.sumDiv} />
              <Summary n={summary.today} label="Today" tone={C.waterFg} />
              <View style={styles.sumDiv} />
              <Summary n={summary.upcoming} label="Upcoming" tone={C.primary} />
            </View>
          )}

          {/* List */}
          {plants.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Add a plant to your garden to set up watering reminders.</Text>
              <PressableScale style={styles.emptyBtn} onPress={() => navigation.navigate('AddReminder', {})} to={0.97}>
                <Text style={styles.emptyBtnText}>Add a reminder</Text>
              </PressableScale>
            </View>
          ) : (
            <>
              <View style={styles.listHeader}>
                <Text style={styles.sectionLabel}>WATERING · {enabledCount} ON</Text>
              </View>
              <View style={styles.listCard}>
                {sorted.map((plant, i) => {
                  const info = getWaterInfo(plant);
                  const tone = toneFor(info.status);
                  return (
                    <View key={plant.plantId} style={[styles.row, i < sorted.length - 1 && styles.rowBorder]}>
                      <View style={[styles.dot, { backgroundColor: tone }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowName} numberOfLines={1}>{plant.nickname}</Text>
                        <Text style={[styles.rowSub, { color: tone }]}>
                          {info.urgentLabel} · next {shortDate(getNextWaterDate(plant))}
                        </Text>
                      </View>
                      <Switch
                        value={!!plant.remindersEnabled}
                        onValueChange={(v) => toggle(plant, v)}
                        disabled={busyId === plant.plantId}
                        trackColor={{ false: C.border, true: 'rgba(94,127,97,0.5)' }}
                        thumbColor={plant.remindersEnabled ? C.primary : C.textMuted}
                      />
                    </View>
                  );
                })}
              </View>

              <PressableScale style={styles.addBtn} onPress={() => navigation.navigate('AddReminder', {})} to={0.97}>
                <Text style={styles.addBtnText}>+  Add a reminder</Text>
              </PressableScale>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const Summary: React.FC<{ n: number; label: string; tone: string }> = ({ n, label, tone }) => (
  <View style={styles.sumBlock}>
    <Text style={[styles.sumNum, { color: tone }]}>{n}</Text>
    <Text style={styles.sumLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 32 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: S.sm },
  lead: { fontFamily: F.serifMedium, fontSize: 30, color: C.textPrimary, marginBottom: S.xl, letterSpacing: -0.4 },

  permCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.lg,
    backgroundColor: C.waterBg, borderRadius: R.xl, padding: S.lg, marginBottom: S.xl,
    borderWidth: 1, borderColor: C.waterFg,
  },
  permTitle: { ...T.bodyStrong, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 3 },
  permBody: { ...T.caption, color: C.textSecondary, lineHeight: 17 },
  permBtn: { backgroundColor: C.waterFg, borderRadius: R.pill, paddingHorizontal: S.lg, paddingVertical: 10 },
  permBtnText: { ...T.label, fontFamily: F.sansBold, color: '#FFFFFF' },

  summaryRow: {
    flexDirection: 'row', backgroundColor: C.card, borderRadius: R.xl, paddingVertical: S.lg,
    marginBottom: S['2xl'], borderWidth: 1, borderColor: C.border, ...theme.shadows.sm,
  },
  sumBlock: { flex: 1, alignItems: 'center' },
  sumNum: { fontFamily: F.sansHeavy, fontSize: 26, marginBottom: 2 },
  sumLabel: { ...T.statLabel, color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  sumDiv: { width: 1, height: 34, backgroundColor: C.divider, alignSelf: 'center' },

  listHeader: { marginBottom: S.md },
  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2 },
  listCard: {
    backgroundColor: C.card, borderRadius: R.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, ...theme.shadows.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: S.lg },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rowName: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 2 },
  rowSub: { ...T.caption, fontFamily: F.sansMedium },

  addBtn: {
    marginTop: S.lg, paddingVertical: 15, alignItems: 'center', borderRadius: R.pill,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  addBtnText: { ...T.label, fontFamily: F.sansBold, color: C.primary },

  empty: { paddingVertical: S['2xl'], alignItems: 'center', gap: S.xl },
  emptyText: { ...T.bodyMd, color: C.textMuted, textAlign: 'center', lineHeight: 21 },
  emptyBtn: { backgroundColor: C.primary, borderRadius: R.pill, paddingHorizontal: S['2xl'], paddingVertical: 14 },
  emptyBtnText: { ...T.button, fontFamily: F.sansBold, color: C.onPrimary },
});
