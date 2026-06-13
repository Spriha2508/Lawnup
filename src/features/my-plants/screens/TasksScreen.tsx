import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Timestamp } from 'firebase/firestore';
import Svg, { Path } from 'react-native-svg';
import { usePlantsStore } from '../store/plantsStore';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { updatePlantInCloud } from '../services/plantService';
import { getWaterInfo } from '../../../services/reminders/reminderService';
import { scheduleWateringReminder } from '../../../services/reminders/notificationScheduler';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import type { WeatherData } from '../../../services/weather/weatherService';
import { getNextWaterDate } from '../../../shared/utils/plantUtils';
import { theme } from '@constants/designSystem';
import type { PlantsStackParamList } from '../../../navigation/types';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
type Nav = StackNavigationProp<PlantsStackParamList, 'Tasks'>;

const fsTs = (d: Date) => Timestamp.fromDate(d);
const shortDate = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const TasksScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { plants, updatePlant } = usePlantsStore();
  const { user } = useAuthStore();
  const { city } = useOnboardingStore();
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => { if (city) getCurrentWeather(city).then(setWeather).catch(() => {}); }, [city]);

  const { due, upcoming } = useMemo(() => {
    const withInfo = plants.map((p) => ({ p, info: getWaterInfo(p) }));
    return {
      due: withInfo
        .filter((x) => x.info.status === 'overdue' || x.info.status === 'today')
        .sort((a, b) => a.info.daysUntil - b.info.daysUntil),
      upcoming: withInfo
        .filter((x) => x.info.status === 'soon' || x.info.status === 'ok')
        .sort((a, b) => a.info.daysUntil - b.info.daysUntil)
        .slice(0, 8),
    };
  }, [plants]);

  const markWatered = useCallback((plant: UserPlantDoc) => {
    const now = new Date();
    const next = new Date(now.getTime() + plant.wateringFrequencyDays * 86_400_000);
    const updates = { lastWateredAt: fsTs(now), nextWaterAt: fsTs(next) };
    updatePlant(plant.plantId, updates);
    if (user) updatePlantInCloud(user.uid, plant.plantId, updates).catch(() => {});
    if (plant.remindersEnabled) {
      scheduleWateringReminder({ ...plant, ...updates }, weather).catch(() => {});
    }
  }, [updatePlant, user, weather]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5L8 12L15 19" stroke={C.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's tasks</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.lead}>{due.length > 0 ? `${due.length} ${due.length === 1 ? 'plant needs' : 'plants need'} water` : 'All caught up 🌿'}</Text>

          {/* Due */}
          {due.length > 0 ? (
            <View style={styles.card}>
              {due.map(({ p, info }, i) => (
                <Animated.View key={p.plantId} layout={Layout.springify().damping(18)} entering={FadeInDown.delay(i * 40).duration(M.duration.standard)}>
                  <View style={[styles.row, i < due.length - 1 && styles.rowBorder]}>
                    <View style={[styles.dot, { backgroundColor: info.status === 'overdue' ? C.criticalFg : C.waterFg }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskName}>Water {p.nickname}</Text>
                      <Text style={[styles.taskMeta, { color: info.status === 'overdue' ? C.criticalFg : C.waterFg }]}>{info.urgentLabel}</Text>
                    </View>
                    <TouchableOpacity style={styles.check} onPress={() => markWatered(p)} activeOpacity={0.7} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path d="M5 12.5L10 17.5L19 7" stroke={C.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nothing needs water today. Your garden is happy.</Text>
            </View>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: S['2xl'] }]}>COMING UP</Text>
              <View style={styles.card}>
                {upcoming.map(({ p, info }, i) => (
                  <View key={p.plantId} style={[styles.row, i < upcoming.length - 1 && styles.rowBorder]}>
                    <View style={[styles.dot, { backgroundColor: C.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskName}>Water {p.nickname}</Text>
                      <Text style={styles.taskMetaMuted}>{info.label} · {shortDate(getNextWaterDate(p))}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {plants.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Add a plant to your garden and its care tasks will show up here.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 32 },
  headerTitle: { fontFamily: F.serifMedium, fontSize: 20, color: C.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: S.sm },
  lead: { fontFamily: F.serifMedium, fontSize: 30, color: C.textPrimary, marginBottom: S.xl, letterSpacing: -0.4 },

  sectionLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },
  card: { backgroundColor: C.card, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 14, paddingHorizontal: S.lg },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  taskName: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 2 },
  taskMeta: { ...T.caption, fontFamily: F.sansMedium },
  taskMetaMuted: { ...T.caption, color: C.textMuted },
  check: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: C.primary,
    backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center',
  },

  empty: { paddingVertical: S['2xl'], alignItems: 'center', paddingHorizontal: 24 },
  emptyText: { ...T.bodyMd, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
});
