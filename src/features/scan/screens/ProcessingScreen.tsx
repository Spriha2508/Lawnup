import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import { useScanFlow } from '../hooks/useScanFlow';
import { ProcessingAnimation } from '../components/ProcessingAnimation';
import { colors } from '../../../constants/colors';
import { logger } from '../../../shared/utils/logger';
import type { ScanStackParamList } from '../../../navigation/types';

const { width: SW, height: SH } = Dimensions.get('window');
type Nav = StackNavigationProp<ScanStackParamList, 'Processing'>;
type Route = RouteProp<ScanStackParamList, 'Processing'>;

export const ProcessingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri } = route.params;

  const { runScan } = useScanFlow();
  const hasStarted = useRef(false);

  // Content fade in
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity]);

  const startScan = useCallback(async () => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const scanId = await runScan(imageUri);

    if (scanId) {
      // Fade out before transitioning
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('ScanResult', { scanId });
      });
    } else {
      // Scan failed — go back
      logger.scan.failed('useScanFlow returned null');
      navigation.goBack();
    }
  }, [imageUri, runScan, navigation, contentOpacity]);

  useEffect(() => {
    startScan();
  }, [startScan]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" hidden />

      {/* Background: captured image, heavily darkened */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.bgImage}
          resizeMode="cover"
          blurRadius={12}
        />
      )}
      <View style={styles.darkOverlay} />

      {/* Subtle radial-like glow centered */}
      <View style={styles.centerGlow} />

      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <ProcessingAnimation />
      </Animated.View>
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
    backgroundColor: `${colors.primary}18`,
    alignSelf: 'center',
    top: SH / 2 - 160,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
});
