/**
 * NatureTransition — a full-screen "living curtain" that sweeps across on every
 * screen change: drifting leaves + falling water droplets (with ripples) over a
 * soft green wash. Adds lifelike continuity between screens.
 *
 * Decorative overlay only — pointerEvents="none", so it never blocks taps and
 * never alters navigation. Reanimated + react-native-svg, all UI-thread.
 *
 * Trigger imperatively from anywhere (we wire it to NavigationContainer's
 * onStateChange in App.tsx):
 *     import { playNatureTransition } from '@shared/components/motion/NatureTransition';
 *     playNatureTransition();
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const { palette: P, motion: M, z: Z } = theme;

const GOLD = P.marigold[300];
const SAGE = P.green[400];
const MINT = P.mint[400];
const GREEN = P.green[500];
const WATER = 'rgba(206,228,238,0.92)';
const LEAF_PATH = 'M0 -8 C6 -3 6 6 0 9 C-6 6 -6 -3 0 -8 Z';

const DUR = 1150;            // one curtain pass
const THROTTLE = 420;        // ignore compound state-change bursts

// ── module-level imperative trigger ──────────────────────────────────────────
let _play: (() => void) | null = null;
export function playNatureTransition() { _play?.(); }

// ── A leaf that falls the full height once, swaying + spinning ───────────────
type LeafSeed = { x: number; sway: number; delay: number; rot: number; size: number; color: string };
const Leaf: React.FC<{ seed: LeafSeed }> = ({ seed }) => {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withDelay(seed.delay, withTiming(1, { duration: DUR, easing: M.ease.smooth })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => {
    const p = t.value;
    const fade = p < 0.82 ? Math.min(1, p * 5) : Math.max(0, (1 - p) / 0.18);
    return {
      opacity: fade * 0.9,
      transform: [
        { translateX: seed.x + Math.sin(p * Math.PI * 2) * seed.sway },
        { translateY: -60 + p * (H + 120) },
        { rotate: `${seed.rot + p * 200}deg` },
        { scale: seed.size },
      ],
    };
  });
  return (
    <Animated.View style={[styles.p, style]} pointerEvents="none">
      <Svg width={24} height={24} viewBox="0 0 24 24"><Path d={LEAF_PATH} transform="translate(12 12)" fill={seed.color} /></Svg>
    </Animated.View>
  );
};

// ── A droplet that falls and ripples once ────────────────────────────────────
type DropSeed = { x: number; delay: number; landY: number };
const Drop: React.FC<{ seed: DropSeed }> = ({ seed }) => {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withDelay(seed.delay, withTiming(1, { duration: DUR, easing: Easing.in(Easing.quad) })); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const drop = useAnimatedStyle(() => {
    const p = Math.min(1, t.value / 0.6);
    return { opacity: t.value < 0.62 ? 0.9 : 0, transform: [{ translateX: seed.x }, { translateY: -30 + p * p * (seed.landY + 30) }, { scaleY: 1 + p * 0.6 }] };
  });
  const ripple = useAnimatedStyle(() => {
    const r = t.value > 0.58 && t.value < 0.9 ? (t.value - 0.58) / 0.32 : 0;
    return { opacity: r > 0 ? (1 - r) * 0.55 : 0, transform: [{ translateX: seed.x - 10 }, { translateY: seed.landY - 10 }, { scale: 0.3 + r * 1.4 }] };
  });
  return (
    <>
      <Animated.View style={[styles.p, drop]} pointerEvents="none">
        <Svg width={9} height={13} viewBox="0 0 8 12"><Path d="M4 0 C7 5 7 9 4 11 C1 9 1 5 4 0 Z" fill={WATER} /></Svg>
      </Animated.View>
      <Animated.View style={[styles.p, ripple]} pointerEvents="none">
        <Svg width={22} height={22} viewBox="0 0 20 20"><Circle cx={10} cy={10} r={8} stroke={WATER} strokeWidth={1.2} fill="none" /></Svg>
      </Animated.View>
    </>
  );
};

// ── One curtain pass — remounted per trigger via key ─────────────────────────
const Burst: React.FC = () => {
  const leaves = useMemo<LeafSeed[]>(() => {
    const col = (i: number) => (i % 3 === 0 ? GOLD : i % 3 === 1 ? SAGE : MINT);
    const a: LeafSeed[] = [];
    for (let i = 0; i < 14; i++) a.push({ x: W * (0.04 + i * 0.069), sway: 18 + (i % 4) * 8, delay: (i % 7) * 45, rot: i * 30, size: 0.7 + (i % 3) * 0.22, color: col(i) });
    return a;
  }, []);
  const drops = useMemo<DropSeed[]>(() => {
    const a: DropSeed[] = [];
    for (let i = 0; i < 7; i++) a.push({ x: W * (0.1 + i * 0.13), delay: (i % 5) * 70 + 120, landY: H * (0.3 + (i % 3) * 0.2) });
    return a;
  }, []);
  const wash = useSharedValue(0);
  useEffect(() => { wash.value = withTiming(1, { duration: DUR, easing: M.ease.smooth }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const washStyle = useAnimatedStyle(() => {
    const p = wash.value;
    return { opacity: (p < 0.5 ? p * 2 : (1 - p) * 2) * 0.16 };
  });
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: GREEN }, washStyle]} pointerEvents="none" />
      {leaves.map((l, i) => <Leaf key={`l${i}`} seed={l} />)}
      {drops.map((d, i) => <Drop key={`d${i}`} seed={d} />)}
    </>
  );
};

export const NatureTransition: React.FC = () => {
  const [burstKey, setBurstKey] = useState(0);
  const [active, setActive] = useState(false);
  const lastRef = useRef(0);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = useCallback(() => {
    const now = Date.now();
    if (now - lastRef.current < THROTTLE) return;
    lastRef.current = now;
    setBurstKey(k => k + 1);
    setActive(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setActive(false), DUR + 140);
  }, []);

  useEffect(() => {
    _play = play;
    return () => { _play = null; if (hideRef.current) clearTimeout(hideRef.current); };
  }, [play]);

  if (!active) return null;
  return (
    <Animated.View style={styles.root} pointerEvents="none">
      <Burst key={burstKey} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: Z.toast + 1, overflow: 'hidden' },
  p: { position: 'absolute', top: 0, left: 0 },
});
