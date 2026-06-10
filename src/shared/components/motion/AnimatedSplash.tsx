/**
 * AnimatedSplash — premium, alive, and Skia-free (renders identically on every
 * build). Reanimated + react-native-svg only.
 *
 * Deep botanical backdrop with a breathing light, a plant that grows from the
 * soil, and continuous ambient life throughout: leaves drift down and water
 * droplets fall + ripple the whole time. Elegant serif wordmark, then a soft
 * cream bloom eases into the app. ~4.2s, tap-to-skip after 1.5s.
 *
 * Contract preserved: absolute overlay, calls onDone() exactly once.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withDelay, withRepeat, cancelAnimation, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const cx = W / 2;
const baseY = H * 0.55;

const GOLD = '#CBB682';
const SAGE = '#9DBE6E';
const SAGE_DEEP = '#6E8C46';
const CREAM = theme.color.canvas;

const TOTAL = 4200;
const SKIP_AFTER = 1500;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const LEAF_D = 'M0 -7 C5 -3 5 5 0 8 C-5 5 -5 -3 0 -7 Z';

// ── Ambient drifting leaf ────────────────────────────────────────────────────
type LeafSeed = { x: number; phase: number; dur: number; drift: number; size: number; rot: number; op: number; color: string };
const DriftLeaf: React.FC<{ seed: LeafSeed }> = ({ seed }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(seed.phase * seed.dur, withRepeat(withTiming(1, { duration: seed.dur, easing: Easing.linear }), -1, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(t.value * Math.PI) * seed.op,
    transform: [
      { translateX: seed.x + Math.sin(t.value * Math.PI * 2) * seed.drift },
      { translateY: -30 + t.value * (H + 60) },
      { rotate: `${seed.rot + t.value * 60}deg` },
      { scale: seed.size },
    ],
  }));
  return (
    <Animated.View style={[styles.particle, style]} pointerEvents="none">
      <Svg width={20} height={20} viewBox="0 0 20 20"><Path d={LEAF_D} transform="translate(10 10)" fill={seed.color} /></Svg>
    </Animated.View>
  );
};

// ── Falling water droplet + ripple ───────────────────────────────────────────
type DropSeed = { x: number; phase: number; dur: number; landY: number; fall: number };
const Droplet: React.FC<{ seed: DropSeed }> = ({ seed }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(seed.phase * seed.dur, withRepeat(withTiming(1, { duration: seed.dur, easing: Easing.linear }), -1, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dropStyle = useAnimatedStyle(() => {
    const p = Math.min(1, t.value / 0.6);
    const fallEase = p * p; // accelerate
    return {
      opacity: t.value < 0.6 ? 0.85 : 0,
      transform: [{ translateX: seed.x }, { translateY: seed.landY - seed.fall + fallEase * seed.fall }, { scaleY: 1 + p * 0.5 }],
    };
  });
  const rippleStyle = useAnimatedStyle(() => {
    const r = t.value > 0.55 && t.value < 0.85 ? (t.value - 0.55) / 0.3 : 0;
    return { opacity: r > 0 ? (1 - r) * 0.5 : 0, transform: [{ translateX: seed.x - 10 }, { translateY: seed.landY - 10 }, { scale: 0.3 + r * 1.2 }] };
  });

  return (
    <>
      <Animated.View style={[styles.particle, dropStyle]} pointerEvents="none">
        <Svg width={8} height={12} viewBox="0 0 8 12"><Path d="M4 0 C7 5 7 9 4 11 C1 9 1 5 4 0 Z" fill="rgba(206,228,238,0.9)" /></Svg>
      </Animated.View>
      <Animated.View style={[styles.particle, rippleStyle]} pointerEvents="none">
        <Svg width={20} height={20} viewBox="0 0 20 20"><Circle cx={10} cy={10} r={8} stroke="rgba(206,228,238,0.8)" strokeWidth={1} fill="none" /></Svg>
      </Animated.View>
    </>
  );
};

interface Props { onDone: () => void }

export const AnimatedSplash: React.FC<Props> = ({ onDone }) => {
  const calledRef = useRef(false);
  const [skipReady, setSkipReady] = useState(false);

  const grow = useSharedValue(0);
  const stemDraw = useSharedValue(1);     // 1 = hidden (full dash offset), 0 = drawn
  const glow = useSharedValue(0);
  const breathe = useSharedValue(0);
  const bright = useSharedValue(0);
  const wordOp = useSharedValue(0);
  const wordY = useSharedValue(14);
  const skipOp = useSharedValue(0);
  const container = useSharedValue(1);

  const leaves = useMemo<LeafSeed[]>(() => Array.from({ length: 7 }, (_, i) => ({
    x: W * (0.1 + (i / 7) * 0.82), phase: (i * 0.37) % 1, dur: 7000 + (i % 3) * 1600,
    drift: 18 + (i % 4) * 8, size: 0.7 + ((i * 7) % 10) / 10, rot: (i * 47) % 360,
    op: 0.12 + ((i * 13) % 8) / 60, color: i % 3 === 0 ? GOLD : SAGE,
  })), []);
  const drops = useMemo<DropSeed[]>(() => Array.from({ length: 3 }, (_, i) => ({
    x: cx + (i - 1) * 46 + (i % 2 ? 12 : -8), phase: i * 0.33, dur: 3200 + i * 700,
    landY: baseY - 70 + i * 26, fall: 90 + i * 20,
  })), []);

  const finish = useCallback(() => { if (calledRef.current) return; calledRef.current = true; onDone(); }, [onDone]);

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);
    glow.value = withTiming(1, { duration: 1000, easing: easeOut });
    breathe.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
    grow.value = withDelay(450, withTiming(1, { duration: 1500, easing: easeOut }));
    stemDraw.value = withDelay(450, withTiming(0, { duration: 1400, easing: easeOut }));
    wordOp.value = withDelay(2200, withTiming(1, { duration: 800, easing: easeOut }));
    wordY.value = withDelay(2200, withTiming(0, { duration: 800, easing: easeOut }));
    bright.value = withDelay(TOTAL - 720, withTiming(1, { duration: 620, easing: Easing.inOut(Easing.cubic) }));
    container.value = withDelay(TOTAL - 360, withTiming(0, { duration: 360, easing: easeOut }));

    const skipT = setTimeout(() => { setSkipReady(true); skipOp.value = withTiming(1, { duration: 500 }); }, SKIP_AFTER);
    const doneT = setTimeout(finish, TOTAL);
    return () => { clearTimeout(skipT); clearTimeout(doneT); finish(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = useCallback(() => {
    if (!skipReady || calledRef.current) return;
    cancelAnimation(container);
    container.value = withTiming(0, { duration: 300 });
    setTimeout(finish, 300);
  }, [skipReady, finish, container]);

  // Plant grows from soil (pivot bottom-centre)
  const PH = 180, PW = 120;
  const plantStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, grow.value * 1.4),
    transform: [{ translateY: PH / 2 }, { scale: 0.15 + grow.value * 0.85 }, { translateY: -PH / 2 }],
  }));
  const stemProps = useAnimatedProps(() => ({ strokeDashoffset: stemDraw.value * 230 }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * (0.6 + breathe.value * 0.4), transform: [{ scale: 0.9 + breathe.value * 0.16 }] }));
  const brightStyle = useAnimatedStyle(() => ({ opacity: bright.value }));
  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOp.value, transform: [{ translateY: wordY.value }] }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOp.value }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleSkip}>
        {/* Backdrop gradient */}
        <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
          <Defs>
            <LinearGradient id="splash-bg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#10241A" />
              <Stop offset="1" stopColor="#0A0F0A" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={W} height={H} fill="url(#splash-bg)" />
        </Svg>

        {/* Breathing light behind plant */}
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Svg width={360} height={360}>
            <Defs>
              <RadialGradient id="splash-glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#E3CE92" stopOpacity={0.5} />
                <Stop offset="0.5" stopColor="#A7C47C" stopOpacity={0.18} />
                <Stop offset="1" stopColor="#A7C47C" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={180} cy={180} r={180} fill="url(#splash-glow)" />
          </Svg>
        </Animated.View>

        {/* Ambient drifting leaves */}
        {leaves.map((s, i) => <DriftLeaf key={`l${i}`} seed={s} />)}

        {/* Growing plant */}
        <Animated.View style={[styles.plant, { width: PW, height: PH, left: cx - PW / 2, top: baseY - PH }, plantStyle]} pointerEvents="none">
          <Svg width={PW} height={PH} viewBox="0 0 120 180">
            <AnimatedPath d="M60 180 C50 130 70 82 60 30" stroke={GOLD} strokeWidth={2} strokeLinecap="round" fill="none" strokeDasharray={230} animatedProps={stemProps} />
            <Path d="M60 120 C78 116 92 104 96 86 C84 92 68 104 60 120 Z" fill={SAGE} opacity={0.92} />
            <Path d="M60 120 C76 112 88 102 95 88" stroke={GOLD} strokeWidth={0.9} fill="none" opacity={0.6} />
            <Path d="M60 80 C42 76 28 64 24 46 C36 52 52 64 60 80 Z" fill={SAGE_DEEP} opacity={0.95} />
            <Path d="M60 80 C44 72 32 62 25 48" stroke={GOLD} strokeWidth={0.9} fill="none" opacity={0.6} />
            <Path d="M60 44 C74 42 86 32 90 18 C80 24 68 34 60 44 Z" fill={SAGE} opacity={0.9} />
          </Svg>
        </Animated.View>

        {/* Falling droplets */}
        {drops.map((s, i) => <Droplet key={`d${i}`} seed={s} />)}

        {/* Soft cream bloom into the app */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: CREAM }, brightStyle]} pointerEvents="none" />

        {/* Wordmark */}
        <Animated.View style={[styles.wordWrap, wordStyle]} pointerEvents="none">
          <Animated.Text style={styles.brand}>Lawnup</Animated.Text>
          <View style={styles.rule} />
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
  root: { ...StyleSheet.absoluteFillObject, zIndex: theme.z.splash, overflow: 'hidden', backgroundColor: '#0A0F0A' },
  particle: { position: 'absolute', top: 0, left: 0 },
  glow: { position: 'absolute', width: 360, height: 360, left: cx - 180, top: baseY - 90 - 180, alignItems: 'center', justifyContent: 'center' },
  plant: { position: 'absolute' },
  wordWrap: { position: 'absolute', left: 0, right: 0, top: baseY + 48, alignItems: 'center' },
  brand: { fontFamily: theme.fonts.serifMediumItalic, fontSize: 48, color: '#F2EEE3', letterSpacing: 0.5 },
  rule: { width: 34, height: 1, backgroundColor: GOLD, opacity: 0.6, marginVertical: 14 },
  tagline: { fontFamily: theme.fonts.sansMedium, fontSize: 10.5, color: 'rgba(203,182,126,0.8)', letterSpacing: 3.4 },
  skipWrap: { position: 'absolute', bottom: theme.spacing['5xl'], left: 0, right: 0, alignItems: 'center' },
  skipText: { fontFamily: theme.fonts.sansMedium, fontSize: 12, color: 'rgba(242,238,227,0.5)', letterSpacing: 0.5 },
});
