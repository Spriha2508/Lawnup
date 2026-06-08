import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScanStore } from '../store/scanStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useAuthStore } from '../../auth/store/authStore';
import { PlantResultHero } from '../components/PlantResultHero';
import { DiseaseCard } from '../components/DiseaseCard';
import { SuggestedActionCard } from '../components/SuggestedActionCard';
import { SavePlantModal } from '../components/SavePlantModal';
// colors referenced inline — cream/olive palette
import { logger } from '../../../shared/utils/logger';
import { track } from '../../../services/analytics/posthog';
import type { ScanStackParamList } from '../../../navigation/types';
import type { UserPlantDoc } from '../../../types/firestore.types';

type Nav = StackNavigationProp<ScanStackParamList, 'ScanResult'>;
type Route = RouteProp<ScanStackParamList, 'ScanResult'>;

// Helper to create a mock Timestamp from a Date
const mockTs = (date: Date) => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0,
  toDate: () => date,
});

export const ScanResultScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { scanResult } = useScanStore();
  const { addPlant } = usePlantsStore();
  const { user } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNickname, setSavedNickname] = useState<string | null>(null);

  // Entrance animations
  const scrollFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(60)).current;

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
    }
  }, [scrollFade, ctaSlide, scanResult]);

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
        lastWateredAt: mockTs(now),
        nextWaterAt: mockTs(nextWater),
        addedFromScanId: scanResult.scanId,
        createdAt: mockTs(now),
        updatedAt: mockTs(now),
      };

      addPlant(plant);
      setSavedNickname(nickname);
      setModalVisible(false);

      logger.scan.nicknamed(scanResult.commonName, nickname);
      track('plant_saved_from_scan', {
        species: scanResult.commonName,
        nickname,
        isHealthy: scanResult.isHealthy,
      });

      // Navigate to the plant detail in Plants tab
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

  // If somehow the result isn't in store (e.g. cold start)
  if (!scanResult) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorEmoji}>🌿</Text>
        <Text style={styles.errorTitle}>No scan result found</Text>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => navigation.navigate('ScanLanding')}
        >
          <Text style={styles.errorBtnText}>Scan again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasDiseases = !scanResult.isHealthy && scanResult.diseases.length > 0;

  return (
    <View style={styles.screen}>
      {/* ── Back button (floating over hero) ── */}
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
        <Text style={styles.reScanText}>Rescan</Text>
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ opacity: scrollFade }}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        {/* Hero image */}
        <PlantResultHero
          imageUri={scanResult.imageUri}
          commonName={scanResult.commonName}
          scientificName={scanResult.scientificName}
          confidence={scanResult.confidence}
          isHealthy={scanResult.isHealthy}
        />

        {/* ── Body content ── */}
        <View style={styles.body}>
          {/* Already saved confirmation */}
          {savedNickname && (
            <View style={styles.savedBanner}>
              <Text style={styles.savedBannerText}>
                ✅  {savedNickname} added to My Plants!
              </Text>
            </View>
          )}

          {/* Disease section */}
          {hasDiseases && (
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>DIAGNOSIS</Text>
              <Text style={styles.sectionTitle}>
                {scanResult.diseases.length === 1 ? 'One concern found' : `${scanResult.diseases.length} concerns found`}
              </Text>
              <Text style={styles.recoveryNote}>
                With the right care, your plant can fully recover.
              </Text>
              {scanResult.diseases.map((d, i) => (
                <DiseaseCard key={d.name} disease={d} index={i} />
              ))}
            </View>
          )}

          {/* Healthy badge */}
          {!hasDiseases && (
            <View style={styles.healthyBanner}>
              <View style={styles.healthyIconWrap}>
                <Text style={styles.healthyIcon}>✦</Text>
              </View>
              <View style={styles.healthyTextWrap}>
                <Text style={styles.healthyTitle}>Your plant is thriving</Text>
                <Text style={styles.healthySubtitle}>
                  No concerns found. Your care is clearly working.
                </Text>
              </View>
            </View>
          )}

          {/* Suggested actions */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>CARE GUIDE</Text>
            <Text style={styles.sectionTitle}>What to do next</Text>
            {scanResult.suggestedActions.map((action, i) => (
              <SuggestedActionCard key={i} action={action} index={i} />
            ))}
          </View>

          {/* AI Doctor CTA */}
          <TouchableOpacity
            style={styles.aiDoctorCard}
            onPress={() =>
              navigation.getParent<any>()?.navigate('AiDoctor', {
                screen: 'Chat',
                params: { plantId: undefined },
              })
            }
            activeOpacity={0.82}
          >
            <View style={styles.aiDoctorLeft}>
              <Text style={styles.aiDoctorLabel}>ASK AI DOCTOR</Text>
              <Text style={styles.aiDoctorTitle}>
                Get personalised advice for {scanResult.commonName}
              </Text>
            </View>
            <Text style={styles.aiDoctorArrow}>→</Text>
          </TouchableOpacity>
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
            <Text style={styles.saveBtnText}>Save this plant  →</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F1E8',
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
  body: {
    padding: 20,
    gap: 28,
  },
  savedBanner: {
    backgroundColor: 'rgba(111,148,62,0.10)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(111,148,62,0.25)',
  },
  savedBannerText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: '#6F943E',
    textAlign: 'center',
  },
  section: {
    gap: 10,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#9E9A94',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: 'Cormorant-SemiBold',
    fontSize: 26,
    color: '#111111',
    lineHeight: 30,
    marginBottom: 4,
  },
  recoveryNote: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: '#6F943E',
    marginBottom: 10,
    lineHeight: 18,
  },
  healthyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#EEE7DA',
    borderRadius: 16,
    padding: 16,
  },
  healthyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(111,148,62,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  healthyIcon: {
    fontSize: 20,
    color: '#6F943E',
  },
  healthyTextWrap: { flex: 1 },
  healthyTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    color: '#111111',
    marginBottom: 2,
  },
  healthySubtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: '#6B6B5E',
    lineHeight: 19,
  },
  aiDoctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A2416',
    borderRadius: 20,
    padding: 20,
  },
  aiDoctorLeft: {
    flex: 1,
    gap: 6,
  },
  aiDoctorLabel: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  aiDoctorTitle: {
    fontFamily: 'Cormorant-SemiBold',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 24,
    paddingRight: 12,
  },
  aiDoctorArrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
    fontFamily: 'Nunito-Regular',
    flexShrink: 0,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(245,241,232,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,196,188,0.6)',
  },
  saveBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.2,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  errorEmoji: {
    fontSize: 56,
  },
  errorTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#111111',
    textAlign: 'center',
  },
  errorBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  errorBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
    color: '#fff',
  },
});
