import { useSubscriptionStore } from '../store/subscriptionStore';
import type { FeatureName } from '../constants/plans';

export interface FeatureGate {
  canUse: boolean;
  isPremium: boolean;
  showUpgrade: boolean;
}

export function useFeatureGate(feature: FeatureName): FeatureGate {
  const { isFeatureEnabled, isPremiumActive } = useSubscriptionStore();
  const isPremium = isPremiumActive();
  const canUse = isFeatureEnabled(feature);
  return { canUse, isPremium, showUpgrade: !canUse };
}

export function useScanGate() {
  const { canScanThisWeek, scansRemainingThisWeek, isPremiumActive } = useSubscriptionStore();
  const isPremium = isPremiumActive();
  return {
    canScan: canScanThisWeek(),
    isPremium,
    remaining: scansRemainingThisWeek(),
  };
}
