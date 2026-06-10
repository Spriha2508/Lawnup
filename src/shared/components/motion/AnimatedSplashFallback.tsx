/**
 * AnimatedSplashFallback — Skia-free splash used when the native Skia module
 * isn't present (Expo Go / pre-Skia binary). Reanimated + SVG only, so it boots
 * everywhere. Same `onDone` contract and ~2.6s timing as the Skia version.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { color: C } = theme;
const TOTAL_DURATION = 2400;

interface Props {
  onDone: () => void;
}

export const AnimatedSplashFallback: React.FC<Props> = ({ onDone }) => {
  const calledRef = useRef(false);

  const iconScale  = useSharedValue(0.6);
  const iconOpacity = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordY       = useSharedValue(16);
  const tagOpacity  = useSharedValue(0);
  const container   = useSharedValue(1);

  const finish = useCallback(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const { spring, ease } = theme.motion;
    iconScale.value   = withSpring(1, spring.bouncy);
    iconOpacity.value = withTiming(1, { duration: 500 });
    wordOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    wordY.value       = withDelay(400, withSpring(0, spring.gentle));
    tagOpacity.value  = withDelay(700, withTiming(1, { duration: 450 }));
    container.value   = withDelay(TOTAL_DURATION - 450, withTiming(0, { duration: 450, easing: ease.smooth }));

    const t = setTimeout(finish, TOTAL_DURATION);
    return () => { clearTimeout(t); finish(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: iconOpacity.value, transform: [{ scale: iconScale.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value, transform: [{ translateY: wordY.value }] }));
  const tagStyle  = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      <Animated.View style={[styles.iconBox, iconStyle]}>
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3C12 3 5 6 5 13C5 17.4183 8.13 21 12 21C15.87 21 19 17.4183 19 13C19 6 12 3 12 3Z" fill="rgba(255,255,255,0.94)" />
          <Path d="M12 3V21" stroke="rgba(111,148,62,0.4)" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M12 13C9.5 15 6.5 15 5 16.5M12 16C14.5 18 17.5 17.2 19 18" stroke="rgba(111,148,62,0.3)" strokeWidth={1.1} strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <Animated.Text style={[styles.brand, wordStyle]}>Lawnup</Animated.Text>
      <Animated.Text style={[styles.tag, tagStyle]}>YOUR AI PLANT COMPANION</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    zIndex: theme.z.splash,
  },
  iconBox: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: theme.spacing.xs, ...theme.shadows.cta,
  },
  brand: {
    fontFamily: theme.fonts.serifMediumItalic,
    fontSize: 44, color: C.textPrimary, letterSpacing: -0.5,
  },
  tag: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11, color: C.textMuted, letterSpacing: 3,
  },
});
