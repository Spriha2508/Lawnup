/**
 * AmbientBackground — a cinematic "living gradient" for premium screens.
 *
 * Layered for depth:
 *   · base cream canvas
 *   · a soft luminous halo high-center (light from above)
 *   · slow drifting colour light-orbs (mint / green / terracotta)
 *   · a faint warm grounding wash at the bottom
 *   · an optional whisper-soft vignette for edge depth
 *
 * Pure Reanimated + svg (no Skia / native gradient dep), UI-thread, decorative.
 * Shared across Splash→Welcome→Auth→Onboarding for one continuous atmosphere.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const P = theme.palette;

type OrbSpec = {
  color: string; size: number; x: number; y: number;
  dx: number; dy: number; grow: number; opacity: number; duration: number; delay: number;
};

const ORBS: OrbSpec[] = [
  // Luminous halo, high centre — "light from above"
  { color: P.mint[300],       size: W * 1.5,  x: -W * 0.25, y: -H * 0.22, dx: 14, dy: 18,  grow: 0.06, opacity: 0.38, duration: 24000, delay: 0 },
  { color: P.green[400],      size: W * 1.15, x: -W * 0.34, y:  H * 0.02, dx: 24, dy: 30,  grow: 0.09, opacity: 0.42, duration: 17000, delay: 600 },
  { color: P.mint[500],       size: W * 0.95, x:  W * 0.46, y:  H * 0.18, dx: -26, dy: 22, grow: 0.10, opacity: 0.36, duration: 21000, delay: 1200 },
  { color: P.terracotta[400], size: W * 0.9,  x:  W * 0.04, y:  H * 0.62, dx: 18, dy: -24, grow: 0.08, opacity: 0.28, duration: 23000, delay: 900 },
  { color: P.green[300],      size: W * 0.78, x:  W * 0.6,  y:  H * 0.72, dx: -16, dy: 18, grow: 0.09, opacity: 0.26, duration: 19000, delay: 1800 },
];

const Orb: React.FC<{ orb: OrbSpec; id: number; animated: boolean }> = ({ orb, id, animated }) => {
  const t = useSharedValue(animated ? 0 : 0.5);
  useEffect(() => {
    if (!animated) return;
    t.value = withDelay(
      orb.delay,
      withRepeat(withTiming(1, { duration: orb.duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [animated]); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      transform: [
        { translateX: -orb.dx + p * orb.dx * 2 },
        { translateY: -orb.dy + p * orb.dy * 2 },
        { scale: 1 + p * orb.grow },
      ],
      opacity: orb.opacity * (0.8 + p * 0.2),
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

export const AmbientBackground: React.FC<{ tint?: string; vignette?: boolean; animated?: boolean }> = ({
  tint, vignette = true, animated = true,
}) => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? theme.color.canvas }]} pointerEvents="none">
    {ORBS.map((orb, i) => (
      <Orb key={i} orb={orb} id={i} animated={animated} />
    ))}
    {vignette && (
      <Svg style={StyleSheet.absoluteFill} width={W} height={H} pointerEvents="none">
        <Defs>
          {/* warm grounding wash, bottom */}
          <LinearGradient id="ambient-ground" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.55" stopColor={P.terracotta[200]} stopOpacity={0} />
            <Stop offset="1" stopColor={P.terracotta[300]} stopOpacity={0.18} />
          </LinearGradient>
          {/* whisper vignette for edge depth */}
          <RadialGradient id="ambient-vig" cx="50%" cy="42%" r="75%">
            <Stop offset="0.6" stopColor="#1A2416" stopOpacity={0} />
            <Stop offset="1" stopColor="#1A2416" stopOpacity={0.07} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#ambient-ground)" />
        <Rect x="0" y="0" width={W} height={H} fill="url(#ambient-vig)" />
      </Svg>
    )}
  </View>
);
