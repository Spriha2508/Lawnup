import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { useScanStore } from '../store/scanStore';
import { colors } from '../../../constants/colors';
import { logger } from '../../../shared/utils/logger';
import type { ScanStackParamList } from '../../../navigation/types';

const { width: SW } = Dimensions.get('window');
type Nav = StackNavigationProp<ScanStackParamList, 'ScanLanding'>;

const FEATURES = [
  { icon: '🌿', title: 'Instant ID', desc: '5000+ Indian plant species' },
  { icon: '🩺', title: 'Disease scan', desc: 'Detect problems early' },
  { icon: '💡', title: 'Care guide', desc: 'Climate-aware advice' },
];

export const ScanLandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { canScan, scansUsed, scanLimit } = useSubscriptionStore();
  const { reset, setCapturedImageUri } = useScanStore();

  // Entrance animations
  const heroScale = useRef(new Animated.Value(0.85)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reset();
    Animated.parallel([
      Animated.spring(heroScale, { toValue: 1, damping: 14, stiffness: 100, useNativeDriver: true }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 600, delay: 150, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, delay: 150, useNativeDriver: true }),
    ]).start();
  }, [heroScale, heroOpacity, contentSlide, contentOpacity, reset]);

  const handleCamera = () => {
    if (!canScan()) return;
    logger.scan.started();
    navigation.navigate('Camera');
  };

  const handleGallery = async () => {
    if (!canScan()) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      logger.scan.failed('Gallery permission denied');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setCapturedImageUri(uri);
      logger.scan.imageSelected('gallery');
      navigation.navigate('Processing', { imageUri: uri });
    }
  };

  const scanLimitDisplay = scanLimit === -1 ? '∞' : String(scanLimit);
  const scanPercent = scanLimit === -1 ? 0 : scansUsed / scanLimit;
  const limitReached = !canScan();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        bounces={false}
      >
        {/* ── Hero ── */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: heroOpacity, transform: [{ scale: heroScale }] },
          ]}
        >
          {/* Soft backdrop circle */}
          <View style={styles.heroCircle} />
          <View style={styles.heroInner}>
            <Text style={styles.heroEmoji}>🔍</Text>
          </View>
        </Animated.View>

        {/* ── Content ── */}
        <Animated.View
          style={[
            styles.content,
            { opacity: contentOpacity, transform: [{ translateY: contentSlide }] },
          ]}
        >
          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>What's this plant?</Text>
            <Text style={styles.titleBadge}>AI</Text>
          </View>
          <Text style={styles.subtitle}>
            Identify species, detect diseases, and get personalised care tips — instantly.
          </Text>

          {/* Feature pills */}
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureChip}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Quota bar ── */}
          <View style={styles.quotaCard}>
            <View style={styles.quotaRow}>
              <Text style={styles.quotaLabel}>Scans this month</Text>
              <Text style={styles.quotaCount}>
                {scansUsed} / {scanLimitDisplay}
              </Text>
            </View>
            {scanLimit !== -1 && (
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, scanPercent * 100)}%` as any,
                      backgroundColor: limitReached ? colors.error : colors.primary,
                    },
                  ]}
                />
              </View>
            )}
            {limitReached && (
              <Text style={styles.quotaWarning}>
                Monthly limit reached · Upgrade for 20+ scans
              </Text>
            )}
          </View>

          {/* ── CTAs ── */}
          <TouchableOpacity
            style={[styles.cameraBtn, limitReached && styles.btnDisabled]}
            onPress={handleCamera}
            disabled={limitReached}
            activeOpacity={0.88}
          >
            <View style={styles.cameraBtnInner}>
              <Text style={styles.cameraBtnIcon}>📷</Text>
              <View>
                <Text style={styles.cameraBtnTitle}>Take a photo</Text>
                <Text style={styles.cameraBtnSub}>Use camera with live scan frame</Text>
              </View>
            </View>
            <Text style={styles.cameraBtnArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.galleryBtn, limitReached && styles.btnDisabled]}
            onPress={handleGallery}
            disabled={limitReached}
            activeOpacity={0.8}
          >
            <Text style={styles.galleryBtnIcon}>🖼️</Text>
            <Text style={styles.galleryBtnText}>Upload from gallery</Text>
          </TouchableOpacity>

          {limitReached && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => navigation.getParent<any>()?.navigate('Profile', { screen: 'Paywall' })}
              activeOpacity={0.85}
            >
              <Text style={styles.upgradeBtnText}>✨  Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    height: 180,
  },
  heroCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(45,106,79,0.08)',
  },
  heroInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(45,106,79,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 52,
  },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleBadge: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 11,
    color: '#fff',
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: -8,
  },
  features: {
    gap: 10,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  featureDesc: {
    fontFamily: 'Nunito-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  quotaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quotaLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  quotaCount: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  quotaWarning: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    color: colors.error,
  },
  cameraBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  cameraBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cameraBtnIcon: {
    fontSize: 28,
  },
  cameraBtnTitle: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 17,
    color: '#fff',
  },
  cameraBtnSub: {
    fontFamily: 'Nunito-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  cameraBtnArrow: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  galleryBtnIcon: {
    fontSize: 20,
  },
  galleryBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  upgradeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeBtnText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 16,
    color: '#fff',
  },
});
