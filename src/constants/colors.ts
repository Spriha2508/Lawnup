export const colors = {
  primary: '#6F943E',
  primaryLight: '#A7C47C',
  primaryDark: '#4A6B28',
  accent: '#E39B64',
  accentLight: '#F5D9C0',
  background: '#F5F1E8',
  surface: '#EEE7DA',
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
