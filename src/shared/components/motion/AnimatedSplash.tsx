/**
 * AnimatedSplash — "Scan to Bloom" (Botanical Daylight).
 *
 * Tells the app's core story in one breath: we SEE your plant → IDENTIFY it →
 * bring it to LIFE — then dawn breaks into the warm-light app.
 *
 *   0.15–0.6s  Deep void. A plant SILHOUETTE fades up, dim & grey (unknown).
 *   0.6–1.45s  A luminous AI SCAN BEAM sweeps top→bottom over the silhouette.
 *   1.3–1.8s   IDENTIFIED: a botanical name + ✓ tick in, with a confidence pulse.
 *   1.5–2.45s  Where the scan passed, LEAVES ILLUMINATE from grey into living
 *              colour, top-down (band by band).
 *   2.2–2.9s   FOLIAGE thickens + soft blossoms open — the plant goes VIBRANT.
 *   2.6–3.2s   The world DAWNS: void → warm ivory daylight.
 *   3.0–3.5s   "LawnUp" resolves on the ivory; "Grow something beautiful."
 *   EXIT       (tap from 1.8s, or auto ~3.7s) fades to reveal the live app.
 *
 * Reanimated + react-native-svg, UI-thread, no setTimeout. Foliage is reused
 * from the proven branch/leaf builder, merged to one <Path> per colour (cheap).
 * Resolves to ivory + green so it hands off seamlessly into the light app.
 * Contract: absolute overlay, onDone() exactly once.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withDelay, withSpring, cancelAnimation, runOnJS,
  interpolate, interpolateColor, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, RadialGradient, LinearGradient, Stop, Rect } from 'react-native-svg';
import { theme } from '@constants/designSystem';

const { width: W, height: H } = Dimensions.get('window');
const cx = W / 2;
const { fonts: F, motion: M } = theme;

// ── "Scan to Bloom" palette: void → daylight, with a luminous AI scan ─────────
const VOID = '#0A0D0B';            // opening dark (matches dark-scene canvas)
const IVORY = '#F7F4EC';           // resolves to the live app's warm ivory
const SILHOUETTE = '#39413A';      // cool slate — the "unknown" plant on void
const SCAN_HALO = '#9BE8B0';       // luminous mint — the AI scan beam glow
const SCAN_LINE = '#EAF7EC';       // bright scan edge
const TRUNK = '#5E7F61';           // sage (brand primary)
const TRUNK_DARK = '#46603F';
const POT_CLAY = '#A6592F';        // warm terracotta vessel
const ROSE = '#CE7E9A';            // soft blossom accent
const ROSE_CTR = '#E0A93F';        // warm gold blossom center
const WORD_COLOR = '#2A2E27';      // warm charcoal on ivory
const TAG_COLOR = '#5A5F54';
const IDENT_NAME = '#EAF7EC';
const SUN = '#FFE9B8';             // warm dawn light

// Lush foliage greens (the plant comes alive).
const GREENS = ['#4E7C4A', '#5E7F61', '#6FA06B', '#7FB069', '#3E6B3C', '#88B07E'];

const TOTAL = 3700;
const SKIP_AT = 1800;
const WORD = 'LawnUp';
const WORD_Y = H * 0.66;
const NBANDS = 6;

// ── Geometry (computed once at module load) ──────────────────────────────────
const baseY = H * 0.52;           // trunk base / pot lip
const POT_BOT = baseY + 28;

const POT_D = `M ${cx - 54} ${baseY} L ${cx + 54} ${baseY} L ${cx + 44} ${POT_BOT} L ${cx - 44} ${POT_BOT} Z`;
const POT_RIM_D = `M ${cx - 62} ${baseY} L ${cx + 62} ${baseY}`;

// One sinuous trunk, base → crown.
const TRUNK_D =
  `M ${cx} ${baseY} ` +
  `C ${cx - 20} ${baseY - 44} ${cx + 22} ${baseY - 78} ${cx + 4} ${baseY - 120} ` +
  `C ${cx - 10} ${baseY - 146} ${cx + 6} ${baseY - 166} ${cx - 6} ${baseY - 190}`;
const TRUNK_LEN = 240;

// Branches as numeric cubic Béziers, so we can both stroke them AND scatter
// foliage along their length.
type Pt = [number, number];
const BR: { p0: Pt; p1: Pt; p2: Pt; p3: Pt }[] = [
  { p0: [cx + 1, baseY - 92],  p1: [cx - 30, baseY - 98],  p2: [cx - 58, baseY - 92],  p3: [cx - 86, baseY - 112] },
  { p0: [cx + 3, baseY - 120], p1: [cx + 34, baseY - 122], p2: [cx + 64, baseY - 120], p3: [cx + 90, baseY - 140] },
  { p0: [cx - 3, baseY - 158], p1: [cx - 28, baseY - 166], p2: [cx - 48, baseY - 172], p3: [cx - 66, baseY - 190] },
  { p0: [cx - 6, baseY - 190], p1: [cx - 2, baseY - 202],  p2: [cx + 14, baseY - 206], p3: [cx + 30, baseY - 216] },
  { p0: [cx - 1, baseY - 72],  p1: [cx - 26, baseY - 76],  p2: [cx - 50, baseY - 70],  p3: [cx - 78, baseY - 86] },
  { p0: [cx + 2, baseY - 104], p1: [cx + 26, baseY - 104], p2: [cx + 48, baseY - 110], p3: [cx + 74, baseY - 124] },
  { p0: [cx + 1, baseY - 150], p1: [cx + 24, baseY - 158], p2: [cx + 40, baseY - 172], p3: [cx + 58, baseY - 192] },
  { p0: [cx - 4, baseY - 176], p1: [cx - 26, baseY - 184], p2: [cx - 42, baseY - 196], p3: [cx - 58, baseY - 214] },
  { p0: [cx + 2, baseY - 84],  p1: [cx + 24, baseY - 82],  p2: [cx + 42, baseY - 74],  p3: [cx + 62, baseY - 82] },
  { p0: [cx - 2, baseY - 132], p1: [cx + 18, baseY - 140], p2: [cx + 30, baseY - 150], p3: [cx + 42, baseY - 168] },
  { p0: [cx - 2, baseY - 110], p1: [cx - 22, baseY - 118], p2: [cx - 38, baseY - 128], p3: [cx - 54, baseY - 146] },
  { p0: [cx - 5, baseY - 168], p1: [cx + 8, baseY - 180],  p2: [cx + 18, baseY - 192], p3: [cx + 28, baseY - 210] },
  { p0: [cx + 3, baseY - 134], p1: [cx + 30, baseY - 132], p2: [cx + 54, baseY - 134], p3: [cx + 78, baseY - 152] },
  { p0: [cx - 4, baseY - 146], p1: [cx - 30, baseY - 150], p2: [cx - 52, baseY - 156], p3: [cx - 74, baseY - 172] },
];
const BRANCH_DS: string[] = BR.map(
  (b) => `M ${b.p0[0]} ${b.p0[1]} C ${b.p1[0]} ${b.p1[1]} ${b.p2[0]} ${b.p2[1]} ${b.p3[0]} ${b.p3[1]}`,
);

// Cubic point + tangent angle (deg) at parameter t.
function cubicAt(b: typeof BR[number], t: number): { x: number; y: number; ang: number } {
  const u = 1 - t;
  const a = u * u * u, c2 = 3 * u * u * t, c3 = 3 * u * t * t, d = t * t * t;
  const x = a * b.p0[0] + c2 * b.p1[0] + c3 * b.p2[0] + d * b.p3[0];
  const y = a * b.p0[1] + c2 * b.p1[1] + c3 * b.p2[1] + d * b.p3[1];
  const da = 3 * u * u, db = 6 * u * t, dc = 3 * t * t;
  const dx = da * (b.p1[0] - b.p0[0]) + db * (b.p2[0] - b.p1[0]) + dc * (b.p3[0] - b.p2[0]);
  const dy = da * (b.p1[1] - b.p0[1]) + db * (b.p2[1] - b.p1[1]) + dc * (b.p3[1] - b.p2[1]);
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const RAD = Math.PI / 180;
// A leaf with rotation + position baked into the path coords, so many leaves
// merge into ONE <Path> per colour.
function leafPathAt(x: number, y: number, L: number, rotDeg: number): string {
  const w = L * 0.42;
  const c = Math.cos(rotDeg * RAD), s = Math.sin(rotDeg * RAD);
  const tx = (px: number, py: number) => `${(x + px * c - py * s).toFixed(1)} ${(y + px * s + py * c).toFixed(1)}`;
  return `M ${tx(0, 0)} C ${tx(L * 0.5, -w)} ${tx(L, -w * 0.45)} ${tx(L, 0)} C ${tx(L, w * 0.45)} ${tx(L * 0.5, w)} ${tx(0, 0)} Z `;
}
function circlePath(x: number, y: number, r: number): string {
  return `M ${(x - r).toFixed(1)} ${y.toFixed(1)} a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0 a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0 `;
}

type Leaf = { x: number; y: number; len: number; rot: number; color: string };
const rnd = (s: number) => { const v = Math.sin(s * 12.9898) * 43758.5453; return v - Math.floor(v); };

// Build the foliage. Two sets: `core` (illuminates with the scan) and `more`
// (the vibrancy wave that thickens the canopy afterwards).
function buildLeaves(): { core: Leaf[]; more: Leaf[]; minY: number; maxY: number } {
  const core: Leaf[] = [];
  const more: Leaf[] = [];
  let i = 0;
  let minY = Infinity, maxY = -Infinity;
  const push = (wave: Leaf[], x: number, y: number, len: number, rot: number) => {
    wave.push({ x, y, len, rot, color: GREENS[i % GREENS.length] }); i++;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  };
  BR.forEach((b, bi) => {
    const samples = [0.26, 0.38, 0.5, 0.62, 0.74, 0.86, 0.96, 1.0];
    samples.forEach((t, si) => {
      const { x, y, ang } = cubicAt(b, t);
      const side = si % 2 === 0 ? 1 : -1;
      const len = 9 + rnd(bi * 7 + si) * 7;
      push(core, x, y, len, ang + side * (52 + rnd(bi + si) * 26));
      push(more, x, y, len * 0.82, ang - side * (44 + rnd(si * 3 + bi) * 24));
    });
    const tip = b.p3;
    for (let k = 0; k < 6; k++) {
      const a = -90 + (k - 2.5) * 30 + rnd(bi * 9 + k) * 16;
      push(k % 2 ? core : more, tip[0], tip[1], 10 + rnd(bi + k * 5) * 6, a);
    }
  });
  const crownX = cx - 6, crownY = baseY - 198;
  for (let k = 0; k < 26; k++) {
    const a = -150 + k * 23 + rnd(k * 4) * 18;
    const r = 6 + rnd(k) * 22;
    push(k % 2 ? more : core, crownX + Math.cos(a * RAD) * r, crownY + Math.sin(a * RAD) * r * 0.7, 9 + rnd(k * 2) * 7, a);
  }
  return { core, more, minY, maxY };
}
const { core: CORE_LEAVES, more: MORE_LEAVES, minY: LEAF_MIN_Y, maxY: LEAF_MAX_Y } = buildLeaves();
const LEAF_SPAN = LEAF_MAX_Y - LEAF_MIN_Y || 1;

// Split the core foliage into horizontal bands (top → bottom) so colour can
// flood downward in the wake of the scan.
const CORE_BANDS: Leaf[][] = Array.from({ length: NBANDS }, () => []);
CORE_LEAVES.forEach((lf) => {
  const t = (lf.y - LEAF_MIN_Y) / LEAF_SPAN;           // 0 = top, 1 = bottom
  const band = Math.min(NBANDS - 1, Math.max(0, Math.floor(t * NBANDS)));
  CORE_BANDS[band].push(lf);
});

// Merged grey silhouette path of ALL leaves (the "unknown" plant).
const SILHOUETTE_D = [...CORE_LEAVES, ...MORE_LEAVES]
  .map((lf) => leafPathAt(lf.x, lf.y, lf.len, lf.rot)).join('');

// A few soft blossoms that open at the crown + tips during the vibrancy wave.
type Bloom = { x: number; y: number; r: number };
const BLOOMS: Bloom[] = (() => {
  const out: Bloom[] = [];
  const tips = BR.map((b) => b.p3).filter((_, i) => i % 2 === 0);
  tips.forEach((p, i) => out.push({ x: p[0], y: p[1], r: 3.4 + (i % 3) }));
  const crownX = cx - 6, crownY = baseY - 196;
  for (let k = 0; k < 9; k++) {
    const a = -160 + k * 28;
    const r = 8 + rnd(k * 5) * 26;
    out.push({ x: crownX + Math.cos(a * RAD) * r, y: crownY + Math.sin(a * RAD) * r * 0.7, r: 3 + rnd(k) * 2.2 });
  }
  return out;
})();

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Scan region the beam sweeps through.
const SCAN_TOP = LEAF_MIN_Y - 36;
const SCAN_BOT = baseY + 26;
const BEAM_H = 120;

// ── One band of foliage, colour flooding in as the scan passes its row ────────
const ScanBandLayer: React.FC<{
  leaves: Leaf[]; illum: SharedValue<number>; start: number; win: number;
}> = ({ leaves, illum, start, win }) => {
  const byColor = useMemo(() => {
    const m: Record<string, string> = {};
    leaves.forEach((lf) => { m[lf.color] = (m[lf.color] ?? '') + leafPathAt(lf.x, lf.y, lf.len, lf.rot); });
    return m;
  }, [leaves]);
  const style = useAnimatedStyle(() => {
    const g = Math.min(1, Math.max(0, (illum.value - start) / win));
    return { opacity: g, transform: [{ scale: 0.86 + g * 0.14 }, { translateY: (1 - g) * 8 }] };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        {Object.entries(byColor).map(([color, d]) => <Path key={color} d={d} fill={color} />)}
      </Svg>
    </Animated.View>
  );
};

// ── The vibrancy wave — extra leaves thicken the canopy ───────────────────────
const FoliageWave: React.FC<{ leaves: Leaf[]; gate: SharedValue<number> }> = ({ leaves, gate }) => {
  const byColor = useMemo(() => {
    const m: Record<string, string> = {};
    leaves.forEach((lf) => { m[lf.color] = (m[lf.color] ?? '') + leafPathAt(lf.x, lf.y, lf.len, lf.rot); });
    return m;
  }, [leaves]);
  const style = useAnimatedStyle(() => ({
    opacity: gate.value,
    transform: [{ scale: 0.8 + gate.value * 0.2 }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        {Object.entries(byColor).map(([color, d]) => <Path key={color} d={d} fill={color} />)}
      </Svg>
    </Animated.View>
  );
};

// ── Soft blossoms opening at the tips/crown ───────────────────────────────────
const BlossomLayer: React.FC<{ gate: SharedValue<number> }> = ({ gate }) => {
  const { petals, centers } = useMemo(() => {
    let p = '', c = '';
    BLOOMS.forEach((b) => { p += circlePath(b.x, b.y, b.r); c += circlePath(b.x, b.y, b.r * 0.4); });
    return { petals: p, centers: c };
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: gate.value, transform: [{ scale: 0.5 + gate.value * 0.5 }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
        <Path d={petals} fill={ROSE} />
        <Path d={centers} fill={ROSE_CTR} />
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

  const silh = useSharedValue(0);    // silhouette fade-up
  const scan = useSharedValue(0);    // beam sweep position (0 top → 1 bottom)
  const ident = useSharedValue(0);   // identified label + tick
  const pulse = useSharedValue(0);   // confidence pulse ring
  const illum = useSharedValue(0);   // top-down colour flood
  const foliage = useSharedValue(0); // vibrancy wave + blossoms
  const dawn = useSharedValue(0);    // void → ivory
  const word = useSharedValue(0);
  const tag = useSharedValue(0);
  const skipOp = useSharedValue(0);
  const container = useSharedValue(1);

  const finish = useCallback(() => { if (calledRef.current) return; calledRef.current = true; onDone(); }, [onDone]);

  useEffect(() => {
    silh.value = withDelay(150, withTiming(1, { duration: 450, easing: M.ease.smooth }));

    // the AI scan sweeps once, top → bottom
    scan.value = withDelay(600, withTiming(1, { duration: 850, easing: M.ease.standard }));

    // recognition: name + tick + a confidence pulse
    ident.value = withDelay(1300, withTiming(1, { duration: 360, easing: M.ease.decelerate }));
    pulse.value = withDelay(1340, withTiming(1, { duration: 700, easing: M.ease.smooth }));

    // colour floods downward in the scan's wake
    illum.value = withDelay(1500, withTiming(1, { duration: 950, easing: M.ease.smooth }));

    // the canopy thickens + blossoms open — vibrant
    foliage.value = withDelay(2200, withSpring(1, M.spring.gentle));

    // the world dawns into warm ivory daylight
    dawn.value = withDelay(2600, withTiming(1, { duration: 650, easing: M.ease.smooth }));

    // the brand resolves on the light
    word.value = withDelay(3000, withTiming(1, { duration: 100 }));
    tag.value = withDelay(3380, withTiming(1, { duration: 420, easing: M.ease.smooth }));

    skipOp.value = withDelay(SKIP_AT, withTiming(1, { duration: 400 }, (f) => { if (f) runOnJS(setArmed)(true); }));

    container.value = withDelay(TOTAL - 420, withTiming(0, { duration: 420, easing: M.ease.smooth }, (f) => { if (f) runOnJS(finish)(); }));
    return () => { cancelAnimation(container); finish(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const skipNow = useCallback(() => {
    if (!armed || calledRef.current) return;
    cancelAnimation(container);
    // eslint-disable-next-line react-hooks/immutability -- shared-value write in a tap handler
    container.value = withTiming(0, { duration: 360, easing: M.ease.smooth }, (f) => { if (f) runOnJS(finish)(); });
  }, [armed, finish]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animated styles ─────────────────────────────────────────────────────────
  const rootStyle = useAnimatedStyle(() => ({
    opacity: container.value,
    backgroundColor: interpolateColor(dawn.value, [0, 1], [VOID, IVORY]),
  }));
  const sunStyle = useAnimatedStyle(() => ({ opacity: dawn.value * 0.9, transform: [{ scale: 0.6 + dawn.value * 0.5 }] }));
  // silhouette is visible on the void, then dissolves as colour + daylight take over
  const silhStyle = useAnimatedStyle(() => ({ opacity: silh.value * (1 - illum.value * 0.7) * (1 - dawn.value) }));
  const potStyle = useAnimatedStyle(() => ({ opacity: silh.value, transform: [{ translateY: (1 - silh.value) * 8 }] }));
  // sage trunk fades in as colour floods
  const trunkColorStyle = useAnimatedStyle(() => ({ opacity: illum.value }));
  const trunkProps = useAnimatedProps(() => ({ strokeDashoffset: TRUNK_LEN * (1 - Math.min(1, silh.value)) }));
  // scan beam: sweeps and fades at the ends
  const beamStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scan.value, [0, 0.06, 0.85, 1], [0, 1, 1, 0]),
    transform: [{ translateY: SCAN_TOP - BEAM_H / 2 + scan.value * (SCAN_BOT - SCAN_TOP) }],
  }));
  // identified label is a scan-HUD: appears, then fades as daylight breaks
  const identStyle = useAnimatedStyle(() => ({
    opacity: ident.value * (1 - dawn.value),
    transform: [{ translateY: (1 - ident.value) * 8 }, { scale: 0.92 + ident.value * 0.08 }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 0.2, 1], [0, 0.5, 0]) * (1 - dawn.value),
    transform: [{ scale: 0.5 + pulse.value * 1.4 }],
  }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOp.value * 0.5 }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={skipNow}>
        {/* warm dawn light blooming behind the plant */}
        <Animated.View style={[styles.sun, sunStyle]} pointerEvents="none">
          <Svg width={W} height={W}>
            <Defs><RadialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={SUN} stopOpacity={0.55} />
              <Stop offset="0.5" stopColor={SUN} stopOpacity={0.12} />
              <Stop offset="1" stopColor={SUN} stopOpacity={0} />
            </RadialGradient></Defs>
            <Circle cx={W / 2} cy={W / 2} r={W / 2} fill="url(#sun-glow)" />
          </Svg>
        </Animated.View>

        {/* the vessel */}
        <Animated.View style={[StyleSheet.absoluteFill, potStyle]} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            <Path d={POT_D} fill={POT_CLAY} opacity={0.9} />
            <Path d={POT_RIM_D} stroke={ROSE_CTR} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
          </Svg>
        </Animated.View>

        {/* grey silhouette — the "unknown" plant (leaves + trunk) */}
        <Animated.View style={[StyleSheet.absoluteFill, silhStyle]} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            <AnimatedPath
              d={TRUNK_D} stroke={SILHOUETTE} strokeWidth={6} strokeLinecap="round" fill="none"
              strokeDasharray={TRUNK_LEN} animatedProps={trunkProps}
            />
            {BRANCH_DS.map((d, i) => <Path key={i} d={d} stroke={SILHOUETTE} strokeWidth={3} strokeLinecap="round" fill="none" />)}
            <Path d={SILHOUETTE_D} fill={SILHOUETTE} />
          </Svg>
        </Animated.View>

        {/* the sage trunk/branches illuminating with colour */}
        <Animated.View style={[StyleSheet.absoluteFill, trunkColorStyle]} pointerEvents="none">
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            <Path d={TRUNK_D} stroke={TRUNK_DARK} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.5} />
            <Path d={TRUNK_D} stroke={TRUNK} strokeWidth={3} strokeLinecap="round" fill="none" />
            {BRANCH_DS.map((d, i) => <Path key={i} d={d} stroke={TRUNK} strokeWidth={2} strokeLinecap="round" fill="none" />)}
          </Svg>
        </Animated.View>

        {/* colour floods top → bottom, band by band, in the scan's wake */}
        {CORE_BANDS.map((band, i) => (
          <ScanBandLayer
            key={i}
            leaves={band}
            illum={illum}
            start={(i / NBANDS) * 0.62}
            win={0.42}
          />
        ))}

        {/* vibrancy: the canopy thickens + blossoms open */}
        <FoliageWave leaves={MORE_LEAVES} gate={foliage} />
        <BlossomLayer gate={foliage} />

        {/* the AI scan beam sweeping over the silhouette */}
        <Animated.View style={[styles.beam, beamStyle]} pointerEvents="none">
          <Svg width={W} height={BEAM_H}>
            <Defs><LinearGradient id="beam-grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={SCAN_HALO} stopOpacity={0} />
              <Stop offset="0.5" stopColor={SCAN_HALO} stopOpacity={0.22} />
              <Stop offset="1" stopColor={SCAN_HALO} stopOpacity={0} />
            </LinearGradient></Defs>
            <Rect x={0} y={0} width={W} height={BEAM_H} fill="url(#beam-grad)" />
            <Rect x={W * 0.12} y={BEAM_H / 2 - 0.8} width={W * 0.76} height={1.6} fill={SCAN_LINE} opacity={0.9} />
          </Svg>
        </Animated.View>

        {/* IDENTIFIED — scan HUD: confidence pulse + name + tick */}
        <Animated.View style={[styles.identWrap, pulseStyle]} pointerEvents="none">
          <View style={styles.pulseRing} />
        </Animated.View>
        <Animated.View style={[styles.identLabel, identStyle]} pointerEvents="none">
          <View style={styles.checkDot}>
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
              <Path d="M5 13l4 4L19 7" stroke={VOID} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Animated.Text style={styles.identName}>Ficus benjamina</Animated.Text>
          <Animated.Text style={styles.identPct}>98%</Animated.Text>
        </Animated.View>

        {/* WORDMARK resolving on the daylight */}
        <Animated.View style={[styles.wordWrap, { top: WORD_Y - 26 }, wordStyle]} pointerEvents="none">
          <View style={styles.wordRow}>
            {WORD.split('').map((ch, i) => <Letter key={i} ch={ch} delay={3000 + i * 40} />)}
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

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: theme.z.splash, overflow: 'hidden', backgroundColor: VOID },
  sun: { position: 'absolute', left: 0, top: baseY - 150 - W / 2, width: W, height: W },
  beam: { position: 'absolute', left: 0, top: 0, width: W, height: BEAM_H },

  identWrap: { position: 'absolute', left: 0, right: 0, top: baseY - 150, alignItems: 'center' },
  pulseRing: { width: 220, height: 220, borderRadius: 110, borderWidth: 1.5, borderColor: SCAN_HALO },
  identLabel: {
    position: 'absolute', left: 0, right: 0, top: H * 0.24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  checkDot: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: SCAN_HALO,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  identName: { fontFamily: F.serifMediumItalic, fontSize: 17, color: IDENT_NAME, letterSpacing: 0.2 },
  identPct: { fontFamily: F.sansBold, fontSize: 11, color: SCAN_HALO, letterSpacing: 1, marginLeft: 8 },

  wordWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  wordRow: { flexDirection: 'row' },
  letter: { fontFamily: F.serifMedium, fontSize: 42, lineHeight: 48, color: WORD_COLOR, letterSpacing: 0.5 },
  tagWrap: { position: 'absolute', left: 0, right: 0, top: H * 0.72, alignItems: 'center' },
  tagline: { fontFamily: F.sansMedium, fontSize: 11, color: TAG_COLOR, letterSpacing: 2.5 },
  skipWrap: { position: 'absolute', bottom: theme.spacing['4xl'], right: theme.spacing['2xl'] },
  skipText: { fontFamily: F.sansMedium, fontSize: 12, color: TAG_COLOR, letterSpacing: 0.4 },
});
