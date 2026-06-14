/**
 * LeafBurst — a celebratory Skia particle burst of leaves.
 *
 * Reused for: auth success, care-task completion (leaf confetti).
 * Fully UI-thread: one Reanimated `progress` drives every particle via derived
 * transforms inside Skia. ~14 particles → cheap on mid-range Android.
 *
 * Usage (declarative replay):
 *   const [key, setKey] = useState(0);
 *   <LeafBurst playKey={key} origin={{ x, y }} onDone={...} />
 *   // call setKey(k => k + 1) to fire.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const PARTICLE_COUNT = 14;
const C = theme.palette;

const LEAF_COLORS = [C.green[500], C.green[400], C.green[600], C.mint[500], C.terracotta[400]];

// Unit leaf path centred near origin.
const LEAF = Skia.Path.MakeFromSVGString('M0 -7 C5 -3 5 4 0 8 C-5 4 -5 -3 0 -7 Z')!;

type Seed = {
  angle: number; distance: number; spin: number; scale: number;
  gravity: number; color: string; delay: number;
};

const makeSeeds = (): Seed[] =>
  Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
    return {
      angle,
      distance: 70 + Math.random() * 90,
      spin: (Math.random() - 0.5) * 6,
      scale: 0.8 + Math.random() * 0.9,
      gravity: 120 + Math.random() * 80,
      color: LEAF_COLORS[i % LEAF_COLORS.length],
      delay: Math.random() * 0.12,
    };
  });

const Particle: React.FC<{
  progress: { value: number };
  seed: Seed;
  ox: number;
  oy: number;
}> = ({ progress, seed, ox, oy }) => {
  const transform = useDerivedValue(() => {
    const raw = Math.max(0, (progress.value - seed.delay) / (1 - seed.delay));
    const ease = 1 - Math.pow(1 - raw, 3); // ease-out-cubic
    const x = ox + Math.cos(seed.angle) * seed.distance * ease;
    const y =
      oy + Math.sin(seed.angle) * seed.distance * ease + seed.gravity * raw * raw;
    return [
      { translateX: x },
      { translateY: y },
      { rotate: seed.spin * ease },
      { scale: seed.scale * (0.4 + 0.6 * ease) },
    ];
  });

  const opacity = useDerivedValue(() => {
    const raw = Math.max(0, (progress.value - seed.delay) / (1 - seed.delay));
    return raw < 0.55 ? 1 : Math.max(0, 1 - (raw - 0.55) / 0.45);
  });

  return (
    <Group transform={transform} opacity={opacity}>
      <Path path={LEAF} color={seed.color} />
    </Group>
  );
};

interface Props {
  playKey: number;
  origin?: { x: number; y: number };
  onDone?: () => void;
}

export const LeafBurst: React.FC<Props> = ({ playKey, origin, onDone }) => {
  const progress = useSharedValue(0);
  const seeds = useMemo(() => makeSeeds(), []);
  const ox = origin?.x ?? W / 2;
  const oy = origin?.y ?? H / 2;

  useEffect(() => {
    if (playKey === 0) return;
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: theme.motion.duration.cinematic, easing: Easing.out(Easing.cubic) },
      (finished) => {
        'worklet';
        if (finished && onDone) runOnJS(onDone)();
      },
    );
  }, [playKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (playKey === 0) return null;

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {seeds.map((s, i) => (
        <Particle key={i} progress={progress} seed={s} ox={ox} oy={oy} />
      ))}
    </Canvas>
  );
};
