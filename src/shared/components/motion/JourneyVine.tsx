/**
 * JourneyVine — the living thread the splash plants.
 *
 * An organic vine up the LEFT EDGE that survives navigation (mounted once at
 * the app root). Enriched:
 *   · faint dotted PATH-AHEAD — you can sense where the journey leads
 *   · glow under-stroke + bright core (a thread of light, not a line)
 *   · a PULSING GROWING TIP that rides the vine's end as it grows
 *   · curling TENDRILS that spiral out as each milestone is passed
 *   · gold BLOSSOMS that open (scale + unfurl-rotate) at each milestone
 *   · completion: the tip BLOOMS with a particle burst, then the vine rests
 *
 * The ONLY progress indicator across the onboarding journey.
 * Decorative (pointerEvents="none"), Reanimated + react-native-svg, UI-thread.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  makeMutable, useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withDelay, withRepeat, interpolate, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { height: H } = Dimensions.get('window');
const { color: C, motion: M, z: Z } = theme;

const VINE_LEN = Math.ceil(H * 1.15);

// ── module-level state (set on navigation; survives screen changes) ──────────
export const vineProgress = makeMutable(0);
const vineBloom = makeMutable(0);
const vineVisible = makeMutable(0);
let bloomed = false;

const PROGRESS: Record<string, number> = {
  Landing: 0.06, Login: 0.06, ForgotPassword: 0.06,
  Signup: 0.16,
  Welcome: 0.3,
  Location: 0.45, PlaceType: 0.6, SkillLevel: 0.75, PlantsType: 0.9,
  Goal: 1.0,
};

export function setVineForRoute(name?: string) {
  if (!name) return;
  if (name in PROGRESS) {
    vineVisible.value = withTiming(1, { duration: 500 });
    vineProgress.value = withTiming(PROGRESS[name], { duration: 1100, easing: M.ease.organic });
  } else {
    vineProgress.value = withTiming(1, { duration: 700, easing: M.ease.smooth });
    if (!bloomed) {
      bloomed = true;
      vineVisible.value = withTiming(1, { duration: 300 });
      vineBloom.value = withDelay(600, withTiming(1, { duration: 1100, easing: M.ease.decelerate }));
      vineVisible.value = withDelay(2400, withTiming(0, { duration: 900, easing: M.ease.smooth }));
    } else {
      vineVisible.value = withTiming(0, { duration: 400 });
    }
  }
}

// Organic S-curve up the left edge (bottom → top).
const SEGS: [number, number][][] = [
  [[14, H * 0.92], [4, H * 0.8], [26, H * 0.68], [12, H * 0.56]],
  [[12, H * 0.56], [2, H * 0.46], [26, H * 0.34], [13, H * 0.22]],
  [[13, H * 0.22], [6, H * 0.16], [18, H * 0.12], [14, H * 0.09]],
];
const VINE_D = `M14 ${H * 0.92} C4 ${H * 0.8} 26 ${H * 0.68} 12 ${H * 0.56} C2 ${H * 0.46} 26 ${H * 0.34} 13 ${H * 0.22} C6 ${H * 0.16} 18 ${H * 0.12} 14 ${H * 0.09}`;

// Pre-sampled points along the curve so the growing tip can ride the vine.
const TIP_PTS: { x: number; y: number }[] = (() => {
  const pts: { x: number; y: number }[] = [];
  const cubic = (a: number, b: number, c: number, d: number, t: number) =>
    (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
  for (const [p0, p1, p2, p3] of SEGS) {
    for (let i = 0; i < 34; i++) {
      const t = i / 33;
      pts.push({ x: cubic(p0[0], p1[0], p2[0], p3[0], t), y: cubic(p0[1], p1[1], p2[1], p3[1], t) });
    }
  }
  return pts;
})();

// Milestones: blossom + tendril per onboarding step.
const MILESTONES = [
  { t: 0.18, x: 16, y: H * 0.78, side: 1 },
  { t: 0.42, x: 10, y: H * 0.60, side: -1 },
  { t: 0.66, x: 18, y: H * 0.40, side: 1 },
  { t: 0.9,  x: 10, y: H * 0.24, side: -1 },
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── A curling tendril that spirals out as the vine passes its milestone ─────
const TENDRIL_LEN = 40;
const Tendril: React.FC<{ t: number; x: number; y: number; side: number }> = ({ t, x, y, side }) => {
  const props = useAnimatedProps(() => {
    const v = Math.min(1, Math.max(0, (vineProgress.value - t) * 6));
    return { strokeDashoffset: TENDRIL_LEN * (1 - v), strokeOpacity: 0.5 * vineVisible.value };
  });
  return (
    <Svg style={[StyleSheet.absoluteFill]} width={40} height={H} pointerEvents="none">
      <AnimatedPath
        d={`M${x} ${y} c${6 * side} -2 ${10 * side} 3 ${6 * side} 7 c${-3 * side} 3 ${-6 * side} 0 ${-4 * side} -3`}
        stroke={C.primarySoft} strokeWidth={1.1} fill="none" strokeLinecap="round"
        strokeDasharray={TENDRIL_LEN} animatedProps={props}
      />
    </Svg>
  );
};

// ── A gold blossom that opens at each milestone ──────────────────────────────
const Blossom: React.FC<{ t: number; x: number; y: number; side: number }> = ({ t, x, y, side }) => {
  const style = useAnimatedStyle(() => {
    const v = Math.min(1, Math.max(0, (vineProgress.value - t) * 6));
    return {
      opacity: v * vineVisible.value,
      transform: [{ rotate: `${(1 - v) * -80 * side}deg` }, { scale: 0.3 + v * 0.7 }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: x + side * 7 - 7, top: y - 7 }, style]} pointerEvents="none">
      <Svg width={14} height={14} viewBox="0 0 14 14">
        {[0, 72, 144, 216, 288].map((a) => (
          <Circle key={a} cx={7 + Math.cos((a * Math.PI) / 180) * 3.6} cy={7 + Math.sin((a * Math.PI) / 180) * 3.6} r={2.4} fill={C.secondary} opacity={0.9} />
        ))}
        <Circle cx={7} cy={7} r={2} fill="#FFE9B8" />
      </Svg>
    </Animated.View>
  );
};

// ── The growing tip — a breathing point of light riding the vine's end ──────
const GrowingTip: React.FC = () => {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => {
    const idx = Math.min(TIP_PTS.length - 1, Math.max(0, Math.round(vineProgress.value * (TIP_PTS.length - 1))));
    const pt = TIP_PTS[idx];
    return {
      opacity: vineVisible.value * (0.6 + pulse.value * 0.4) * (vineProgress.value > 0.02 ? 1 : 0),
      transform: [{ translateX: pt.x - 9 }, { translateY: pt.y - 9 }, { scale: 0.85 + pulse.value * 0.3 }],
    };
  });
  return (
    <Animated.View style={[styles.abs, style]} pointerEvents="none">
      <Svg width={18} height={18}>
        <Defs><RadialGradient id="jv-tip" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#D9FBE5" stopOpacity={1} />
          <Stop offset="0.45" stopColor={C.primary} stopOpacity={0.55} />
          <Stop offset="1" stopColor={C.primary} stopOpacity={0} />
        </RadialGradient></Defs>
        <Circle cx={9} cy={9} r={9} fill="url(#jv-tip)" />
      </Svg>
    </Animated.View>
  );
};

// ── Completion bloom particles from the vine tip ─────────────────────────────
const BloomDot: React.FC<{ i: number }> = ({ i }) => {
  const style = useAnimatedStyle(() => {
    const p = vineBloom.value;
    const a = (i / 7) * Math.PI - Math.PI * 0.5 - 0.3;
    return {
      opacity: Math.sin(p * Math.PI) * 0.85,
      transform: [
        { translateX: 14 + Math.cos(a) * p * (26 + i * 5) },
        { translateY: H * 0.09 + Math.sin(a) * p * (30 + i * 4) - p * 18 },
        { scale: 0.5 + p * 0.6 },
      ],
    };
  });
  return <Animated.View style={[{ position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: i % 2 ? C.primary : C.secondary }, style]} pointerEvents="none" />;
};

export const JourneyVine: React.FC = () => {
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withRepeat(withTiming(1, { duration: M.loop.breath, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const vineProps = useAnimatedProps(() => ({ strokeDashoffset: VINE_LEN * (1 - vineProgress.value) }));
  const wrapStyle = useAnimatedStyle(() => ({
    opacity: vineVisible.value,
    transform: [{ translateX: interpolate(sway.value, [0, 1], [-1.5, 1.5]) }],
  }));

  const dots = useMemo(() => Array.from({ length: 7 }, (_, i) => i), []);

  return (
    <Animated.View style={[styles.root, wrapStyle]} pointerEvents="none">
      <Svg width={40} height={H}>
        {/* faint path-ahead — the journey you can sense but haven't walked */}
        <Path d={VINE_D} stroke="rgba(74,222,128,0.10)" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeDasharray="2 7" />
        {/* glow under-stroke + bright core */}
        <AnimatedPath d={VINE_D} stroke={C.primary} strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" fill="none" strokeDasharray={VINE_LEN} animatedProps={vineProps} />
        <AnimatedPath d={VINE_D} stroke="#A9F5C5" strokeWidth={1.8} strokeLinecap="round" fill="none" strokeDasharray={VINE_LEN} animatedProps={vineProps} />
      </Svg>
      {MILESTONES.map((m, i) => <Tendril key={`t${i}`} {...m} />)}
      {MILESTONES.map((m, i) => <Blossom key={`b${i}`} {...m} />)}
      <GrowingTip />
      {dots.map((i) => <BloomDot key={i} i={i} />)}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: Z.header + 1 },
  abs: { position: 'absolute', top: 0, left: 0 },
});
