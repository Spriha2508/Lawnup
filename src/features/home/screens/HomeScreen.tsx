import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useAuthStore } from '../../auth/store/authStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { isDueForWater, computeHealthScore, getIKImageUrl } from '../../../shared/utils/plantUtils';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import { getTodayNarrative } from '../../../services/reminders/reminderService';
import type { WeatherData } from '../../../services/weather/weatherService';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: W } = Dimensions.get('window');
const H_PAD = 20;
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

function healthBadgeStyle(score: number) {
  if (score >= 75) return { bg: 'rgba(111,148,62,0.14)', text: '#4A6E25' };
  if (score >= 45) return { bg: 'rgba(176,112,0,0.12)', text: '#7A5200' };
  return { bg: 'rgba(192,57,43,0.10)', text: '#8B2010' };
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
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
  const duePlants = useMemo(() => plants.filter(isDueForWater), [plants]);
  const showPlants = useMemo(() => plants.slice(0, 6), [plants]);
  const todayNarrative = useMemo(
    () => getTodayNarrative(plants, weather, city || undefined),
    [plants, weather, city],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.firstName}>{firstName}</Text>
          </View>
          <Pressable
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarInitial}>
              {user?.name ? user.name[0].toUpperCase() : 'G'}
            </Text>
          </Pressable>
        </View>

        {/* Upgrade banner — free users only, dismissible */}
        {!isPremium && !bannerDismissed && (
          <View style={styles.premiumBanner}>
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
          </View>
        )}

        {/* Today in your garden */}
        <View style={styles.todayCard}>
          <View style={styles.todayLeft}>
            <Text style={styles.todayEyebrow}>TODAY IN YOUR GARDEN</Text>
            <Text style={styles.todayText}>{todayNarrative}</Text>
          </View>
          {weather && (
            <View style={styles.todayWeatherCol}>
              <Text style={styles.todayTemp}>{weather.tempC}°</Text>
              <Text style={styles.todayHumidity}>{weather.humidity}%</Text>
              <Text style={styles.todayHumidityLabel}>humidity</Text>
            </View>
          )}
        </View>

        {/* Dark scan CTA — solid green button, not ghost */}
        <TouchableOpacity
          style={styles.scanCard}
          onPress={() => navigation.navigate('Scan')}
          activeOpacity={0.88}
        >
          <View style={styles.scanBlob} />
          <Text style={styles.scanLabel}>AI PLANT SCAN</Text>
          <Text style={styles.scanTitle}>Identify any plant{'\n'}in seconds</Text>
          <Text style={styles.scanBody}>
            Species ID, health check, and personalised care guide — instantly.
          </Text>
          <View style={styles.scanBtn}>
            <Text style={styles.scanBtnText}>Open Camera  →</Text>
          </View>
        </TouchableOpacity>

        {/* My Garden horizontal strip */}
        {plants.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={[styles.sectionRow, { paddingHorizontal: H_PAD, marginBottom: 14 }]}>
              <Text style={styles.sectionLabel}>MY GARDEN</Text>
              <Pressable onPress={() => navigation.navigate('Plants')}>
                <Text style={styles.sectionLink}>See all →</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plantScroll}
              decelerationRate="fast"
              snapToInterval={PLANT_CARD_W + 12}
              snapToAlignment="start"
            >
              {showPlants.map((plant) => (
                <HomePlantCard
                  key={plant.plantId}
                  plant={plant}
                  onPress={() =>
                    navigation.navigate('Plants', {
                      screen: 'PlantDetail',
                      params: { plantId: plant.plantId },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}

        {plants.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              Your future indoor jungle starts here — scan any plant to begin.
            </Text>
          </View>
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
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const HomePlantCard: React.FC<{ plant: UserPlantDoc; onPress: () => void }> = ({
  plant, onPress,
}) => {
  const score = computeHealthScore(plant);
  const badge = healthBadgeStyle(score);
  const imgUrl = plant.imageUrl
    ? getIKImageUrl(plant.imageUrl, 'tr=w-400,h-320,q-80,fo-auto')
    : null;
  const healthLabel = score >= 75 ? 'Healthy' : 'Needs care';

  return (
    <Pressable style={styles.plantCard} onPress={onPress}>
      <View style={styles.plantImageWrap}>
        {imgUrl ? (
          <Image
            source={{ uri: imgUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.plantPlaceholder]}>
            <Text style={styles.plantPlaceholderInitial}>
              {plant.nickname.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={[styles.healthBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.healthBadgeText, { color: badge.text }]}>{healthLabel}</Text>
        </View>
      </View>
      <View style={styles.plantInfo}>
        <Text style={styles.plantName} numberOfLines={1}>{plant.nickname}</Text>
        <Text style={styles.plantStatus} numberOfLines={1}>{plant.speciesName}</Text>
      </View>
    </Pressable>
  );
};

const CareRow: React.FC<{
  plant: UserPlantDoc;
  isLast: boolean;
  onPress: () => void;
}> = ({ plant, isLast, onPress }) => (
  <Pressable
    style={[styles.careRow, !isLast && styles.careRowBorder]}
    onPress={onPress}
  >
    <View style={styles.careIcon}>
      <Text style={styles.careIconText}>◆</Text>
    </View>
    <View style={styles.careText}>
      <Text style={styles.carePlantName}>Water {plant.nickname}</Text>
      <Text style={styles.careTime}>Today</Text>
    </View>
    <View style={styles.careCheck}>
      <Text style={styles.careCheckText}>✓</Text>
    </View>
  </Pressable>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  content: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 120,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flex: 1, marginRight: 12 },
  dateLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    marginBottom: 2,
  },
  firstName: {
    fontSize: 44,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#111111',
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6F943E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
  },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A2416',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  premiumBannerLeft: { flex: 1 },
  premiumEyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  premiumText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: 'rgba(255,255,255,0.85)',
  },
  premiumBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumArrow: {
    fontSize: 16,
    color: '#A7C47C',
  },
  premiumClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCloseText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },

  // Today card
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CEC6B2',
    gap: 14,
  },
  todayLeft: { flex: 1, gap: 6 },
  todayEyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  todayText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#2A2A22',
    lineHeight: 21,
  },
  todayWeatherCol: { alignItems: 'flex-end' },
  todayTemp: {
    fontFamily: 'Cormorant-SemiBold',
    fontSize: 32,
    color: '#111111',
    lineHeight: 34,
  },
  todayHumidity: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 12,
    color: '#6F943E',
  },
  todayHumidityLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 10,
    color: '#9E9A94',
  },

  // Scan CTA (dark, solid green button)
  scanCard: {
    backgroundColor: '#1A2416',
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingTop: 28,
    paddingBottom: 28,
    marginBottom: 36,
    overflow: 'hidden',
  },
  scanBlob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(111,148,62,0.06)',
    top: -100,
    right: -80,
  },
  scanLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  scanTitle: {
    fontSize: 40,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  scanBody: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.40)',
    lineHeight: 21,
    marginBottom: 28,
  },
  scanBtn: {
    backgroundColor: '#6F943E',
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 26,
    alignSelf: 'flex-start',
  },
  scanBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Section headers
  sectionWrap: {
    marginLeft: -H_PAD,
    marginRight: -H_PAD,
    marginBottom: 36,
  },
  careSectionWrap: {
    marginBottom: 36,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: '#9E9A94',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 0.2,
  },

  // Plant strip
  plantScroll: {
    paddingHorizontal: H_PAD,
    gap: 12,
  },
  plantCard: {
    width: PLANT_CARD_W,
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    overflow: 'hidden',
  },
  plantImageWrap: {
    width: '100%',
    height: PLANT_CARD_W * 0.9,
    backgroundColor: '#DDD4C7',
    position: 'relative',
  },
  plantPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E0D0',
  },
  plantPlaceholderInitial: {
    fontSize: 32,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: 'rgba(0,0,0,0.22)',
  },
  healthBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  healthBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
  },
  plantInfo: {
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
  },
  plantName: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#111111',
    marginBottom: 4,
  },
  plantStatus: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#6E6A64',
  },

  // Care section
  careCard: {
    backgroundColor: '#EEE7DA',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CEC6B2',
  },
  careRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  careRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CEC6B2',
  },
  careIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(111,148,62,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careIconText: { fontSize: 12, color: '#6F943E' },
  careText: { flex: 1 },
  carePlantName: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
    marginBottom: 2,
  },
  careTime: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
  careCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careCheckText: {
    fontSize: 12,
    color: '#9E9A94',
    fontFamily: 'Nunito-SemiBold',
  },

  // Empty state
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    textAlign: 'center',
  },
});
