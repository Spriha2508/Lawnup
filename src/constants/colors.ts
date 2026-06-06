export const colors = {
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  primaryDark: '#1B4332',
  accent: '#F4A261',
  accentLight: '#FDDCB0',
  background: '#F8FAF5',
  surface: '#FFFFFF',
  textPrimary: '#1B1B1B',
  textSecondary: '#6B7280',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E5E7EB',
  overlay: 'rgba(0,0,0,0.4)',
  // Health status
  healthy: '#22C55E',
  needsAttention: '#F59E0B',
  critical: '#EF4444',
} as const;

export type ColorKey = keyof typeof colors;
