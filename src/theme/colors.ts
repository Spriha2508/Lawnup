export const colors = {
  // Backgrounds
  background:    '#F5F1E8',
  card:          '#EEE7DA',
  cardWhite:     '#FFFFFF',
  inputBg:       '#EDE6D8',

  // Brand
  primary:       '#6F943E',
  primaryLight:  '#A7C47C',
  primaryDark:   '#4A6B28',

  // Text
  textPrimary:   '#111111',
  textSecondary: '#6E6A64',
  textMuted:     '#9E9A94',
  textFaint:     '#C4C0BA',

  // Accent
  accentOrange:  '#E39B64',
  accentAmber:   '#F0C060',

  // Semantic
  success:       '#6F943E',
  error:         '#DC2626',
  warning:       '#D97706',

  // Border / divider
  border:        '#DDD4C7',
  divider:       '#E5DDD0',

  // Neutral
  white:         '#FFFFFF',
  black:         '#000000',
} as const;

export type Color = keyof typeof colors;
