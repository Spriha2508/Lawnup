// LawnUp typography scale.
// Headings: Nunito-ExtraBold (Plus Jakarta Sans can be substituted once installed)
// Body: Nunito-Regular / SemiBold / Bold

export const typography = {
  hero: {
    fontSize:    52,
    lineHeight:  58,
    fontFamily:  'Nunito-ExtraBold',
    letterSpacing: -1.2,
  },
  sectionHeading: {
    fontSize:    36,
    lineHeight:  42,
    fontFamily:  'Nunito-ExtraBold',
    letterSpacing: -0.6,
  },
  h1: {
    fontSize:    30,
    lineHeight:  36,
    fontFamily:  'Nunito-ExtraBold',
    letterSpacing: -0.3,
  },
  h2: {
    fontSize:    24,
    lineHeight:  30,
    fontFamily:  'Nunito-Bold',
    letterSpacing: -0.2,
  },
  h3: {
    fontSize:    20,
    lineHeight:  26,
    fontFamily:  'Nunito-Bold',
    letterSpacing: -0.1,
  },
  cardTitle: {
    fontSize:    17,
    lineHeight:  22,
    fontFamily:  'Nunito-Bold',
    letterSpacing: 0,
  },
  body: {
    fontSize:    16,
    lineHeight:  24,
    fontFamily:  'Nunito-Regular',
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize:    14,
    lineHeight:  20,
    fontFamily:  'Nunito-Regular',
    letterSpacing: 0,
  },
  label: {
    fontSize:    12,
    lineHeight:  16,
    fontFamily:  'Nunito-SemiBold',
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize:    11,
    lineHeight:  15,
    fontFamily:  'Nunito-Regular',
    letterSpacing: 0.2,
  },
  button: {
    fontSize:    16,
    lineHeight:  20,
    fontFamily:  'Nunito-Bold',
    letterSpacing: 0.3,
  },
} as const;
