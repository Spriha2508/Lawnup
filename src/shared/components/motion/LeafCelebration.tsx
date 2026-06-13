/**
 * LeafCelebration — a lightweight, dependency-free "success" burst.
 *
 * Pure Reanimated + react-native-svg (no Skia), so it always plays. A small
 * fan of leaves + blossoms erupts upward from an origin, arcs under gravity,
 * spins, and fades — the reward moment when a scan succeeds or a plant is saved.
 *
 * Plays once on mount. Decorative only (pointerEvents="none").
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width: W } = Dimensions.get('window');

const COLORS = ['#5E7F61', '#6FA06B', '#88B07E', '#4E7C4A', '#F4A6C0', '#FFFFFF', '#E0A93F'];
const N = 20;

const rnd = (s: number) => { const v = Math.sin(s * 99.13) * 43758.5; return v - Math.floor(v); };
const leafD = (L: number) => {
  const w = L * 0.5;
  return `M0 0 C ${L * 0.5} ${-w} ${L} ${-w * 0.4} ${L} 0 C ${L} ${w * 0.4} ${L * 0.5} ${w} 0 0 Z`;
};

type Part = { angle: number; dist: number; size: number; rot: number; color: string; delay: number };
const PARTS: Part[] = Array.from({ length: N }, (_, i) => ({
  // fan biased upward (−90°) with spread
  angle: -Math.PI / 2 + (rnd(i) - 0.5) * 2.5,
  dist: 80 + rnd(i + 9) * 150,
  size: 7 + rnd(i + 3) * 7,
  rot: (rnd(i + 5) - 0.5) * 560,
  color: COLORS[i % COLORS.length],
  delay: (i % 6) * 28,
}));

const Particle: React.FC<{ p: Part; ox: number; oy: number }> = ({ p, ox, oy }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(p.delay, withTiming(1, { duration: 1250, easing: Easing.out(Easing.cubic) }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => {
    const v = t.value;
    const x = Math.cos(p.angle) * p.dist * v;
    const y = Math.sin(p.angle) * p.dist * v + 240 * v * v; // gravity pulls back down
    const opacity = v < 0.12 ? v / 0.12 : 1 - (v - 0.12) / 0.88;
    return {
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${p.rot * v}deg` }, { scale: 0.5 + v * 0.7 }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: ox, top: oy }, style]} pointerEvents="none">
      <Svg width={p.size * 2} height={p.size * 2}><Path d={leafD(p.size)} fill={p.color} /></Svg>
    </Animated.View>
  );
};

export const LeafCelebration: React.FC<{ originY?: number }> = ({ originY = 140 }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {PARTS.map((p, i) => <Particle key={i} p={p} ox={W / 2} oy={originY} />)}
  </View>
);
