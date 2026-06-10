/**
 * AnimatedSplash — cinematic seed→roots→stem→leaves→logo growth sequence.
 *
 * Built with @shopify/react-native-skia (organic vector growth on the UI thread)
 * orchestrated by Reanimated shared values. Total ≈ 2.6s, skippable after 1.5s.
 *
 * Contract preserved exactly: renders an absolute overlay and calls `onDone()`
 * once when the sequence finishes (or on unmount / skip). App.tsx mounts this
 * OUTSIDE the nav tree until splashDone — do not change that wiring here.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Canvas,
  Group,
  Path,
  Circle,
  Rect,
  LinearGradient,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');

// ── Stage geometry ───────────────────────────────────────────────────────────
const cx = W / 2;
const soilY = H * 0.6; // the line where the seed sits / plant springs from

// ── Vector paths (computed once) ─────────────────────────────────────────────
const ROOTS_PATH =
  `M ${cx} ${soilY} C ${cx - 2} ${soilY + 24} ${cx - 20} ${soilY + 34} ${cx - 30} ${soilY + 62} ` +
  `M ${cx} ${soilY} C ${cx + 2} ${soilY + 26} ${cx + 18} ${soilY + 40} ${cx + 26} ${soilY + 66} ` +
  `M ${cx} ${soilY} L ${cx} ${soilY + 50}`;

const STEM_PATH =
  `M ${cx} ${soilY} C ${cx - 7} ${soilY - 38} ${cx + 5} ${soilY - 82} ${cx} ${soilY - 122}`;

const LEAF_R_PATH =
  `M ${cx} ${soilY - 95} C ${cx + 12} ${soilY - 118} ${cx + 42} ${soilY - 116} ${cx + 50} ${soilY - 92} ` +
  `C ${cx + 40} ${soilY - 82} ${cx + 14} ${soilY - 86} ${cx} ${soilY - 95} Z`;

const LEAF_L_PATH =
  `M ${cx} ${soilY - 70} C ${cx - 12} ${soilY - 92} ${cx - 42} ${soilY - 90} ${cx - 50} ${soilY - 66} ` +
  `C ${cx - 40} ${soilY - 56} ${cx - 14} ${soilY - 60} ${cx} ${soilY - 70} Z`;

// ── Earthy colours (from the design system) ──────────────────────────────────
const C = theme.color;
const P = theme.palette;
const EARTH = P.terracotta[600];

const SKIP_AFTER = 1500;
const TOTAL_DURATION = 2600;

interface Props {
  onDone: () => void;
}

export const AnimatedSplashSkia: React.FC<Props> = ({ onDone }) => {
  const calledRef = useRef(false);
  const [skipReady, setSkipReady] = useState(false);

  // Growth drivers (UI-thread shared values feeding Skia + the wordmark)
  const seedScale = useSharedValue(0);
  const rootGrow  = useSharedValue(0);
  const stemGrow  = useSharedValue(0);
  const leafR     = useSharedValue(0);
  const leafL     = useSharedValue(0);
  const glow      = useSharedValue(0);
  const bright    = useSharedValue(0); // dark soil → morning light

  // Wordmark
  const wordOpacity = useSharedValue(0);
  const wordY       = useSharedValue(14);
  const skipOpacity = useSharedValue(0);

  // Container fade-out
  const containerOpacity = useSharedValue(1);

  const finish = useCallback(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const { ease, spring } = theme.motion;

    // 1 · seed drops in
    seedScale.value = withDelay(100, withSpring(1, spring.bouncy));
    // 2 · roots reach down
    rootGrow.value  = withDelay(300, withTiming(1, { duration: 800, easing: ease.smooth }));
    // 3 · stem shoots up
    stemGrow.value  = withDelay(800, withTiming(1, { duration: 800, easing: ease.organic }));
    // 4 · leaves unfurl (staggered, with overshoot)
    leafR.value     = withDelay(1300, withSpring(1, spring.bouncy));
    leafL.value     = withDelay(1500, withSpring(1, spring.bouncy));
    glow.value      = withDelay(1300, withTiming(1, { duration: 700, easing: ease.smooth }));
    // 5 · morning light rises
    bright.value    = withDelay(1500, withTiming(1, { duration: 900, easing: ease.smooth }));
    // 6 · wordmark fades in
    wordOpacity.value = withDelay(1900, withTiming(1, { duration: 500, easing: ease.smooth }));
    wordY.value       = withDelay(1900, withSpring(0, spring.gentle));

    // 7 · curtain out
    containerOpacity.value = withDelay(
      TOTAL_DURATION - 450,
      withTiming(0, { duration: 450, easing: ease.smooth }),
    );

    const skipTimer = setTimeout(() => {
      setSkipReady(true);
      skipOpacity.value = withTiming(1, { duration: 400 });
    }, SKIP_AFTER);

    const doneTimer = setTimeout(finish, TOTAL_DURATION);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(doneTimer);
      finish();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tap-to-skip: only after 1.5s; fast-forwards the curtain then resolves.
  const handleSkip = useCallback(() => {
    if (!skipReady || calledRef.current) return;
    cancelAnimation(containerOpacity);
    containerOpacity.value = withTiming(0, { duration: 280 });
    setTimeout(finish, 280);
  }, [skipReady, finish, containerOpacity]);

  // ── Skia transform derivations ──
  const seedT  = useDerivedValue(() => [{ scale: seedScale.value }]);
  const leafRT = useDerivedValue(() => [{ scale: leafR.value }]);
  const leafLT = useDerivedValue(() => [{ scale: leafL.value }]);

  // ── RN overlay styles ──
  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOpacity.value }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleSkip}>
        <Canvas style={StyleSheet.absoluteFill}>
          {/* Base — dark rich soil / night */}
          <Rect x={0} y={0} width={W} height={H}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, H)}
              colors={[...theme.gradients.darkGarden]}
            />
          </Rect>

          {/* Morning light rising over the garden */}
          <Group opacity={bright}>
            <Rect x={0} y={0} width={W} height={H}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, H)}
                colors={[P.cream.canvas, P.mint[200], P.green[100]]}
              />
            </Rect>
          </Group>

          {/* Soft glow behind the sprout */}
          <Group opacity={glow}>
            <Circle cx={cx} cy={soilY - 90} r={130}>
              <RadialGradient
                c={vec(cx, soilY - 90)}
                r={130}
                colors={['rgba(167,196,124,0.55)', 'rgba(167,196,124,0)']}
              />
            </Circle>
          </Group>

          {/* Roots reaching into the soil */}
          <Path
            path={ROOTS_PATH}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            strokeJoin="round"
            color={EARTH}
            opacity={0.9}
            start={0}
            end={rootGrow}
          />

          {/* Stem */}
          <Path
            path={STEM_PATH}
            style="stroke"
            strokeWidth={5}
            strokeCap="round"
            strokeJoin="round"
            color={C.primaryDark}
            start={0}
            end={stemGrow}
          />

          {/* Leaves unfurling */}
          <Group transform={leafRT} origin={vec(cx, soilY - 95)}>
            <Path path={LEAF_R_PATH} color={C.primary} />
          </Group>
          <Group transform={leafLT} origin={vec(cx, soilY - 70)}>
            <Path path={LEAF_L_PATH} color={P.green[400]} />
          </Group>

          {/* Seed */}
          <Group transform={seedT} origin={vec(cx, soilY)}>
            <Circle cx={cx} cy={soilY} r={6} color={EARTH} />
          </Group>
        </Canvas>

        {/* Wordmark */}
        <Animated.View style={[styles.wordWrap, wordStyle]} pointerEvents="none">
          <Animated.Text style={styles.brand}>Lawnup</Animated.Text>
          <Animated.Text style={styles.tagline}>YOUR AI PLANT COMPANION</Animated.Text>
        </Animated.View>

        {/* Skip hint */}
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
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: theme.z.splash,
    overflow: 'hidden',
    backgroundColor: theme.color.canvas,
  },
  wordWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: soilY + 76,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  brand: {
    fontFamily: theme.fonts.serifMediumItalic,
    fontSize: 44,
    color: theme.color.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 11,
    color: theme.color.textMuted,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  skipWrap: {
    position: 'absolute',
    bottom: theme.spacing['5xl'],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  skipText: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.color.textMuted,
    letterSpacing: 0.5,
  },
});
