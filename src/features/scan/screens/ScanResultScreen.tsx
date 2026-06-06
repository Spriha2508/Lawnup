import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScanStore } from '../store/scanStore';
import { usePlantsStore } from '../../my-plants/store/plantsStore';
import { useAuthStore } from '../../auth/store/authStore';
import { PlantResultHero } from '../components/PlantResultHero';
import { DiseaseCard } from '../components/DiseaseCard';
import { SuggestedActionCard } from '../components/SuggestedActionCard';
import { SavePlantModal } from '../components/SavePlantModal';
import { colors } from '../../../constants/colors';
import { logger } from '../../../shared/utils/logger';
import { track } from '../../../services/analytics/posthog';
import type { ScanStackParamList } from '../../../navigation/types';
import type { UserPlantDoc } from '../../../types/firestore.types';

const { width: SW } = Dimensions.get('window');
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⚠️</Text>
                <Text style={styles.sectionTitle}>
                  {scanResult.diseases.length} issue{scanResult.diseases.length > 1 ? 's' : ''} detected
                </Text>
              </View>
              {scanResult.diseases.map((d, i) => (
                <DiseaseCard key={d.name} disease={d} index={i} />
              ))}
            </View>
          )}

          {/* Healthy badge */}
          {!hasDiseases && (
            <View style={styles.healthyBanner}>
              <Text style={styles.healthyIcon}>🌟</Text>
              <View>
                <Text style={styles.healthyTitle}>Looking great!</Text>
                <Text style={styles.healthySubtitle}>
                  No diseases detected. Keep up the good care!
                </Text>
              </View>
            </View>
          )}

          {/* Suggested actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💡</Text>
              <Text style={styles.sectionTitle}>Care recommendations</Text>
            </View>
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
              <Text style={styles.aiDoctorIcon}>🤖</Text>
              <View>
                <Text style={styles.aiDoctorTitle}>Ask AI Doctor</Text>
                <Text style={styles.aiDoctorSub}>
                  Get personalised advice for {scanResult.commonName}
                </Text>
              </View>
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
            <Text style={styles.saveBtnText}>🌿  Save this Plant</Text>
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
    backgroundColor: colors.background,
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
    fontFamily: 'Nunito-Bold',
  },
  body: {
    padding: 20,
    gap: 24,
  },
  savedBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  savedBannerText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    color: colors.success,
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 17,
    color: colors.textPrimary,
  },
  healthyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F0FFF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  healthyIcon: {
    fontSize: 32,
  },
  healthyTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: colors.success,
  },
  healthySubtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aiDoctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 18,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  aiDoctorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  aiDoctorIcon: {
    fontSize: 28,
  },
  aiDoctorTitle: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 16,
    color: '#fff',
  },
  aiDoctorSub: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  aiDoctorArrow: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    marginLeft: 12,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(248,250,245,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  saveBtnText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: 0.2,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  errorBtnText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 15,
    color: '#fff',
  },
});
