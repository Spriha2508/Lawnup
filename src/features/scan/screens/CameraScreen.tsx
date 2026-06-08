import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { useScanStore } from '../store/scanStore';
import { ScanFrame, FRAME_SIZE } from '../components/ScanFrame';
import { logger } from '../../../shared/utils/logger';
import type { ScanStackParamList } from '../../../navigation/types';

const { width: SW, height: SH } = Dimensions.get('window');
type Nav = StackNavigationProp<ScanStackParamList, 'Camera'>;

type FlashMode = 'off' | 'on' | 'auto';

export const CameraScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { isGranted, isDenied, request } = useCameraPermission();
  const { setCapturedImageUri } = useScanStore();

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Flash animation on capture
  const captureFlash = useRef(new Animated.Value(0)).current;

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    // Flash overlay animation
    Animated.sequence([
      Animated.timing(captureFlash, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(captureFlash, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        shutterSound: false,
      } as Parameters<typeof cameraRef.current.takePictureAsync>[0]);
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        logger.scan.imageSelected('camera');
      }
    } catch (err) {
      logger.scan.failed('Capture failed', err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, captureFlash]);

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
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const topPad = insets.top + (Platform.OS === 'android' ? 12 : 0);
  const bottomPad = insets.bottom + 12;

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

        <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="cover" />

        {/* Dark overlay */}
        <View style={styles.previewOverlay} />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <Text style={styles.previewHint}>Analyse this plant?</Text>
        </View>

        {/* Bottom actions */}
        <View style={[styles.previewActions, { paddingBottom: bottomPad }]}>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={handleRetake}
            activeOpacity={0.82}
          >
            <Text style={styles.retakeBtnText}>← Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.usePhotoBtn}
            onPress={handleUsePhoto}
            activeOpacity={0.88}
          >
            <Text style={styles.usePhotoBtnText}>Analyse plant  →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Camera live view ─────────────────────────────────────────────────────────
  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" hidden />

      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      />

      {/* Top dark letterbox */}
      <View style={[styles.letterboxTop, { height: (SH - FRAME_SIZE) / 2 }]}>
        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.hintText}>Hold any leaf within the frame</Text>

          <TouchableOpacity
            onPress={() =>
              setFlash((f) => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'))
            }
            style={styles.flashBtn}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Text style={[styles.flashBtnText, flash !== 'off' && styles.flashBtnOn]}>
              {flash === 'auto' ? 'AUTO' : 'FLASH'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scan frame (center) */}
      <View style={styles.frameContainer}>
        <ScanFrame active />
      </View>

      {/* Bottom dark letterbox */}
      <View style={[styles.letterboxBottom, { height: (SH - FRAME_SIZE) / 2 }]}>
        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          {/* Gallery button */}
          <TouchableOpacity
            style={styles.sideBtn}
            onPress={handleGallery}
            activeOpacity={0.75}
          >
            <Text style={styles.sideBtnLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Capture button */}
          <TouchableOpacity
            style={[styles.captureBtn, isCapturing && { opacity: 0.7 }]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.85}
          >
            <View style={styles.captureBtnOuter}>
              <View style={styles.captureBtnInner} />
            </View>
          </TouchableOpacity>

          {/* Flip button */}
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
    backgroundColor: '#0A0F0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permissionContent: {
    alignItems: 'center',
    gap: 16,
  },
  permMark: {
    fontSize: 36,
    color: '#6F943E',
    marginBottom: 20,
    textAlign: 'center',
  },
  permTitle: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
  },
  permSubtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },
  permBtn: {
    marginTop: 8,
    backgroundColor: '#6F943E',
    borderRadius: 999,
    paddingHorizontal: 36,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  permBtnText: {
    fontFamily: 'Nunito-ExtraBold',
    fontSize: 17,
    color: '#fff',
  },
  permCancel: {
    paddingVertical: 8,
  },
  permCancelText: {
    fontFamily: 'Nunito-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  // Letterboxes
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
  // Scan frame area
  frameContainer: {
    position: 'absolute',
    top: (SH - FRAME_SIZE) / 2,
    left: (SW - FRAME_SIZE) / 2,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Top controls
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
    fontFamily: 'Nunito-Bold',
  },
  hintText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    flex: 1,
  },
  flashBtn: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashBtnText: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
  },
  flashBtnOn: {
    color: '#FFD60A',
  },
  // Bottom controls
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
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
  },
  captureBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  // Preview
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
    fontFamily: 'Nunito-Bold',
    fontSize: 17,
    color: '#fff',
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
    borderRadius: 999,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retakeBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  usePhotoBtn: {
    flex: 2,
    backgroundColor: '#111111',
    borderRadius: 999,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usePhotoBtnText: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.2,
  },
  captureFlash: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#fff',
  },
});
