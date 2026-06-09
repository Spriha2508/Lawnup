// All shadows use a warm botanical tint — never cold grey.

export const shadows = {
  card: {
    shadowColor:   '#6F943E',
    shadowOffset:  { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius:  24,
    elevation:     6,
  },
  sm: {
    shadowColor:   '#6F943E',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius:  10,
    elevation:     3,
  },
  button: {
    shadowColor:   '#6F943E',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius:  16,
    elevation:     8,
  },
  hero: {
    shadowColor:   '#111111',
    shadowOffset:  { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius:  32,
    elevation:     10,
  },
} as const;
