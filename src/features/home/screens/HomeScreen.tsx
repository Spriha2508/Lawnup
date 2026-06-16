import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown, Easing,
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, Extrapolation,
  withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { useScanHistoryStore } from '../../scan/store/scanHistoryStore';
import { isDueForWater, computeHealthScore, getIKImageUrl } from '../../../shared/utils/plantUtils';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import { getAirQuality, type AirQualityData } from '../../../services/weather/aqiService';
import { aqiRules, currentSeason, type AqiBand } from '../../../services/knowledge';
import { getWeatherInsight } from '../utils/homeInsights';
import { track } from '../../../services/analytics/posthog';
import { HealthRing } from '@shared/components/motion/HealthRing';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import { openPaywall } from '@navigation/openPaywall';
import type { WeatherData } from '../../../services/weather/weatherService';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: W, height: SCREEN_H } = Dimensions.get('window');
const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
const H_PAD = S.xl;
const PLANT_CARD_W = Math.floor(W * 0.42);
const SECTION_GAP = S['3xl'];

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
};

const getDateLabel = (): string => {
  const now = new Date();
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
};

const millis = (ts: any): number => ts?.toMillis?.() ?? (ts?.seconds ? ts.seconds * 1000 : 0);

// What a scan gives you — outcome-led (the benefit), not a feature list (first-run only).
const VALUE_PROPS = [
  { icon: '🌿', label: 'Know what it is' },
  { icon: '🩺', label: 'Spot problems early' },
  { icon: '🧾', label: 'A care plan that fits' },
  { icon: '💧', label: 'Know when to water' },
];

// Learn & Grow — curated, self-contained tips (inline-expandable; no dead buttons).
const LEARN_CARDS = [
  {
    id: 'summer',
    icon: '☀️',
    title: 'Summer plant care',
    body: 'Water early morning or evening so it isn’t lost to midday heat. Move sensitive plants out of harsh afternoon sun, and mist humidity-lovers. Hold off on repotting until the season cools.',
  },
  {
    id: 'watering',
    icon: '💧',
    title: 'Common watering mistakes',
    body: 'Overwatering kills more plants than underwatering. Check the top 2–3 cm of soil before every watering, always use a pot with drainage holes, and empty the saucer so roots never sit in water.',
  },
  {
    id: 'balcony',
    icon: '🪴',
    title: 'Balcony gardening tips',
    body: 'Group plants by light need, use lighter pots that won’t over-heat, and shield them from strong wind. In peak summer, a shade net softens direct sun while still letting plants thrive.',
  },
];

const AnimatedScrollView = Animated.ScrollView;

const bandColor = (band: AqiBand): string =>
  band === 'good' || band === 'satisfactory' ? C.healthyFg
    : band === 'moderate' ? C.waterFg
    : C.criticalFg;

// ── Time-aware sky — the homepage wakes up every time it opens ──────────────
const skyColorForHour = (): string => {
  const h = new Date().getHours();
  if (h >= 6 && h < 9) return 'rgba(224,169,63,0.16)';   // dawn gold
  if (h >= 9 && h < 17) return 'rgba(231,224,210,0.5)';  // warm daylight haze
  if (h >= 17 && h < 19) return 'rgba(206,126,154,0.14)';// blossom dusk
  return 'rgba(120,110,92,0.16)';                        // warm dusk
};

const TimeSky: React.FC = () => {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(200, withTiming(1, { duration: 1500, easing: M.ease.smooth }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ opacity: v.value }));
  const sky = useMemo(() => skyColorForHour(), []);
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_H * 0.35 }, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="home-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky} stopOpacity={1} />
            <Stop offset="1" stopColor={sky} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#home-sky)" />
      </Svg>
    </Animated.View>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { plants } = usePlantsStore();
  const { city } = useOnboardingStore();
  const isPremiumActive = useSubscriptionStore(s => s.isPremiumActive);
  const scansCompleted = useScanHistoryStore(s => s.entries.length);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AirQualityData | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [learnOpen, setLearnOpen] = useState<string | null>(null);
  const isPremium = isPremiumActive();

  // First-run: with no plants yet, Home stays focused on one action.
  const isNewUser = plants.length === 0;

  useEffect(() => {
    track('home_viewed', { plants: plants.length, isNewUser });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (city) {
      getCurrentWeather(city).then(setWeather).catch(() => {});
      getAirQuality(city).then(setAqi).catch(() => {});
    }
  }, [city]);

  const aqiAdvice = useMemo(() => aqiRules(aqi?.aqi), [aqi]);
  const season = useMemo(() => currentSeason(), []);

  // Hero "breathing" — nothing on screen is ever fully static.
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: M.loop.breath, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const blobStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breathe.value * 0.06 }], opacity: 0.5 + breathe.value * 0.4 }));

  const firstName = user?.name?.split(' ')[0] ?? 'Gardener';
  const avatarChar = user?.name ? user.name[0].toUpperCase() : 'G';

  const duePlants = useMemo(() => plants.filter(isDueForWater), [plants]);
  const recent = useMemo(
    () => [...plants].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, 6),
    [plants],
  );

  // Garden Overview + 4-tier health summary (all real, from computeHealthScore).
  const garden = useMemo(() => {
    let healthy = 0, needsAttention = 0, atRisk = 0, critical = 0, sum = 0;
    for (const p of plants) {
      const s = computeHealthScore(p);
      sum += s;
      if (s >= 75) healthy++;
      else if (s >= 55) needsAttention++;
      else if (s >= 35) atRisk++;
      else critical++;
    }
    const score = plants.length ? Math.round(sum / plants.length) : 0;
    const attention = plants.length - healthy; // anything not "Healthy" needs a look
    return { healthy, needsAttention, atRisk, critical, score, attention };
  }, [plants]);

  // Today's care — real watering tasks + honest seasonal fertilizer / sunlight suggestions.
  const careTasks = useMemo(() => {
    const tasks: { id: string; kind: 'water' | 'fertilizer' | 'sunlight'; title: string; meta: string; plantId?: string }[] = [];
    duePlants.slice(0, 3).forEach(p =>
      tasks.push({ id: `w-${p.plantId}`, kind: 'water', title: `Water ${p.nickname}`, meta: 'Due today', plantId: p.plantId }),
    );
    if (plants.length > 0 && (season === 'summer' || season === 'monsoon')) {
      tasks.push({ id: 'fertilizer', kind: 'fertilizer', title: 'Feed your plants', meta: 'Growing season — a light, balanced feed this month helps' });
    }
    if (plants.length > 0) {
      tasks.push({ id: 'sunlight', kind: 'sunlight', title: 'Turn plants toward the light', meta: 'A quarter-turn keeps growth even and full' });
    }
    return tasks;
  }, [duePlants, plants.length, season]);

  const weatherInsight = useMemo(() => getWeatherInsight(weather, city || undefined), [weather, city]);
  const careRecommendation = useMemo(() => {
    // Surface AQI care guidance from "moderate" up (101+) — most relevant in
    // Indian cities; cleaner air falls through to the weather insight.
    if (aqi && aqiAdvice && aqiAdvice.band !== 'good' && aqiAdvice.band !== 'satisfactory') {
      return aqiAdvice.rules[0];
    }
    return weatherInsight?.body ?? 'Conditions look calm today — keep up your usual care.';
  }, [aqi, aqiAdvice, weatherInsight]);

  // Parallax header
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({ onScroll: (e) => { scrollY.value = e.contentOffset.y; } });
  const bigHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 80], [0, -16], Extrapolation.CLAMP) }],
  }));
  const compactNameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [50, 100], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [50, 100], [8, 0], Extrapolation.CLAMP) }],
  }));
  const compactBarStyle = useAnimatedStyle(() => ({
    borderBottomWidth: interpolate(scrollY.value, [60, 100], [0, StyleSheet.hairlineWidth], Extrapolation.CLAMP),
    backgroundColor: `rgba(247,244,236,${interpolate(scrollY.value, [40, 90], [0, 0.94], Extrapolation.CLAMP)})`,
  }));

  // ── navigation helpers (analytics-wrapped) ──────────────────────────────────
  const goScan = useCallback((src: string) => { track('home_quick_action', { action: 'scan', src }); navigation.navigate('Scan'); }, [navigation]);
  const goAddPlant = useCallback((src: string) => { track('home_quick_action', { action: 'add_plant', src }); navigation.navigate('Plants', { screen: 'AddPlant' }); }, [navigation]);
  const goDoctor = useCallback((src: string) => { track('home_quick_action', { action: 'dr_banyan', src }); navigation.navigate('Chat'); }, [navigation]);
  const goTasks = useCallback((src: string) => { track('home_section_cta', { section: 'tasks', src }); navigation.navigate('Plants', { screen: 'Tasks' }); }, [navigation]);
  const goPlant = useCallback((plantId: string) => navigation.navigate('Plants', { screen: 'PlantDetail', params: { plantId } }), [navigation]);
  const goPaywall = useCallback(() => { track('home_premium_tap'); openPaywall(navigation); }, [navigation]);
  const toggleLearn = useCallback((id: string) => {
    setLearnOpen(prev => { const next = prev === id ? null : id; if (next) track('home_learn_open', { topic: next }); return next; });
  }, []);

  return (
    <View style={styles.root}>
      <TimeSky />

      {/* Sticky compact header */}
      <Animated.View style={[styles.compactBar, { paddingTop: insets.top + 4, borderBottomColor: C.border }, compactBarStyle]}>
        <Animated.Text style={[styles.compactName, compactNameStyle]} numberOfLines={1}>{firstName}</Animated.Text>
        <PressableScale style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')} to={0.9}
          accessibilityRole="button" accessibilityLabel="Open profile">
          <Text style={styles.avatarInitial}>{avatarChar}</Text>
        </PressableScale>
      </Animated.View>

      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
      >
        {/* ── 1 · Garden Overview Hero ──────────────────────────────────────── */}
        <Animated.View style={[styles.bigHeader, bigHeaderStyle]}>
          <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.firstName}>{firstName}</Text>
        </Animated.View>

        {!isNewUser && (
          <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={styles.overviewCard}>
            <View style={styles.overviewRingWrap}>
              <HealthRing progress={garden.score / 100} size={64} stroke={6} color={C.primary}>
                <Text style={styles.overviewScore}>{garden.score}</Text>
              </HealthRing>
              <Text style={styles.overviewRingLabel}>GARDEN{'\n'}HEALTH</Text>
            </View>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNum}>{plants.length}</Text>
                <Text style={styles.overviewStatLabel}>Plants</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={[styles.overviewStatNum, garden.attention > 0 && { color: C.waterFg }]}>{garden.attention}</Text>
                <Text style={styles.overviewStatLabel}>Need care</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── First-run: focused single action ──────────────────────────────── */}
        {isNewUser && (
          <>
            <Animated.View entering={FadeInDown.delay(120).duration(M.duration.expressive)} style={{ marginBottom: S.lg }}>
              <PressableScale style={styles.scanCard} onPress={() => goScan('first_run_hero')} to={0.97}>
                <Animated.View style={[styles.scanBlob, blobStyle]} />
                <Text style={styles.scanLabel}>START HERE</Text>
                <Text style={styles.scanTitle}>Scan your{'\n'}first plant</Text>
                <Text style={styles.scanBody}>Point your camera at any plant — we’ll name it, check its health, and build a care plan just for it.</Text>
                <View style={styles.scanBtn}><Text style={styles.scanBtnText}>Scan a plant  →</Text></View>
              </PressableScale>
            </Animated.View>
            <Text style={styles.valueHeading}>What one scan gives you</Text>
            <View style={styles.valueGrid}>
              {VALUE_PROPS.map((v, i) => (
                <Animated.View key={v.label} entering={FadeInDown.delay(190 + i * 45).duration(M.duration.standard)} style={{ width: (W - H_PAD * 2 - 10) / 2 }}>
                  <PressableScale style={styles.valueItem} onPress={() => goScan('first_run_value')} to={0.97}>
                    <View style={styles.valueIcon}><Text style={styles.valueEmoji}>{v.icon}</Text></View>
                    <Text style={styles.valueLabel}>{v.label}</Text>
                  </PressableScale>
                </Animated.View>
              ))}
            </View>
            <Animated.View entering={FadeInDown.delay(360)} style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Free to start · Save as many plants as you like · No card needed</Text>
            </Animated.View>
          </>
        )}

        {/* ════════ Populated dashboard ════════ */}
        {!isNewUser && (
          <>
            {/* ── 2 · Today's Care Tasks ────────────────────────────────────── */}
            <View style={{ marginBottom: SECTION_GAP }}>
              <SectionHeader label="TODAY'S CARE" actionLabel="View all →" onAction={() => goTasks('todays_care')} />
              <View style={styles.careCard}>
                {careTasks.length === 0 ? (
                  <View style={styles.careEmpty}><Text style={styles.careEmptyText}>All caught up — your garden is happy 🌿</Text></View>
                ) : (
                  careTasks.map((t, i) => (
                    <CareTaskRow key={t.id} task={t} isLast={i === careTasks.length - 1} onPress={t.plantId ? () => goPlant(t.plantId!) : undefined} />
                  ))
                )}
              </View>
            </View>

            {/* ── 3 · My Plants carousel ────────────────────────────────────── */}
            <View style={[styles.stripWrap, { marginBottom: SECTION_GAP }]}>
              <View style={{ paddingHorizontal: H_PAD }}>
                <SectionHeader label="MY GARDEN" actionLabel="Add plant +" onAction={() => goAddPlant('my_plants')} />
              </View>
              <AnimatedScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plantScroll}
                decelerationRate="fast" snapToInterval={PLANT_CARD_W + 12} snapToAlignment="start">
                {recent.map((plant, i) => (
                  <HomePlantCard key={plant.plantId} plant={plant} index={i} onPress={() => goPlant(plant.plantId)} />
                ))}
              </AnimatedScrollView>
            </View>

            {/* ── 5 · Plant Health Summary (4-tier) ─────────────────────────── */}
            <View style={{ marginBottom: SECTION_GAP }}>
              <SectionHeader label="PLANT HEALTH" />
              <View style={styles.healthGrid}>
                <HealthTier label="Healthy" n={garden.healthy} color={C.healthyFg} />
                <HealthTier label="Needs attention" n={garden.needsAttention} color={C.waterFg} />
                <HealthTier label="At risk" n={garden.atRisk} color={C.secondary} />
                <HealthTier label="Critical" n={garden.critical} color={C.criticalFg} />
              </View>
            </View>

            {/* ── 6 · Weather + AQI Intelligence ────────────────────────────── */}
            {(weather || aqi) && (
              <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={[styles.intelCard, { marginBottom: SECTION_GAP }]}>
                <Text style={styles.cardEyebrow}>TODAY{city ? ` · ${city}` : ''}</Text>
                <View style={styles.intelRow}>
                  {weather && <IntelStat value={`${weather.tempC}°`} label="Temp" />}
                  {weather && <IntelStat value={`${weather.humidity}%`} label="Humidity" />}
                  {aqi && aqiAdvice && <IntelStat value={String(aqi.aqi)} label="AQI" color={bandColor(aqiAdvice.band)} />}
                </View>
                <Text style={styles.intelRec}>{careRecommendation}</Text>
              </Animated.View>
            )}

            {/* ── 7 · Learn & Grow ──────────────────────────────────────────── */}
            <View style={{ marginBottom: SECTION_GAP }}>
              <SectionHeader label="LEARN & GROW" />
              <View style={{ gap: 10 }}>
                {LEARN_CARDS.map(card => (
                  <LearnCard key={card.id} card={card} open={learnOpen === card.id} onToggle={() => toggleLearn(card.id)} />
                ))}
              </View>
            </View>

            {/* ── 8 · Streaks & Achievements ────────────────────────────────── */}
            <View style={{ marginBottom: SECTION_GAP }}>
              <SectionHeader label="YOUR PROGRESS" actionLabel="View all →" onAction={() => { track('home_section_cta', { section: 'progress' }); navigation.navigate('Profile'); }} />
              <View style={styles.progressRow}>
                <ProgressStat value={plants.length} label="Plants saved" />
                <ProgressStat value={scansCompleted} label="Scans completed" />
              </View>
            </View>

            {/* ── 9 · Premium Upgrade ───────────────────────────────────────── */}
            {!isPremium && !bannerDismissed && (
              <Animated.View entering={FadeInDown.duration(M.duration.standard)} style={[styles.premiumCard, { marginBottom: SECTION_GAP }]}>
                <TouchableOpacity style={styles.premiumClose} onPress={() => setBannerDismissed(true)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Text style={styles.premiumCloseText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.premiumEyebrow}>LAWNUP PREMIUM</Text>
                <Text style={styles.premiumTitle}>More scans, deeper care</Text>
                <Text style={styles.premiumBody}>Unlimited AI scans · unlimited Dr. Banyan · disease detection · smart reminders.</Text>
                <PressableScale style={styles.premiumBtn} onPress={goPaywall} to={0.97}>
                  <Text style={styles.premiumBtnText}>See Premium  →</Text>
                </PressableScale>
              </Animated.View>
            )}

            {/* ── 10 · Quick Actions ────────────────────────────────────────── */}
            <View style={{ marginBottom: S.xl }}>
              <SectionHeader label="QUICK ACTIONS" />
              <View style={styles.quickGrid}>
                <QuickAction emoji="🪴" label="Add Plant" onPress={() => goAddPlant('quick_action')} />
                <QuickAction emoji="💬" label="Ask Dr. Banyan" onPress={() => goDoctor('quick_action')} />
                <QuickAction emoji="✅" label="Tasks" onPress={() => goTasks('quick_action')} />
              </View>
            </View>
          </>
        )}
      </AnimatedScrollView>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ label: string; actionLabel?: string; onAction?: () => void }> = ({ label, actionLabel, onAction }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {actionLabel ? <Pressable onPress={onAction} hitSlop={8}><Text style={styles.sectionLink}>{actionLabel}</Text></Pressable> : null}
  </View>
);

const TASK_ICON: Record<'water' | 'fertilizer' | 'sunlight', { emoji: string; bg: string }> = {
  water: { emoji: '💧', bg: C.waterBg },
  fertilizer: { emoji: '🌱', bg: C.healthyBg },
  sunlight: { emoji: '☀️', bg: C.primaryWash },
};

const CareTaskRow: React.FC<{
  task: { kind: 'water' | 'fertilizer' | 'sunlight'; title: string; meta: string };
  isLast: boolean;
  onPress?: () => void;
}> = ({ task, isLast, onPress }) => {
  const icon = TASK_ICON[task.kind];
  const Inner = (
    <>
      <View style={[styles.careIcon, { backgroundColor: icon.bg }]}><Text style={{ fontSize: 15 }}>{icon.emoji}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.carePlantName}>{task.title}</Text>
        <Text style={styles.careTime}>{task.meta}</Text>
      </View>
      {onPress && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M9 6l6 6-6 6" stroke={C.textMuted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
      )}
    </>
  );
  return onPress
    ? <PressableScale style={[styles.careRow, !isLast && styles.careRowBorder]} onPress={onPress} to={0.98}>{Inner}</PressableScale>
    : <View style={[styles.careRow, !isLast && styles.careRowBorder]}>{Inner}</View>;
};

const HealthTier: React.FC<{ label: string; n: number; color: string }> = ({ label, n, color }) => (
  <View style={styles.healthTier}>
    <View style={[styles.healthDot, { backgroundColor: color }]} />
    <Text style={styles.healthTierNum}>{n}</Text>
    <Text style={styles.healthTierLabel}>{label}</Text>
  </View>
);

const IntelStat: React.FC<{ value: string; label: string; color?: string }> = ({ value, label, color }) => (
  <View style={styles.intelStat}>
    <Text style={[styles.intelValue, color && { color }]}>{value}</Text>
    <Text style={styles.intelLabel}>{label}</Text>
  </View>
);

const ProgressStat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <View style={styles.progressStat}>
    <Text style={styles.progressNum}>{value}</Text>
    <Text style={styles.progressLabel}>{label}</Text>
  </View>
);

const QuickAction: React.FC<{ emoji: string; label: string; onPress: () => void }> = ({ emoji, label, onPress }) => (
  <PressableScale style={styles.quickItem} onPress={onPress} to={0.95}>
    <View style={styles.quickIcon}><Text style={{ fontSize: 20 }}>{emoji}</Text></View>
    <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
  </PressableScale>
);

const LearnCard: React.FC<{ card: { icon: string; title: string; body: string }; open: boolean; onToggle: () => void }> = ({ card, open, onToggle }) => (
  <PressableScale style={styles.learnCard} onPress={onToggle} to={0.99}>
    <View style={styles.learnHead}>
      <View style={styles.learnIcon}><Text style={{ fontSize: 16 }}>{card.icon}</Text></View>
      <Text style={styles.learnTitle}>{card.title}</Text>
      <Text style={styles.learnChevron}>{open ? '–' : '+'}</Text>
    </View>
    {open && <Text style={styles.learnBody}>{card.body}</Text>}
  </PressableScale>
);

const HomePlantCard: React.FC<{ plant: UserPlantDoc; index: number; onPress: () => void }> = ({ plant, index, onPress }) => {
  const score = computeHealthScore(plant);
  const tone = score >= 75 ? C.healthyFg : score >= 45 ? C.waterFg : C.criticalFg;
  const imgUrl = plant.imageUrl ? getIKImageUrl(plant.imageUrl, 'tr=w-400,h-320,q-80,fo-auto') : null;
  return (
    <Animated.View entering={FadeInDown.delay(index * M.stagger.base).duration(M.duration.expressive).springify().damping(18)}>
      <PressableScale style={styles.plantCard} onPress={onPress} to={0.96}>
        <View style={styles.plantImageWrap}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.plantPlaceholder]}>
              <Text style={styles.plantPlaceholderInitial}>{plant.nickname.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.ringWrap}>
            <HealthRing progress={score / 100} size={40} stroke={4} color={tone} delay={index * M.stagger.base + 200}>
              <Text style={[styles.ringScore, { color: tone }]}>{score}</Text>
            </HealthRing>
          </View>
        </View>
        <View style={styles.plantInfo}>
          <Text style={styles.plantName} numberOfLines={1}>{plant.nickname}</Text>
          <Text style={styles.plantStatus} numberOfLines={1}>{plant.speciesName}</Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: H_PAD, paddingBottom: 140 },

  compactBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: theme.z.header,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: H_PAD, paddingBottom: S.sm,
  },
  compactName: { ...T.h3, color: C.textPrimary, flex: 1 },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...T.bodyStrong, fontFamily: F.sansBold, color: C.onPrimary, fontSize: 16 },

  bigHeader: { marginBottom: S.lg },
  dateLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 1.8, marginBottom: S.xs + 2 },
  greeting: { ...T.bodyStrong, fontFamily: F.sans, color: C.textMuted, marginBottom: 2 },
  firstName: { fontFamily: F.serifMediumItalic, fontSize: 44, lineHeight: 48, letterSpacing: -0.6, color: C.textPrimary },

  // 1 · Garden Overview Hero — warm white card with a sage health ring
  overviewCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.xl,
    backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, marginBottom: SECTION_GAP,
    borderWidth: 1, borderColor: C.border, ...theme.shadows.card,
  },
  overviewRingWrap: { alignItems: 'center', gap: 6 },
  overviewScore: { fontFamily: F.sansHeavy, fontSize: 20, color: C.textPrimary },
  overviewRingLabel: { ...T.caption, fontSize: 9, letterSpacing: 1, color: C.textMuted, textAlign: 'center' },
  overviewStats: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewStatNum: { fontFamily: F.sansHeavy, fontSize: 30, letterSpacing: -0.5, color: C.textPrimary },
  overviewStatLabel: { ...T.caption, color: C.textMuted, marginTop: 2 },
  overviewDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: C.border },

  cardEyebrow: { ...T.statLabel, color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: S.sm },

  // First-run scan hero (kept deep green — it's the single first-run focal point)
  scanCard: { backgroundColor: C.primaryDark, borderRadius: R.sheet, paddingHorizontal: 26, paddingTop: 28, paddingBottom: 28, overflow: 'hidden', ...theme.shadows.lg },
  scanBlob: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.07)', top: -100, right: -80 },
  scanLabel: { ...T.statLabel, color: 'rgba(255,255,255,0.7)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: S.md },
  scanTitle: { fontFamily: F.serifMedium, fontSize: 34, lineHeight: 40, letterSpacing: -0.5, color: '#FFFFFF', marginBottom: S.md },
  scanBody: { ...T.bodyMd, color: 'rgba(255,255,255,0.78)', lineHeight: 21, marginBottom: 28 },
  scanBtn: { backgroundColor: C.card, borderRadius: R.pill, paddingVertical: 15, paddingHorizontal: 26, alignSelf: 'flex-start' },
  scanBtnText: { ...T.button, fontFamily: F.sansBold, color: C.primaryDark },

  valueHeading: { ...T.eyebrow, color: C.textMuted, letterSpacing: 2, marginBottom: S.md },
  valueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SECTION_GAP },
  valueItem: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.card, borderRadius: R.lg, paddingVertical: S.md, paddingHorizontal: S.md, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  valueIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  valueEmoji: { fontSize: 15 },
  valueLabel: { ...T.bodyMd, fontFamily: F.sansMedium, fontSize: 13, color: C.textPrimary, flex: 1 },

  // Sections
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md },
  sectionLabel: { ...T.label, fontFamily: F.sansBold, color: C.textMuted, letterSpacing: 2.2, textTransform: 'uppercase' },
  sectionLink: { ...T.label, fontSize: 13, color: C.primary },

  // 2 · Care
  careCard: { backgroundColor: C.card, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...theme.shadows.card },
  careRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.lg, paddingHorizontal: 16, gap: S.md },
  careRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  careIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  carePlantName: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, marginBottom: 2 },
  careTime: { ...T.caption, color: C.textMuted },
  careEmpty: { padding: S.xl, alignItems: 'center' },
  careEmptyText: { ...T.bodyMd, color: C.textMuted },

  // 3 · Strip
  stripWrap: { marginLeft: -H_PAD, marginRight: -H_PAD },
  plantScroll: { paddingHorizontal: H_PAD, gap: 12 },
  plantCard: { width: PLANT_CARD_W, backgroundColor: C.card, borderRadius: R.xl, overflow: 'hidden', ...theme.shadows.card },
  plantImageWrap: { width: '100%', height: PLANT_CARD_W * 0.9, backgroundColor: C.surface, position: 'relative' },
  plantPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryWash },
  plantPlaceholderInitial: { fontFamily: F.serifMedium, fontSize: 32, color: C.primary },
  ringWrap: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 22, padding: 2 },
  ringScore: { fontFamily: F.sansHeavy, fontSize: 12 },
  plantInfo: { paddingHorizontal: 11, paddingTop: 9, paddingBottom: 11 },
  plantName: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 4 },
  plantStatus: { ...T.caption, color: C.textSecondary },

  // 5 · Health summary (4-tier)
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  healthTier: { width: (W - H_PAD * 2 - 10) / 2, backgroundColor: C.card, borderRadius: R.lg, paddingVertical: S.lg, paddingHorizontal: S.lg, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: S.md, ...theme.shadows.sm },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
  healthTierNum: { fontFamily: F.sansHeavy, fontSize: 22, color: C.textPrimary, minWidth: 24 },
  healthTierLabel: { ...T.caption, color: C.textSecondary, flex: 1 },

  // 6 · Weather + AQI
  intelCard: { backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.border, ...theme.shadows.card },
  intelRow: { flexDirection: 'row', gap: S.md, marginBottom: S.lg },
  intelStat: { flex: 1, alignItems: 'center', backgroundColor: C.surface, borderRadius: R.md, paddingVertical: S.md },
  intelValue: { fontFamily: F.sansHeavy, fontSize: 22, color: C.textPrimary },
  intelLabel: { ...T.caption, fontSize: 11, color: C.textMuted, marginTop: 2 },
  intelRec: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textSecondary, lineHeight: 21 },

  // 7 · Learn & Grow
  learnCard: { backgroundColor: C.card, borderRadius: R.lg, paddingHorizontal: S.lg, paddingVertical: S.lg, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  learnHead: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  learnIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  learnTitle: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, flex: 1 },
  learnChevron: { fontFamily: F.sansBold, fontSize: 20, color: C.textMuted, width: 16, textAlign: 'center' },
  learnBody: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21, marginTop: S.md },

  // 8 · Progress
  progressRow: { flexDirection: 'row', gap: 12 },
  progressStat: { flex: 1, backgroundColor: C.card, borderRadius: R.lg, paddingVertical: S.xl, alignItems: 'center', borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  progressNum: { fontFamily: F.sansHeavy, fontSize: 30, letterSpacing: -0.5, color: C.primary },
  progressLabel: { ...T.caption, color: C.textSecondary, marginTop: 2 },

  // 9 · Premium
  premiumCard: { backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.primarySoft, ...theme.shadows.card },
  premiumClose: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  premiumCloseText: { fontSize: 13, color: C.textMuted },
  premiumEyebrow: { ...T.statLabel, color: C.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: S.xs },
  premiumTitle: { fontFamily: F.serifMedium, fontSize: 22, color: C.textPrimary, marginBottom: S.xs },
  premiumBody: { ...T.bodyMd, color: C.textSecondary, lineHeight: 20, marginBottom: S.lg },
  premiumBtn: { backgroundColor: C.primary, borderRadius: R.pill, paddingVertical: 13, paddingHorizontal: 22, alignSelf: 'flex-start' },
  premiumBtnText: { ...T.button, fontFamily: F.sansBold, color: C.onPrimary },

  // 10 · Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: { width: (W - H_PAD * 2 - 10) / 2, flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.card, borderRadius: R.lg, paddingVertical: S.lg, paddingHorizontal: S.lg, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  quickIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { ...T.bodyMd, fontFamily: F.sansMedium, fontSize: 13, color: C.textPrimary, flex: 1 },

  emptyWrap: { paddingVertical: S['2xl'], alignItems: 'center' },
  emptyText: { ...T.bodyMd, color: C.textMuted, textAlign: 'center' },
});
