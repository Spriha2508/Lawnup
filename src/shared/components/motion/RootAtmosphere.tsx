/**
 * RootAtmosphere — the ONE continuous living world.
 *
 * Mounted ONCE at the app root, behind the (transparent) navigator. It never
 * unmounts, so its orbs and spores keep breathing and drifting across every
 * screen transition — the world doesn't reset, the user moves through it.
 *
 * Intensity ramps as the user goes deeper (Login < Welcome < Home) via the
 * module-level `atmosphereDepth` shared value, animated on each navigation by
 * `setAtmosphereForRoute`. Particles are NEVER added/removed (that would reset
 * them) — their opacity scales with depth instead.
 *
 * Light palette (brand stays light). Pure Reanimated + light SVG, UI-thread,
 * decorative (pointerEvents="none").
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  makeMutable, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, interpolate, interpolateColor, Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const { color: C, motion: M } = theme;

// ── module-level "depth": how alive the world is for the current screen (0..1) ─
export const atmosphereDepth = makeMutable(0);

// Route → depth. Deeper into the app = more present. Unmapped routes = full.
const DEPTH: Record<string, number> = {
  Landing: 0.2, Login: 0.25, ForgotPassword: 0.25, Signup: 0.4,
  Welcome: 0.5,
  Location: 0.62, PlaceType: 0.62, SkillLevel: 0.62, PlantsType: 0.62, Goal: 0.62,
  Home: 1.0,
};

export function setAtmosphereForRoute(name?: string) {
  const d = name && name in DEPTH ? DEPTH[name] : 1.0;
  atmosphereDepth.value = withTiming(d, { duration: M.duration.cinematic, easing: M.ease.smooth });
}

type NavState = { index?: number; routes: { name: string; state?: unknown }[] } | undefined;
export function getActiveRouteName(state: NavState): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index ?? 0];
  return route?.state ? getActiveRouteName(route.state as NavState) : route?.name;
}

// ── A breathing ambient orb whose opacity tracks depth ───────────────────────
type OrbProps = { id: number; x: number; y: number; size: number; color: string; oFrom: number; oTo: number; dur: number; dx: number; dy: number; delay: number };
const Orb: React.FC<OrbProps> = ({ id, x, y, size, color, oFrom, oTo, dur, dx, dy, delay }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(atmosphereDepth.value, [0, 1], [oFrom, oTo]) * (0.85 + t.value * 0.15),
    transform: [
      { translateX: -dx + t.value * dx * 2 },
      { translateY: -dy + t.value * dy * 2 },
      { scale: 1 + t.value * 0.04 },
    ],
  }));
  const gid = `root-orb-${id}`;
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gid})`} />
      </Svg>
    </Animated.View>
  );
};

// ── A drifting spore (tiny dot) — always alive, opacity scales with depth ─────
type SporeSeed = { x: number; y0: number; y1: number; sway: number; dur: number; phase: number; r: number; color: string };
const Spore: React.FC<{ seed: SporeSeed }> = ({ seed }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(seed.phase * seed.dur, withRepeat(withTiming(1, { duration: seed.dur, easing: Easing.linear }), -1, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => {
    const p = t.value;
    const env = Math.sin(p * Math.PI);
    return {
      opacity: env * 0.62 * interpolate(atmosphereDepth.value, [0, 1], [0.45, 1]),
      transform: [
        { translateX: seed.x + Math.sin(p * Math.PI * 2 + seed.phase * 6) * seed.sway },
        { translateY: seed.y0 + p * (seed.y1 - seed.y0) },
      ],
    };
  });
  return <Animated.View style={[{ position: 'absolute', width: seed.r * 2, height: seed.r * 2, borderRadius: seed.r, backgroundColor: seed.color }, style]} pointerEvents="none" />;
};

export const RootAtmosphere: React.FC = () => {
  // 16 spores rendered always (never added/removed → never resets); depth dims them.
  const spores = useMemo<SporeSeed[]>(() => {
    const col = (i: number) => (i % 3 === 0 ? C.secondary : i % 3 === 1 ? C.primary : C.accent);
    return Array.from({ length: 16 }, (_, i) => ({
      x: W * ((i * 0.0625 + 0.03) % 1),
      y0: H * (0.15 + (i % 5) * 0.17),
      y1: H * (0.05 + (i % 4) * 0.12),
      sway: 12 + (i % 4) * 8,
      dur: 13000 + (i % 6) * 1800,
      phase: (i * 0.137) % 1,
      r: 1.4 + (i % 3) * 0.8,
      color: col(i),
    }));
  }, []);

  // Deeper into the app, the warm ivory daylight gently brightens (never a cave).
  const baseStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(atmosphereDepth.value, [0, 1], [C.canvas, '#FCFAF4']),
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, baseStyle]} pointerEvents="none">
      {/* orchid bloom orb, upper-right */}
      <Orb id={0} x={W * 0.1} y={-H * 0.18} size={W * 1.4} color={C.primary} oFrom={0.10} oTo={0.18} dur={M.loop.breath + 1800} dx={20} dy={24} delay={0} />
      {/* warm brass orb, lower-left */}
      <Orb id={1} x={-W * 0.42} y={H * 0.48} size={W * 1.35} color={C.secondary} oFrom={0.12} oTo={0.22} dur={M.loop.breath + 3200} dx={24} dy={-20} delay={800} />
      {spores.map((s, i) => <Spore key={i} seed={s} />)}
    </Animated.View>
  );
};
