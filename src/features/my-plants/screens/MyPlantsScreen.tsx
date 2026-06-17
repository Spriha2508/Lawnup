import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { PlantCard } from '../../../shared/components/ui/PlantCard';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { AmbientBackground } from '@shared/components/motion/AmbientBackground';
import { usePlantsStore } from '../store/plantsStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import { getTodayNarrative } from '../../../services/reminders/reminderService';
import { theme } from '@constants/designSystem';
import type { WeatherData } from '../../../services/weather/weatherService';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: SCREEN_W } = Dimensions.get('window');
const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;
const CONTENT_W = Math.min(SCREEN_W, 430);
const H_PAD = S.xl;
const CARD_GAP = 12;
const CARD_W = Math.floor((CONTENT_W - H_PAD * 2 - CARD_GAP) / 2);

type FilterKey = 'All' | 'Thriving' | 'Needs Care' | 'Indoor' | 'Outdoor';
const FILTERS: FilterKey[] = ['All', 'Thriving', 'Needs Care', 'Indoor', 'Outdoor'];
const INDOOR_KEYWORDS = ['living room', 'bedroom', 'kitchen', 'bathroom', 'office', 'study', 'hall', 'balcony', 'indoor'];
const OUTDOOR_KEYWORDS = ['garden', 'terrace', 'lawn', 'yard', 'outdoor', 'patio', 'driveway'];

function matchesFilter(plant: UserPlantDoc, filter: FilterKey): boolean {
  if (filter === 'All') return true;
  if (filter === 'Thriving') return plant.healthStatus === 'Healthy';
  if (filter === 'Needs Care') return plant.healthStatus !== 'Healthy';
  const loc = (plant.location ?? '').toLowerCase();
  if (filter === 'Indoor') return INDOOR_KEYWORDS.some(k => loc.includes(k)) || !OUTDOOR_KEYWORDS.some(k => loc.includes(k));
  if (filter === 'Outdoor') return OUTDOOR_KEYWORDS.some(k => loc.includes(k));
  return true;
}

const LeafMark: React.FC<{ size?: number; color?: string }> = ({ size = 30, color = C.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill={color} opacity={0.9} />
    <Path d="M12 3V21" stroke={C.canvas} strokeWidth={1.3} strokeLinecap="round" />
  </Svg>
);

export const MyPlantsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { plants } = usePlantsStore();
  const { city } = useOnboardingStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => { if (city) getCurrentWeather(city).then(setWeather).catch(() => {}); }, [city]);

  const filtered = useMemo(() => plants.filter(p => matchesFilter(p, activeFilter)), [plants, activeFilter]);
  const thriving = plants.filter(p => p.healthStatus === 'Healthy').length;
  const needCare = plants.filter(p => p.healthStatus !== 'Healthy').length;
  const todayNarrative = getTodayNarrative(plants, weather, city || undefined);

  const handlePlantPress = useCallback((plantId: string) => navigation.navigate('PlantDetail', { plantId }), [navigation]);

  if (plants.length === 0) {
    return (
      <View style={styles.root}>
        <AmbientBackground animated={false} />
        <SafeAreaView style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}><LeafMark size={40} /></View>
          <Text style={styles.emptyTitle}>Your garden is waiting 🌱</Text>
          <Text style={styles.emptySub}>Scan your first plant to start growing your digital garden.</Text>
          <PressableScale style={styles.emptyBtn} onPress={() => navigation.navigate('Scan')} to={0.97}>
            <Text style={styles.emptyBtnText}>Scan Your First Plant</Text>
          </PressableScale>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AmbientBackground animated={false} vignette={false} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={filtered}
          keyExtractor={p => p.plantId}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <GardenHeader
              total={plants.length} thriving={thriving} needCare={needCare}
              todayNarrative={todayNarrative} weather={weather}
              activeFilter={activeFilter} onFilterChange={setActiveFilter}
              onAdd={() => navigation.navigate('AddPlant', {})}
            />
          }
          renderItem={({ item, index }) => (
            <PlantCard plant={item} width={CARD_W} index={index} onPress={() => handlePlantPress(item.plantId)} />
          )}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.duration(300)} style={styles.emptyFilter}>
              <Text style={styles.emptyFilterText}>No plants here yet</Text>
            </Animated.View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────
interface HeaderProps {
  total: number; thriving: number; needCare: number;
  todayNarrative: string; weather: WeatherData | null;
  activeFilter: FilterKey; onFilterChange: (f: FilterKey) => void; onAdd: () => void;
}

const GardenHeader: React.FC<HeaderProps> = ({ total, thriving, needCare, todayNarrative, weather, activeFilter, onFilterChange, onAdd }) => (
  <Animated.View entering={FadeInDown.duration(theme.motion.duration.expressive)} style={styles.header}>
    <View style={styles.titleRow}>
      <View>
        <Text style={styles.eyebrow}>YOUR LIVING COLLECTION</Text>
        <Text style={styles.title}>My garden</Text>
      </View>
      <PressableScale style={[styles.addBtn, theme.shadows.cta]} onPress={onAdd} to={0.9}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M12 5V19M5 12H19" stroke={C.onInkBtn} strokeWidth={2.2} strokeLinecap="round" /></Svg>
      </PressableScale>
    </View>

    {/* Today banner */}
    <View style={styles.todayBanner}>
      <View style={styles.todayDot} />
      <Text style={styles.todayText} numberOfLines={2}>{todayNarrative}</Text>
      {weather && <Text style={styles.todayWeather}>{weather.tempC}° · {weather.humidity}%</Text>}
    </View>

    {/* Filters */}
    <FlatList
      horizontal data={FILTERS} keyExtractor={f => f} showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContent} style={styles.filters}
      renderItem={({ item: f }) => (
        <Pressable onPress={() => onFilterChange(f)} style={[styles.pill, activeFilter === f && styles.pillActive]}>
          <Text style={[styles.pillText, activeFilter === f && styles.pillTextActive]}>{f}</Text>
        </Pressable>
      )}
    />

    {/* Stats */}
    <View style={styles.statsRow}>
      <StatItem label="PLANTS" value={total} />
      <View style={styles.statDivider} />
      <StatItem label="THRIVING" value={thriving} tone={C.healthyFg} />
      <View style={styles.statDivider} />
      <StatItem label="NEED CARE" value={needCare} tone={C.waterFg} />
    </View>
  </Animated.View>
);

const StatItem: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, tone && { color: tone }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  header: { paddingHorizontal: H_PAD, paddingTop: S.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: S.lg },
  eyebrow: { ...T.eyebrow, color: C.textMuted, marginBottom: S.xs },
  title: { fontFamily: F.serifMedium, fontSize: 36, letterSpacing: -0.4, color: C.textPrimary },
  addBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.inkBtn, alignItems: 'center', justifyContent: 'center' },

  todayBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.lg, paddingHorizontal: S.lg, paddingVertical: S.md, marginBottom: S.lg, gap: S.md, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  todayDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },
  todayText: { flex: 1, ...T.caption, fontFamily: F.sansMedium, fontSize: 13, color: C.textPrimary, lineHeight: 18 },
  todayWeather: { ...T.caption, fontSize: 11, color: C.textMuted, flexShrink: 0 },

  filters: { marginBottom: S.lg, marginHorizontal: -H_PAD },
  filtersContent: { paddingHorizontal: H_PAD, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: R.pill, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  pillActive: { backgroundColor: C.inkBtn, borderColor: C.inkBtn },
  pillText: { ...T.label, fontSize: 13, color: C.textMuted },
  pillTextActive: { color: C.onInkBtn },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: R.xl, paddingVertical: S.lg, marginBottom: S.xl, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { ...T.statLabel, color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 },
  statValue: { fontFamily: F.sansHeavy, fontSize: 24, letterSpacing: -0.4, color: C.textPrimary },
  statDivider: { width: 1, height: 30, backgroundColor: C.divider },

  listContent: { paddingBottom: 120 },
  row: { paddingHorizontal: H_PAD, justifyContent: 'space-between' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 30, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center', marginBottom: S['2xl'] },
  emptyTitle: { fontFamily: F.serifMedium, fontSize: 30, lineHeight: 35, color: C.textPrimary, textAlign: 'center', marginBottom: S.md },
  emptySub: { ...T.bodyMd, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: S['2xl'] },
  emptyBtn: { backgroundColor: C.inkBtn, borderRadius: R.pill, paddingVertical: S.lg, paddingHorizontal: S['3xl'], ...theme.shadows.cta },
  emptyBtnText: { ...T.button, fontFamily: F.sansMedium, color: C.onInkBtn },
  emptyFilter: { alignItems: 'center', paddingVertical: 48 },
  emptyFilterText: { ...T.bodyMd, color: C.textMuted },
});
