/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  LawnUp · designSystem.ts — THE single source of truth                    ║
 * ║                                                                            ║
 * ║  Every screen imports ONLY from here:                                      ║
 * ║      import { theme } from '@constants/designSystem';                       ║
 * ║                                                                            ║
 * ║  Zero hardcoded colours / sizes / radii / durations anywhere else.         ║
 * ║                                                                            ║
 * ║  Design intent: clean (Zepto) · lush & premium (lifestyle) · earthy &      ║
 * ║  desi-warm (Indian homes) · bold micro-interactions (futuristic).          ║
 * ║                                                                            ║
 * ║  Fonts in play (loaded in App.tsx):                                         ║
 * ║    Serif / display  → Cormorant Garamond  (warmth, personality)            ║
 * ║    Sans  / UI+body  → Nunito              (legible on small screens)        ║
 * ║                                                                            ║
 * ║  Dark mode: tokens are fully defined below (theme.dark) but UNUSED this     ║
 * ║  pass — app ships light-only. Wiring the toggle is a later, dedicated step. ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { Easing } from 'react-native-reanimated';
import type { TextStyle, ViewStyle } from 'react-native';

/* ─────────────────────────────────────────────────────────────────────────────
 * 1 · PALETTE  (raw colour scales — the "paint", referenced by the theme below)
 * Sophisticated, muted, India-warm. Never #00FF00 greens.
 * ──────────────────────────────────────────────────────────────────────────── */

const palette = {
  // ── Botanical green — the brand spine (deep, muted, alive) ──
  green: {
    900: '#16261A', // deepest — dark-mode canvas
    800: '#1C3520', // add-button shadow, deep forest
    700: '#2E4A22',
    600: '#4A6B28', // primaryDark — pressed states
    500: '#6F943E', // PRIMARY — the LawnUp leaf green
    400: '#A7C47C', // soft accent
    300: '#C9DBA8',
    200: '#E3EFD2',
    100: '#F1F6E8', // faintest green wash
  },

  // ── Terracotta / Marigold — desi warmth (secondary) ──
  terracotta: {
    600: '#9E4F28',
    500: '#C2683C', // SECONDARY — warm clay
    400: '#E39B64', // legacy accent
    300: '#F0C29E',
    200: '#F7E0CC',
  },
  marigold: {
    500: '#E9A21C', // festive Genda gold
    400: '#F4B740',
    300: '#FBD27E',
    200: '#FCE7B8',
  },

  // ── Mint / Morning-dew — fresh highlights (accent) ──
  mint: {
    500: '#7FCB9B',
    400: '#A8DEBC',
    300: '#CBEBD6',
    200: '#E7F3EA', // dewy card wash (e.g. "just watered")
  },

  // ── Warm neutrals — cream backgrounds, never pure white ──
  cream: {
    canvas: '#F5F1E8', // app page bg (matches NavigationContainer theme)
    subtle: '#EEEADF', // recessed sections
    sand:   '#F5F4EF', // inputs / chips
    card:   '#FFFFFF', // card fill — the one place pure white is allowed
  },

  // ── Ink — text on light ──
  ink: {
    900: '#1A1A14', // headings
    700: '#3A3A30',
    500: '#6B6B5E', // body secondary
    300: '#A0A094', // captions / labels
    200: '#C8C8BC', // placeholders / disabled
    100: '#E8E5DB', // borders / dividers
  },

  // ── Semantic — health states ──
  healthy:  { fg: '#1B5E35', bg: '#D4EDD0' }, // thriving
  water:    { fg: '#8B6000', bg: '#FEF0C0' }, // needs water (amber)
  critical: { fg: '#8B1A1A', bg: '#FDE8E8' }, // SOS (coral red)

  // ── Pure utility ──
  white: '#FFFFFF',
  black: '#111111',
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
  // ── Serif display — reserved for emotive moments (splash, hero greetings) ──
  display:     t({ fontFamily: fonts.serifBold,   fontSize: 42, lineHeight: 46, letterSpacing: -0.5 }),
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
    shadowColor: '#1A1A08', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  }),
  card: sh({
    shadowColor: '#1A1A08', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 4,
  }),
  lg: sh({
    shadowColor: '#1A1A08', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10, shadowRadius: 20, elevation: 8,
  }),
  floating: sh({
    shadowColor: '#1C3520', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 16, elevation: 12,
  }),
  cta: sh({
    shadowColor: '#1C3520', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  }),
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 6 · GRADIENTS  (color stops for expo-linear-gradient / Skia)
 * ──────────────────────────────────────────────────────────────────────────── */

const gradients = {
  // Splash: dark rich soil → morning light
  sunrise:     ['#16261A', '#3E5F2A', '#A7C47C', '#F5F1E8'] as const,
  // Glass overlay on hero plant imagery (top→bottom darken)
  heroScrim:   ['rgba(22,38,26,0)', 'rgba(22,38,26,0.55)', 'rgba(22,38,26,0.85)'] as const,
  // "Just watered" dewy wash
  dew:         ['#E7F3EA', '#CBEBD6'] as const,
  // Festive marigold (Diwali / Navratri accent strips)
  marigold:    ['#F4B740', '#E9A21C'] as const,
  // Forest CTA
  forest:      ['#6F943E', '#4A6B28'] as const,
  // Dark garden (used by the future dark-mode moonrise transition)
  darkGarden:  ['#0F1A12', '#16261A', '#1C3520'] as const,
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 7 · GLASS  (frosted-glass tokens — bottom nav, hero overlays)
 * ──────────────────────────────────────────────────────────────────────────── */

const glass = {
  light:  { fill: 'rgba(245,241,232,0.72)', border: 'rgba(255,255,255,0.45)', blur: 24 },
  dark:   { fill: 'rgba(22,38,26,0.55)',    border: 'rgba(255,255,255,0.12)', blur: 24 },
  onImage:{ fill: 'rgba(255,255,255,0.16)', border: 'rgba(255,255,255,0.28)', blur: 18 },
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

const lightColor = {
  // Surfaces
  canvas:      palette.cream.canvas,
  surface:     palette.cream.subtle,
  card:        palette.cream.card,
  input:       palette.cream.sand,
  tabBar:      palette.cream.card,

  // Brand
  primary:     palette.green[500],
  primaryDark: palette.green[600],
  primarySoft: palette.green[400],
  primaryWash: palette.green[100],
  onPrimary:   palette.white,

  secondary:   palette.terracotta[500],
  secondarySoft: palette.terracotta[400],
  marigold:    palette.marigold[500],

  accent:      palette.mint[500],
  accentWash:  palette.mint[200],

  // Dark CTA (the black add/scan buttons already in the app)
  inkBtn:      palette.black,
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
  scrim:       'rgba(22,38,26,0.5)',
} as const;

/* ── Dark colour map — DEFINED, UNUSED this pass (forest base, not black) ── */
const darkColor: Record<keyof typeof lightColor, string> = {
  canvas:      '#0F1A12',
  surface:     '#16261A',
  card:        '#1C3520',
  input:       '#21402A',
  tabBar:      '#16261A',

  primary:     palette.green[400],
  primaryDark: palette.green[500],
  primarySoft: palette.green[500],
  primaryWash: '#21402A',
  onPrimary:   '#0F1A12',

  secondary:   palette.terracotta[400],
  secondarySoft: palette.terracotta[500],
  marigold:    palette.marigold[400],

  accent:      palette.mint[400],
  accentWash:  '#21402A',

  inkBtn:      palette.white,
  onInkBtn:    palette.green[900],

  textPrimary:   '#F1F6E8',
  textSecondary: '#B8C4AC',
  textMuted:     '#7E8C72',
  textFaint:     '#4A5A40',

  border:      '#2E4A22',
  divider:     '#2E4A22',

  healthyFg:   palette.mint[400],   healthyBg:   '#1B3A26',
  waterFg:     palette.marigold[300], waterBg:   '#3A2E10',
  criticalFg:  '#F0A0A0',           criticalBg:  '#3A1A1A',

  scrim:       'rgba(0,0,0,0.6)',
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 11 · EXPORT
 * ──────────────────────────────────────────────────────────────────────────── */

export const theme = {
  color: lightColor,   // ← screens use theme.color.* (light)
  palette,             // raw scales when a specific shade is needed
  spacing,
  radii,
  fonts,
  typography,
  shadows,
  gradients,
  glass,
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
  gradients, glass, motion, z, opacity, hitSlop, border,
  lightColor as colorLight, darkColor as colorDark,
};

export type Theme = typeof theme;
export type ThemeColor = typeof lightColor;
export type TypographyToken = keyof typeof typography;

export default theme;
