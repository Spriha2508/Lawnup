import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, Pressable, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown, FadeInUp, Easing,
  useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, interpolate, Extrapolation,
  withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { isDueForWater, computeHealthScore, getIKImageUrl } from '../../../shared/utils/plantUtils';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import { getAirQuality, type AirQualityData } from '../../../services/weather/aqiService';
import { aqiRules, type AqiBand } from '../../../services/knowledge';
import { getTodayNarrative } from '../../../services/reminders/reminderService';
import { getWeatherInsight, getSeasonalTip } from '../utils/homeInsights';
import { HealthRing } from '@shared/components/motion/HealthRing';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { WeatherData } from '../../../services/weather/weatherService';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: W, height: SCREEN_H } = Dimensions.get('window');
const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
const H_PAD = S.xl;
const PLANT_CARD_W = Math.floor(W * 0.42);
const SECTION_GAP = S['4xl'];

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

// ─── small icons ─────────────────────────────────────────────────────────────
const DropIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C12 3 5 11 5 15.5C5 19.0899 8.13401 22 12 22C15.866 22 19 19.0899 19 15.5C19 11 12 3 12 3Z" fill={color} />
  </Svg>
);
const EMERGENCIES = [
  { id: 'yellow', label: 'Yellow leaves', d: 'M12 2C12 2 5 9 5 14C5 17.866 8.134 21 12 21C15.866 21 19 17.866 19 14C19 9 12 2 12 2Z' },
  { id: 'brown',  label: 'Brown tips',    d: 'M12 2C12 2 5 9 5 14C5 17.866 8.134 21 12 21C15.866 21 19 17.866 19 14C19 9 12 2 12 2Z' },
  { id: 'fungus', label: 'Fungus / spots', d: 'M12 2C12 2 5 9 5 14C5 17.866 8.134 21 12 21C15.866 21 19 17.866 19 14C19 9 12 2 12 2Z' },
  { id: 'over',   label: 'Overwatering',   d: 'M12 3C12 3 5 11 5 15.5C5 19.09 8.13 22 12 22C15.87 22 19 19.09 19 15.5C19 11 12 3 12 3Z' },
];

// Core value props surfaced on Home — what LawnUp does for you, at a glance.
const VALUE_PROPS = [
  { icon: '📷', label: 'Scan any plant' },
  { icon: '🌿', label: 'Identify species' },
  { icon: '🩺', label: 'Diagnose issues' },
  { icon: '🧾', label: 'Get care plans' },
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
  if (h >= 9 && h < 17) return 'rgba(94,127,97,0.14)';   // sage day
  if (h >= 17 && h < 19) return 'rgba(206,126,154,0.14)';// blossom dusk
  return 'rgba(70,96,73,0.14)';                          // deep-garden evening
};

const TimeSky: React.FC = () => {
  const v = useSharedValue(0);
  useEffect(() => {
    // Signature moment: the sky brightens over 1.5s on mount (200ms delay).
    v.value = withDelay(200, withTiming(1, { duration: 1500, easing: M.ease.smooth }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ opacity: v.value }));
  const sky = useMemo(skyColorForHour, []);
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

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AirQualityData | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isPremium = isPremiumActive();

  useEffect(() => {
    if (city) {
      getCurrentWeather(city).then(setWeather).catch(() => {});
      getAirQuality(city).then(setAqi).catch(() => {});
    }
  }, [city]);

  const aqiAdvice = useMemo(() => aqiRules(aqi?.aqi), [aqi]);

  // Hero "breathing" — nothing on screen is ever fully static.
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: M.loop.breath, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const blobStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breathe.value * 0.08 }], opacity: 0.55 + breathe.value * 0.45 }));

  const firstName = user?.name?.split(' ')[0] ?? 'Gardener';
  const avatarChar = user?.name ? user.name[0].toUpperCase() : 'G';

  const duePlants = useMemo(() => plants.filter(isDueForWater), [plants]);
  const recent = useMemo(
    () => [...plants].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, 6),
    [plants],
  );
  const snapshot = useMemo(() => {
    let thriving = 0, watch = 0;
    for (const p of plants) {
      const s = computeHealthScore(p);
      if (s >= 75) thriving++;
      else if (s < 45) watch++;
    }
    return { needWater: duePlants.length, thriving, watch };
  }, [plants, duePlants]);
  const todayNarrative = useMemo(() => getTodayNarrative(plants, weather, city || undefined), [plants, weather, city]);
  const weatherInsight = useMemo(() => getWeatherInsight(weather, city || undefined), [weather, city]);
  const seasonalTip = useMemo(() => getSeasonalTip(), []);

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

  return (
    <View style={styles.root}>
      {/* Atmosphere is the persistent root world — Home is transparent over it. */}
      <TimeSky />

      {/* Sticky compact header */}
      <Animated.View style={[styles.compactBar, { paddingTop: insets.top + 4, borderBottomColor: C.border }, compactBarStyle]}>
        <Animated.Text style={[styles.compactName, compactNameStyle]} numberOfLines={1}>{firstName}</Animated.Text>
        <PressableScale style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')} to={0.9}>
          <Text style={styles.avatarInitial}>{avatarChar}</Text>
        </PressableScale>
      </Animated.View>

      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
      >
        {/* Big header */}
        <Animated.View style={[styles.bigHeader, bigHeaderStyle]}>
          <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.firstName}>{firstName}</Text>
          {weather && (
            <Text style={styles.skyWeather}>
              {weather.tempC}° · {weather.humidity}% humidity{city ? ` · ${city}` : ''}
            </Text>
          )}
        </Animated.View>

        {/* Premium banner */}
        {!isPremium && !bannerDismissed && (
          <Animated.View entering={FadeInDown.duration(M.duration.standard)} style={styles.premiumBanner}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => navigation.navigate('Profile', { screen: 'Paywall' })} activeOpacity={0.82} />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumEyebrow}>LAWNUP PRO</Text>
              <Text style={styles.premiumText}>Unlimited scans · AI Doctor · No limits</Text>
            </View>
            <View style={styles.premiumRight}>
              <Text style={styles.premiumArrow}>→</Text>
              <TouchableOpacity style={styles.premiumClose} onPress={() => setBannerDismissed(true)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Text style={styles.premiumCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Weather · Garden Sync */}
        {weatherInsight && (
          <Animated.View entering={FadeInDown.delay(60).duration(M.duration.expressive)} style={styles.weatherCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>{weatherInsight.eyebrow}</Text>
              <Text style={styles.weatherTitle}>{weatherInsight.title}</Text>
              <Text style={styles.weatherBody}>{weatherInsight.body}</Text>
            </View>
            {weather && (
              <View style={styles.weatherTempCol}>
                <Text style={styles.weatherTemp}>{weather.tempC}°</Text>
                <Text style={styles.weatherHum}>{weather.humidity}%</Text>
                <Text style={styles.weatherHumLabel}>humidity</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Air quality · plant guidance (India-first) */}
        {aqi && aqiAdvice && (
          <Animated.View entering={FadeInDown.delay(90).duration(M.duration.expressive)} style={styles.aqiCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>AIR QUALITY{city ? ` · ${city}` : ''}</Text>
              <Text style={styles.aqiBand}>{aqiAdvice.label}</Text>
              <Text style={styles.aqiBody}>{aqiAdvice.rules[0]}</Text>
            </View>
            <View style={styles.aqiBadge}>
              <Text style={[styles.aqiNum, { color: bandColor(aqiAdvice.band) }]}>{aqi.aqi}</Text>
              <Text style={styles.aqiNumLabel}>AQI</Text>
            </View>
          </Animated.View>
        )}

        {/* Today narrative (compact) */}
        <Animated.View entering={FadeInDown.delay(110).duration(M.duration.expressive)} style={styles.narrativeRow}>
          <View style={styles.narrativeDot} />
          <Text style={styles.narrativeText}>{todayNarrative}</Text>
        </Animated.View>

        {/* Hero scan CTA */}
        <Animated.View entering={FadeInDown.delay(160).duration(M.duration.expressive)} style={{ marginBottom: S.lg }}>
          <PressableScale style={styles.scanCard} onPress={() => navigation.navigate('Scan')} to={0.97}>
            <Animated.View style={[styles.scanBlob, blobStyle]} />
            <Text style={styles.scanLabel}>AI PLANT SCAN</Text>
            <Text style={styles.scanTitle}>Identify any plant{'\n'}in seconds</Text>
            <Text style={styles.scanBody}>Species ID, health check, and a personalised care guide — instantly.</Text>
            <View style={styles.scanBtn}><Text style={styles.scanBtnText}>Open Camera  →</Text></View>
          </PressableScale>
        </Animated.View>

        {/* Core value props — what LawnUp does, made prominent */}
        <View style={styles.valueGrid}>
          {VALUE_PROPS.map((v, i) => (
            <Animated.View key={v.label} entering={FadeInDown.delay(190 + i * 45).duration(M.duration.standard)} style={{ width: (W - H_PAD * 2 - 10) / 2 }}>
              <PressableScale style={styles.valueItem} onPress={() => navigation.navigate('Scan')} to={0.97}>
                <View style={styles.valueIcon}><Text style={styles.valueEmoji}>{v.icon}</Text></View>
                <Text style={styles.valueLabel}>{v.label}</Text>
              </PressableScale>
            </Animated.View>
          ))}
        </View>

        {/* Plant Health Snapshot */}
        {plants.length > 0 && (
          <View style={{ marginBottom: SECTION_GAP }}>
            <SectionHeader label="YOUR GARDEN AT A GLANCE" />
            <View style={styles.statRow}>
              <StatCard n={snapshot.needWater} label="Need water" tone={C.waterFg} bg={C.waterBg} delay={0} />
              <StatCard n={snapshot.thriving} label="Thriving" tone={C.healthyFg} bg={C.healthyBg} delay={70} />
              <StatCard n={snapshot.watch} label="Watch" tone={C.criticalFg} bg={C.criticalBg} delay={140} />
            </View>
          </View>
        )}

        {/* Today's Care */}
        {duePlants.length > 0 && (
          <View style={{ marginBottom: SECTION_GAP }}>
            <SectionHeader label="TODAY'S CARE" actionLabel="All tasks →" onAction={() => navigation.navigate('Plants', { screen: 'Tasks' })} />
            <View style={styles.careCard}>
              {duePlants.slice(0, 4).map((plant, i) => (
                <CareRow key={plant.plantId} plant={plant} index={i} isLast={i === Math.min(duePlants.length, 4) - 1}
                  onPress={() => navigation.navigate('Plants', { screen: 'PlantDetail', params: { plantId: plant.plantId } })} />
              ))}
            </View>
          </View>
        )}

        {/* My Garden (recently added) */}
        {plants.length > 0 && (
          <View style={[styles.stripWrap, { marginBottom: SECTION_GAP }]}>
            <View style={{ paddingHorizontal: H_PAD }}>
              <SectionHeader label="MY GARDEN" actionLabel="See all →" onAction={() => navigation.navigate('Plants')} />
            </View>
            <AnimatedScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plantScroll}
              decelerationRate="fast" snapToInterval={PLANT_CARD_W + 12} snapToAlignment="start">
              {recent.map((plant, i) => (
                <HomePlantCard key={plant.plantId} plant={plant} index={i}
                  onPress={() => navigation.navigate('Plants', { screen: 'PlantDetail', params: { plantId: plant.plantId } })} />
              ))}
            </AnimatedScrollView>
          </View>
        )}

        {/* Seasonal tip */}
        <Animated.View entering={FadeInDown.duration(M.duration.expressive)} style={[styles.seasonCard, { marginBottom: SECTION_GAP }]}>
          <Text style={styles.cardEyebrow}>{seasonalTip.eyebrow}</Text>
          <Text style={styles.seasonTitle}>{seasonalTip.title}</Text>
          <Text style={styles.seasonBody}>{seasonalTip.body}</Text>
        </Animated.View>

        {/* Plant emergency quick actions */}
        <View style={{ marginBottom: S.xl }}>
          <SectionHeader label="QUICK DIAGNOSE" />
          <View style={styles.emergencyGrid}>
            {EMERGENCIES.map((e, i) => (
              <Animated.View key={e.id} entering={FadeInDown.delay(i * 50).duration(M.duration.standard)} style={{ width: (W - H_PAD * 2 - 12) / 2 }}>
                <PressableScale style={styles.emCard} onPress={() => navigation.navigate('Scan')} to={0.97}>
                  <View style={styles.emIcon}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d={e.d} fill={C.primary} opacity={0.85} /></Svg>
                  </View>
                  <Text style={styles.emLabel}>{e.label}</Text>
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        </View>

        {plants.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Your future indoor jungle starts here — scan any plant to begin.</Text>
          </Animated.View>
        )}
      </AnimatedScrollView>

      {/* FAB */}
      <Animated.View entering={FadeInUp.delay(400).duration(M.duration.expressive).springify().damping(14)} style={styles.fabWrap} pointerEvents="box-none">
        <PressableScale style={styles.fab} onPress={() => navigation.navigate('Scan')} to={0.9}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none"><Path d="M12 5V19M5 12H19" stroke={C.onInkBtn} strokeWidth={2.2} strokeLinecap="round" /></Svg>
        </PressableScale>
      </Animated.View>
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

const StatCard: React.FC<{ n: number; label: string; tone: string; bg: string; delay: number }> = ({ n, label, tone, bg, delay }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(M.duration.expressive)} style={[styles.statCard, { backgroundColor: bg }]}>
    <Text style={[styles.statNum, { color: tone }]}>{n}</Text>
    <Text style={[styles.statLabel, { color: tone }]}>{label}</Text>
  </Animated.View>
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

const CareRow: React.FC<{ plant: UserPlantDoc; index: number; isLast: boolean; onPress: () => void }> = ({ plant, index, isLast, onPress }) => (
  <Animated.View entering={FadeInDown.delay(index * M.stagger.base).duration(M.duration.standard)}>
    <PressableScale style={[styles.careRow, !isLast && styles.careRowBorder]} onPress={onPress} to={0.98}>
      <View style={styles.careIcon}><DropIcon color={C.waterFg} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.carePlantName}>Water {plant.nickname}</Text>
        <Text style={styles.careTime}>Due today</Text>
      </View>
      <View style={styles.careCheck}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none"><Path d="M5 12.5L10 17.5L19 7" stroke={C.textMuted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>
      </View>
    </PressableScale>
  </Animated.View>
);

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

  bigHeader: { marginBottom: S.xl },
  dateLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 1.8, marginBottom: S.xs + 2 },
  greeting: { ...T.bodyStrong, fontFamily: F.sans, color: C.textMuted, marginBottom: 2 },
  firstName: { fontFamily: F.serifMediumItalic, fontSize: 48, lineHeight: 52, letterSpacing: -0.6, color: C.textPrimary },
  skyWeather: { ...T.caption, color: C.textMuted, marginTop: S.sm, letterSpacing: 0.3 },

  premiumBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.waterBg, borderRadius: R.lg, paddingHorizontal: S.lg, paddingVertical: S.md, marginBottom: S.lg, overflow: 'hidden', borderWidth: 1, borderColor: C.waterFg },
  premiumEyebrow: { ...T.statLabel, color: C.waterFg, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 },
  premiumText: { ...T.label, fontFamily: F.sansMedium, fontSize: 13, color: C.textSecondary },
  premiumRight: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  premiumArrow: { fontSize: 16, color: C.waterFg },
  premiumClose: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  premiumCloseText: { fontSize: 12, color: C.textMuted },

  cardEyebrow: { ...T.statLabel, color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: S.sm },

  // Weather card
  weatherCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.lg,
    backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, marginBottom: S.lg,
    borderWidth: 1, borderColor: C.border, ...theme.shadows.card,
  },
  weatherTitle: { ...T.h3, color: C.textPrimary, marginBottom: S.xs },
  weatherBody: { ...T.bodyMd, color: C.textSecondary, lineHeight: 20 },
  weatherTempCol: { alignItems: 'flex-end' },
  weatherTemp: { fontFamily: F.serifMedium, fontSize: 38, lineHeight: 40, color: C.textPrimary },
  weatherHum: { fontFamily: F.sansHeavy, fontSize: 13, color: C.primary },
  weatherHumLabel: { ...T.caption, fontSize: 10, color: C.textMuted },

  // AQI card
  aqiCard: {
    flexDirection: 'row', alignItems: 'center', gap: S.lg,
    backgroundColor: C.card, borderRadius: R.xl, padding: S.xl, marginBottom: S.lg,
    borderWidth: 1, borderColor: C.border, ...theme.shadows.card,
  },
  aqiBand: { ...T.h3, color: C.textPrimary, marginBottom: S.xs },
  aqiBody: { ...T.bodyMd, color: C.textSecondary, lineHeight: 20 },
  aqiBadge: { alignItems: 'center', minWidth: 48 },
  aqiNum: { fontFamily: F.sansHeavy, fontSize: 30, letterSpacing: -0.5 },
  aqiNumLabel: { ...T.statLabel, fontSize: 10, color: C.textMuted, letterSpacing: 1 },

  narrativeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md, marginBottom: SECTION_GAP, paddingRight: S.sm },
  narrativeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary, marginTop: 6 },
  narrativeText: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, lineHeight: 21, flex: 1 },

  // Scan CTA — deep botanical green hero (the one bold block on a light home)
  scanCard: { backgroundColor: C.primaryDark, borderRadius: R.sheet, paddingHorizontal: 26, paddingTop: 28, paddingBottom: 28, overflow: 'hidden', ...theme.shadows.lg },
  scanBlob: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.07)', top: -100, right: -80 },
  scanLabel: { ...T.statLabel, color: 'rgba(255,255,255,0.7)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: S.md },
  scanTitle: { fontFamily: F.serifMedium, fontSize: 34, lineHeight: 40, letterSpacing: -0.5, color: '#FFFFFF', marginBottom: S.md },
  scanBody: { ...T.bodyMd, color: 'rgba(255,255,255,0.78)', lineHeight: 21, marginBottom: 28 },
  scanBtn: { backgroundColor: C.card, borderRadius: R.pill, paddingVertical: 15, paddingHorizontal: 26, alignSelf: 'flex-start' },
  scanBtnText: { ...T.button, fontFamily: F.sansBold, color: C.primaryDark },

  // Value props grid
  valueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SECTION_GAP },
  valueItem: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.card, borderRadius: R.lg, paddingVertical: S.md, paddingHorizontal: S.md, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  valueIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  valueEmoji: { fontSize: 15 },
  valueLabel: { ...T.bodyMd, fontFamily: F.sansMedium, fontSize: 13, color: C.textPrimary, flex: 1 },

  // Sections
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.lg },
  sectionLabel: { ...T.label, fontFamily: F.sansBold, color: C.textMuted, letterSpacing: 2.2, textTransform: 'uppercase' },
  sectionLink: { ...T.label, fontSize: 13, color: C.primary },

  // Stat snapshot
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: R.lg, paddingVertical: S.lg, paddingHorizontal: S.md, alignItems: 'flex-start' },
  statNum: { fontFamily: F.sansHeavy, fontSize: 30, letterSpacing: -0.5, marginBottom: 2 },
  statLabel: { ...T.label, fontSize: 12 },

  // Strip
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

  // Care
  careCard: { backgroundColor: C.card, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.border, ...theme.shadows.card },
  careRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.lg, paddingHorizontal: 18, gap: S.lg },
  careRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  careIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.waterBg, alignItems: 'center', justifyContent: 'center' },
  carePlantName: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, marginBottom: 2 },
  careTime: { ...T.caption, color: C.textMuted },
  careCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  // Seasonal
  seasonCard: { backgroundColor: C.primaryWash, borderRadius: R.xl, padding: S.xl, borderWidth: 1, borderColor: C.primarySoft },
  seasonTitle: { fontFamily: F.serifMedium, fontSize: 24, lineHeight: 28, color: C.textPrimary, marginBottom: S.sm },
  seasonBody: { ...T.bodyMd, color: C.textSecondary, lineHeight: 21 },

  // Emergency
  emergencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emCard: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: C.card, borderRadius: R.lg, paddingVertical: S.lg, paddingHorizontal: S.lg, borderWidth: 1, borderColor: C.border, ...theme.shadows.sm },
  emIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primaryWash, alignItems: 'center', justifyContent: 'center' },
  emLabel: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, flex: 1 },

  emptyWrap: { paddingVertical: S['2xl'], alignItems: 'center' },
  emptyText: { ...T.bodyMd, color: C.textMuted, textAlign: 'center' },

  // FAB
  fabWrap: { position: 'absolute', right: H_PAD, bottom: 24, zIndex: theme.z.fab },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.inkBtn, alignItems: 'center', justifyContent: 'center', ...theme.shadows.floating },
});
