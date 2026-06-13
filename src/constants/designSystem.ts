/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LawnUp · designSystem.ts — THE single source of truth                    ║
 * ║                                                                            ║
 * ║  Every screen imports ONLY from here:                                      ║
 * ║      import { theme } from '@constants/designSystem';                       ║
 * ║                                                                            ║
 * ║  Zero hardcoded colours / sizes / radii / durations anywhere else.         ║
 * ║                                                                            ║
 * ║  Design intent: MIDNIGHT CONSERVATORY — a Victorian glasshouse at midnight. ║
 * ║  Deep botanical darkness, brass framing, moonlit glass, rare blooms aglow.  ║
 * ║  Premium · mysterious · alive. Per DESIGN_SYSTEM.md: AVOID dominant         ║
 * ║  green / yellow / blue — the brand is antique BRASS, the bloom accent is    ║
 * ║  ORCHID, and green survives only as sparing jade + health semantics.        ║
 * ║                                                                            ║
 * ║  Fonts in play (loaded in App.tsx):                                         ║
 * ║    Serif / display  → Cormorant Garamond  (conservatory elegance)          ║
 * ║    Sans  / UI+body  → Nunito              (legible on small screens)        ║
 * ║                                                                            ║
 * ║  TWO themes ship (DESIGN_SYSTEM.md: "dark premium home, light content"):    ║
 * ║    theme.color   = darkColor  → ACTIVE default (premium home / immersive)   ║
 * ║    theme.dark/light maps travel along for the per-screen ThemeProvider.     ║
 * ║                                                                            ║
 * ║  NOTE: legacy palette sub-keys (green/mint/terracotta/marigold/cream) are   ║
 * ║  retained so motion components keep compiling, but their VALUES now carry   ║
 * ║  Conservatory roles — green=foliage/jade, mint=orchid-glow,                 ║
 * ║  terracotta=plum, marigold=brass, cream=paper. Renamed cleanly in a later   ║
 * ║  pass when the atmosphere components are revisited for the splash rebuild.  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { Easing } from 'react-native-reanimated';
import type { TextStyle, ViewStyle } from 'react-native';

/* ─────────────────────────────────────────────────────────────────────────────
 * 1 · PALETTE  (raw colour scales — the "paint", referenced by the theme below)
 * MIDNIGHT CONSERVATORY: void darks · orchid bloom · antique brass · moonlit jade.
 * Legacy sub-key names kept for compile-safety; values carry Conservatory roles.
 * ──────────────────────────────────────────────────────────────────────────── */

const palette = {
  // ── "green" = deep FOLIAGE / moonlit JADE (supporting, never the brand) ──
  green: {
    900: '#060A07', // deepest void-foliage
    800: '#0C140E',
    700: '#14211A',
    600: '#1E3329', // pressed jade
    500: '#2E8267', // jade — sparing botanical accent
    400: '#4A9E80', // jade orb glow
    300: '#6FB89A',
    200: '#A8D4C2',
    100: '#E0F0E8', // faint jade wash (light theme)
  },

  // ── "terracotta" = dusky PLUM / ROSE (warm jewel — atmosphere blooms) ──
  terracotta: {
    600: '#6E3A52',
    500: '#8E4E6C', // plum
    400: '#B5688E', // orchid-rose orb glow
    300: '#D49CBC',
    200: '#ECCFDD',
  },
  // ── "marigold" = antique BRASS (premium metal · festive warmth) ──
  marigold: {
    500: '#C8A24E', // brass
    400: '#D6B468',
    300: '#E2C98C', // brass glow / transition gold
    200: '#F0E0BE',
  },

  // ── "mint" = ORCHID bloom glow (the rare conservatory flower / highlight) ──
  mint: {
    500: '#C77DAE', // orchid
    400: '#D9A6C8', // soft orchid glow
    300: '#E8C6DD',
    200: '#F4E2EE', // faint bloom wash
  },

  // ── "cream" = warm PAPER / parchment (light content screens) ──
  cream: {
    canvas: '#F6F1EA', // light page bg
    subtle: '#EFE8DD', // recessed sections
    sand:   '#F2ECE2', // inputs / chips
    card:   '#FFFFFF', // card fill on light
  },

  // ── Ink — text on light (warm) ──
  ink: {
    900: '#1C140F', // headings
    700: '#3A3026',
    500: '#5C5448', // body secondary
    300: '#948B7C', // captions / labels
    200: '#C2BAAC', // placeholders / disabled
    100: '#E6DDD0', // borders / dividers
  },

  // ── Semantic — health states (functional, tuned to read on dark + light) ──
  healthy:  { fg: '#1B6B45', bg: '#D8EFE2' }, // thriving
  water:    { fg: '#8A5A00', bg: '#FBEBC8' }, // needs water (amber)
  critical: { fg: '#9B3530', bg: '#F8E0DD' }, // SOS (coral)

  // ── Pure utility ──
  white: '#FFFFFF',
  black: '#0A0D0B', // "black" is the void, not pure #000
  transparent: 'transparent',
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 2 · SPACING  (8-pt grid — every gap is a multiple of 4)
 * ──────────────────────────────────────────────────────────────────────────── */

const spacing = {
  none: 0,
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  // Semantic
  screenX: 20, // horizontal screen padding
  cardGap: 12, // gap between grid cards
  touchTarget: 48, // WCAG minimum interactive size
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 3 · RADII
 * ──────────────────────────────────────────────────────────────────────────── */

const radii = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  card: 18,
  image: 13, // top image corners inside a card
  xl: 24,
  sheet: 28, // bottom-sheet / screen top corners
  pill: 100, // chips, badges, pills
  full: 9999, // circles
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 4 · TYPOGRAPHY
 *   serif* → Cormorant (hero/display personality)
 *   everything else → Nunito (UI + body). Body never below 14sp.
 * ──────────────────────────────────────────────────────────────────────────── */

const fonts = {
  serif:          'Cormorant-Regular',
  serifItalic:    'Cormorant-Italic',
  serifMedium:    'Cormorant-SemiBold',
  serifMediumItalic: 'Cormorant-SemiBoldItalic',
  serifBold:      'Cormorant-Bold',
  sans:           'Nunito-Regular',
  sansMedium:     'Nunito-SemiBold',
  sansBold:       'Nunito-Bold',
  sansHeavy:      'Nunito-ExtraBold',
} as const;

const t = (style: TextStyle): TextStyle => style;

const typography = {
  // ── Editorial hero — oversized emotional statements (immersive moments) ──
  //   Dramatic scale contrast is intentional: these carry the screen's feeling.
  heroDisplay: t({ fontFamily: fonts.serif,            fontSize: 56, lineHeight: 58, letterSpacing: -1.2 }),
  heroItalic:  t({ fontFamily: fonts.serifMediumItalic, fontSize: 58, lineHeight: 60, letterSpacing: -1.0 }),
  // ── Environmental type — giant muted word BEHIND content (e.g. "GROW") ──
  //   Always used at very low opacity (≈0.04–0.07) as architecture, not text.
  envType:     t({ fontFamily: fonts.serifBold,        fontSize: 128, lineHeight: 128, letterSpacing: -3 }),

  // ── Serif display — reserved for emotive moments (splash, hero greetings) ──
  display:     t({ fontFamily: fonts.serifBold,   fontSize: 42, lineHeight: 46, letterSpacing: -0.5 }),
  display2:    t({ fontFamily: fonts.serifMedium, fontSize: 36, lineHeight: 40, letterSpacing: -0.6 }),
  serifTitle:  t({ fontFamily: fonts.serifMedium, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 }),
  serifQuote:  t({ fontFamily: fonts.serifMediumItalic, fontSize: 20, lineHeight: 28, letterSpacing: 0 }),

  // ── Sans headings — workhorse UI titles ──
  h1:          t({ fontFamily: fonts.sansHeavy,  fontSize: 28, lineHeight: 34, letterSpacing: -0.3 }),
  h2:          t({ fontFamily: fonts.sansBold,   fontSize: 22, lineHeight: 28, letterSpacing: -0.2 }),
  h3:          t({ fontFamily: fonts.sansBold,   fontSize: 18, lineHeight: 24, letterSpacing: 0 }),
  title:       t({ fontFamily: fonts.sansBold,   fontSize: 17, lineHeight: 22, letterSpacing: 0 }),

  // ── Body ──
  bodyLg:      t({ fontFamily: fonts.sans,       fontSize: 16, lineHeight: 24, letterSpacing: 0 }),
  body:        t({ fontFamily: fonts.sans,       fontSize: 15, lineHeight: 22, letterSpacing: 0 }),
  bodyMd:      t({ fontFamily: fonts.sans,       fontSize: 14, lineHeight: 20, letterSpacing: 0 }), // min body
  bodyStrong:  t({ fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 22, letterSpacing: 0 }),

  // ── Supporting ──
  caption:     t({ fontFamily: fonts.sans,       fontSize: 12, lineHeight: 16, letterSpacing: 0 }),
  label:       t({ fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 }),
  eyebrow:     t({ fontFamily: fonts.sansMedium, fontSize: 10, lineHeight: 14, letterSpacing: 1.4 }),
  button:      t({ fontFamily: fonts.sansBold,   fontSize: 16, lineHeight: 20, letterSpacing: 0.2 }),

  // ── Numeric / stat (for streaks, health %, weather temps) ──
  statNum:     t({ fontFamily: fonts.sansHeavy,  fontSize: 21, lineHeight: 24, letterSpacing: -0.4 }),
  statLabel:   t({ fontFamily: fonts.sansMedium, fontSize: 9,  lineHeight: 12, letterSpacing: 0.9 }),
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 5 · SHADOWS / ELEVATION  (warm-tinted, never harsh black)
 * ──────────────────────────────────────────────────────────────────────────── */

const sh = (s: ViewStyle): ViewStyle => s;

const shadows = {
  none: sh({ shadowColor: palette.transparent, elevation: 0 }),
  sm: sh({
    shadowColor: '#000000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 2,
  }),
  card: sh({
    shadowColor: '#000000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 4,
  }),
  lg: sh({
    shadowColor: '#000000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40, shadowRadius: 20, elevation: 8,
  }),
  // Brass-glow under floating elements / CTAs on the void
  floating: sh({
    shadowColor: '#2A2010', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 18, elevation: 12,
  }),
  cta: sh({
    shadowColor: '#4A3A14', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 6,
  }),
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 6 · GRADIENTS  (color stops for expo-linear-gradient / Skia)
 * ──────────────────────────────────────────────────────────────────────────── */

const gradients = {
  // Splash / hero: midnight void → orchid bloom dawn
  sunrise:     ['#0A0D0B', '#161B17', '#8E4E6C', '#C77DAE'] as const,
  // Glass overlay on hero plant imagery (top→bottom darken into the void)
  heroScrim:   ['rgba(10,13,11,0)', 'rgba(10,13,11,0.55)', 'rgba(10,13,11,0.9)'] as const,
  // Soft bloom wash (e.g. "just cared for")
  dew:         ['#F4E2EE', '#E8C6DD'] as const,
  // Antique brass strip (festive / premium accents)
  marigold:    ['#D6B468', '#C8A24E'] as const,
  // Brass CTA (the primary action gradient)
  forest:      ['#D6B468', '#9A7A30'] as const,
  // Deep conservatory void (moonrise / immersive transitions)
  darkGarden:  ['#060A07', '#0A0D0B', '#161B17'] as const,
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 7 · GLASS  (frosted-glass tokens — bottom nav, hero overlays)
 * ──────────────────────────────────────────────────────────────────────────── */

const glass = {
  light:  { fill: 'rgba(246,241,234,0.72)', border: 'rgba(255,255,255,0.45)', blur: 24 },
  dark:   { fill: 'rgba(14,18,16,0.62)',    border: 'rgba(255,255,255,0.10)', blur: 24 },
  onImage:{ fill: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.26)', blur: 18 },
  // Soft frosted surface — replaces heavy opaque cards in fluid layouts.
  frost:  { fill: 'rgba(255,255,255,0.40)', border: 'rgba(255,255,255,0.52)' },
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 7b · ATMOSPHERE  ★ the "every screen is a living environment" layer ★
 *   The 3-layer system every immersive screen composes:
 *     L1 canvas (theme.color.canvas) · L2 ambient orbs + light · L3 texture grain
 *   Light-palette tuned — warm, luminous, never harsh. Decorative only.
 * ──────────────────────────────────────────────────────────────────────────── */

const atmosphere = {
  // Ambient gradient-orb tints (drift on motion.loop.drift) — orchid · plum · jade
  orb: {
    mint:       palette.mint[300],       // orchid glow
    green:      palette.green[400],       // moonlit jade
    greenSoft:  palette.green[300],
    terracotta: palette.terracotta[400],  // plum bloom
    gold:       palette.marigold[300],    // brass shimmer
  },
  // Moonlit brass light pouring through the glasshouse (LightRays / blooms / glow)
  light:    '#F0E0BE',
  lightSoft:'#E2C98C',
  bloom:    'rgba(240,224,190,0.45)',
  // L3 texture — organic, not digital. Use at the given low opacities.
  grain:    { color: '#000000', opacity: 0.05 },
  dotGrid:  { color: '#C77DAE', opacity: 0.02 },
  // Edge framing — deep vignette for the void
  vignette: 'rgba(0,0,0,0.22)',
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 8 · MOTION  ★ the product differentiator ★
 *   durations + easings + spring presets + stagger.
 *   Springs are config objects → withSpring(v, motion.spring.gentle).
 *   Easings are Reanimated Easing fns → withTiming(v, { easing: motion.ease.smooth }).
 * ──────────────────────────────────────────────────────────────────────────── */

const motion = {
  duration: {
    instant:    80,
    fast:       150, // taps, toggles, micro-press
    standard:   300, // most transitions, fades
    expressive: 500, // card entrances, sheet open
    cinematic:  800, // splash beats, moonrise, hero morph
    transition: 250, // screen-to-screen content cross-fade (atmosphere persists)
  },

  // Reanimated Easing curves (UI-thread safe)
  ease: {
    smooth:     Easing.bezier(0.22, 1.0, 0.36, 1.0),  // ease-out-cubic — transitions
    standard:   Easing.bezier(0.4, 0.0, 0.2, 1.0),    // material standard
    decelerate: Easing.out(Easing.cubic),
    accelerate: Easing.in(Easing.cubic),
    organic:    Easing.bezier(0.34, 1.2, 0.64, 1.0),  // slight overshoot — "alive"
    linear:     Easing.linear,
  },

  // withSpring presets (damping/stiffness/mass)
  spring: {
    gentle:  { damping: 18, stiffness: 180, mass: 1 },   // card stagger, soft settles
    snappy:  { damping: 20, stiffness: 320, mass: 0.9 }, // buttons, tab press
    bouncy:  { damping: 12, stiffness: 220, mass: 1 },   // playful — sprout, streak roll
    stiff:   { damping: 26, stiffness: 420, mass: 0.8 }, // tight, immediate
  },

  // List/grid entrance choreography
  stagger: {
    base: 60,   // ms between sibling items
    max: 8,     // cap items that stagger (rest snap in) to protect first paint
  },

  // ── Ambient LOOP presets — the "nothing is ever fully still" layer ──
  // Long, gentle, infinite ease-in-out / linear loops for living atmosphere.
  loop: {
    breath:  5200,  // hero plant / emblem scale-breathe (1.0 → 1.02)
    drift:   12000, // ambient orb slow travel
    shimmer: 6500,  // light-ray / glow opacity shimmer
    float:   3400,  // floating botanicals bob
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 9 · MISC tokens
 * ──────────────────────────────────────────────────────────────────────────── */

const z = { base: 0, card: 1, sticky: 10, fab: 20, header: 30, sheet: 40, toast: 50, splash: 100 } as const;
const opacity = { disabled: 0.4, muted: 0.6, scrim: 0.5, press: 0.85 } as const;
const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
const border = { hairline: 1, thin: 1.5, thick: 2 } as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 10 · SEMANTIC THEME  (light) — what screens actually reference
 *   theme.color.* maps human intent → palette. Swap this map for dark later.
 * ──────────────────────────────────────────────────────────────────────────── */

/* ── Light "conservatory daylight" map — CONTENT screens (warm parchment, same
 *    orchid/brass/jade accents as the dark home, so the worlds feel cohesive). ── */
const lightColor = {
  // Surfaces
  canvas:      palette.cream.canvas,
  surface:     palette.cream.subtle,
  card:        palette.cream.card,
  input:       palette.cream.sand,
  tabBar:      palette.cream.card,

  // Brand — antique brass (deepened for contrast on parchment)
  primary:     '#A07A28',
  primaryDark: '#7A5C1E',
  primarySoft: palette.marigold[500],
  primaryWash: palette.marigold[200],
  onPrimary:   palette.white,

  // Secondary — jade (sparing)
  secondary:     palette.green[500],
  secondarySoft: palette.green[400],
  marigold:      '#C8902E',

  // Accent — orchid bloom (deepened for light)
  accent:      '#A85C8C',
  accentWash:  palette.mint[200],

  // Dark CTA (warm near-black on light content)
  inkBtn:      palette.ink[900],
  onInkBtn:    palette.white,

  // Text
  textPrimary:   palette.ink[900],
  textSecondary: palette.ink[500],
  textMuted:     palette.ink[300],
  textFaint:     palette.ink[200],

  // Lines
  border:      palette.ink[100],
  divider:     palette.ink[100],

  // Semantic / health
  healthyFg:   palette.healthy.fg,   healthyBg:   palette.healthy.bg,
  waterFg:     palette.water.fg,     waterBg:     palette.water.bg,
  criticalFg:  palette.critical.fg,  criticalBg:  palette.critical.bg,

  // Overlays
  scrim:       'rgba(20,12,16,0.5)',
} as const;

/* ── MIDNIGHT CONSERVATORY map — THE ACTIVE THEME (premium home / immersive).
 *    Void darks · antique BRASS brand · orchid bloom accent · moonlit jade.
 *    Green is deliberately NOT the brand colour (per DESIGN_SYSTEM.md). ── */
const darkColor: Record<keyof typeof lightColor, string> = {
  // Surfaces (void → raised glasshouse panel)
  canvas:      '#0A0D0B', // midnight void (root atmosphere lifts toward #141A14 with depth)
  surface:     '#0E1210', // surfaceDeep
  card:        '#161B17', // surfaceRaised — moonlit glass panel
  input:       '#1E241F', // surfaceFloat
  tabBar:      '#0E1210',

  // Brand — antique brass (glasshouse ironwork / premium metal)
  primary:     '#C8A24E',
  primaryDark: '#9A7A30',
  primarySoft: '#D6B468',
  primaryWash: 'rgba(200,162,78,0.12)',
  onPrimary:   '#14100A',

  // Secondary — moonlit jade (sparing botanical)
  secondary:     '#4A9E80',
  secondarySoft: '#6FB89A',
  marigold:      '#D6B468', // festive brass

  // Accent — orchid bloom (the rare conservatory flower; highlights / special states)
  accent:      '#C77DAE',
  accentWash:  'rgba(199,125,174,0.12)',

  // Brand brass-glow CTA on the void
  inkBtn:      '#C8A24E',
  onInkBtn:    '#14100A',

  // Text — warm off-white on the void (never cold)
  textPrimary:   '#F3EFE9',
  textSecondary: '#C9C2B6',
  textMuted:     '#8B8475',
  textFaint:     'rgba(243,239,233,0.32)',

  // Lines
  border:      'rgba(255,255,255,0.07)',
  divider:     'rgba(255,255,255,0.05)',

  // Semantic / health
  healthyFg:   '#6FCBA0', healthyBg:   'rgba(111,203,160,0.14)',
  waterFg:     '#E0A93F', waterBg:     'rgba(224,169,63,0.14)',
  criticalFg:  '#E8736B', criticalBg:  'rgba(232,115,107,0.14)',

  scrim:       'rgba(0,0,0,0.65)',
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 11 · EXPORT
 * ──────────────────────────────────────────────────────────────────────────── */

export const theme = {
  color: darkColor,    // ← ACTIVE: Midnight Conservatory dark theme (screens use theme.color.*)
  palette,             // raw scales when a specific shade is needed
  spacing,
  radii,
  fonts,
  typography,
  shadows,
  gradients,
  glass,
  atmosphere,
  motion,
  z,
  opacity,
  hitSlop,
  border,
  // dark map travels with the theme so a future ThemeProvider can swap it in
  dark: { color: darkColor },
} as const;

// Granular named exports — convenient destructuring for screens that want it.
export {
  palette, spacing, radii, fonts, typography, shadows,
  gradients, glass, atmosphere, motion, z, opacity, hitSlop, border,
  lightColor as colorLight, darkColor as colorDark,
};

export type Theme = typeof theme;
export type ThemeColor = typeof lightColor;
export type TypographyToken = keyof typeof typography;

export default theme;
