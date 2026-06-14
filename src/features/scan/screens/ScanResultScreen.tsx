import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timestamp } from 'firebase/firestore';
import { useScanStore } from '../store/scanStore';
import { useScanHistoryStore } from '../store/scanHistoryStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { savePlantToCloud } from '../../my-plants/services/plantService';
import { useAuthStore } from '../../auth/store/authStore';
import { useOnboardingStore } from '../../onboarding/store/onboardingStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { UpgradePrompt } from '../../subscription/components/UpgradePrompt';
import { LeafCelebration } from '@shared/components/motion/LeafCelebration';
import Svg, { Path } from 'react-native-svg';
import { PlantResultHero } from '../components/PlantResultHero';
import { AICompanionSummary } from '../components/AICompanionSummary';
import { DiseaseCard } from '../components/DiseaseCard';
import { SuggestedActionCard } from '../components/SuggestedActionCard';
import { SavePlantModal } from '../components/SavePlantModal';
import { WeatherAdviceCard } from '../components/WeatherAdviceCard';
import { AlternativeSuggestionsCard } from '../components/AlternativeSuggestionsCard';
import { logger } from '../../../shared/utils/logger';
import { track } from '../../../services/analytics/posthog';
import { getCurrentWeather } from '../../../services/weather/weatherService';
import type { WeatherData } from '../../../services/weather/weatherService';
import type { ScanStackParamList } from '../../../navigation/types';
import type { UserPlantDoc } from '../../../types/firestore.types';
import { theme } from '@constants/designSystem';
import { openPaywall } from '@navigation/openPaywall';

const C = theme.color;

type Nav = StackNavigationProp<ScanStackParamList, 'ScanResult'>;
type Route = RouteProp<ScanStackParamList, 'ScanResult'>;

// Real Firestore Timestamp — structurally satisfies the local Timestamp type
const fsTs = (date: Date) => Timestamp.fromDate(date);

function getConfidenceMessage(confidence: number, name: string): string {
  if (confidence >= 0.85) return `Identification looks accurate. This is likely a ${name}.`;
  if (confidence >= 0.70) return `This is reasonably likely to be a ${name}. Scan a leaf from a different angle to confirm.`;
  if (confidence >= 0.50) return `This may be a ${name} — but the result needs confirmation. Try a closer photo in good, natural light.`;
  return `The AI couldn't identify this confidently. A well-lit, close-up photo of a single leaf on a plain background will give much better results.`;
}

const RESCAN_TIPS = [
  'Scan a single leaf — not the whole plant',
  'Move closer so the leaf fills the frame',
  'Use natural daylight — avoid artificial light',
  'Hold steady to avoid blur',
  'Isolate one plant, reduce background clutter',
];

function getWeatherContext(weather: WeatherData, plantName: string, city?: string): string | null {
  const place = city ?? 'Your area';
  if (weather.isRaining) {
    return `Rain in the forecast — skip watering ${plantName} for a day or two.`;
  }
  if (weather.isHot && weather.humidity > 65) {
    return `${place} is hot and humid today — watch for fungal spots on your ${plantName}.`;
  }
  if (weather.isHot) {
    return `${place} heat may dry soil faster than usual — check moisture more often.`;
  }
  if (weather.isHumid) {
    return `High humidity today — ease up on watering to protect the roots.`;
  }
  if (weather.tempC < 15) {
    return `Cool weather slows plant growth — reduce watering frequency until it warms up.`;
  }
  if (weather.humidity < 30) {
    return `The air is very dry today — your ${plantName} may appreciate a light misting.`;
  }
  return null;
}

const TABS = ['CARE', 'HEALTH', 'INFO'] as const;
type TabId = 0 | 1 | 2;

export const ScanResultScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { scanResult } = useScanStore();
  const { addPlant } = usePlantsStore();
  const { user } = useAuthStore();
  const { city } = useOnboardingStore();

  const scansRemainingThisWeek = useSubscriptionStore(s => s.scansRemainingThisWeek);
  const isPremiumActive        = useSubscriptionStore(s => s.isPremiumActive);
  const remaining = scansRemainingThisWeek();
  const isPremium = isPremiumActive();

  const [activeTab, setActiveTab] = useState<TabId>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [savedPlantId, setSavedPlantId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const scrollFade = useRef(new Animated.Value(0)).current;
  const ctaSlide   = useRef(new Animated.Value(60)).current;

  const scanId = scanResult?.scanId;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scrollFade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(ctaSlide, { toValue: 0, damping: 16, stiffness: 120, useNativeDriver: true }),
    ]).start();

    if (scanResult) {
      track('scan_result_viewed', {
        species: scanResult.commonName,
        confidence: scanResult.confidence,
        isHealthy: scanResult.isHealthy,
        diseaseCount: scanResult.diseases.length,
      });
      // Record into scan history (persisted, on-device)
      useScanHistoryStore.getState().addEntry({
        scanId: scanResult.scanId,
        imageUri: scanResult.imageUri,
        commonName: scanResult.commonName,
        scientificName: scanResult.scientificName,
        confidence: scanResult.confidence,
        isHealthy: scanResult.isHealthy,
        date: scanResult.scanDate ?? new Date().toISOString(),
      });
    }

    const resolvedCity = scanResult?.city || city;
    if (resolvedCity) {
      getCurrentWeather(resolvedCity).then(setWeather).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, city]);

  const handleSavePlant = useCallback(async (nickname: string) => {
    if (!scanResult || !user) return;
    setIsSaving(true);

    try {
      const now = new Date();
      const nextWater = new Date(now);
      nextWater.setDate(nextWater.getDate() + 7);

      const plantId = `plant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const plant: UserPlantDoc = {
        plantId,
        userId: user.uid,
        nickname,
        speciesName: scanResult.commonName,
        scientificName: scanResult.scientificName,
        imageUrl: scanResult.imageUri,
        healthStatus: scanResult.isHealthy ? 'Healthy' : 'Needs Attention',
        wateringFrequencyDays: 7,
        lastWateredAt: fsTs(now),
        nextWaterAt: fsTs(nextWater),
        addedFromScanId: scanResult.scanId,
        scanDate: scanResult.scanDate,
        scanConfidence: scanResult.confidence,
        city: scanResult.city,
        createdAt: fsTs(now),
        updatedAt: fsTs(now),
      };

      // Persist first (survives restart); the live snapshot keeps the store in
      // sync, but addPlant makes the plant available for immediate navigation.
      await savePlantToCloud(user.uid, plant);
      addPlant(plant);
      setSavedNickname(nickname);
      setSavedPlantId(plantId);
      setModalVisible(false);

      logger.scan.nicknamed(scanResult.commonName, nickname);
      track('plant_saved_from_scan', {
        species: scanResult.commonName,
        nickname,
        isHealthy: scanResult.isHealthy,
      });

      const rem = useSubscriptionStore.getState().scansRemainingThisWeek();
      if (!useSubscriptionStore.getState().isPremiumActive() && rem === 0) {
        setUpgradeVisible(true);
        return;
      }

      navigation.getParent<any>()?.navigate('Plants', {
        screen: 'PlantDetail',
        params: { plantId },
      });
    } catch (err) {
      logger.app.error('Failed to save plant', err);
    } finally {
      setIsSaving(false);
    }
  }, [scanResult, user, addPlant, navigation]);

  if (!scanResult) {
    return (
      <View style={styles.errorScreen}>
        <View style={styles.errorMarkWrap}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill={C.primary} opacity={0.9} />
            <Path d="M12 3V21" stroke={C.canvas} strokeWidth={1.3} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={styles.errorTitle}>Result not found</Text>
        <Text style={styles.errorSub}>Let's try again with a closer photo.</Text>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => navigation.navigate('ScanLanding')}
        >
          <Text style={styles.errorBtnText}>Identify a plant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived display flags ─────────────────────────────────────────────────
  const conf = scanResult.confidence;
  const showConfidenceNote = conf < 0.85;
  const showRescanTips     = conf < 0.70;
  const hasDiseases        = !scanResult.isHealthy && scanResult.diseases.length > 0 && conf >= 0.60;
  const diseaseSectionSoft = conf < 0.75;
  const hasAlternatives    = (scanResult.alternatives?.length ?? 0) > 0 && conf < 0.90;
  const weatherContext     = weather ? getWeatherContext(weather, scanResult.commonName, city || scanResult.city) : null;

  return (
    <View style={styles.screen}>
      {/* ── Floating back button ── */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.navigate('ScanLanding')}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        activeOpacity={0.8}
      >
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* ── Scan again shortcut ── */}
      <TouchableOpacity
        style={[styles.reScanBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.navigate('Camera')}
        activeOpacity={0.8}
      >
        <Text style={styles.reScanText}>Scan again</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity: scrollFade }}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        stickyHeaderIndices={[2]}
      >
        {/* [0] Hero */}
        <PlantResultHero
          imageUri={scanResult.imageUri}
          commonName={scanResult.commonName}
          scientificName={scanResult.scientificName}
          indianAlternate={scanResult.indianAlternate}
          confidence={scanResult.confidence}
          isHealthy={scanResult.isHealthy}
        />

        {/* [1] AI companion summary — the emotional read */}
        <AICompanionSummary
          name={scanResult.commonName}
          isHealthy={scanResult.isHealthy}
          confidence={scanResult.confidence}
          diseases={scanResult.diseases}
        />

        {/* [2] Tab bar — sticky on scroll */}
        <View style={styles.tabBar}>
          {/* Global banners inside sticky bar */}
          {savedNickname && (
            <View style={styles.savedBanner}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <Path d="M5 12.5L10 17.5L19 7" stroke={C.healthyFg} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.savedBannerText}>{savedNickname} added to your garden</Text>
            </View>
          )}
          {!isPremium && remaining !== -1 && remaining <= 1 && (
            <Pressable
              style={styles.scanCountBanner}
              onPress={() => openPaywall(navigation)}
            >
              <Text style={styles.scanCountText}>
                {remaining === 0
                  ? 'No free scans left this week — upgrade for unlimited'
                  : `${remaining} free scan left this week  ·  Upgrade for unlimited`}
              </Text>
            </Pressable>
          )}
          {/* Tab row */}
          <View style={styles.tabRow}>
            {TABS.map((label, idx) => (
              <TouchableOpacity
                key={label}
                style={[styles.tab, activeTab === idx && styles.tabActive]}
                onPress={() => setActiveTab(idx as TabId)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* [2] Tab body */}
        <View style={styles.body}>

          {/* ───────────── CARE TAB ───────────── */}
          {activeTab === 0 && (
            <View style={styles.tabContent}>
              <View style={styles.section}>
                <Text style={styles.sectionEyebrow}>CARE GUIDE</Text>
                <Text style={styles.sectionTitle}>Your next steps</Text>
                {scanResult.suggestedActions.map((action, i) => (
                  <SuggestedActionCard key={i} action={action} index={i} />
                ))}
              </View>

              {/* AI Doctor CTA */}
              <TouchableOpacity
                style={styles.aiDoctorCard}
                onPress={() =>
                  openPaywall(navigation)
                }
                activeOpacity={0.82}
              >
                <View style={styles.aiDoctorLeft}>
                  <Text style={styles.aiDoctorLabel}>ASK AI DOCTOR</Text>
                  <Text style={styles.aiDoctorTitle}>
                    Get personalised care advice for {scanResult.commonName}
                  </Text>
                </View>
                <Text style={styles.aiDoctorArrow}>→</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ───────────── HEALTH TAB ───────────── */}
          {activeTab === 1 && (
            <View style={styles.tabContent}>
              {/* Confidence note */}
              {showConfidenceNote && (
                <View style={[
                  styles.confidenceBanner,
                  conf >= 0.70 ? styles.confidenceBannerAmber : styles.confidenceBannerMuted,
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    conf >= 0.70 ? styles.confidenceTextAmber : styles.confidenceTextMuted,
                  ]}>
                    {getConfidenceMessage(conf, scanResult.commonName)}
                  </Text>

                  {showRescanTips && (
                    <View style={styles.rescanTips}>
                      <Text style={styles.rescanTipsLabel}>For a better result, try:</Text>
                      {RESCAN_TIPS.slice(0, 3).map((tip, i) => (
                        <View key={i} style={styles.rescanTipRow}>
                          <Text style={styles.rescanTipDot}>·</Text>
                          <Text style={styles.rescanTipText}>{tip}</Text>
                        </View>
                      ))}
                      <TouchableOpacity
                        style={styles.refinementCTA}
                        onPress={() => navigation.navigate('Camera')}
                        activeOpacity={0.82}
                      >
                        <Text style={styles.refinementCTAText}>Try a closer photo  →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Disease section */}
              {hasDiseases && (
                <View style={styles.section}>
                  <Text style={styles.sectionEyebrow}>PLANT HEALTH</Text>
                  <Text style={styles.sectionTitle}>
                    {diseaseSectionSoft
                      ? `Possible ${scanResult.diseases.length === 1 ? 'concern' : 'concerns'} spotted`
                      : `${scanResult.diseases.length === 1 ? 'One concern' : `${scanResult.diseases.length} concerns`} found`}
                  </Text>
                  {diseaseSectionSoft && (
                    <Text style={styles.recoveryNote}>
                      These observations are based on limited scan data — rescan in better light to confirm.
                    </Text>
                  )}
                  {!diseaseSectionSoft && (
                    <Text style={styles.recoveryNote}>
                      With the right care, your plant can fully recover.
                    </Text>
                  )}
                  {scanResult.diseases.map((d, i) => (
                    <DiseaseCard key={d.name} disease={d} index={i} />
                  ))}
                </View>
              )}

              {/* Health assessment skipped — low confidence */}
              {!scanResult.isHealthy && scanResult.diseases.length > 0 && conf < 0.60 && (
                <View style={styles.healthyBanner}>
                  <View style={styles.healthyIconWrap}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 8V13M12 16.5V16.6" stroke={C.primary} strokeWidth={2} strokeLinecap="round" />
                      <Path d="M12 3L21 19H3L12 3Z" stroke={C.primary} strokeWidth={1.6} strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <View style={styles.healthyTextWrap}>
                    <Text style={styles.healthyTitle}>Health assessment skipped</Text>
                    <Text style={styles.healthySubtitle}>
                      Scan confidence is too low to give reliable health advice. Try a clearer photo.
                    </Text>
                  </View>
                </View>
              )}

              {/* Healthy badge */}
              {!hasDiseases && scanResult.isHealthy && (
                <View style={styles.healthyBanner}>
                  <View style={styles.healthyIconWrap}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12.5L10 17.5L19 7" stroke={C.healthyFg} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <View style={styles.healthyTextWrap}>
                    <Text style={styles.healthyTitle}>Looking healthy</Text>
                    <Text style={styles.healthySubtitle}>
                      No visible disease indicators — keep up the good care.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ───────────── INFO TAB ───────────── */}
          {activeTab === 2 && (
            <View style={styles.tabContent}>
              {/* Weather context */}
              {weatherContext && (
                <View style={styles.weatherContext}>
                  <Text style={styles.weatherContextEyebrow}>TODAY'S CONDITIONS</Text>
                  <Text style={styles.weatherContextText}>{weatherContext}</Text>
                </View>
              )}

              {weather && !weatherContext && (
                <View style={styles.section}>
                  <Text style={styles.sectionEyebrow}>WEATHER IMPACT TODAY</Text>
                  <WeatherAdviceCard weather={weather} />
                </View>
              )}

              {/* Alternative matches */}
              {hasAlternatives && (
                <AlternativeSuggestionsCard
                  topName={scanResult.commonName}
                  topConfidence={scanResult.confidence}
                  alternatives={scanResult.alternatives!}
                />
              )}

              {/* Scan meta */}
              <View style={styles.scanMeta}>
                <Text style={styles.scanMetaEyebrow}>IDENTIFICATION DETAILS</Text>
                <View style={styles.scanMetaRow}>
                  <Text style={styles.scanMetaKey}>Scientific name</Text>
                  <Text style={styles.scanMetaValue}>{scanResult.scientificName}</Text>
                </View>
                <View style={styles.scanMetaRow}>
                  <Text style={styles.scanMetaKey}>Confidence</Text>
                  <Text style={styles.scanMetaValue}>{Math.round(conf * 100)}%</Text>
                </View>
                {scanResult.indianAlternate && (
                  <View style={styles.scanMetaRow}>
                    <Text style={styles.scanMetaKey}>Local name</Text>
                    <Text style={styles.scanMetaValue}>{scanResult.indianAlternate}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

        </View>
      </Animated.ScrollView>

      {/* ── Sticky bottom CTA ── */}
      {!savedNickname && (
        <Animated.View
          style={[
            styles.ctaContainer,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY: ctaSlide }] },
          ]}
        >
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.88}
          >
            <Text style={styles.saveBtnText}>Add to my garden  →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Save plant modal ── */}
      <SavePlantModal
        visible={modalVisible}
        scanResult={scanResult}
        onSave={handleSavePlant}
        onDismiss={() => setModalVisible(false)}
        isSaving={isSaving}
      />

      {/* ── Upgrade prompt ── */}
      <UpgradePrompt
        visible={upgradeVisible}
        context="after_save"
        onUpgrade={() => {
          setUpgradeVisible(false);
          openPaywall(navigation);
        }}
        onDismiss={() => {
          setUpgradeVisible(false);
          if (savedPlantId) {
            navigation.getParent<any>()?.navigate('Plants', {
              screen: 'PlantDetail',
              params: { plantId: savedPlantId },
            });
          }
        }}
      />

      {/* Scan-success celebration — a leaf & blossom burst on a real identification */}
      {conf >= 0.5 && <LeafCelebration originY={insets.top + 90} />}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.canvas,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    marginTop: -1,
  },
  reScanBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  reScanText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },

  // Tab bar — sticky header
  tabBar: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 0,
    gap: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: C.primary,
  },
  tabText: {
    fontSize: 11,
    fontFamily: 'Nunito-Bold',
    color: C.textMuted,
    letterSpacing: 1.8,
  },
  tabTextActive: {
    color: C.textPrimary,
    letterSpacing: 1.8,
  },

  // Global banners (inside sticky tabBar)
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.healthyBg,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: C.healthyFg,
  },
  savedBannerText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: C.healthyFg,
    textAlign: 'center',
  },
  scanCountBanner: {
    backgroundColor: C.card,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  scanCountText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
  },

  // Body
  body: {
    paddingTop: 8,
  },
  tabContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 28,
  },

  // Confidence banner
  confidenceBanner: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  confidenceBannerAmber: {
    backgroundColor: C.waterBg,
    borderColor: C.waterFg,
  },
  confidenceBannerMuted: {
    backgroundColor: C.card,
    borderColor: C.border,
  },
  confidenceText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  confidenceTextAmber: { color: C.waterFg },
  confidenceTextMuted:  { color: C.textSecondary },

  // Re-scan tips
  rescanTips: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.divider,
  },
  rescanTipsLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rescanTipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  rescanTipDot: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: C.primary,
    lineHeight: 20,
  },
  rescanTipText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  refinementCTA: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: C.primaryWash,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.primary,
  },
  refinementCTAText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: C.primary,
  },

  // Weather context
  weatherContext: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  weatherContextEyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  weatherContextText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 21,
  },

  // Sections
  section: { gap: 12 },
  sectionEyebrow: {
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    color: C.textMuted,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Jakarta-SemiBoldItalic',
    fontSize: 32,
    color: C.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  recoveryNote: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: C.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },

  // Health banner
  healthyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
  },
  healthyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  healthyIcon: { fontSize: 20, color: C.healthyFg },
  healthyTextWrap: { flex: 1 },
  healthyTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    color: C.textPrimary,
    marginBottom: 2,
  },
  healthySubtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 19,
  },

  // AI Doctor CTA
  aiDoctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: C.primary,
  },
  aiDoctorLeft: { flex: 1, gap: 8 },
  aiDoctorLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-Bold',
    color: C.primary,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  aiDoctorTitle: {
    fontFamily: 'Jakarta-SemiBoldItalic',
    fontSize: 24,
    color: C.textPrimary,
    lineHeight: 28,
    letterSpacing: -0.2,
    paddingRight: 14,
  },
  aiDoctorArrow: {
    color: C.textMuted,
    fontSize: 22,
    fontFamily: 'Nunito-Regular',
    flexShrink: 0,
  },

  // Scan meta (INFO tab)
  scanMeta: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  scanMetaEyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  scanMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  scanMetaKey: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: C.textMuted,
  },
  scanMetaValue: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: C.textPrimary,
    flex: 1,
    textAlign: 'right',
  },

  // Sticky bottom CTA
  ctaContainer: {
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
  saveBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: C.onPrimary,
    letterSpacing: 0.2,
  },

  // Error screen
  errorScreen: {
    flex: 1,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  errorMarkWrap: {
    width: 72, height: 72, borderRadius: 26,
    backgroundColor: C.primaryWash,
    alignItems: 'center', justifyContent: 'center',
  },
  errorTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: C.textPrimary,
    textAlign: 'center',
  },
  errorSub: {
    fontFamily: 'Nunito-Regular',
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
  },
  errorBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  errorBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
    color: C.onPrimary,
  },
});
