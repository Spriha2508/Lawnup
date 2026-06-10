import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HealthRing } from '@shared/components/motion/HealthRing';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { usePlantsStore } from '../store/plantsStore';
import { updatePlantInCloud, deletePlantFromCloud } from '../services/plantService';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { getNextWaterDate, getDaysSince, getIKImageUrl, computeHealthScore } from '../../../shared/utils/plantUtils';
import { getWaterInfo, generateWeatherAlert, generateWateringMessage } from '../../../services/reminders/reminderService';
import { getPlantCareProfile } from '../../../shared/utils/plantCareGuide';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import { getWeatherPlantAdvice } from '../../../services/weather/weatherAdvice';
import {
  scheduleWateringReminder,
  cancelPlantReminders,
  requestNotificationPermission,
  isReminderScheduled,
} from '../../../services/reminders/notificationScheduler';
import type { WeatherData } from '../../../services/weather/weatherService';
import type { PlantsStackParamList } from '../../../navigation/types';

type Route = RouteProp<PlantsStackParamList, 'PlantDetail'>;
type Nav   = StackNavigationProp<PlantsStackParamList, 'PlantDetail'>;

const { width: SW } = Dimensions.get('window');
const HERO_H = Math.round(SW * 0.88);

const HEALTH_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Healthy:           { label: 'Thriving',       color: '#6F943E', bg: 'rgba(111,148,62,0.10)' },
  'Needs Attention': { label: 'Needs attention', color: '#B07000', bg: 'rgba(176,112,0,0.10)'  },
  Critical:          { label: 'Critical',        color: '#C0392B', bg: 'rgba(192,57,43,0.08)'  },
};

function shortDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function relativeDate(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '—';
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return shortDate(d);
}

function confidenceTier(c: number): { label: string; color: string } {
  if (c >= 0.85) return { label: 'High confidence', color: '#6F943E' };
  if (c >= 0.70) return { label: 'Reasonably confident', color: '#5A8032' };
  if (c >= 0.50) return { label: 'Moderate confidence', color: '#B07000' };
  return             { label: 'Low confidence', color: '#9E9A94' };
}

// ── Screen ────────────────────────────────────────────────────────────────────

export const PlantDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { plantId } = route.params;
  const { plants, updatePlant, removePlant } = usePlantsStore();
  const { user } = useAuthStore();
  const plant = plants.find(p => p.plantId === plantId) ?? null;
  const { city: userCity } = useOnboardingStore();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [remindersOn, setRemindersOn]   = useState(plant?.remindersEnabled ?? false);
  const [reminderLoading, setReminderLoading] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const city = plant?.city || userCity;
    if (city) {
      getCurrentWeather(city).then(setWeather).catch(() => {});
    }

    if (plant) {
      isReminderScheduled(plant.plantId).then(scheduled => {
        if (scheduled !== remindersOn) setRemindersOn(scheduled);
      });
    }
  }, [plantId]);

  const handleReminderToggle = useCallback(async (value: boolean) => {
    if (!plant) return;
    setReminderLoading(true);
    try {
      if (value) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            'Notifications off',
            'Enable notifications in your device settings to get watering reminders.',
          );
          setReminderLoading(false);
          return;
        }
        await scheduleWateringReminder(plant, weather);
      } else {
        await cancelPlantReminders(plant.plantId);
      }
      updatePlant(plant.plantId, { remindersEnabled: value });
      if (user) {
        updatePlantInCloud(user.uid, plant.plantId, { remindersEnabled: value })
          .catch(() => { /* local toggle still applies; snapshot reconciles later */ });
      }
      setRemindersOn(value);
    } finally {
      setReminderLoading(false);
    }
  }, [plant, weather, updatePlant, user]);

  const handleDelete = useCallback(() => {
    if (!plant) return;
    Alert.alert(
      `Remove ${plant.nickname}?`,
      'This will remove the plant from your garden. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await cancelPlantReminders(plant.plantId);
            if (user) {
              await deletePlantFromCloud(user.uid, plant.plantId)
                .catch(() => { /* removed locally; orphan doc cleaned on next sync */ });
            }
            removePlant(plant.plantId);
            navigation.goBack();
          },
        },
      ],
    );
  }, [plant, removePlant, user, navigation]);

  if (!plant) {
    return (
      <View style={styles.errorScreen}>
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnOverlay}>
            <Text style={styles.backLabel}>← Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.errorBody}>
          <View style={styles.errorMarkWrap}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill="#6F943E" opacity={0.85} />
              <Path d="M12 3V21" stroke="#F5F1E8" strokeWidth={1.3} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={styles.errorTitle}>Plant not found</Text>
          <Text style={styles.errorSub}>It may have been removed from your garden.</Text>
        </View>
      </View>
    );
  }

  const health       = HEALTH_CONFIG[plant.healthStatus] ?? HEALTH_CONFIG['Healthy'];
  const healthScore  = computeHealthScore(plant);
  const nextWater    = getNextWaterDate(plant);
  const waterInfo    = getWaterInfo(plant);
  const rawLastWatered = plant.lastWateredAt as any;
  const lastWateredDate: Date = rawLastWatered?.toDate?.() instanceof Date
    ? rawLastWatered.toDate()
    : rawLastWatered instanceof Date ? rawLastWatered : new Date();
  const daysSinceWater = getDaysSince(lastWateredDate);
  const imageUrl     = plant.imageUrl ? getIKImageUrl(plant.imageUrl, 'tr=w-800,h-800,q-85,fo-auto') : null;
  const careProfile  = getPlantCareProfile(plant.speciesName);
  const weatherAdvice = weather ? getWeatherPlantAdvice(weather) : null;
  const weatherAlert  = weather ? generateWeatherAlert(plant, weather) : null;
  const waterMessage  = generateWateringMessage(plant, weather);
  const initial       = plant.nickname.charAt(0).toUpperCase();

  const waterStatusColor = waterInfo.status === 'overdue' ? '#C0392B'
    : waterInfo.status === 'today' ? '#B07000'
    : '#6F943E';

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { height: HERO_H }]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={400}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]}>
              <Text style={styles.heroInitial}>{initial}</Text>
            </View>
          )}

          <View style={styles.heroScrimTop} />
          <View style={styles.heroScrimBottom} />

          <SafeAreaView edges={['top']} style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backLabel}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditPlant', { plantId: plant.plantId })}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.heroContent}>
            <View style={[styles.healthPill, { backgroundColor: health.bg }]}>
              <View style={[styles.healthDot, { backgroundColor: health.color }]} />
              <Text style={[styles.healthPillText, { color: health.color }]}>{health.label}</Text>
            </View>
            <Text style={styles.heroNickname}>{plant.nickname}</Text>
            <Text style={styles.heroSpecies}>
              {plant.scientificName ?? plant.speciesName}
            </Text>
          </View>

          {/* Self-drawing health ring */}
          <View style={styles.heroRing}>
            <HealthRing progress={healthScore / 100} size={58} stroke={5} color={health.color} trackColor="rgba(255,255,255,0.28)" delay={350}>
              <Text style={styles.heroRingText}>{healthScore}</Text>
            </HealthRing>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Water message — warm, weather-reactive */}
          <View style={[styles.waterMessage, { borderLeftColor: waterStatusColor }]}>
            <Text style={[styles.waterMessageText, { color: waterStatusColor }]}>
              {waterMessage}
            </Text>
          </View>

          {/* Quick care stats */}
          <View style={styles.statsRow}>
            <StatCard
              icon="drop"
              iconColor={waterStatusColor}
              value={waterInfo.label}
              label="Next water"
              urgent={waterInfo.status === 'overdue' || waterInfo.status === 'today'}
              urgentColor={waterStatusColor}
            />
            <StatCard
              icon="clock"
              iconColor="#6F943E"
              value={daysSinceWater === 0 ? 'Today' : `${daysSinceWater}d ago`}
              label="Last watered"
            />
            <StatCard
              icon="repeat"
              iconColor="#9E9A94"
              value={plant.wateringFrequencyDays === 1 ? 'Daily' : `${plant.wateringFrequencyDays}d`}
              label="Frequency"
            />
          </View>

          {/* Today's Conditions (Phase 2) */}
          {weather && (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>TODAY'S CONDITIONS</Text>
              <View style={styles.conditionsCard}>
                <View style={styles.conditionsTop}>
                  <View>
                    <Text style={styles.conditionsTemp}>{weather.tempC}°C</Text>
                    <Text style={styles.conditionsDesc}>{weather.description}</Text>
                  </View>
                  <View style={styles.conditionsRight}>
                    <Text style={styles.conditionsStat}>{weather.humidity}%</Text>
                    <Text style={styles.conditionsStatLabel}>humidity</Text>
                  </View>
                </View>
                {weatherAlert && (
                  <Text style={styles.conditionsAlert}>{weatherAlert}</Text>
                )}
                {weatherAdvice && (
                  <View style={styles.conditionsTipsList}>
                    {weatherAdvice.tips.slice(0, 2).map((tip, i) => (
                      <View key={i} style={styles.conditionsTipRow}>
                        <Text style={styles.conditionsTipDot}>·</Text>
                        <Text style={styles.conditionsTipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Care Recommendations (Phase 2) */}
          {careProfile && (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>CARE GUIDE</Text>
              <Text style={styles.sectionTitle}>What {plant.nickname} needs</Text>
              <View style={styles.careList}>
                <CareRow icon="drop" label="Watering"  text={careProfile.water} />
                <CareRow icon="sun" label="Light"     text={careProfile.light} />
                {careProfile.humidity && (
                  <CareRow icon="humidity" label="Humidity" text={careProfile.humidity} />
                )}
                {careProfile.fertilizer && (
                  <CareRow icon="feed" label="Feeding"  text={careProfile.fertilizer} />
                )}
                {careProfile.tips.slice(0, 2).map((tip, i) => (
                  <CareRow key={i} icon="tip" label="Tip" text={tip} />
                ))}
              </View>
            </View>
          )}

          {/* Watering schedule detail */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>WATERING SCHEDULE</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Last watered" value={shortDate(plant.lastWateredAt.toDate())} />
              <Divider />
              <InfoRow
                label="Next due"
                value={waterInfo.status === 'overdue' ? 'Overdue — water now' : shortDate(nextWater)}
                valueColor={waterInfo.status === 'overdue' ? '#C0392B' : undefined}
              />
              <Divider />
              <InfoRow
                label="Schedule"
                value={`Every ${plant.wateringFrequencyDays} ${plant.wateringFrequencyDays === 1 ? 'day' : 'days'}`}
              />
            </View>
          </View>

          {/* Care Timeline (Phase 2) */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>PLANT HISTORY</Text>
            <View style={styles.timeline}>
              <TimelineRow
                dot="#6F943E"
                title="Added to garden"
                subtitle={shortDate(plant.createdAt.toDate())}
              />
              {plant.scanDate && (
                <TimelineRow
                  dot="#9E9A94"
                  title="Last scanned"
                  subtitle={relativeDate(plant.scanDate)}
                  detail={plant.scanConfidence != null
                    ? `${confidenceTier(plant.scanConfidence).label} · ${Math.round(plant.scanConfidence * 100)}%`
                    : undefined}
                  detailColor={plant.scanConfidence != null
                    ? confidenceTier(plant.scanConfidence).color
                    : undefined}
                />
              )}
              {plant.location && (
                <TimelineRow
                  dot="#DDD4C7"
                  title="Location"
                  subtitle={plant.location}
                  isLast
                />
              )}
              {!plant.location && (
                <TimelineRow
                  dot="#DDD4C7"
                  title="Identification"
                  subtitle={plant.speciesName}
                  isLast
                />
              )}
            </View>
          </View>

          {/* Reminders (Phase 3) */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>REMINDERS</Text>
            <View style={styles.infoCard}>
              <View style={styles.reminderRow}>
                <View style={styles.reminderLeft}>
                  <Text style={styles.reminderTitle}>Watering reminder</Text>
                  <Text style={styles.reminderSub}>
                    {remindersOn
                      ? `Remind me on ${shortDate(nextWater)}`
                      : 'Get notified when it\'s time to water'}
                  </Text>
                </View>
                <Switch
                  value={remindersOn}
                  onValueChange={handleReminderToggle}
                  disabled={reminderLoading}
                  trackColor={{ false: '#DDD4C7', true: 'rgba(111,148,62,0.5)' }}
                  thumbColor={remindersOn ? '#6F943E' : '#9E9A94'}
                />
              </View>
            </View>
          </View>

          {/* Notes */}
          {plant.notes ? (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>NOTES</Text>
              <View style={styles.infoCard}>
                <Text style={styles.notesText}>{plant.notes}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>NOTES</Text>
              <TouchableOpacity
                style={styles.notesEmpty}
                onPress={() => navigation.navigate('EditPlant', { plantId: plant.plantId })}
                activeOpacity={0.75}
              >
                <Text style={styles.notesEmptyText}>
                  Add a note about {plant.nickname} — care observations, special tips, anything.
                </Text>
                <Text style={styles.notesEmptyLink}>Add note →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AI Doctor CTA */}
          <TouchableOpacity
            style={styles.aiCard}
            onPress={() =>
              navigation.getParent<any>()?.navigate('Profile', { screen: 'Paywall' })
            }
            activeOpacity={0.82}
          >
            <View>
              <Text style={styles.aiCardLabel}>ASK AI DOCTOR</Text>
              <Text style={styles.aiCardTitle}>
                Get advice personalised{'\n'}for {plant.nickname}
              </Text>
            </View>
            <Text style={styles.aiCardArrow}>→</Text>
          </TouchableOpacity>

          {/* Remove plant */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            activeOpacity={0.75}
          >
            <Text style={styles.deleteBtnText}>Remove {plant.nickname} from garden</Text>
          </TouchableOpacity>

          <Text style={styles.addedDate}>
            Added {shortDate(plant.createdAt.toDate())}
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const DetailIcon: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 16 }) => {
  const p = { stroke: color, strokeWidth: 1.7, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    drop: <Path d="M12 3C12 3 5 11 5 15.5C5 19.09 8.13 22 12 22C15.87 22 19 19.09 19 15.5C19 11 12 3 12 3Z" fill={color} stroke="none" />,
    clock: <><Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" {...p} /><Path d="M12 7v5l3 2" {...p} /></>,
    repeat: <><Path d="M17 2l4 4-4 4" {...p} /><Path d="M3 11V9a4 4 0 014-4h14M7 22l-4-4 4-4" {...p} /><Path d="M21 13v2a4 4 0 01-4 4H3" {...p} /></>,
    sun: <><Path d="M12 17a5 5 0 100-10 5 5 0 000 10z" {...p} /><Path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" {...p} /></>,
    humidity: <><Path d="M12 3C12 3 6 9 6 14a6 6 0 0012 0c0-5-6-11-6-11z" {...p} /></>,
    feed: <Path d="M11 3C11 3 5 6 5 12C5 15.87 7.91 19 11 19C11 19 11 11 11 3ZM13 21C13 21 19 18 19 12C19 8.13 16.09 5 13 5" {...p} />,
    tip: <Path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" {...p} />,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{paths[name] ?? paths.tip}</Svg>;
};

const StatCard: React.FC<{
  icon: string; iconColor: string; value: string; label: string;
  urgent?: boolean; urgentColor?: string;
}> = ({ icon, iconColor, value, label, urgent, urgentColor }) => (
  <View style={styles.statCard}>
    <View style={styles.statIconWrap}><DetailIcon name={icon} color={iconColor} /></View>
    <Text style={[styles.statValue, urgent && { color: urgentColor }]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const CareRow: React.FC<{ icon: string; label: string; text: string }> = ({ icon, label, text }) => (
  <View style={styles.careRow}>
    <View style={styles.careRowIconWrap}><DetailIcon name={icon} color="#6F943E" size={15} /></View>
    <View style={styles.careRowContent}>
      <Text style={styles.careRowLabel}>{label}</Text>
      <Text style={styles.careRowText}>{text}</Text>
    </View>
  </View>
);

const InfoRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({
  label, value, valueColor,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoKey}>{label}</Text>
    <Text style={[styles.infoVal, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const TimelineRow: React.FC<{
  dot: string; title: string; subtitle: string;
  detail?: string; detailColor?: string; isLast?: boolean;
}> = ({ dot, title, subtitle, detail, detailColor, isLast }) => (
  <View style={[styles.timelineRow, isLast && styles.timelineRowLast]}>
    <View style={styles.timelineDotWrap}>
      <View style={[styles.timelineDot, { backgroundColor: dot }]} />
      {!isLast && <View style={styles.timelineLine} />}
    </View>
    <View style={styles.timelineContent}>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Text style={styles.timelineSub}>{subtitle}</Text>
      {detail && (
        <Text style={[styles.timelineDetail, { color: detailColor ?? '#9E9A94' }]}>
          {detail}
        </Text>
      )}
    </View>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1E8' },
  scrollContent: { paddingBottom: 60 },

  // Error
  errorScreen: { flex: 1, backgroundColor: '#F5F1E8' },
  backBtnOverlay: { margin: 20, alignSelf: 'flex-start' },
  errorBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorMarkWrap: { width: 64, height: 64, borderRadius: 24, backgroundColor: 'rgba(111,148,62,0.10)', alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontFamily: 'Nunito-Bold', fontSize: 18, color: '#111111' },
  errorSub: { fontFamily: 'Nunito-Regular', fontSize: 14, color: '#6B6B5E', textAlign: 'center' },

  // Hero
  hero: { width: SW, backgroundColor: '#1A2416' },
  heroPlaceholder: {
    backgroundColor: '#1A2416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitial: {
    fontFamily: 'Cormorant-SemiBoldItalic',
    fontSize: 96,
    color: 'rgba(255,255,255,0.12)',
  },
  heroScrimTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 130, backgroundColor: 'rgba(0,0,0,0.32)',
  },
  heroScrimBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: HERO_H * 0.55, backgroundColor: 'rgba(0,0,0,0.60)',
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 4,
  },
  backBtn: { padding: 8 },
  backLabel: { fontFamily: 'Nunito-SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  editBtnText: { fontFamily: 'Nunito-SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 22, paddingBottom: 26, gap: 4,
  },
  heroRing: { position: 'absolute', right: 22, bottom: 28 },
  heroRingText: { fontFamily: 'Nunito-ExtraBold', fontSize: 16, color: '#FFFFFF' },
  healthPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, gap: 6, marginBottom: 4,
  },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthPillText: { fontFamily: 'Nunito-SemiBold', fontSize: 12 },
  heroNickname: {
    fontFamily: 'Cormorant-SemiBoldItalic',
    fontSize: 42, color: '#FFFFFF', lineHeight: 46,
  },
  heroSpecies: {
    fontFamily: 'Nunito-Regular', fontSize: 13,
    color: 'rgba(255,255,255,0.55)', fontStyle: 'italic',
  },

  // Body
  body: { paddingHorizontal: 20, paddingTop: 24, gap: 24 },

  // Water message bar
  waterMessage: {
    backgroundColor: '#EEE7DA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 3,
  },
  waterMessageText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    lineHeight: 21,
  },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#EEE7DA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD4C7',
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: { marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
  statValue: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 14,
    color: '#111111',
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'Nunito-Regular',
    fontSize: 9,
    color: '#9E9A94',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Sections
  section: { gap: 10 },
  sectionEyebrow: {
    fontSize: 10, fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94', letterSpacing: 2, textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: 'Cormorant-SemiBold', fontSize: 24, color: '#111111', lineHeight: 28,
  },

  // Today's Conditions
  conditionsCard: {
    backgroundColor: '#EEE7DA', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#DDD4C7', gap: 12,
  },
  conditionsTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  conditionsTemp: {
    fontFamily: 'Cormorant-SemiBold', fontSize: 32, color: '#111111',
  },
  conditionsDesc: {
    fontFamily: 'Nunito-Regular', fontSize: 13, color: '#6B6B5E',
    textTransform: 'capitalize', marginTop: 2,
  },
  conditionsRight: { alignItems: 'flex-end', gap: 2 },
  conditionsStat: {
    fontFamily: 'Nunito-ExtraBold', fontSize: 22, color: '#111111',
  },
  conditionsStatLabel: {
    fontFamily: 'Nunito-Regular', fontSize: 11, color: '#9E9A94',
  },
  conditionsAlert: {
    fontFamily: 'Nunito-SemiBold', fontSize: 13, color: '#B07000',
    lineHeight: 19, paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DDD4C7',
  },
  conditionsTipsList: { gap: 6 },
  conditionsTipRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  conditionsTipDot: {
    fontFamily: 'Nunito-Bold', fontSize: 14, color: '#6F943E', lineHeight: 20,
  },
  conditionsTipText: {
    fontFamily: 'Nunito-Regular', fontSize: 13, color: '#6B6B5E', lineHeight: 20, flex: 1,
  },

  // Care guide list
  careList: {
    backgroundColor: '#EEE7DA', borderRadius: 18,
    borderWidth: 1, borderColor: '#DDD4C7',
    overflow: 'hidden',
  },
  careRow: {
    flexDirection: 'row', gap: 12, padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DDD4C7',
    alignItems: 'flex-start',
  },
  careRowIconWrap: { marginTop: 1, width: 18, alignItems: 'center' },
  careRowContent: { flex: 1, gap: 2 },
  careRowLabel: {
    fontFamily: 'Nunito-SemiBold', fontSize: 10, color: '#9E9A94',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  careRowText: {
    fontFamily: 'Nunito-Regular', fontSize: 13, color: '#111111', lineHeight: 19,
  },

  // Info card (watering details, reminder)
  infoCard: {
    backgroundColor: '#EEE7DA', borderRadius: 18,
    borderWidth: 1, borderColor: '#DDD4C7',
    paddingHorizontal: 18, paddingVertical: 14, gap: 10,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoKey: { fontFamily: 'Nunito-Regular', fontSize: 14, color: '#6B6B5E' },
  infoVal: {
    fontFamily: 'Nunito-SemiBold', fontSize: 14, color: '#111111',
    textAlign: 'right', flexShrink: 1, marginLeft: 8,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#DDD4C7' },

  // Timeline (Plant History)
  timeline: {
    backgroundColor: '#EEE7DA', borderRadius: 18,
    borderWidth: 1, borderColor: '#DDD4C7',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 4,
  },
  timelineRow: {
    flexDirection: 'row', gap: 14, paddingBottom: 16,
  },
  timelineRowLast: { paddingBottom: 10 },
  timelineDotWrap: { alignItems: 'center', paddingTop: 3 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { width: 1, flex: 1, backgroundColor: '#DDD4C7', marginTop: 4 },
  timelineContent: { flex: 1, gap: 2, paddingBottom: 2 },
  timelineTitle: { fontFamily: 'Nunito-SemiBold', fontSize: 13, color: '#111111' },
  timelineSub: { fontFamily: 'Nunito-Regular', fontSize: 12, color: '#6B6B5E' },
  timelineDetail: { fontFamily: 'Nunito-SemiBold', fontSize: 11 },

  // Reminder
  reminderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  reminderLeft: { flex: 1, gap: 3 },
  reminderTitle: { fontFamily: 'Nunito-SemiBold', fontSize: 14, color: '#111111' },
  reminderSub: { fontFamily: 'Nunito-Regular', fontSize: 12, color: '#6B6B5E' },

  // Notes
  notesText: { fontFamily: 'Nunito-Regular', fontSize: 14, color: '#111111', lineHeight: 22 },
  notesEmpty: {
    backgroundColor: '#EEE7DA', borderRadius: 18,
    borderWidth: 1, borderColor: '#DDD4C7',
    paddingHorizontal: 18, paddingVertical: 16, gap: 8,
  },
  notesEmptyText: {
    fontFamily: 'Nunito-Regular', fontSize: 13, color: '#9E9A94', lineHeight: 20,
  },
  notesEmptyLink: { fontFamily: 'Nunito-SemiBold', fontSize: 13, color: '#6F943E' },

  // AI Doctor CTA
  aiCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1A2416', borderRadius: 20, padding: 20,
  },
  aiCardLabel: {
    fontSize: 9, fontFamily: 'Nunito-SemiBold', color: '#6F943E',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
  },
  aiCardTitle: {
    fontFamily: 'Cormorant-SemiBold', fontSize: 20, color: '#FFFFFF', lineHeight: 24,
  },
  aiCardArrow: {
    color: 'rgba(255,255,255,0.4)', fontSize: 20, fontFamily: 'Nunito-Regular',
  },

  // Delete
  deleteBtn: {
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(192,57,43,0.25)',
    borderRadius: 14, backgroundColor: 'rgba(192,57,43,0.04)',
  },
  deleteBtnText: {
    fontFamily: 'Nunito-SemiBold', fontSize: 14, color: '#C0392B',
  },
  addedDate: {
    fontFamily: 'Nunito-Regular', fontSize: 12, color: '#B0ACA6', textAlign: 'center',
    paddingBottom: 8,
  },
});
