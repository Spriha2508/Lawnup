import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { CameraView } from 'expo-camera';
import type { CameraMountError } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { useScanStore } from '../store/scanStore';
import { useSubscriptionStore } from '../../subscription/store/subscriptionStore';
import { ScanFrame, FRAME_SIZE } from '../components/ScanFrame';
import { analyzeImageQuality } from '../../../shared/utils/imageQuality';
import type { ImageQualityResult } from '../../../shared/utils/imageQuality';
import { logger } from '../../../shared/utils/logger';
import { theme } from '@constants/designSystem';
import type { ScanStackParamList } from '../../../navigation/types';

const { color: C, spacing: S, typography: T, radii: R, fonts: F } = theme;
const { width: SW, height: SH } = Dimensions.get('window');
type Nav = StackNavigationProp<ScanStackParamList, 'Camera'>;
type FlashMode = 'off' | 'on' | 'auto';

// Scan guidance tips — rotate through these during the live view
const SCAN_TIPS = [
  'Include the full plant — leaves, stem, and overall shape',
  'Natural daylight gives the most accurate results',
  'Hold steady and move close — blurry photos reduce accuracy',
  'Keep affected leaves clearly visible in the frame',
  'Avoid harsh backlighting — step into shade if needed',
  'Include the pot if possible — it helps with context',
];

// How long a quality warning stays before resuming tip rotation (ms)
const QUALITY_WARN_DURATION = 4000;
// How long the capture button stays dimmed after a poor-quality rejection (ms)
const CAPTURE_LOCK_DURATION = 2500;

export const CameraScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { isGranted, isDenied, request } = useCameraPermission();
  const { setCapturedImageUri } = useScanStore();
  const isUsageHydrated = useSubscriptionStore(s => s.isUsageHydrated);
  // Weekly gate (free: 3/week; premium bypasses). Functions are stable store refs;
  // call them at render / via getState() rather than putting them in dep arrays.
  const canScanThisWeek = useSubscriptionStore(s => s.canScanThisWeek);

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);

  // Quality state
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null);
  const [showingQualityWarn, setShowingQualityWarn] = useState(false);
  const [captureLocked, setCaptureLocked] = useState(false); // dim button after rejection

  // Tip / quality message area
  const [tipIndex, setTipIndex] = useState(0);
  const tipFade = useRef(new Animated.Value(1)).current;
  const qualityWarnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const captureFlash = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;
  const previewFade  = useRef(new Animated.Value(0)).current;

  // Quality pill opacity (fades in when quality result is available)
  const qualityPillOpacity = useRef(new Animated.Value(0)).current;

  // ── [CAMERA_MOUNT] lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (__DEV__) console.log('[CAMERA_MOUNT] CameraScreen mounted');
    return () => {
      if (__DEV__) console.log('[CAMERA_MOUNT] CameraScreen unmounted');
      if (qualityWarnTimer.current) clearTimeout(qualityWarnTimer.current);
      if (captureLockTimer.current) clearTimeout(captureLockTimer.current);
    };
  }, []);

  // ── [CAMERA_PERMISSION] permission/hydration log ───────────────────────────
  useEffect(() => {
    if (__DEV__) {
      console.log(
        `[CAMERA_PERMISSION] isGranted=${isGranted} | isDenied=${isDenied}` +
          ` | isUsageHydrated=${isUsageHydrated} | canScanThisWeek=${useSubscriptionStore.getState().canScanThisWeek()}`,
      );
    }
  }, [isGranted, isDenied, isUsageHydrated]);

  // ── Tip rotation (pauses while showing quality warning) ───────────────────
  useEffect(() => {
    if (showingQualityWarn) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipFade, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(tipFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      setTipIndex((i) => (i + 1) % SCAN_TIPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [showingQualityWarn, tipFade]);

  // ── Preview crossfade — fades the captured photo in after the shutter flash ──
  useEffect(() => {
    if (capturedUri) {
      previewFade.setValue(0);
      Animated.timing(previewFade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    }
  }, [capturedUri, previewFade]);

  // ── Capture button press feedback ───────────────────────────────────────────
  const onCapturePressIn = useCallback(() => {
    Animated.spring(captureScale, { toValue: 0.9, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  }, [captureScale]);
  const onCapturePressOut = useCallback(() => {
    Animated.spring(captureScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }, [captureScale]);

  // ── Camera callbacks ────────────────────────────────────────────────────────
  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
    if (__DEV__) console.log('[CAMERA_READY] Camera preview initialised and live');
  }, []);

  const handleMountError = useCallback((error: CameraMountError) => {
    setMountError(error.message);
    if (__DEV__) console.error('[CAMERA_ERROR] Mount error:', error.message);
    logger.scan.failed('Camera mount error', error);
  }, []);

  // ── Show quality warning in the tip area ───────────────────────────────────
  const triggerQualityWarning = useCallback(
    (result: ImageQualityResult) => {
      if (qualityWarnTimer.current) clearTimeout(qualityWarnTimer.current);
      if (captureLockTimer.current) clearTimeout(captureLockTimer.current);

      setShowingQualityWarn(true);
      setCaptureLocked(true);

      // Fade the tip text out → in with new message
      Animated.sequence([
        Animated.timing(tipFade, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(tipFade, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();

      qualityWarnTimer.current = setTimeout(() => {
        setShowingQualityWarn(false);
        // Fade back to tip
        Animated.sequence([
          Animated.timing(tipFade, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(tipFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }, QUALITY_WARN_DURATION);

      captureLockTimer.current = setTimeout(() => {
        setCaptureLocked(false);
      }, CAPTURE_LOCK_DURATION);
    },
    [tipFade],
  );

  // ── Show quality pill (good/acceptable) ────────────────────────────────────
  const showQualityPill = useCallback(() => {
    Animated.sequence([
      Animated.timing(qualityPillOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(qualityPillOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [qualityPillOpacity]);

  // ── Capture ─────────────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || !isCameraReady || captureLocked) return;
    if (__DEV__) console.log('[CAMERA_READY] Capture triggered');
    setIsCapturing(true);

    Animated.sequence([
      Animated.timing(captureFlash, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(captureFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    let photoUri: string | null = null;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        shutterSound: false,
      } as Parameters<typeof cameraRef.current.takePictureAsync>[0]);

      if (!photo?.uri) return;
      photoUri = photo.uri;

      // ── Quality analysis ──────────────────────────────────────────────────
      const quality = await analyzeImageQuality(photoUri);

      if (__DEV__) {
        console.log('[ImageQuality]', {
          level: quality.level,
          issue: quality.issue,
          thumbBytes: quality.metrics.thumbBytes,
          blurScore: quality.metrics.blurScore,
          brightnessScore: quality.metrics.brightnessScore,
          overallScore: quality.metrics.overallScore,
        });
      }

      setQualityResult(quality);

      if (quality.level === 'poor') {
        // Block — guide user to retake
        triggerQualityWarning(quality);
        FileSystem.deleteAsync(photoUri, { idempotent: true }).catch(() => {});
        photoUri = null;
        return;
      }

      // Acceptable or good — show quality pill then proceed to preview
      showQualityPill();
      setCapturedUri(photoUri);
      logger.scan.imageSelected('camera');

    } catch (err) {
      if (__DEV__) console.error('[CAMERA_ERROR] Capture/analysis failed:', err);
      logger.scan.failed('Capture failed', err);
      if (photoUri) {
        FileSystem.deleteAsync(photoUri, { idempotent: true }).catch(() => {});
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, isCameraReady, captureLocked, captureFlash, triggerQualityWarning, showQualityPill]);

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      logger.scan.failed('Gallery permission denied in CameraScreen');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      logger.scan.imageSelected('gallery');
    }
  };

  const handleUsePhoto = () => {
    if (!capturedUri) return;
    setCapturedImageUri(capturedUri);
    navigation.navigate('Processing', { imageUri: capturedUri });
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setQualityResult(null);
  };
  const handleClose = () => navigation.goBack();

  const topPad    = insets.top + (Platform.OS === 'android' ? 12 : 0);
  const bottomPad = insets.bottom + 12;

  // ── Derived display values ──────────────────────────────────────────────────

  // Tip area: show quality warning message or regular rotating tip
  const tipText = showingQualityWarn && qualityResult
    ? qualityResult.feedback
    : SCAN_TIPS[tipIndex % SCAN_TIPS.length];
  const tipIsWarning = showingQualityWarn && qualityResult?.level === 'poor';

  // Quality status pill (shown briefly after a good/acceptable capture)
  const pillText = qualityResult
    ? qualityResult.level === 'good'
      ? '✓  Sharp · Good lighting'
      : qualityResult.issue === 'too_dark'
      ? '⚠  Low light'
      : qualityResult.issue === 'blurry'
      ? '⚠  Hold steady'
      : '◎  Acceptable'
    : '';

  const pillColor =
    qualityResult?.level === 'good' ? C.healthyFg : C.waterFg;

  // Capture button: dimmed while analysing or locked after rejection
  const captureDisabled = isCapturing || !isCameraReady || captureLocked;
  const captureOpacity  = captureDisabled ? 0.45 : 1;

  // ── Permission: Not yet determined ──────────────────────────────────────────
  if (!isGranted && !isDenied) {
    return (
      <View style={styles.permissionScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContent}>
          <Text style={styles.permMark}>✦</Text>
          <Text style={styles.permTitle}>Camera access</Text>
          <Text style={styles.permSubtitle}>
            To identify plants and diagnose disease, LawnUp needs access to your camera.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={request} activeOpacity={0.88}>
            <Text style={styles.permBtnText}>Allow Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.permCancel}>
            <Text style={styles.permCancelText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Permission: Denied ───────────────────────────────────────────────────────
  if (isDenied) {
    return (
      <View style={styles.permissionScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContent}>
          <Text style={styles.permMark}>◇</Text>
          <Text style={styles.permTitle}>Access denied</Text>
          <Text style={styles.permSubtitle}>
            Open your device settings and enable camera access to continue scanning.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={handleGallery} activeOpacity={0.88}>
            <Text style={styles.permBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.permCancel}>
            <Text style={styles.permCancelText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Preview mode (after capture) ─────────────────────────────────────────────
  if (capturedUri) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="light-content" hidden />

        <Animated.Image
          source={{ uri: capturedUri }}
          style={[styles.previewImage, { opacity: previewFade }]}
          resizeMode="cover"
        />
        <View style={styles.previewOverlay} />

        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <TouchableOpacity
            onPress={handleRetake}
            style={styles.closeBtn}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.previewHint}>Analyse this plant?</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Quality badge in preview */}
        {qualityResult && (
          <View
            style={[
              styles.previewQualityBadge,
              { backgroundColor: qualityResult.level === 'good' ? C.healthyFg : C.waterFg },
            ]}
          >
            <Text style={styles.previewQualityText}>
              {qualityResult.level === 'good' ? '✓  Sharp · Good lighting' : '◎  Acceptable quality'}
            </Text>
          </View>
        )}

        <View style={[styles.previewActions, { paddingBottom: bottomPad }]}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.82}>
            <Text style={styles.retakeBtnText}>← Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.usePhotoBtn} onPress={handleUsePhoto} activeOpacity={0.88}>
            <Text style={styles.usePhotoBtnText}>Analyse plant  →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Camera live view ─────────────────────────────────────────────────────────
  // CameraView mounts immediately when permissions are confirmed.
  // Hydration loading and quota limits render as overlays so the camera
  // hardware initialises without delay (prevents Android black-screen).
  const limitReached = isUsageHydrated && !canScanThisWeek();

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" hidden />

      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        onCameraReady={handleCameraReady}
        onMountError={handleMountError}
      />

      {/* Top letterbox */}
      <View style={[styles.letterboxTop, { height: (SH - FRAME_SIZE) / 2 }]}>
        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.hintText}>Scan your plant</Text>

          <TouchableOpacity
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'))}
            style={styles.flashBtn}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Text style={[styles.flashBtnText, flash !== 'off' && styles.flashBtnOn]}>
              {flash === 'auto' ? 'AUTO' : 'FLASH'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scan frame */}
      <View style={styles.frameContainer}>
        <ScanFrame active />
      </View>

      {/* Quality status pill — fades in after a capture attempt */}
      <Animated.View
        style={[styles.qualityPill, { opacity: qualityPillOpacity, backgroundColor: pillColor }]}
        pointerEvents="none"
      >
        <Text style={styles.qualityPillText}>{pillText}</Text>
      </Animated.View>

      {/* Tip / quality warning area */}
      <Animated.View
        style={[styles.tipContainer, { opacity: tipFade }]}
        pointerEvents="none"
      >
        <Text style={[styles.tipText, tipIsWarning && styles.tipWarning]}>
          {tipText}
        </Text>
      </Animated.View>

      {/* Bottom letterbox */}
      <View style={[styles.letterboxBottom, { height: (SH - FRAME_SIZE) / 2 }]}>
        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          <TouchableOpacity style={styles.sideBtn} onPress={handleGallery} activeOpacity={0.75}>
            <Text style={styles.sideBtnLabel}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureBtn, { opacity: captureOpacity }]}
            onPress={handleCapture}
            onPressIn={onCapturePressIn}
            onPressOut={onCapturePressOut}
            disabled={captureDisabled}
            activeOpacity={1}
          >
            <Animated.View style={[styles.captureBtnOuter, { transform: [{ scale: captureScale }] }]}>
              <View style={styles.captureBtnInner} />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideBtn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            activeOpacity={0.75}
          >
            <Text style={styles.sideBtnLabel}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Capture flash overlay */}
      <Animated.View
        style={[styles.captureFlash, { opacity: captureFlash }]}
        pointerEvents="none"
      />

      {/* ── Mount error overlay ──────────────────────────────────────────────── */}
      {mountError && (
        <View style={styles.overlayFull}>
          <Text style={styles.overlayMark}>◇</Text>
          <Text style={styles.overlayTitle}>Camera unavailable</Text>
          <Text style={styles.overlaySubtitle}>{mountError}</Text>
          <TouchableOpacity style={styles.overlayBtn} onPress={handleGallery} activeOpacity={0.88}>
            <Text style={styles.overlayBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.permCancel}>
            <Text style={styles.permCancelText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Usage hydration spinner ──────────────────────────────────────────── */}
      {!isUsageHydrated && !mountError && (
        <View style={styles.overlayLoading} pointerEvents="none">
          <ActivityIndicator size="small" color={C.primary} />
        </View>
      )}

      {/* ── Quota limit overlay ──────────────────────────────────────────────── */}
      {limitReached && !mountError && (
        <View style={styles.overlayFull}>
          <Text style={styles.overlayMark}>◆</Text>
          <Text style={styles.overlayTitle}>Weekly limit reached</Text>
          <Text style={styles.overlaySubtitle}>
            You've used all 3 free scans this week. Upgrade to Premium for unlimited plant identification.
          </Text>
          <TouchableOpacity
            style={styles.overlayBtn}
            onPress={() => (navigation as any).getParent()?.getParent()?.navigate('Profile', { screen: 'Paywall' })}
            activeOpacity={0.88}
          >
            <Text style={styles.overlayBtnText}>View upgrade options</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.permCancel}>
            <Text style={styles.permCancelText}>Go back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: S['3xl'],
  },
  permissionContent: {
    alignItems: 'center',
    gap: S.md,
  },
  permMark: {
    fontSize: 36,
    color: C.primary,
    marginBottom: S.xl,
    textAlign: 'center',
  },
  permTitle: {
    ...T.display2,
    color: C.textPrimary,
    textAlign: 'center',
  },
  permSubtitle: {
    ...T.body,
    color: C.textMuted,
    textAlign: 'center',
  },
  permBtn: {
    marginTop: S.xs,
    backgroundColor: C.inkBtn,
    borderRadius: R.pill,
    paddingHorizontal: S['2xl'],
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  permBtnText: {
    ...T.button,
    color: C.onInkBtn,
  },
  permCancel: { paddingVertical: S.xs },
  permCancelText: {
    ...T.body,
    color: C.textFaint,
  },
  letterboxTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  letterboxBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  frameContainer: {
    position: 'absolute',
    top: (SH - FRAME_SIZE) / 2,
    left: (SW - FRAME_SIZE) / 2,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quality status pill — appears briefly after each capture attempt
  qualityPill: {
    position: 'absolute',
    top: (SH - FRAME_SIZE) / 2 - 38,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: R.pill,
  },
  qualityPillText: {
    ...T.label,
    color: C.onPrimary,
  },
  // Tip / quality warning text below scan frame
  tipContainer: {
    position: 'absolute',
    top: (SH - FRAME_SIZE) / 2 + FRAME_SIZE + 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: S['3xl'],
  },
  tipText: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  tipWarning: {
    color: C.waterFg,
    fontSize: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: F.sansBold,
  },
  hintText: {
    ...T.eyebrow,
    fontSize: 11,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    flex: 1,
  },
  flashBtn: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: R.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnText: {
    fontSize: 10,
    fontFamily: F.sansMedium,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
  },
  flashBtnOn: { color: C.secondary },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 20,
    paddingHorizontal: 32,
  },
  sideBtn: {
    alignItems: 'center',
    width: 64,
  },
  sideBtnLabel: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
  },
  captureBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Luminous-green ring — the one confident "go" element on the dark scene
  captureBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject as any,
    width: SW,
    height: SH,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  previewHint: {
    flex: 1,
    textAlign: 'center',
    fontFamily: F.serifMediumItalic,
    fontSize: 21,
    color: '#fff',
  },
  previewQualityBadge: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  previewQualityText: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    color: C.onPrimary,
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: R.pill,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retakeBtnText: {
    fontFamily: F.sansMedium,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  usePhotoBtn: {
    flex: 2,
    backgroundColor: C.inkBtn,
    borderRadius: R.pill,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.cta,
  },
  usePhotoBtnText: {
    ...T.button,
    color: C.onInkBtn,
  },
  captureFlash: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#fff',
  },
  // Overlays drawn on top of the mounted CameraView
  overlayLoading: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayFull: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: 'rgba(4,13,8,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: S['3xl'],
    gap: S.md,
  },
  overlayMark: {
    fontSize: 36,
    color: C.primary,
    marginBottom: S.xl,
    textAlign: 'center',
  },
  overlayTitle: {
    ...T.display2,
    fontSize: 30,
    lineHeight: 34,
    color: C.textPrimary,
    textAlign: 'center',
  },
  overlaySubtitle: {
    ...T.body,
    color: C.textMuted,
    textAlign: 'center',
  },
  overlayBtn: {
    marginTop: S.xs,
    backgroundColor: C.inkBtn,
    borderRadius: R.pill,
    paddingHorizontal: S['2xl'],
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  overlayBtnText: {
    ...T.button,
    color: C.onInkBtn,
  },
});
