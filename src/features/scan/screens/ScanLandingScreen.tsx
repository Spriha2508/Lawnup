import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { useScanStore } from '../store/scanStore';
import { ScanFrame } from '../components/ScanFrame';
import { logger } from '../../../shared/utils/logger';
import type { ScanStackParamList } from '../../../navigation/types';
type Nav = StackNavigationProp<ScanStackParamList, 'ScanLanding'>;

export const ScanLandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { canScan, scansUsed, scanLimit } = useSubscriptionStore();
  const { reset, setCapturedImageUri } = useScanStore();

  const sheetSlide = useRef(new Animated.Value(40)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reset();
    Animated.parallel([
      Animated.timing(titleFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(sheetOpacity, { toValue: 1, duration: 550, delay: 150, useNativeDriver: true }),
      Animated.spring(sheetSlide, { toValue: 0, damping: 16, stiffness: 100, delay: 150, useNativeDriver: true } as any),
    ]).start();
  }, []);

  const handleCamera = () => {
    if (!canScan()) return;
    logger.scan.started();
    navigation.navigate('Camera');
  };

  const handleGallery = async () => {
    if (!canScan()) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
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
    <View style={styles.root}>
      {/* ── Dark hero ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={styles.hero}>
        <Animated.View style={[styles.heroContent, { opacity: titleFade }]}>
          <Text style={styles.eyebrow}>AI DIAGNOSTICIAN</Text>
          <Text style={styles.heroTitle}>Identify your{'\n'}plant.</Text>
        </Animated.View>

        {/* Scan frame centered in remaining hero space */}
        <View style={styles.frameWrap}>
          <ScanFrame active={true} />
        </View>

        {/* Feature tags */}
        <Animated.View style={[styles.tagRow, { opacity: titleFade }]}>
          {['5 000+ species', 'Disease scan', 'Care advice'].map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </Animated.View>
      </SafeAreaView>

      {/* ── Cream bottom sheet ─────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.sheet,
          { opacity: sheetOpacity, transform: [{ translateY: sheetSlide }] },
        ]}
      >
        {/* Quota bar */}
        {scanLimit !== -1 && (
          <View style={styles.quotaRow}>
            <Text style={styles.quotaLabel}>
              {scansUsed} of {scanLimitDisplay} scans used this month
            </Text>
            <View style={styles.quotaTrack}>
              <View
                style={[
                  styles.quotaFill,
                  {
                    width: `${Math.min(100, scanPercent * 100)}%` as any,
                    backgroundColor: limitReached ? '#C0392B' : '#6F943E',
                  },
                ]}
              />
            </View>
            {limitReached && (
              <Text style={styles.quotaWarning}>Monthly limit reached</Text>
            )}
          </View>
        )}

        {/* Camera CTA */}
        <TouchableOpacity
          style={[styles.cameraBtn, limitReached && styles.btnDisabled]}
          onPress={handleCamera}
          disabled={limitReached}
          activeOpacity={0.88}
        >
          <Text style={styles.cameraBtnText}>Open camera  →</Text>
        </TouchableOpacity>

        {/* Gallery CTA */}
        <TouchableOpacity
          style={[styles.galleryBtn, limitReached && styles.btnDisabled]}
          onPress={handleGallery}
          disabled={limitReached}
          activeOpacity={0.8}
        >
          <Text style={styles.galleryBtnText}>Upload from gallery</Text>
        </TouchableOpacity>

        {/* Upgrade nudge */}
        {limitReached && (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => navigation.getParent<any>()?.navigate('Profile')}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeBtnText}>Upgrade for unlimited scans</Text>
          </TouchableOpacity>
        )}

        <SafeAreaView edges={['bottom']} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1610',
  },

  // Dark hero
  hero: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  heroContent: {
    paddingTop: 8,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 9,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 42,
    fontFamily: 'Cormorant-SemiBoldItalic',
    color: '#FFFFFF',
    lineHeight: 46,
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(111,148,62,0.35)',
    backgroundColor: 'rgba(111,148,62,0.07)',
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.2,
  },

  // Cream sheet
  sheet: {
    backgroundColor: '#F5F1E8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 4,
    gap: 12,
  },

  // Quota
  quotaRow: {
    gap: 8,
    marginBottom: 4,
  },
  quotaLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
  quotaTrack: {
    height: 4,
    backgroundColor: '#DDD4C7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  quotaFill: {
    height: 4,
    borderRadius: 2,
  },
  quotaWarning: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    color: '#C0392B',
  },

  // CTAs
  cameraBtn: {
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
  },
  cameraBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  galleryBtn: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
    backgroundColor: '#EEE7DA',
  },
  galleryBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#6B6B5E',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  upgradeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    color: '#6F943E',
    textDecorationLine: 'underline',
  },
});
