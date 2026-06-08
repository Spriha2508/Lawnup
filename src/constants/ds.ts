/**
 * LawnUp design-system tokens — single source of truth for colours, spacing,
 * typography, radii and shadows that match the "Your Greenhouse" reference.
 */

export const DS = {
  // ── Palette ────────────────────────────────────────────────────────────────
  color: {
    // Backgrounds
    screenBg:      '#EEEADF',   // warm cream page background
    card:          '#FFFFFF',   // card fill
    tabBar:        '#FFFFFF',   // bottom tab bar fill
    inputBg:       '#F5F4EF',   // input / chip fill

    // Text
    ink:           '#1A1A14',   // primary headings
    inkMid:        '#6B6B5E',   // secondary body
    inkMuted:      '#A0A094',   // labels, captions
    inkFaint:      '#C8C8BC',   // placeholders, disabled

    // Brand / accent
    forest:        '#2D6A4F',   // primary green
    forestDark:    '#1C3520',   // add-button, dark CTA
    forestLight:   '#52B788',   // softer accent

    // Interactive
    filterActive:  '#1C1C18',   // selected filter pill bg
    filterText:    '#FFFFFF',   // text on active pill
    filterInactive:'#A0A094',   // unselected pill text

    // Tab bar
    tabActive:     '#1A1A14',
    tabInactive:   '#C4C4B0',

    // Health badge
    healthGreenBg:   '#D4EDD0',
    healthGreenText: '#1B5E35',
    healthAmberBg:   '#FEF0C0',
    healthAmberText: '#8B6000',
    healthRedBg:     '#FDE8E8',
    healthRedText:   '#8B1A1A',

    // Borders / dividers
    border:        '#E8E5DB',
    divider:       '#E8E5DB',
  },

  // ── Spacing (8-pt grid) ────────────────────────────────────────────────────
  space: {
    xs:   4,
    sm:   8,
    md:   16,
    lg:   24,
    xl:   32,
    '2xl': 48,
    screenH: 20,    // horizontal screen padding
    cardGap: 12,    // gap between grid cards
  },

  // ── Border radius ──────────────────────────────────────────────────────────
  radius: {
    card:    18,
    image:   13,    // top image corners inside card
    pill:   100,    // fully round pills
    badge:  100,
    addBtn:  100,
    sm:       8,
    md:      12,
    lg:      20,
    screen:  28,
  },

  // ── Typography (Nunito family) ─────────────────────────────────────────────
  type: {
    eyebrow:   { size: 10, family: 'Nunito-SemiBold',  tracking: 1.4 },
    h1:        { size: 30, family: 'Nunito-ExtraBold',  tracking: -0.3 },
    h2:        { size: 22, family: 'Nunito-Bold',       tracking: -0.2 },
    h3:        { size: 17, family: 'Nunito-Bold',       tracking: 0 },
    body:      { size: 15, family: 'Nunito-Regular',    tracking: 0 },
    bodyMd:    { size: 14, family: 'Nunito-Regular',    tracking: 0 },
    caption:   { size: 12, family: 'Nunito-Regular',    tracking: 0 },
    label:     { size: 11, family: 'Nunito-SemiBold',   tracking: 0.3 },
    cardName:  { size: 13, family: 'Nunito-Bold',       tracking: 0 },
    cardSub:   { size: 11, family: 'Nunito-Regular',    tracking: 0 },
    statNum:   { size: 21, family: 'Nunito-ExtraBold',  tracking: -0.4 },
    statLabel: { size:  9, family: 'Nunito-SemiBold',   tracking: 0.9 },
    badge:     { size: 10, family: 'Nunito-Bold',       tracking: 0.2 },
    filter:    { size: 13, family: 'Nunito-SemiBold',   tracking: 0.1 },
  },

  // ── Shadows ────────────────────────────────────────────────────────────────
  shadow: {
    card: {
      shadowColor:   '#1A1A08',
      shadowOffset:  { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius:  12,
      elevation:     4,
    },
    sm: {
      shadowColor:   '#1A1A08',
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius:  4,
      elevation:     2,
    },
    addBtn: {
      shadowColor:   '#1C3520',
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius:  10,
      elevation:     6,
    },
  },
} as const;
