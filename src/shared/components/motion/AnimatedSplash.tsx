/**
 * AnimatedSplash — a cinematic, Skia-free growth sequence (renders identically
 * on every build). Reanimated + react-native-svg.
 *
 * The scene moves through time-of-day: NIGHT → DAWN → MORNING. A plant grows
 * from the soil while ambient life drifts from every direction — leaves falling
 * from the top, rising from the bottom, and spilling out from the centre, plus
 * water droplets that fall and ripple. It ends in a soft morning bloom that
 * eases into the app. ~4.4s, tap-to-skip after 1.5s.
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
const baseY = H * 0.56;

const GOLD = '#CBB682';
const SAGE = '#9DBE6E';
const SAGE_DEEP = '#6E8C46';
const CREAM = theme.color.canvas;

const TOTAL = 4400;
const SKIP_AFTER = 1500;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const LEAF_D = 'M0 -7 C5 -3 5 5 0 8 C-5 5 -5 -3 0 -7 Z';

// ── Generic drifting particle (leaf), any direction via y0→y1 ────────────────
type PSeed = { x: number; xDrift: number; y0: number; y1: number; dur: number; phase: number; size: number; rot: number; op: number; color: string };
const DriftParticle: React.FC<{ seed: PSeed }> = ({ seed }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(seed.phase * seed.dur, withRepeat(withTiming(1, { duration: seed.dur, easing: Easing.linear }), -1, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => {
    const p = t.value;
    return {
      opacity: Math.sin(p * Math.PI) * seed.op,
      transform: [
        { translateX: seed.x + Math.sin(p * Math.PI * 2 + seed.phase * 6) * seed.xDrift },
        { translateY: seed.y0 + p * (seed.y1 - seed.y0) },
        { rotate: `${seed.rot + p * 90}deg` },
        { scale: seed.size },
      ],
    };
  });
  return (
    <Animated.View style={[styles.particle, style]} pointerEvents="none">
      <Svg width={22} height={22} viewBox="0 0 22 22"><Path d={LEAF_D} transform="translate(11 11)" fill={seed.color} /></Svg>
    </Animated.View>
  );
};

// ── Falling water droplet + ripple ───────────────────────────────────────────
type DropSeed = { x: number; phase: number; dur: number; topY: number; landY: number };
const Droplet: React.FC<{ seed: DropSeed }> = ({ seed }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(seed.phase * seed.dur, withRepeat(withTiming(1, { duration: seed.dur, easing: Easing.linear }), -1, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const dropStyle = useAnimatedStyle(() => {
    const p = Math.min(1, t.value / 0.6);
    const fall = p * p;
    return { opacity: t.value < 0.6 ? 0.85 : 0, transform: [{ translateX: seed.x }, { translateY: seed.topY + fall * (seed.landY - seed.topY) }, { scaleY: 1 + p * 0.5 }] };
  });
  const rippleStyle = useAnimatedStyle(() => {
    const r = t.value > 0.55 && t.value < 0.85 ? (t.value - 0.55) / 0.3 : 0;
    return { opacity: r > 0 ? (1 - r) * 0.5 : 0, transform: [{ translateX: seed.x - 10 }, { translateY: seed.landY - 10 }, { scale: 0.3 + r * 1.3 }] };
  });
  return (
    <>
      <Animated.View style={[styles.particle, dropStyle]} pointerEvents="none">
        <Svg width={8} height={12} viewBox="0 0 8 12"><Path d="M4 0 C7 5 7 9 4 11 C1 9 1 5 4 0 Z" fill="rgba(206,228,238,0.92)" /></Svg>
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
  const stemDraw = useSharedValue(1);
  const glow = useSharedValue(0);
  const breathe = useSharedValue(0);
  const dawn = useSharedValue(0);     // night → dawn
  const morning = useSharedValue(0);  // → morning bloom (also the app transition)
  const wordOp = useSharedValue(0);
  const wordY = useSharedValue(14);
  const skipOp = useSharedValue(0);
  const container = useSharedValue(1);

  // Mixed-direction leaves: fall (top), rise (bottom), spill (centre-out)
  const leaves = useMemo<PSeed[]>(() => {
    const out: PSeed[] = [];
    const col = (i: number) => (i % 3 === 0 ? GOLD : i % 3 === 1 ? SAGE : SAGE_DEEP);
    // fall from top
    for (let i = 0; i < 4; i++) out.push({ x: W * (0.12 + i * 0.24), xDrift: 22 + i * 6, y0: -40, y1: H + 40, dur: 7600 + i * 1100, phase: (i * 0.31) % 1, size: 0.7 + (i % 3) * 0.18, rot: i * 40, op: 0.22, color: col(i) });
    // rise from bottom
    for (let i = 0; i < 3; i++) out.push({ x: W * (0.2 + i * 0.3), xDrift: 26 + i * 8, y0: H + 40, y1: -40, dur: 8800 + i * 1200, phase: (i * 0.5 + 0.2) % 1, size: 0.8 + (i % 2) * 0.2, rot: i * 70, op: 0.2, color: col(i + 1) });
    // spill from centre outward/up
    for (let i = 0; i < 3; i++) out.push({ x: cx + (i - 1) * 60, xDrift: 50 + i * 14, y0: baseY - 80, y1: -40, dur: 7000 + i * 900, phase: (i * 0.4 + 0.5) % 1, size: 0.6 + (i % 2) * 0.2, rot: i * 55, op: 0.24, color: col(i + 2) });
    return out;
  }, []);

  const drops = useMemo<DropSeed[]>(() => ([
    { x: cx - 40, phase: 0.0,  dur: 3200, topY: baseY - 150, landY: baseY - 60 },
    { x: cx + 50, phase: 0.35, dur: 3800, topY: baseY - 130, landY: baseY - 30 },
    { x: cx + 8,  phase: 0.6,  dur: 3400, topY: -20,         landY: baseY - 90 },
    { x: W * 0.2, phase: 0.2,  dur: 4200, topY: -20,         landY: H * 0.42 },
  ]), []);

  const finish = useCallback(() => { if (calledRef.current) return; calledRef.current = true; onDone(); }, [onDone]);

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);
    const easeInOut = Easing.inOut(Easing.cubic);
    glow.value = withTiming(1, { duration: 1100, easing: easeOut });
    breathe.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
    grow.value = withDelay(500, withTiming(1, { duration: 1600, easing: easeOut }));
    stemDraw.value = withDelay(500, withTiming(0, { duration: 1500, easing: easeOut }));
    // time of day
    dawn.value = withDelay(1300, withTiming(1, { duration: 1500, easing: easeInOut }));
    morning.value = withDelay(TOTAL - 1300, withTiming(1, { duration: 1100, easing: easeInOut }));
    // wordmark
    wordOp.value = withDelay(2400, withTiming(1, { duration: 800, easing: easeOut }));
    wordY.value = withDelay(2400, withTiming(0, { duration: 800, easing: easeOut }));
    container.value = withDelay(TOTAL - 320, withTiming(0, { duration: 320, easing: easeOut }));

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

  const PH = 180, PW = 120;
  const plantStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, grow.value * 1.4),
    transform: [{ translateY: PH / 2 }, { scale: 0.15 + grow.value * 0.85 }, { translateY: -PH / 2 }],
  }));
  const stemProps = useAnimatedProps(() => ({ strokeDashoffset: stemDraw.value * 230 }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * (0.55 + breathe.value * 0.4), transform: [{ scale: 0.9 + breathe.value * 0.16 }] }));
  const dawnStyle = useAnimatedStyle(() => ({ opacity: dawn.value * 0.85 }));
  const morningStyle = useAnimatedStyle(() => ({ opacity: morning.value }));
  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOp.value, transform: [{ translateY: wordY.value }] }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOp.value }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleSkip}>
        {/* NIGHT base */}
        <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
          <Defs>
            <LinearGradient id="sp-night" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0A1410" /><Stop offset="1" stopColor="#06090A" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={W} height={H} fill="url(#sp-night)" />
        </Svg>

        {/* DAWN warm layer (fades in behind plant) */}
        <Animated.View style={[StyleSheet.absoluteFill, dawnStyle]} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            <Defs>
              <LinearGradient id="sp-dawn" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#1A130C" /><Stop offset="0.55" stopColor="#3A2415" /><Stop offset="1" stopColor="#6E4220" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={W} height={H} fill="url(#sp-dawn)" />
          </Svg>
        </Animated.View>

        {/* Breathing light behind plant */}
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Svg width={380} height={380}>
            <Defs>
              <RadialGradient id="sp-glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#E8CF8E" stopOpacity={0.5} />
                <Stop offset="0.5" stopColor="#A7C47C" stopOpacity={0.18} />
                <Stop offset="1" stopColor="#A7C47C" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={190} cy={190} r={190} fill="url(#sp-glow)" />
          </Svg>
        </Animated.View>

        {/* Ambient leaves (all directions) */}
        {leaves.map((s, i) => <DriftParticle key={`l${i}`} seed={s} />)}

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

        {/* MORNING bloom → eases into the app */}
        <Animated.View style={[StyleSheet.absoluteFill, morningStyle]} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            <Defs>
              <LinearGradient id="sp-morning" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#F5F1E8" /><Stop offset="0.6" stopColor="#EAF0DC" /><Stop offset="1" stopColor="#F1F6E8" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={W} height={H} fill="url(#sp-morning)" />
          </Svg>
        </Animated.View>

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
  root: { ...StyleSheet.absoluteFillObject, zIndex: theme.z.splash, overflow: 'hidden', backgroundColor: '#06090A' },
  particle: { position: 'absolute', top: 0, left: 0 },
  glow: { position: 'absolute', width: 380, height: 380, left: cx - 190, top: baseY - 100 - 190, alignItems: 'center', justifyContent: 'center' },
  plant: { position: 'absolute' },
  wordWrap: { position: 'absolute', left: 0, right: 0, top: baseY + 48, alignItems: 'center' },
  brand: { fontFamily: theme.fonts.serifMediumItalic, fontSize: 48, color: '#F2EEE3', letterSpacing: 0.5 },
  rule: { width: 34, height: 1, backgroundColor: GOLD, opacity: 0.6, marginVertical: 14 },
  tagline: { fontFamily: theme.fonts.sansMedium, fontSize: 10.5, color: 'rgba(203,182,126,0.8)', letterSpacing: 3.4 },
  skipWrap: { position: 'absolute', bottom: theme.spacing['5xl'], left: 0, right: 0, alignItems: 'center' },
  skipText: { fontFamily: theme.fonts.sansMedium, fontSize: 12, color: 'rgba(242,238,227,0.5)', letterSpacing: 0.5 },
});
