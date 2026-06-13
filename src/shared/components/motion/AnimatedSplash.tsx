/**
 * AnimatedSplash — "Midnight Conservatory" bonsai (per DESIGN_SYSTEM.md).
 *
 *   0–0.9s   Brass moonlight blooms in the void; the glazed pot settles.
 *   0.3–1.4s The TRUNK draws itself in one brass stroke (ink finding form).
 *   1.2–2.2s BRANCHES draw outward, staggered — the bonsai reaches.
 *   2.1–3.1s CHERRY BLOSSOMS pop at the branch tips (orchid spring-bloom).
 *   2.6–5.0s PETALS drift down, swaying, fading near the floor.
 *   3.2–4.1s The wordmark "LawnUp" rises with a brass glow; tagline follows.
 *   EXIT     (tap from 2s, or auto at 5.2s) content fades + expands away.
 *
 * Reanimated + react-native-svg, UI-thread, no setTimeout.
 * Emotion: STILLNESS → WONDER. Contract: absolute overlay, onDone() exactly once.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withDelay, withRepeat, withSpring, cancelAnimation, runOnJS, Easing,
  interpolate, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const cx = W / 2;
const { fonts: F, motion: M } = theme;

// Midnight Conservatory palette (brass-led, orchid bloom accent).
const VOID = '#0A0D0B';
const BRASS = '#C8A24E';        // trunk / branches / brand
const BRASS_BRIGHT = '#F0E0BE'; // highlight along the bark
const BRASS_DARK = '#9A7A30';
const ORCHID = '#C77DAE';       // blossom core
const ORCHID_SOFT = '#E8C6DD';  // blossom petal / falling petals
const POT_FILL = '#1C1612';     // dark glazed ceramic
const WORD_COLOR = '#F3EFE9';
const TAG_COLOR = '#8B8475';

// Lush botanical foliage — sage & botanical greens (the plant comes alive).
const GREENS = ['#4E7C4A', '#5E7F61', '#6FA06B', '#7FB069', '#3E6B3C', '#88B07E'];

const TOTAL = 5200;
const SKIP_AT = 2000;
const WORD = 'LawnUp';
const WORD_Y = H * 0.66;

// ── Geometry (computed once at module load) ──────────────────────────────────
const baseY = H * 0.54;          // trunk base / pot lip
const POT_BOT = baseY + 28;

const POT_D = `M ${cx - 58} ${baseY} L ${cx + 58} ${baseY} L ${cx + 46} ${POT_BOT} L ${cx - 46} ${POT_BOT} Z`;
const POT_RIM_D = `M ${cx - 66} ${baseY} L ${cx + 66} ${baseY}`;

// One sinuous trunk, base → crown.
const TRUNK_D =
  `M ${cx} ${baseY} ` +
  `C ${cx - 20} ${baseY - 44} ${cx + 22} ${baseY - 78} ${cx + 4} ${baseY - 120} ` +
  `C ${cx - 10} ${baseY - 146} ${cx + 6} ${baseY - 166} ${cx - 6} ${baseY - 190}`;
const TRUNK_LEN = 240;

// Branches as numeric cubic Béziers, so we can both draw them AND scatter
// foliage along their length. [p0, p1, p2, p3], len = approx path length.
type Pt = [number, number];
const BR: { p0: Pt; p1: Pt; p2: Pt; p3: Pt; len: number }[] = [
  // main reaching branches
  { p0: [cx + 1, baseY - 92],  p1: [cx - 30, baseY - 98],  p2: [cx - 58, baseY - 92],  p3: [cx - 86, baseY - 112], len: 110 },
  { p0: [cx + 3, baseY - 120], p1: [cx + 34, baseY - 122], p2: [cx + 64, baseY - 120], p3: [cx + 90, baseY - 140], len: 110 },
  { p0: [cx - 3, baseY - 158], p1: [cx - 28, baseY - 166], p2: [cx - 48, baseY - 172], p3: [cx - 66, baseY - 190], len: 90 },
  { p0: [cx - 6, baseY - 190], p1: [cx - 2, baseY - 202],  p2: [cx + 14, baseY - 206], p3: [cx + 30, baseY - 216], len: 60 },
  // extra stems for a fuller crown
  { p0: [cx - 1, baseY - 72],  p1: [cx - 26, baseY - 76],  p2: [cx - 50, baseY - 70],  p3: [cx - 78, baseY - 86],  len: 96 },
  { p0: [cx + 2, baseY - 104], p1: [cx + 26, baseY - 104], p2: [cx + 48, baseY - 110], p3: [cx + 74, baseY - 124], len: 100 },
  { p0: [cx + 1, baseY - 150], p1: [cx + 24, baseY - 158], p2: [cx + 40, baseY - 172], p3: [cx + 58, baseY - 192], len: 94 },
  { p0: [cx - 4, baseY - 176], p1: [cx - 26, baseY - 184], p2: [cx - 42, baseY - 196], p3: [cx - 58, baseY - 214], len: 88 },
  // finer twigs woven through the crown for maximum fullness
  { p0: [cx + 2, baseY - 84],  p1: [cx + 24, baseY - 82],  p2: [cx + 42, baseY - 74],  p3: [cx + 62, baseY - 82],  len: 84 },
  { p0: [cx - 2, baseY - 132], p1: [cx + 18, baseY - 140], p2: [cx + 30, baseY - 150], p3: [cx + 42, baseY - 168], len: 72 },
  { p0: [cx - 2, baseY - 110], p1: [cx - 22, baseY - 118], p2: [cx - 38, baseY - 128], p3: [cx - 54, baseY - 146], len: 78 },
  { p0: [cx - 5, baseY - 168], p1: [cx + 8, baseY - 180],  p2: [cx + 18, baseY - 192], p3: [cx + 28, baseY - 210], len: 66 },
  { p0: [cx + 3, baseY - 134], p1: [cx + 30, baseY - 132], p2: [cx + 54, baseY - 134], p3: [cx + 78, baseY - 152], len: 96 },
  { p0: [cx - 4, baseY - 146], p1: [cx - 30, baseY - 150], p2: [cx - 52, baseY - 156], p3: [cx - 74, baseY - 172], len: 92 },
];
const BRANCHES: { d: string; len: number }[] = BR.map((b) => ({
  d: `M ${b.p0[0]} ${b.p0[1]} C ${b.p1[0]} ${b.p1[1]} ${b.p2[0]} ${b.p2[1]} ${b.p3[0]} ${b.p3[1]}`,
  len: b.len,
}));

// Cubic point + tangent angle (deg) at parameter t.
function cubicAt(b: typeof BR[number], t: number): { x: number; y: number; ang: number } {
  const u = 1 - t;
  const a = u * u * u, c2 = 3 * u * u * t, c3 = 3 * u * t * t, d = t * t * t;
  const x = a * b.p0[0] + c2 * b.p1[0] + c3 * b.p2[0] + d * b.p3[0];
  const y = a * b.p0[1] + c2 * b.p1[1] + c3 * b.p2[1] + d * b.p3[1];
  // derivative
  const da = 3 * u * u, db = 6 * u * t, dc = 3 * t * t;
  const dx = da * (b.p1[0] - b.p0[0]) + db * (b.p2[0] - b.p1[0]) + dc * (b.p3[0] - b.p2[0]);
  const dy = da * (b.p1[1] - b.p0[1]) + db * (b.p2[1] - b.p1[1]) + dc * (b.p3[1] - b.p2[1]);
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI };
}

// A leaf shape with its rotation + position baked straight into the path coords,
// so hundreds of leaves can be merged into ONE <Path> per colour (cheap to draw).
const RAD = Math.PI / 180;
function leafPathAt(x: number, y: number, L: number, rotDeg: number): string {
  const w = L * 0.42;
  const c = Math.cos(rotDeg * RAD), s = Math.sin(rotDeg * RAD);
  const tx = (px: number, py: number) => `${(x + px * c - py * s).toFixed(1)} ${(y + px * s + py * c).toFixed(1)}`;
  return `M ${tx(0, 0)} C ${tx(L * 0.5, -w)} ${tx(L, -w * 0.45)} ${tx(L, 0)} C ${tx(L, w * 0.45)} ${tx(L * 0.5, w)} ${tx(0, 0)} Z `;
}
// A filled circle as path data (two arcs) — lets many flowers merge per colour.
function circlePath(x: number, y: number, r: number): string {
  return `M ${(x - r).toFixed(1)} ${y.toFixed(1)} a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0 a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0 `;
}

type Leaf = { x: number; y: number; len: number; rot: number; color: string };
// Deterministic pseudo-random so the canopy is identical every launch.
const rnd = (s: number) => { const v = Math.sin(s * 12.9898) * 43758.5453; return v - Math.floor(v); };

// Build the foliage: leaves sprout along every branch (both sides), cluster at
// the tips, and crown the treetop. Two waves so the canopy "illuminates" then thickens.
function buildLeaves(): { base: Leaf[]; more: Leaf[] } {
  const base: Leaf[] = [];
  const more: Leaf[] = [];
  let i = 0;
  const push = (wave: Leaf[], x: number, y: number, len: number, rot: number) => {
    wave.push({ x, y, len, rot, color: GREENS[i % GREENS.length] }); i++;
  };
  BR.forEach((b, bi) => {
    const samples = [0.26, 0.38, 0.5, 0.62, 0.74, 0.86, 0.96, 1.0];
    samples.forEach((t, si) => {
      const { x, y, ang } = cubicAt(b, t);
      const side = si % 2 === 0 ? 1 : -1;
      const len = 9 + rnd(bi * 7 + si) * 7;
      push(si % 2 === 0 ? base : more, x, y, len, ang + side * (52 + rnd(bi + si) * 26));
      push(si % 2 === 0 ? more : base, x, y, len * 0.8, ang - side * (44 + rnd(si * 3 + bi) * 24));
    });
    const tip = b.p3;
    for (let k = 0; k < 6; k++) {
      const a = -90 + (k - 2.5) * 30 + rnd(bi * 9 + k) * 16;
      push(k % 2 ? base : more, tip[0], tip[1], 10 + rnd(bi + k * 5) * 6, a);
    }
  });
  const crownX = cx - 6, crownY = baseY - 198;
  for (let k = 0; k < 26; k++) {
    const a = -150 + k * 23 + rnd(k * 4) * 18;
    const r = 6 + rnd(k) * 22;
    push(k % 2 ? more : base, crownX + Math.cos((a * Math.PI) / 180) * r, crownY + Math.sin((a * Math.PI) / 180) * r * 0.7, 9 + rnd(k * 2) * 7, a);
  }
  return { base, more };
}
const { base: LEAVES_BASE, more: LEAVES_MORE } = buildLeaves();

// ── Flowers: small pink & white blossoms, denser than the leaves ─────────────
const PINKS = ['#F4A6C0', '#EFB1CB', '#F7C2D6', '#E98FB2'];
const WHITES = ['#FFFFFF', '#FDF3F6', '#FBEFF3', '#FFF7FA'];

type Flower = { x: number; y: number; r: number; petal: string; ctr: string };
// Three waves so blossoms keep opening after the leaves fill in.
function buildFlowers(): Flower[][] {
  const waves: Flower[][] = [[], [], []];
  let i = 0;
  const push = (x: number, y: number, r: number) => {
    const pink = i % 5 !== 0; // mostly pink, some white — both present
    waves[i % 3].push({
      x, y, r,
      petal: pink ? PINKS[i % PINKS.length] : WHITES[i % WHITES.length],
      ctr: pink ? '#F2D98C' : '#F6E7C8',
    });
    i++;
  };
  BR.forEach((b, bi) => {
    const samples = [0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81, 0.9, 1.0];
    samples.forEach((t, si) => {
      const { x, y } = cubicAt(b, t);
      const sp = 10 + rnd(bi + si) * 9;
      push(x + (rnd(bi * 3 + si) - 0.5) * sp, y + (rnd(si * 5 + bi) - 0.5) * sp, 2.6 + rnd(bi + si * 2) * 2.1);
      push(x + (rnd(bi + si * 7) - 0.5) * sp, y + (rnd(si + bi * 2) - 0.5) * sp, 2.3 + rnd(si + bi) * 1.9);
      push(x + (rnd(bi * 5 + si * 2) - 0.5) * sp * 1.3, y + (rnd(si * 9 + bi) - 0.5) * sp * 1.3, 2.2 + rnd(bi * 2 + si) * 1.7);
    });
    const tip = b.p3;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2;
      const rad = 4 + rnd(bi * 4 + k) * 15;
      push(tip[0] + Math.cos(a) * rad, tip[1] + Math.sin(a) * rad * 0.85, 2.6 + rnd(k + bi) * 2.2);
    }
  });
  const cxr = cx - 6, cyr = baseY - 198;
  for (let k = 0; k < 54; k++) {
    const a = (k / 18) * Math.PI * 2;
    const rad = 8 + rnd(k * 3) * 40;
    push(cxr + Math.cos(a) * rad, cyr + Math.sin(a) * rad * 0.7, 2.2 + rnd(k) * 2.4);
  }
  return waves;
}
const FLOWERS = buildFlowers();

// Blossom pads at the branch tips + a mid-trunk pad.
const PADS = [
  { x: cx - 86, y: baseY - 112 },
  { x: cx + 90, y: baseY - 140 },
  { x: cx - 66, y: baseY - 190 },
  { x: cx + 30, y: baseY - 216 },
  { x: cx + 4,  y: baseY - 120 },
];

type Bloom = { x: number; y: number; r: number; delay: number };
const BLOOMS: Bloom[] = PADS.flatMap((p, pi) =>
  Array.from({ length: 3 }, (_, j) => {
    const a = (j * 2.3 + pi) * 1.7;
    const rad = 6 + ((pi + j) % 3) * 6;
    return {
      x: p.x + Math.cos(a) * rad,
      y: p.y + Math.sin(a) * rad,
      r: 4.2 + ((pi + j) % 3) * 1.1,
      delay: 2100 + (pi * 3 + j) * 70,
    };
  }),
);

type Petal = { startX: number; sway: number; size: number; dur: number; phase: number; rot: number };
const PETALS: Petal[] = Array.from({ length: 16 }, (_, i) => ({
  startX: cx - 96 + ((i * 0.41) % 1) * 192,
  sway: 18 + (i % 4) * 12,
  size: 4 + (i % 3),
  dur: 4200 + (i % 5) * 900,
  phase: (i * 0.137) % 1,
  rot: (i % 2 === 0 ? 1 : -1) * (180 + (i % 3) * 120),
}));

const FALL_FROM = baseY - 210;     // petals begin around the crown
const FALL_TO = POT_BOT + 40;      // and settle just past the pot

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── A whole wave of foliage, merged to one <Path> per colour (perf) ──────────
const LeafLayer: React.FC<{ leaves: Leaf[]; gate: SharedValue<number> }> = ({ leaves, gate }) => {
  const style = useAnimatedStyle(() => ({
    opacity: gate.value,
    transform: [{ scale: 0.84 + gate.value * 0.16 }, { translateY: (1 - gate.value) * 10 }],
  }));
  const byColor = useMemo(() => {
    const m: Record<string, string> = {};
    leaves.forEach((lf) => { m[lf.color] = (m[lf.color] ?? '') + leafPathAt(lf.x, lf.y, lf.len, lf.rot); });
    return m;
  }, [leaves]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        {Object.entries(byColor).map(([color, d]) => <Path key={color} d={d} fill={color} />)}
      </Svg>
    </Animated.View>
  );
};

// ── A whole wave of flowers, merged to one <Path> per colour (perf) ──────────
const FlowerLayer: React.FC<{ flowers: Flower[]; gate: SharedValue<number> }> = ({ flowers, gate }) => {
  const style = useAnimatedStyle(() => ({
    opacity: gate.value,
    transform: [{ scale: 0.7 + gate.value * 0.3 }],
  }));
  const { petals, centers } = useMemo(() => {
    const p: Record<string, string> = {}, c: Record<string, string> = {};
    flowers.forEach((f) => {
      p[f.petal] = (p[f.petal] ?? '') + circlePath(f.x, f.y, f.r);
      c[f.ctr] = (c[f.ctr] ?? '') + circlePath(f.x, f.y, f.r * 0.42);
    });
    return { petals: p, centers: c };
  }, [flowers]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        {Object.entries(petals).map(([col, d]) => <Path key={`p${col}`} d={d} fill={col} />)}
        {Object.entries(centers).map(([col, d]) => <Path key={`c${col}`} d={d} fill={col} />)}
      </Svg>
    </Animated.View>
  );
};

// ── A cherry blossom that springs open at a branch tip ───────────────────────
const Blossom: React.FC<{ b: Bloom; gate: SharedValue<number> }> = ({ b, gate }) => {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(b.delay, withSpring(1, M.spring.bouncy));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: gate.value * Math.min(1, s.value * 1.2),
    transform: [{ scale: s.value }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: b.x - b.r * 2, top: b.y - b.r * 2, width: b.r * 4, height: b.r * 4 }, style]} pointerEvents="none">
      <Svg width={b.r * 4} height={b.r * 4}>
        <Circle cx={b.r * 2} cy={b.r * 2} r={b.r} fill={ORCHID_SOFT} />
        <Circle cx={b.r * 2} cy={b.r * 2} r={b.r * 0.62} fill={ORCHID} />
        <Circle cx={b.r * 2} cy={b.r * 2} r={b.r * 0.22} fill={BRASS_BRIGHT} />
      </Svg>
    </Animated.View>
  );
};

// ── A petal drifting down from the canopy ────────────────────────────────────
const FallingPetal: React.FC<{ p: Petal; gate: SharedValue<number> }> = ({ p, gate }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(2600 + p.phase * 1600, withRepeat(withTiming(1, { duration: p.dur, easing: Easing.linear }), -1, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => {
    const v = t.value;
    const y = FALL_FROM + (FALL_TO - FALL_FROM) * v;
    const x = p.startX + Math.sin(v * Math.PI * 2 + p.phase * 6) * p.sway;
    const rot = v * p.rot;
    // fade in at top, out near the floor
    const fade = interpolate(v, [0, 0.12, 0.82, 1], [0, 1, 1, 0]);
    return {
      opacity: gate.value * fade,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${rot}deg` }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0 }, style]} pointerEvents="none">
      <Svg width={p.size * 2} height={p.size * 2}>
        <Ellipse cx={p.size} cy={p.size} rx={p.size} ry={p.size * 0.6} fill={ORCHID_SOFT} />
      </Svg>
    </Animated.View>
  );
};

// ── A wordmark letter emerging with spring weight ────────────────────────────
const Letter: React.FC<{ ch: string; delay: number }> = ({ ch, delay }) => {
  const o = useSharedValue(0);
  const s = useSharedValue(0.9);
  const y = useSharedValue(10);
  useEffect(() => {
    o.value = withDelay(delay, withTiming(1, { duration: 320, easing: M.ease.decelerate }));
    s.value = withDelay(delay, withSpring(1, M.spring.gentle));
    y.value = withDelay(delay, withSpring(0, M.spring.gentle));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { scale: s.value }] }));
  return <Animated.Text style={[styles.letter, style]}>{ch}</Animated.Text>;
};

interface Props { onDone: () => void }

export const AnimatedSplash: React.FC<Props> = ({ onDone }) => {
  const calledRef = useRef(false);
  const [armed, setArmed] = useState(false);

  const glow = useSharedValue(0);       // brass moonlight
  const pot = useSharedValue(0);        // pot settle
  const trunkDraw = useSharedValue(0);  // trunk stroke reveal
  const branchDraw = useSharedValue(0); // branches stroke reveal
  const leafGate0 = useSharedValue(0);  // foliage wave 1 (illuminate)
  const leafGate1 = useSharedValue(0);  // foliage wave 2 (more foliage)
  const flowerGate0 = useSharedValue(0); // flowers wave 1
  const flowerGate1 = useSharedValue(0); // flowers wave 2
  const flowerGate2 = useSharedValue(0); // flowers wave 3
  const bloomGate = useSharedValue(0);  // blossoms visible
  const petalGate = useSharedValue(0);  // petals visible
  const word = useSharedValue(0);
  const tag = useSharedValue(0);
  const skipOp = useSharedValue(0);
  const container = useSharedValue(1);

  const finish = useCallback(() => { if (calledRef.current) return; calledRef.current = true; onDone(); }, [onDone]);

  useEffect(() => {
    glow.value = withDelay(200, withTiming(1, { duration: 1100, easing: M.ease.smooth }));
    pot.value = withDelay(200, withTiming(1, { duration: 600, easing: M.ease.decelerate }));

    // the bonsai draws itself: trunk first, then branches reach out
    trunkDraw.value = withDelay(300, withTiming(1, { duration: 1100, easing: M.ease.smooth }));
    branchDraw.value = withDelay(1200, withTiming(1, { duration: 1000, easing: M.ease.smooth }));

    // foliage illuminates as the branches finish, then thickens
    leafGate0.value = withDelay(1650, withTiming(1, { duration: 700, easing: M.ease.smooth }));
    leafGate1.value = withDelay(2150, withTiming(1, { duration: 800, easing: M.ease.smooth }));

    // then the plant bursts into bloom — pink & white flowers open in waves
    flowerGate0.value = withDelay(2150, withSpring(1, M.spring.gentle));
    flowerGate1.value = withDelay(2500, withSpring(1, M.spring.gentle));
    flowerGate2.value = withDelay(2850, withSpring(1, M.spring.gentle));

    // canopy blooms, then petals begin to fall
    bloomGate.value = withDelay(2050, withTiming(1, { duration: 300 }));
    petalGate.value = withDelay(2600, withTiming(1, { duration: 600 }));

    // the brand rises beneath the tree
    word.value = withDelay(3200, withTiming(1, { duration: 100 }));
    tag.value = withDelay(3900, withTiming(1, { duration: 450, easing: M.ease.smooth }));

    skipOp.value = withDelay(SKIP_AT, withTiming(1, { duration: 400 }, (f) => { if (f) runOnJS(setArmed)(true); }));

    container.value = withDelay(TOTAL - 450, withTiming(0, { duration: 450, easing: M.ease.smooth }, (f) => { if (f) runOnJS(finish)(); }));
    return () => { cancelAnimation(container); finish(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const skipNow = useCallback(() => {
    if (!armed || calledRef.current) return;
    cancelAnimation(container);
    // eslint-disable-next-line react-hooks/immutability -- shared-value write in a tap handler
    container.value = withTiming(0, { duration: 380, easing: M.ease.smooth }, (f) => { if (f) runOnJS(finish)(); });
  }, [armed, finish]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animated props / styles ────────────────────────────────────────────────
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.5, transform: [{ scale: 0.7 + glow.value * 0.4 }] }));
  const potStyle = useAnimatedStyle(() => ({ opacity: pot.value, transform: [{ translateY: (1 - pot.value) * 10 }] }));
  const trunkProps = useAnimatedProps(() => ({ strokeDashoffset: TRUNK_LEN * (1 - trunkDraw.value) }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOp.value * 0.55 }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: container.value,
    transform: [{ scale: 1 + (1 - container.value) * 0.05 }],
  }));

  return (
    <Animated.View style={[styles.root, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={skipNow}>
        {/* brass moonlight glow behind the tree */}
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <Svg width={W} height={W}>
            <Defs><RadialGradient id="bonsai-glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={BRASS} stopOpacity={0.30} />
              <Stop offset="0.55" stopColor={BRASS} stopOpacity={0.07} />
              <Stop offset="1" stopColor={BRASS} stopOpacity={0} />
            </RadialGradient></Defs>
            <Circle cx={W / 2} cy={W / 2} r={W / 2} fill="url(#bonsai-glow)" />
          </Svg>
        </Animated.View>

        {/* glazed pot */}
        <Animated.View style={[StyleSheet.absoluteFill, potStyle]} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            <Path d={POT_D} fill={POT_FILL} stroke={BRASS_DARK} strokeWidth={1.5} strokeLinejoin="round" />
            <Path d={POT_RIM_D} stroke={BRASS} strokeWidth={3} strokeLinecap="round" />
          </Svg>
        </Animated.View>

        {/* the bonsai — trunk + branches drawing themselves in brass */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            {/* trunk: soft under-glow + bright bark line */}
            <AnimatedPath d={TRUNK_D} stroke={BRASS} strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" fill="none" strokeDasharray={TRUNK_LEN} animatedProps={trunkProps} />
            <AnimatedPath d={TRUNK_D} stroke={BRASS_BRIGHT} strokeWidth={2.4} strokeLinecap="round" fill="none" strokeDasharray={TRUNK_LEN} animatedProps={trunkProps} />
            {BRANCHES.map((br, i) => (
              <Branch key={i} d={br.d} len={br.len} draw={branchDraw} />
            ))}
          </Svg>
        </View>

        {/* lush foliage — leaves illuminate, then thicken (two waves) */}
        <LeafLayer leaves={LEAVES_BASE} gate={leafGate0} />
        <LeafLayer leaves={LEAVES_MORE} gate={leafGate1} />

        {/* the bloom — pink & white flowers, denser than the leaves (three waves) */}
        <FlowerLayer flowers={FLOWERS[0]} gate={flowerGate0} />
        <FlowerLayer flowers={FLOWERS[1]} gate={flowerGate1} />
        <FlowerLayer flowers={FLOWERS[2]} gate={flowerGate2} />

        {/* cherry blossoms at the tips */}
        {BLOOMS.map((b, i) => <Blossom key={i} b={b} gate={bloomGate} />)}

        {/* petals drifting down */}
        {PETALS.map((p, i) => <FallingPetal key={i} p={p} gate={petalGate} />)}

        {/* WORDMARK rising beneath the tree */}
        <Animated.View style={[styles.wordWrap, { top: WORD_Y - 26 }, wordStyle]} pointerEvents="none">
          <View style={styles.wordRow}>
            {WORD.split('').map((ch, i) => <Letter key={i} ch={ch} delay={3200 + i * 40} />)}
          </View>
        </Animated.View>
        <Animated.View style={[styles.tagWrap, tagStyle]} pointerEvents="none">
          <Animated.Text style={styles.tagline}>GROW SOMETHING BEAUTIFUL</Animated.Text>
        </Animated.View>

        {/* skip */}
        <Animated.View style={[styles.skipWrap, skipStyle]} pointerEvents="none">
          <Animated.Text style={styles.skipText}>Tap to skip</Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// ── A single branch stroke (own animated offset off the shared draw value) ────
const Branch: React.FC<{ d: string; len: number; draw: SharedValue<number> }> = ({ d, len, draw }) => {
  const props = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - draw.value) }));
  return (
    <>
      <AnimatedPath d={d} stroke={BRASS} strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round" fill="none" strokeDasharray={len} animatedProps={props} />
      <AnimatedPath d={d} stroke={BRASS_BRIGHT} strokeWidth={1.6} strokeLinecap="round" fill="none" strokeDasharray={len} animatedProps={props} />
    </>
  );
};

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: theme.z.splash, overflow: 'hidden', backgroundColor: VOID },
  glow: { position: 'absolute', left: 0, top: baseY - 150 - W / 2, width: W, height: W },
  wordWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  wordRow: { flexDirection: 'row' },
  letter: { fontFamily: F.serif, fontSize: 42, lineHeight: 48, color: WORD_COLOR, letterSpacing: 1, textShadowColor: 'rgba(200,162,78,0.45)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  tagWrap: { position: 'absolute', left: 0, right: 0, top: H * 0.72, alignItems: 'center' },
  tagline: { fontFamily: F.sansMedium, fontSize: 11, color: TAG_COLOR, letterSpacing: 2.5 },
  skipWrap: { position: 'absolute', bottom: theme.spacing['4xl'], right: theme.spacing['2xl'] },
  skipText: { fontFamily: F.sansMedium, fontSize: 12, color: 'rgba(243,239,233,0.7)', letterSpacing: 0.4 },
});
