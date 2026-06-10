/**
 * AnimatedSplashFallback — Skia-free premium splash (Expo Go / pre-Skia binary).
 * Reanimated + svg only. Same dark, luxurious direction & timing as the Skia
 * version, minus the canvas particles. Same onDone contract.
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const BG_TOP = '#0E1A12';
const GOLD = '#CBB682';
const SAGE = '#B7CE8F';
const TOTAL_DURATION = 4000;

const LEAF = 'M12 2 C18 6 22 12 12 22 C2 12 6 6 12 2 Z M12 4 L12 20';

interface Props { onDone: () => void }

const DriftLeaf: React.FC<{ x: number; delay: number; dur: number; size: number; op: number }> = ({ x, delay, dur, size, op }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.linear }), -1, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(t.value * Math.PI) * op,
    transform: [{ translateX: x + (t.value - 0.5) * 40 }, { translateY: -30 + t.value * (H * 0.85) }, { rotate: `${t.value * 90}deg` }],
  }));
  return (
    <Animated.View style={[styles.drift, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={LEAF} fill={SAGE} /></Svg>
    </Animated.View>
  );
};

export const AnimatedSplashFallback: React.FC<Props> = ({ onDone }) => {
  const calledRef = useRef(false);
  const markScale = useSharedValue(0.7);
  const markOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(12);
  const tagOpacity = useSharedValue(0);
  const container = useSharedValue(1);

  const finish = useCallback(() => { if (calledRef.current) return; calledRef.current = true; onDone(); }, [onDone]);

  const drifts = useMemo(() => [
    { x: W * 0.2, delay: 600, dur: 7000, size: 26, op: 0.14 },
    { x: W * 0.55, delay: 1600, dur: 8200, size: 20, op: 0.12 },
    { x: W * 0.78, delay: 1000, dur: 7600, size: 30, op: 0.10 },
  ], []);

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);
    markScale.value = withDelay(200, withTiming(1, { duration: 1000, easing: easeOut }));
    markOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    wordOpacity.value = withDelay(900, withTiming(1, { duration: 700, easing: easeOut }));
    wordY.value = withDelay(900, withTiming(0, { duration: 700, easing: easeOut }));
    tagOpacity.value = withDelay(1300, withTiming(1, { duration: 600 }));
    container.value = withDelay(TOTAL_DURATION - 450, withTiming(0, { duration: 450, easing: easeOut }));
    const t = setTimeout(finish, TOTAL_DURATION);
    return () => { clearTimeout(t); finish(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value, transform: [{ scale: markScale.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value, transform: [{ translateY: wordY.value }] }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      {drifts.map((d, i) => <DriftLeaf key={i} {...d} />)}

      <View style={styles.center}>
        <Animated.View style={[styles.mark, markStyle]}>
          <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" stroke={GOLD} strokeWidth={1.3} strokeLinejoin="round" />
            <Path d="M12 3V21" stroke={GOLD} strokeWidth={1} strokeLinecap="round" opacity={0.7} />
            <Path d="M12 12C9.7 13.9 6.8 13.9 5.2 15.5M12 15C14.3 16.8 17.2 16.1 18.8 17.6" stroke={SAGE} strokeWidth={0.9} strokeLinecap="round" opacity={0.7} />
          </Svg>
        </Animated.View>

        <Animated.Text style={[styles.brand, wordStyle]}>Lawnup</Animated.Text>
        <View style={styles.rule} />
        <Animated.Text style={[styles.tag, tagStyle]}>YOUR AI PLANT COMPANION</Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, backgroundColor: BG_TOP, alignItems: 'center', justifyContent: 'center', zIndex: theme.z.splash, overflow: 'hidden' },
  drift: { position: 'absolute', top: 0 },
  center: { alignItems: 'center' },
  mark: { marginBottom: theme.spacing.xl },
  brand: { fontFamily: theme.fonts.serifMediumItalic, fontSize: 46, color: '#F2EEE3', letterSpacing: 0.5 },
  rule: { width: 34, height: 1, backgroundColor: GOLD, opacity: 0.6, marginVertical: 14 },
  tag: { fontFamily: theme.fonts.sansMedium, fontSize: 10.5, color: 'rgba(203,182,126,0.78)', letterSpacing: 3.4 },
});
