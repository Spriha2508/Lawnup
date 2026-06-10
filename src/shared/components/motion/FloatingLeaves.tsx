/**
 * FloatingLeaves — slow, parallax botanical drift for backgrounds.
 *
 * Pure Reanimated (UI thread) + react-native-svg leaves. Each leaf drifts on a
 * gentle, looping vertical bob + sway at its own speed → soft depth/parallax.
 * Decorative only: pointerEvents none, sits behind content.
 *
 * Used by the auth screens; reusable on any calm screen that wants ambience.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');

type LeafSpec = {
  x: number; y: number; size: number; rotate: number;
  drift: number; sway: number; duration: number; delay: number; color: string;
  opacity: number;
};

const C = theme.palette;

// Hand-placed for a balanced, uncluttered composition.
const LEAVES: LeafSpec[] = [
  { x: W * 0.08, y: H * 0.14, size: 46, rotate: -18, drift: 22, sway: 14, duration: 7000, delay: 0,    color: C.green[400], opacity: 0.26 },
  { x: W * 0.78, y: H * 0.10, size: 64, rotate: 24,  drift: 26, sway: 16, duration: 9000, delay: 600,  color: C.green[500], opacity: 0.20 },
  { x: W * 0.84, y: H * 0.42, size: 38, rotate: -40, drift: 20, sway: 20, duration: 6500, delay: 1200, color: C.mint[500],  opacity: 0.28 },
  { x: W * 0.04, y: H * 0.52, size: 54, rotate: 12,  drift: 24, sway: 14, duration: 8200, delay: 300,  color: C.green[400], opacity: 0.22 },
  { x: W * 0.70, y: H * 0.74, size: 44, rotate: -8,  drift: 20, sway: 16, duration: 7600, delay: 900,  color: C.green[300], opacity: 0.24 },
  { x: W * 0.16, y: H * 0.80, size: 34, rotate: 30,  drift: 16, sway: 12, duration: 6800, delay: 1500, color: C.terracotta[400], opacity: 0.20 },
];

// Unit leaf (almond) — scaled per spec.
const LEAF_D =
  'M12 2 C18 6 22 12 12 22 C2 12 6 6 12 2 Z M12 4 L12 20';

const Leaf: React.FC<{ spec: LeafSpec }> = ({ spec }) => {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: spec.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      transform: [
        { translateY: -spec.drift + p * spec.drift * 2 },
        { translateX: -spec.sway + p * spec.sway * 2 },
        { rotate: `${spec.rotate + (p - 0.5) * 10}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.leaf,
        { left: spec.x, top: spec.y, opacity: spec.opacity },
        style,
      ]}
    >
      <Svg width={spec.size} height={spec.size} viewBox="0 0 24 24" fill="none">
        <Path d={LEAF_D} fill={spec.color} />
      </Svg>
    </Animated.View>
  );
};

export const FloatingLeaves: React.FC<{ specs?: LeafSpec[] }> = ({ specs }) => {
  const data = useMemo(() => specs ?? LEAVES, [specs]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {data.map((s, i) => (
        <Leaf key={i} spec={s} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  leaf: { position: 'absolute' },
});
