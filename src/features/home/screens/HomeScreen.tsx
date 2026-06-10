import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../auth/store/authStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { isDueForWater, computeHealthScore, getIKImageUrl } from '../../../shared/utils/plantUtils';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import { getTodayNarrative } from '../../../services/reminders/reminderService';
import { HealthRing } from '@shared/components/motion/HealthRing';
import { PressableScale } from '@shared/components/motion/PressableScale';
import { theme } from '@constants/designSystem';
import type { WeatherData } from '../../../services/weather/weatherService';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: W } = Dimensions.get('window');
const { color: C, spacing: S, typography: T, radii: R, motion: M, fonts: F } = theme;
const H_PAD = S.xl; // 20
const PLANT_CARD_W = Math.floor(W * 0.42);

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

function healthTone(score: number) {
  if (score >= 75) return { ring: C.healthyFg, bg: C.healthyBg, label: 'Healthy' };
  if (score >= 45) return { ring: C.waterFg, bg: C.waterBg, label: 'Needs care' };
  return { ring: C.criticalFg, bg: C.criticalBg, label: 'Critical' };
}

// Water-drop icon for care rows
const DropIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3C12 3 5 11 5 15.5C5 19.0899 8.13401 22 12 22C15.866 22 19 19.0899 19 15.5C19 11 12 3 12 3Z" fill={color} />
  </Svg>
);

const AnimatedScrollView = Animated.ScrollView;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { plants } = usePlantsStore();
  const { city } = useOnboardingStore();
  const isPremiumActive = useSubscriptionStore(s => s.isPremiumActive);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const isPremium = isPremiumActive();

  useEffect(() => {
    if (city) {
      getCurrentWeather(city).then(setWeather).catch(() => {});
    }
  }, [city]);

  const firstName = user?.name?.split(' ')[0] ?? 'Gardener';
  const avatarChar = user?.name ? user.name[0].toUpperCase() : 'G';
  const duePlants = useMemo(() => plants.filter(isDueForWater), [plants]);
  const showPlants = useMemo(() => plants.slice(0, 6), [plants]);
  const todayNarrative = useMemo(
    () => getTodayNarrative(plants, weather, city || undefined),
    [plants, weather, city],
  );

  // ── Parallax header morph ──
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });
  const bigHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, 80], [0, -16], Extrapolation.CLAMP) }],
  }));
  const compactNameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [50, 100], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [50, 100], [8, 0], Extrapolation.CLAMP) }],
  }));
  const compactBarStyle = useAnimatedStyle(() => ({
    borderBottomColor: C.border,
    borderBottomWidth: interpolate(scrollY.value, [60, 100], [0, StyleSheet.hairlineWidth], Extrapolation.CLAMP),
    backgroundColor: `rgba(245,241,232,${interpolate(scrollY.value, [40, 90], [0, 0.92], Extrapolation.CLAMP)})`,
  }));

  return (
    <View style={styles.root}>
      {/* Sticky compact header — avatar persists, small name fades in on scroll */}
      <Animated.View style={[styles.compactBar, { paddingTop: insets.top + 4 }, compactBarStyle]}>
        <Animated.Text style={[styles.compactName, compactNameStyle]} numberOfLines={1}>
          {firstName}
        </Animated.Text>
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
        {/* Big header (parallax + fade) */}
        <Animated.View style={[styles.bigHeader, bigHeaderStyle]}>
          <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.firstName}>{firstName}</Text>
        </Animated.View>

        {/* Upgrade banner — free users only, dismissible */}
        {!isPremium && !bannerDismissed && (
          <Animated.View entering={FadeInDown.duration(M.duration.standard)} style={styles.premiumBanner}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => navigation.navigate('Profile', { screen: 'Paywall' })}
              activeOpacity={0.82}
            />
            <View style={styles.premiumBannerLeft}>
              <Text style={styles.premiumEyebrow}>LAWNUP PRO</Text>
              <Text style={styles.premiumText}>Unlimited scans · AI Doctor · No limits</Text>
            </View>
            <View style={styles.premiumBannerRight}>
              <Text style={styles.premiumArrow}>→</Text>
              <TouchableOpacity
                style={styles.premiumClose}
                onPress={() => setBannerDismissed(true)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Text style={styles.premiumCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Today in your garden — weather chip slides in from top */}
        <Animated.View entering={FadeInDown.delay(80).duration(M.duration.expressive)} style={styles.todayCard}>
          <View style={styles.todayLeft}>
            <Text style={styles.todayEyebrow}>TODAY IN YOUR GARDEN</Text>
            <Text style={styles.todayText}>{todayNarrative}</Text>
          </View>
          {weather && (
            <Animated.View entering={FadeInUp.delay(200).duration(M.duration.expressive)} style={styles.todayWeatherCol}>
              <Text style={styles.todayTemp}>{weather.tempC}°</Text>
              <Text style={styles.todayHumidity}>{weather.humidity}%</Text>
              <Text style={styles.todayHumidityLabel}>humidity</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Scan CTA */}
        <Animated.View entering={FadeInDown.delay(160).duration(M.duration.expressive)}>
          <PressableScale style={styles.scanCard} onPress={() => navigation.navigate('Scan')} to={0.97}>
            <View style={styles.scanBlob} />
            <Text style={styles.scanLabel}>AI PLANT SCAN</Text>
            <Text style={styles.scanTitle}>Identify any plant{'\n'}in seconds</Text>
            <Text style={styles.scanBody}>
              Species ID, health check, and personalised care guide — instantly.
            </Text>
            <View style={styles.scanBtn}>
              <Text style={styles.scanBtnText}>Open Camera  →</Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* My Garden horizontal strip */}
        {plants.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={[styles.sectionRow, { paddingHorizontal: H_PAD, marginBottom: 14 }]}>
              <Text style={styles.sectionLabel}>MY GARDEN</Text>
              <Pressable onPress={() => navigation.navigate('Plants')}>
                <Text style={styles.sectionLink}>See all →</Text>
              </Pressable>
            </View>
            <AnimatedScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plantScroll}
              decelerationRate="fast"
              snapToInterval={PLANT_CARD_W + 12}
              snapToAlignment="start"
            >
              {showPlants.map((plant, i) => (
                <HomePlantCard
                  key={plant.plantId}
                  plant={plant}
                  index={i}
                  onPress={() =>
                    navigation.navigate('Plants', {
                      screen: 'PlantDetail',
                      params: { plantId: plant.plantId },
                    })
                  }
                />
              ))}
            </AnimatedScrollView>
          </View>
        )}

        {plants.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              Your future indoor jungle starts here — scan any plant to begin.
            </Text>
          </Animated.View>
        )}

        {/* Today's Care */}
        {duePlants.length > 0 && (
          <View style={styles.careSectionWrap}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>TODAY'S CARE</Text>
              <Pressable onPress={() => navigation.navigate('Plants')}>
                <Text style={styles.sectionLink}>All →</Text>
              </Pressable>
            </View>
            <View style={styles.careCard}>
              {duePlants.slice(0, 4).map((plant, i) => (
                <CareRow
                  key={plant.plantId}
                  plant={plant}
                  index={i}
                  isLast={i === Math.min(duePlants.length, 4) - 1}
                  onPress={() =>
                    navigation.navigate('Plants', {
                      screen: 'PlantDetail',
                      params: { plantId: plant.plantId },
                    })
                  }
                />
              ))}
            </View>
          </View>
        )}
      </AnimatedScrollView>

      {/* Floating add-plant button */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(M.duration.expressive).springify().damping(14)}
        style={styles.fabWrap}
        pointerEvents="box-none"
      >
        <PressableScale style={styles.fab} onPress={() => navigation.navigate('Scan')} to={0.9}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5V19M5 12H19" stroke={C.onInkBtn} strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </PressableScale>
      </Animated.View>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const HomePlantCard: React.FC<{ plant: UserPlantDoc; index: number; onPress: () => void }> = ({
  plant, index, onPress,
}) => {
  const score = computeHealthScore(plant);
  const tone = healthTone(score);
  const imgUrl = plant.imageUrl
    ? getIKImageUrl(plant.imageUrl, 'tr=w-400,h-320,q-80,fo-auto')
    : null;

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
          {/* Self-drawing health ring */}
          <View style={styles.ringWrap}>
            <HealthRing progress={score / 100} size={40} stroke={4} color={tone.ring} delay={index * M.stagger.base + 200}>
              <Text style={[styles.ringScore, { color: tone.ring }]}>{score}</Text>
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

const CareRow: React.FC<{
  plant: UserPlantDoc;
  index: number;
  isLast: boolean;
  onPress: () => void;
}> = ({ plant, index, isLast, onPress }) => (
  <Animated.View entering={FadeInDown.delay(index * M.stagger.base).duration(M.duration.standard)}>
    <PressableScale style={[styles.careRow, !isLast && styles.careRowBorder]} onPress={onPress} to={0.98}>
      <View style={styles.careIcon}>
        <DropIcon color={C.waterFg} />
      </View>
      <View style={styles.careText}>
        <Text style={styles.carePlantName}>Water {plant.nickname}</Text>
        <Text style={styles.careTime}>Today</Text>
      </View>
      <View style={styles.careCheck}>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12.5L10 17.5L19 7" stroke={C.textMuted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </PressableScale>
  </Animated.View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  content: { paddingHorizontal: H_PAD, paddingBottom: 140 },

  // Sticky compact header
  compactBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: theme.z.header,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: H_PAD, paddingBottom: S.sm,
  },
  compactName: { ...T.h3, color: C.textPrimary, flex: 1 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { ...T.bodyStrong, fontFamily: F.sansBold, color: C.onPrimary, fontSize: 16 },

  // Big header
  bigHeader: { marginBottom: S.xl },
  dateLabel: { ...T.eyebrow, color: C.textMuted, letterSpacing: 1.8, marginBottom: S.xs + 2 },
  greeting: { ...T.bodyStrong, fontFamily: F.sans, color: C.textMuted, marginBottom: 2 },
  firstName: { fontFamily: F.serifMediumItalic, fontSize: 44, lineHeight: 48, letterSpacing: -0.5, color: C.textPrimary },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1A2416', borderRadius: R.lg, paddingHorizontal: S.lg, paddingVertical: S.md,
    marginBottom: S.lg, overflow: 'hidden',
  },
  premiumBannerLeft: { flex: 1 },
  premiumEyebrow: { ...T.statLabel, color: C.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 },
  premiumText: { ...T.label, fontFamily: F.sansMedium, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  premiumBannerRight: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  premiumArrow: { fontSize: 16, color: C.primarySoft },
  premiumClose: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  premiumCloseText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },

  // Today card
  todayCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.xl, paddingHorizontal: S.xl, paddingVertical: S.lg,
    marginBottom: S.xl, borderWidth: 1, borderColor: C.border, gap: S.lg,
  },
  todayLeft: { flex: 1, gap: S.xs + 2 },
  todayEyebrow: { ...T.statLabel, color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
  todayText: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, lineHeight: 21 },
  todayWeatherCol: { alignItems: 'flex-end' },
  todayTemp: { fontFamily: F.serifMedium, fontSize: 32, lineHeight: 34, color: C.textPrimary },
  todayHumidity: { fontFamily: F.sansHeavy, fontSize: 12, color: C.primary },
  todayHumidityLabel: { ...T.caption, fontSize: 10, color: C.textMuted },

  // Scan CTA
  scanCard: {
    backgroundColor: '#1A2416', borderRadius: R.sheet,
    paddingHorizontal: 26, paddingTop: 28, paddingBottom: 28, marginBottom: 36, overflow: 'hidden',
  },
  scanBlob: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(111,148,62,0.06)', top: -100, right: -80,
  },
  scanLabel: { ...T.statLabel, color: C.primary, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: S.md },
  scanTitle: { fontFamily: F.serifMediumItalic, fontSize: 40, lineHeight: 44, letterSpacing: -0.5, color: '#FFFFFF', marginBottom: S.md },
  scanBody: { ...T.bodyMd, color: 'rgba(255,255,255,0.40)', lineHeight: 21, marginBottom: 28 },
  scanBtn: { backgroundColor: C.primary, borderRadius: R.pill, paddingVertical: 15, paddingHorizontal: 26, alignSelf: 'flex-start' },
  scanBtnText: { ...T.button, fontFamily: F.sansBold, color: '#FFFFFF' },

  // Sections
  sectionWrap: { marginLeft: -H_PAD, marginRight: -H_PAD, marginBottom: 36 },
  careSectionWrap: { marginBottom: 36 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.lg },
  sectionLabel: { ...T.label, fontFamily: F.sansBold, color: C.textMuted, letterSpacing: 2.2, textTransform: 'uppercase' },
  sectionLink: { ...T.label, fontSize: 13, color: C.primary },

  // Plant strip
  plantScroll: { paddingHorizontal: H_PAD, gap: 12 },
  plantCard: { width: PLANT_CARD_W, backgroundColor: C.surface, borderRadius: R.xl, overflow: 'hidden', ...theme.shadows.sm },
  plantImageWrap: { width: '100%', height: PLANT_CARD_W * 0.9, backgroundColor: '#DDD4C7', position: 'relative' },
  plantPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8E0D0' },
  plantPlaceholderInitial: { fontFamily: F.serifMediumItalic, fontSize: 32, color: 'rgba(0,0,0,0.22)' },
  ringWrap: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 22, padding: 2,
  },
  ringScore: { fontFamily: F.sansHeavy, fontSize: 12 },
  plantInfo: { paddingHorizontal: 11, paddingTop: 9, paddingBottom: 11 },
  plantName: { ...T.bodyMd, fontFamily: F.sansBold, color: C.textPrimary, marginBottom: 4 },
  plantStatus: { ...T.caption, color: C.textSecondary },

  // Care section
  careCard: { backgroundColor: C.surface, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  careRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.lg, paddingHorizontal: 18, gap: S.lg },
  careRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  careIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.waterBg, alignItems: 'center', justifyContent: 'center' },
  careText: { flex: 1 },
  carePlantName: { ...T.bodyMd, fontFamily: F.sansMedium, color: C.textPrimary, marginBottom: 2 },
  careTime: { ...T.caption, color: C.textMuted },
  careCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  // Empty
  emptyWrap: { paddingVertical: S['2xl'], alignItems: 'center', marginBottom: S.xl },
  emptyText: { ...T.bodyMd, color: C.textMuted, textAlign: 'center' },

  // FAB
  fabWrap: { position: 'absolute', right: H_PAD, bottom: 24, zIndex: theme.z.fab },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.inkBtn,
    alignItems: 'center', justifyContent: 'center', ...theme.shadows.floating,
  },
});
