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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useScanFlow } from '../hooks/useScanFlow';
import { ProcessingAnimation } from '../components/ProcessingAnimation';
import { validatePlantImage } from '../../../services/validation/plantValidation';
import { logger } from '../../../shared/utils/logger';
import type { ScanStackParamList } from '../../../navigation/types';

const { width: SW, height: SH } = Dimensions.get('window');
type Nav = StackNavigationProp<ScanStackParamList, 'Processing'>;
type Route = RouteProp<ScanStackParamList, 'Processing'>;

type Phase = 'validating' | 'scanning' | 'not_plant';

export const ProcessingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri } = route.params;

  const { runScan } = useScanFlow();
  const hasStarted = useRef(false);
  const [phase, setPhase] = useState<Phase>('validating');

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const retryOpacity   = useRef(new Animated.Value(0)).current;

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

    // ── Step 1: Validate the image contains a real plant ─────────────────────
    // Does NOT consume quota. Only proceeds if validation passes.
    const validation = await validatePlantImage(imageUri);

    if (!validation.isPlant) {
      logger.scan.failed(
        `Plant not detected (confidence ${(validation.confidence * 100).toFixed(0)}%)`,
      );
      transitionToRetry();
      return;
    }

    // ── Step 2: Run identification scan (quota consumed here) ─────────────────
    setPhase('scanning');
    const scanId = await runScan(imageUri);

    if (scanId) {
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('ScanResult', { scanId });
      });
    } else {
      logger.scan.failed('useScanFlow returned null');
      navigation.goBack();
    }
  }, [imageUri, runScan, navigation, contentOpacity, transitionToRetry]);

  useEffect(() => {
    startFlow();
  }, [startFlow]);

  const handleRetake = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleGallery = useCallback(async () => {
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
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" hidden />

      {/* Captured image as blurred, darkened background */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.bgImage}
          resizeMode="cover"
          blurRadius={14}
        />
      )}
      <View style={styles.darkOverlay} />
      <View style={styles.centerGlow} />

      {/* ── Processing animation (validating + scanning) ────────────────────── */}
      {phase !== 'not_plant' && (
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          <ProcessingAnimation />
          {phase === 'validating' && (
            <Text style={styles.validatingHint}>Checking image…</Text>
          )}
        </Animated.View>
      )}

      {/* ── Not-a-plant retry state ─────────────────────────────────────────── */}
      {phase === 'not_plant' && (
        <Animated.View style={[styles.retryContent, { opacity: retryOpacity }]}>
          <Text style={styles.retryMark}>✦</Text>
          <Text style={styles.retryTitle}>
            We couldn't clearly detect{'\n'}a plant in this image.
          </Text>
          <Text style={styles.retryHint}>
            Try a closer shot with the leaf{'\n'}
            filling most of the frame.
          </Text>

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

  // not_plant retry
  retryContent: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  retryMark: {
    fontSize: 32,
    color: 'rgba(180,165,140,0.55)',
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
    marginBottom: 44,
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
});
