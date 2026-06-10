import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { useScanFlow } from '../hooks/useScanFlow';
import { ProcessingAnimation } from '../components/ProcessingAnimation';
import { logger } from '../../../shared/utils/logger';
import { UpgradePrompt } from '../../subscription/components/UpgradePrompt';
import type { ScanStackParamList } from '../../../navigation/types';

const { width: SW, height: SH } = Dimensions.get('window');
type Nav = StackNavigationProp<ScanStackParamList, 'Processing'>;
type Route = RouteProp<ScanStackParamList, 'Processing'>;

const PROCESSING_MESSAGES = [
  'Identifying the species',
  'Checking plant health',
  'Building your care guide',
];

type Phase = 'validating' | 'scanning' | 'not_plant' | 'scan_failed' | 'limit_reached';

export const ProcessingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { imageUri, extraUris } = route.params;

  const { runScan, cancelScan } = useScanFlow();
  const hasStarted = useRef(false);
  const [phase, setPhase] = useState<Phase>('validating');
  const [failDetails, setFailDetails] = useState<string | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const msgOpacity = useRef(new Animated.Value(1)).current;
  const msgTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimer = useRef<ReturnType<typeof Animated.timing> | null>(null);

  // Cancel any in-flight scan when the screen unmounts (e.g. back gesture)
  useEffect(() => {
    return () => {
      cancelScan();
      if (msgTimer.current) clearInterval(msgTimer.current);
      progressTimer.current?.stop();
    };
  }, [cancelScan]);

  // Cycle messages + animate progress bar during scanning phase
  useEffect(() => {
    if (phase !== 'scanning') return;

    progressAnim.setValue(0);
    progressTimer.current = Animated.timing(progressAnim, {
      toValue: 0.92,
      duration: 5200,
      useNativeDriver: false,
    });
    progressTimer.current.start();

    // Crossfade each message swap so the copy never pops abruptly
    msgTimer.current = setInterval(() => {
      Animated.timing(msgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setMsgIdx(i => (i + 1) % PROCESSING_MESSAGES.length);
        Animated.timing(msgOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    }, 1900);

    return () => {
      if (msgTimer.current) clearInterval(msgTimer.current);
      progressTimer.current?.stop();
    };
  }, [phase, progressAnim, msgOpacity]);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const retryOpacity    = useRef(new Animated.Value(0)).current;
  const failedOpacity   = useRef(new Animated.Value(0)).current;

  // Fade content in on mount
  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity]);

  const transitionToRetry = useCallback(() => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setPhase('not_plant');
      Animated.timing(retryOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    });
  }, [contentOpacity, retryOpacity]);

  const startFlow = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Single comprehensive scan — handles is_plant detection, classification,
    // health assessment, and disease detection in one API call.
    setPhase('scanning');
    const { scanId, error: scanError } = await runScan(imageUri, extraUris);

    if (scanId) {
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('ScanResult', { scanId });
      });
    } else if (scanError === 'not_plant') {
      // identifyPlant detected is_plant < 0.5 — not a plant image
      logger.scan.failed('not_plant_detected');
      transitionToRetry();
    } else if (scanError === 'scan_limit_reached') {
      setPhase('limit_reached');
    } else {
      logger.scan.failed(`runScan failed: ${scanError ?? 'unknown'}`);
      setFailDetails(scanError);
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setPhase('scan_failed');
        Animated.timing(failedOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [imageUri, extraUris, runScan, navigation, contentOpacity, transitionToRetry, failedOpacity]);

  useEffect(() => {
    startFlow();
  }, [startFlow]);

  const handleRetake = useCallback(() => {
    cancelScan();
    navigation.goBack();
  }, [navigation, cancelScan]);

  const handleGallery = useCallback(async () => {
    cancelScan();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      // Replace current Processing screen so back button returns to Camera
      navigation.replace('Processing', { imageUri: result.assets[0].uri });
    }
  }, [navigation, cancelScan]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" hidden />

      {/* Captured image as blurred, darkened background */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.bgImage}
          resizeMode="cover"
          blurRadius={10}
        />
      )}
      <View style={styles.darkOverlay} />
      <View style={styles.centerGlow} />

      {/* ── Cancel button (always visible during active processing) ──────── */}
      {phase !== 'not_plant' && phase !== 'scan_failed' && phase !== 'limit_reached' && (
        <TouchableOpacity
          style={[styles.cancelBtn, { top: insets.top + (Platform.OS === 'android' ? 12 : 8) }]}
          onPress={handleRetake}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>✕</Text>
        </TouchableOpacity>
      )}

      {/* ── Processing animation (validating + scanning) ────────────────────── */}
      {phase !== 'not_plant' && phase !== 'scan_failed' && (
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          <ProcessingAnimation />
          {phase === 'validating' && (
            <Text style={styles.validatingHint}>Preparing your photo</Text>
          )}
          {phase === 'scanning' && (
            <>
              <Animated.Text style={[styles.scanningMsg, { opacity: msgOpacity }]}>
                {PROCESSING_MESSAGES[msgIdx]}
              </Animated.Text>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.trustLine}>Analyzing leaves, shape & health</Text>
            </>
          )}
        </Animated.View>
      )}

      {/* ── Not-a-plant retry state ─────────────────────────────────────────── */}
      {phase === 'not_plant' && (
        <Animated.View style={[styles.retryContent, { opacity: retryOpacity }]}>
          <View style={styles.retryMarkWrap}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill="rgba(167,196,124,0.6)" />
              <Path d="M12 3V21" stroke="rgba(255,255,255,0.4)" strokeWidth={1.2} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={styles.retryTitle}>
            Hmm, I couldn't spot a plant
          </Text>
          <Text style={styles.retryHint}>
            For best results, try:
          </Text>
          <View style={styles.retryTips}>
            {[
              'Move closer so the plant fills the frame',
              'Use natural daylight — avoid dim rooms',
              'Include the full plant, not just one leaf',
              'Hold steady to avoid blur',
            ].map((tip, i) => (
              <View key={i} style={styles.retryTipRow}>
                <Text style={styles.retryTipDot}>·</Text>
                <Text style={styles.retryTipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.retryActions}>
            <TouchableOpacity
              style={styles.btnRetake}
              onPress={handleRetake}
              activeOpacity={0.82}
            >
              <Text style={styles.btnRetakeText}>Retake photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnGallery}
              onPress={handleGallery}
              activeOpacity={0.8}
            >
              <Text style={styles.btnGalleryText}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── Daily limit reached — upgrade prompt ──────────────────────────── */}
      <UpgradePrompt
        visible={phase === 'limit_reached'}
        context="scan_limit"
        onUpgrade={() => {
          cancelScan();
          navigation.getParent<any>()?.navigate('Profile', { screen: 'Paywall' });
        }}
        onDismiss={() => {
          cancelScan();
          navigation.goBack();
        }}
      />

      {/* ── API / identification failure ────────────────────────────────────── */}
      {phase === 'scan_failed' && (
        <Animated.View style={[styles.retryContent, { opacity: failedOpacity }]}>
          <View style={styles.retryMarkWrap}>
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Path d="M12 8V13M12 16.5V16.6" stroke="rgba(255,255,255,0.55)" strokeWidth={2.2} strokeLinecap="round" />
              <Path d="M12 3L21 19H3L12 3Z" stroke="rgba(255,255,255,0.45)" strokeWidth={1.6} strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={styles.retryTitle}>
            Scan didn't complete
          </Text>
          <Text style={styles.retryHint}>
            {failDetails?.includes('offline') || failDetails?.includes('connection')
              ? 'No internet connection — check your signal and try again.'
              : failDetails?.includes('timed out')
              ? 'The request timed out — your connection may be slow. Try again.'
              : 'Something went wrong on our end. Try again or use a different photo.'}
          </Text>
          {__DEV__ && failDetails && (
            <Text style={styles.failDebug} numberOfLines={4}>{failDetails}</Text>
          )}

          <View style={styles.retryActions}>
            <TouchableOpacity
              style={styles.btnRetake}
              onPress={handleRetake}
              activeOpacity={0.82}
            >
              <Text style={styles.btnRetakeText}>Try again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnGallery}
              onPress={handleGallery}
              activeOpacity={0.8}
            >
              <Text style={styles.btnGalleryText}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#060D09',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: SW,
    height: SH,
    opacity: 0.35,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,13,9,0.78)',
  },
  centerGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(111,148,62,0.07)',
    alignSelf: 'center',
    top: SH / 2 - 160,
  },

  cancelBtn: {
    position: 'absolute',
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
  },

  // Processing phases
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  validatingHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 0.3,
  },
  scanningMsg: {
    marginTop: 28,
    fontSize: 17,
    fontFamily: 'Nunito-SemiBold',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  progressTrack: {
    marginTop: 18,
    width: 184,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#7FB069',
  },
  trustLine: {
    marginTop: 14,
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.34)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // not_plant retry
  retryContent: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  retryMarkWrap: {
    width: 60, height: 60, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  retryTitle: {
    fontSize: 22,
    fontFamily: 'Cormorant-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 14,
  },
  retryHint: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.42)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
  },
  retryTips: {
    alignSelf: 'stretch',
    gap: 6,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  retryTipRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  retryTipDot: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.30)',
    lineHeight: 22,
  },
  retryTipText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 22,
    flex: 1,
  },
  retryActions: {
    width: '100%',
    gap: 12,
  },
  btnRetake: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  btnRetakeText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
  },
  btnGallery: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnGalleryText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    color: 'rgba(255,255,255,0.45)',
  },
  failDebug: {
    marginTop: 12,
    marginBottom: -8,
    fontSize: 10,
    fontFamily: 'Nunito-Regular',
    color: 'rgba(255,180,100,0.70)',
    textAlign: 'center',
    lineHeight: 14,
  },
});
