/**
 * AnimatedSplashSkia — premium, luxurious growth sequence.
 *
 * Deep moody backdrop + a single warm-gold light bloom → a refined botanical
 * line/leaf form draws and settles (slow, no bounce) → ambient life (drifting
 * leaves, gold dust motes, a falling water droplet) → wordmark → a soft cream
 * bloom eases into the app. Skia + Reanimated, UI-thread.
 *
 * Contract preserved: absolute overlay, calls onDone() once. ~4.2s, skip @1.5s.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useDerivedValue, useAnimatedStyle,
  withTiming, withDelay, withRepeat, cancelAnimation, Easing,
} from 'react-native-reanimated';
import {
  Canvas, Group, Path, Circle, Rect, LinearGradient, RadialGradient, vec,
} from '@shopify/react-native-skia';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const cx = W / 2;
const baseY = H * 0.56;

// ── Luxe palette ─────────────────────────────────────────────────────────────
const BG_TOP = '#0E1A12';
const BG_BOT = '#15110B';
const GOLD = '#CBB682';
const SAGE_LIGHT = '#B7CE8F';
const SAGE_DEEP = '#6E8C46';
const BLOOM = '#E3CE92';
const DROP = 'rgba(214,230,236,0.9)';
const CREAM = theme.color.canvas;
const mote = (a: number) => `rgba(203,182,126,${a})`;

// ── Refined botanical geometry ───────────────────────────────────────────────
const STEM = `M ${cx} ${baseY} C ${cx - 12} ${baseY - 58} ${cx + 12} ${baseY - 115} ${cx} ${baseY - 165}`;

const LEAF1 = `M ${cx + 2} ${baseY - 62} C ${cx + 20} ${baseY - 58} ${cx + 44} ${baseY - 66} ${cx + 50} ${baseY - 86} C ${cx + 40} ${baseY - 92} ${cx + 16} ${baseY - 78} ${cx + 2} ${baseY - 62} Z`;
const VEIN1 = `M ${cx + 4} ${baseY - 64} C ${cx + 22} ${baseY - 70} ${cx + 38} ${baseY - 78} ${cx + 48} ${baseY - 85}`;
const LEAF2 = `M ${cx - 2} ${baseY - 100} C ${cx - 20} ${baseY - 96} ${cx - 44} ${baseY - 104} ${cx - 50} ${baseY - 124} C ${cx - 40} ${baseY - 130} ${cx - 16} ${baseY - 116} ${cx - 2} ${baseY - 100} Z`;
const VEIN2 = `M ${cx - 4} ${baseY - 102} C ${cx - 22} ${baseY - 108} ${cx - 38} ${baseY - 116} ${cx - 48} ${baseY - 123}`;
const LEAF3 = `M ${cx + 1} ${baseY - 132} C ${cx + 14} ${baseY - 130} ${cx + 30} ${baseY - 136} ${cx + 36} ${baseY - 150} C ${cx + 28} ${baseY - 156} ${cx + 12} ${baseY - 144} ${cx + 1} ${baseY - 132} Z`;

const LEAF_TIP = { x: cx + 50, y: baseY - 86 }; // where the droplet falls from

const SKIP_AFTER = 1500;
const TOTAL_DURATION = 4200;

interface Props { onDone: () => void }

// ── Gold dust mote ───────────────────────────────────────────────────────────
type MoteSeed = { x: number; phase: number; sway: number; rise: number; size: number; maxOp: number; sp: number };
const Mote: React.FC<{ loop: { value: number }; seed: MoteSeed }> = ({ loop, seed }) => {
  const t = useDerivedValue(() => {
    const p = (loop.value + seed.phase) % 1;
    const x = seed.x + Math.sin((p + seed.sp) * Math.PI * 2) * seed.sway;
    const y = baseY + 30 - p * seed.rise;
    return [{ translateX: x }, { translateY: y }];
  });
  const op = useDerivedValue(() => {
    const p = (loop.value + seed.phase) % 1;
    return Math.sin(p * Math.PI) * seed.maxOp;
  });
  return (
    <Group transform={t} opacity={op}>
      <Circle cx={0} cy={0} r={seed.size} color={mote(1)} />
    </Group>
  );
};

// ── Ambient drifting leaf silhouette ─────────────────────────────────────────
const LEAF_MOTIF = 'M0 -6 C4 -2 4 4 0 7 C-4 4 -4 -2 0 -6 Z';
type DriftSeed = { x0: number; phase: number; drift: number; fall: number; size: number; rot: number; op: number };
const DriftLeaf: React.FC<{ loop: { value: number }; seed: DriftSeed }> = ({ loop, seed }) => {
  const t = useDerivedValue(() => {
    const p = (loop.value + seed.phase) % 1;
    const x = seed.x0 + p * seed.drift;
    const y = -20 + p * seed.fall;
    return [{ translateX: x }, { translateY: y }, { rotate: seed.rot + p * 3 }, { scale: seed.size }];
  });
  const op = useDerivedValue(() => {
    const p = (loop.value + seed.phase) % 1;
    return Math.sin(p * Math.PI) * seed.op;
  });
  return (
    <Group transform={t} opacity={op}>
      <Path path={LEAF_MOTIF} color={SAGE_LIGHT} />
    </Group>
  );
};

export const AnimatedSplashSkia: React.FC<Props> = ({ onDone }) => {
  const calledRef = useRef(false);
  const [skipReady, setSkipReady] = useState(false);

  const bloom = useSharedValue(0);
  const stemGrow = useSharedValue(0);
  const leaf1 = useSharedValue(0);
  const leaf2 = useSharedValue(0);
  const leaf3 = useSharedValue(0);
  const loop = useSharedValue(0);
  const drop = useSharedValue(0);
  const brightEnd = useSharedValue(0);

  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(12);
  const skipOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const motes = useMemo<MoteSeed[]>(() => Array.from({ length: 11 }, () => ({
    x: cx + (Math.random() - 0.5) * 150, phase: Math.random(), sway: 12 + Math.random() * 22,
    rise: 180 + Math.random() * 160, size: 0.8 + Math.random() * 1.4, maxOp: 0.25 + Math.random() * 0.4, sp: Math.random(),
  })), []);
  const drifts = useMemo<DriftSeed[]>(() => Array.from({ length: 4 }, (_, i) => ({
    x0: W * (0.15 + i * 0.22), phase: Math.random(), drift: (Math.random() - 0.5) * 90,
    fall: H * 0.7 + Math.random() * H * 0.3, size: 1 + Math.random() * 1.4, rot: Math.random() * 2, op: 0.10 + Math.random() * 0.10,
  })), []);

  const finish = useCallback(() => { if (calledRef.current) return; calledRef.current = true; onDone(); }, [onDone]);

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);
    bloom.value = withTiming(1, { duration: 900, easing: easeOut });
    stemGrow.value = withDelay(500, withTiming(1, { duration: 1200, easing: easeOut }));
    // slow, settled leaf reveal — NO bounce
    leaf1.value = withDelay(1250, withTiming(1, { duration: 800, easing: easeOut }));
    leaf2.value = withDelay(1500, withTiming(1, { duration: 800, easing: easeOut }));
    leaf3.value = withDelay(1750, withTiming(1, { duration: 800, easing: easeOut }));
    // ambient life
    loop.value = withDelay(1300, withRepeat(withTiming(1, { duration: 7000, easing: Easing.linear }), -1, false));
    drop.value = withDelay(2100, withRepeat(withTiming(1, { duration: 3400, easing: Easing.linear }), -1, false));
    // wordmark + soft cream bloom into the app
    wordOpacity.value = withDelay(2300, withTiming(1, { duration: 700, easing: easeOut }));
    wordY.value = withDelay(2300, withTiming(0, { duration: 700, easing: easeOut }));
    brightEnd.value = withDelay(TOTAL_DURATION - 750, withTiming(1, { duration: 650, easing: Easing.inOut(Easing.cubic) }));
    containerOpacity.value = withDelay(TOTAL_DURATION - 380, withTiming(0, { duration: 380, easing: easeOut }));

    const skipTimer = setTimeout(() => { setSkipReady(true); skipOpacity.value = withTiming(1, { duration: 500 }); }, SKIP_AFTER);
    const doneTimer = setTimeout(finish, TOTAL_DURATION);
    return () => { clearTimeout(skipTimer); clearTimeout(doneTimer); finish(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = useCallback(() => {
    if (!skipReady || calledRef.current) return;
    cancelAnimation(containerOpacity);
    containerOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(finish, 300);
  }, [skipReady, finish, containerOpacity]);

  // leaf transforms (origin = attach point, gentle scale-in)
  const leaf1T = useDerivedValue(() => [{ scale: leaf1.value }]);
  const leaf2T = useDerivedValue(() => [{ scale: leaf2.value }]);
  const leaf3T = useDerivedValue(() => [{ scale: leaf3.value }]);

  // droplet
  const dropT = useDerivedValue(() => {
    const p = Math.min(1, drop.value / 0.55);
    return [{ translateX: LEAF_TIP.x }, { translateY: LEAF_TIP.y + p * 70 }];
  });
  const dropOp = useDerivedValue(() => (drop.value < 0.55 ? Math.sin((drop.value / 0.55) * Math.PI) * 0.9 : 0));
  const rippleR = useDerivedValue(() => (drop.value > 0.5 && drop.value < 0.8 ? (drop.value - 0.5) / 0.3 * 12 : 0));
  const rippleOp = useDerivedValue(() => (drop.value > 0.5 && drop.value < 0.8 ? (1 - (drop.value - 0.5) / 0.3) * 0.4 : 0));

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value, transform: [{ translateY: wordY.value }] }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOpacity.value }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleSkip}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Deep moody backdrop */}
          <Rect x={0} y={0} width={W} height={H}>
            <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={[BG_TOP, BG_BOT]} />
          </Rect>

          {/* Warm gold light bloom behind the plant */}
          <Group opacity={bloom}>
            <Circle cx={cx} cy={baseY - 90} r={180}>
              <RadialGradient c={vec(cx, baseY - 90)} r={180} colors={[`${BLOOM}`, 'rgba(227,206,146,0)']} />
            </Circle>
          </Group>

          {/* Ambient drifting leaves (behind) */}
          {drifts.map((s, i) => <DriftLeaf key={i} loop={loop} seed={s} />)}

          {/* Stem — fine gold line that draws itself */}
          <Path path={STEM} style="stroke" strokeWidth={1.8} strokeCap="round" color={GOLD} start={0} end={stemGrow} opacity={0.92} />

          {/* Leaves — refined, gradient-filled, settle in slowly */}
          <Group transform={leaf1T} origin={vec(cx + 2, baseY - 62)} opacity={leaf1}>
            <Path path={LEAF1}>
              <LinearGradient start={vec(cx, baseY - 90)} end={vec(cx + 50, baseY - 60)} colors={[SAGE_LIGHT, SAGE_DEEP]} />
            </Path>
            <Path path={VEIN1} style="stroke" strokeWidth={0.9} color={GOLD} opacity={0.6} />
          </Group>
          <Group transform={leaf2T} origin={vec(cx - 2, baseY - 100)} opacity={leaf2}>
            <Path path={LEAF2}>
              <LinearGradient start={vec(cx, baseY - 128)} end={vec(cx - 50, baseY - 98)} colors={[SAGE_LIGHT, SAGE_DEEP]} />
            </Path>
            <Path path={VEIN2} style="stroke" strokeWidth={0.9} color={GOLD} opacity={0.6} />
          </Group>
          <Group transform={leaf3T} origin={vec(cx + 1, baseY - 132)} opacity={leaf3}>
            <Path path={LEAF3}>
              <LinearGradient start={vec(cx, baseY - 152)} end={vec(cx + 36, baseY - 130)} colors={[SAGE_LIGHT, SAGE_DEEP]} />
            </Path>
          </Group>

          {/* Water droplet + ripple */}
          <Group transform={dropT} opacity={dropOp}>
            <Path path="M0 -5 C3 -1 3 3 0 6 C-3 3 -3 -1 0 -5 Z" color={DROP} />
          </Group>
          <Circle cx={LEAF_TIP.x} cy={LEAF_TIP.y + 70} r={rippleR} style="stroke" strokeWidth={1.2} color={DROP} opacity={rippleOp} />

          {/* Gold dust motes (front) */}
          {motes.map((s, i) => <Mote key={i} loop={loop} seed={s} />)}

          {/* Soft cream bloom — eases into the app */}
          <Group opacity={brightEnd}>
            <Rect x={0} y={0} width={W} height={H} color={CREAM} />
          </Group>
        </Canvas>

        {/* Wordmark */}
        <Animated.View style={[styles.wordWrap, wordStyle]} pointerEvents="none">
          <Animated.Text style={styles.brand}>Lawnup</Animated.Text>
          <Animated.View style={styles.rule} />
          <Animated.Text style={styles.tagline}>YOUR AI PLANT COMPANION</Animated.Text>
        </Animated.View>

        {skipReady && (
          <Animated.View style={[styles.skipWrap, skipStyle]} pointerEvents="none">
            <Animated.Text style={styles.skipText}>Tap to skip</Animated.Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: theme.z.splash, overflow: 'hidden', backgroundColor: BG_TOP },
  wordWrap: { position: 'absolute', left: 0, right: 0, top: baseY + 56, alignItems: 'center' },
  brand: { fontFamily: theme.fonts.serifMediumItalic, fontSize: 46, color: '#F2EEE3', letterSpacing: 0.5 },
  rule: { width: 34, height: 1, backgroundColor: GOLD, opacity: 0.6, marginVertical: 14 },
  tagline: { fontFamily: theme.fonts.sansMedium, fontSize: 10.5, color: 'rgba(203,182,126,0.78)', letterSpacing: 3.4 },
  skipWrap: { position: 'absolute', bottom: theme.spacing['5xl'], left: 0, right: 0, alignItems: 'center' },
  skipText: { fontFamily: theme.fonts.sansMedium, fontSize: 12, color: 'rgba(242,238,227,0.5)', letterSpacing: 0.5 },
});
