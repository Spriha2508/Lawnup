/**
 * AmbientBackground — a calm "living gradient" for premium onboarding/auth.
 *
 * Soft radial light-orbs drift + breathe very slowly (16–22s loops) over the
 * cream canvas, giving organic depth without noise. Pure Reanimated + svg
 * (no Skia / native gradient dep), UI-thread, decorative (pointerEvents none).
 *
 * Shared across Welcome → Auth → Onboarding for visual cohesion.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const P = theme.palette;

type Orb = {
  color: string; size: number; x: number; y: number;
  dx: number; dy: number; grow: number; opacity: number;
  duration: number; delay: number;
};

const ORBS: Orb[] = [
  { color: P.green[400],      size: W * 1.15, x: -W * 0.32, y: -H * 0.06, dx: 22, dy: 30,  grow: 0.08, opacity: 0.45, duration: 17000, delay: 0 },
  { color: P.mint[500],       size: W * 0.95, x:  W * 0.45, y:  H * 0.16, dx: -26, dy: 22, grow: 0.10, opacity: 0.40, duration: 21000, delay: 1200 },
  { color: P.terracotta[400], size: W * 0.85, x:  W * 0.08, y:  H * 0.66, dx: 18, dy: -24, grow: 0.07, opacity: 0.30, duration: 23000, delay: 600 },
  { color: P.green[300],      size: W * 0.70, x:  W * 0.62, y:  H * 0.74, dx: -16, dy: 18, grow: 0.09, opacity: 0.28, duration: 19000, delay: 1800 },
];

const Orb: React.FC<{ orb: Orb; id: number }> = ({ orb, id }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      orb.delay,
      withRepeat(withTiming(1, { duration: orb.duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      transform: [
        { translateX: -orb.dx + p * orb.dx * 2 },
        { translateY: -orb.dy + p * orb.dy * 2 },
        { scale: 1 + p * orb.grow },
      ],
      opacity: orb.opacity * (0.82 + p * 0.18),
    };
  });

  const gid = `ambient-orb-${id}`;
  return (
    <Animated.View style={[{ position: 'absolute', left: orb.x, top: orb.y, width: orb.size, height: orb.size }, style]}>
      <Svg width={orb.size} height={orb.size}>
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={orb.color} stopOpacity={1} />
            <Stop offset="100%" stopColor={orb.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={orb.size / 2} cy={orb.size / 2} r={orb.size / 2} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
};

export const AmbientBackground: React.FC<{ tint?: string }> = ({ tint }) => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? theme.color.canvas }]} pointerEvents="none">
    {ORBS.map((orb, i) => (
      <Orb key={i} orb={orb} id={i} />
    ))}
  </View>
);
