export type PlanId = 'free' | 'premium_monthly' | 'premium_annual';
export type PremiumTier = 'monthly' | 'annual';

export type FeatureName =
  | 'unlimitedScans'
  | 'aiDoctor'
  | 'diseaseDetection'
  | 'advancedWeather'
  | 'unlimitedPlants'
  | 'reminders'
  | 'priorityAI';

// ── Quotas (PRD, 2026-06-13) ────────────────────────────────────────────────
// Free:    unlimited plants · 3 scans / WEEK · 20 AI messages / DAY.
// Premium: 80 scans / MONTH (monthly plan) · 100 scans / MONTH (annual plan) ·
//          unlimited AI messages.
// Client-side enforcement (Spark / no Functions deploy); mirror server-side later.
export const FREE_WEEKLY_SCAN_LIMIT = 3;
export const PREMIUM_MONTHLY_SCAN_LIMIT = 80;  // monthly plan, per calendar month
export const PREMIUM_ANNUAL_SCAN_LIMIT = 100;  // annual plan, per calendar month
export const FREE_DAILY_MESSAGE_LIMIT = 20;
export const PREMIUM_DAILY_MESSAGE_LIMIT = -1; // unlimited

/** Per-month scan cap for the active premium tier. */
export function premiumScanLimit(tier: PremiumTier): number {
  return tier === 'annual' ? PREMIUM_ANNUAL_SCAN_LIMIT : PREMIUM_MONTHLY_SCAN_LIMIT;
}

// Premium-locked features. Per PRD, plants + AI Doctor are FREE (metered), so
// they are NOT in this list — premium's value is higher quotas + these perks.
export const PREMIUM_FEATURES: FeatureName[] = [
  'unlimitedScans',
  'diseaseDetection',
  'advancedWeather',
  'reminders',
  'priorityAI',
];

export const FEATURE_LABELS: Record<FeatureName, string> = {
  unlimitedScans:   'More scans every month',
  aiDoctor:         'Doc. Sage — personalised care',
  diseaseDetection: 'Disease detection',
  advancedWeather:  'Advanced weather insights',
  unlimitedPlants:  'Unlimited plants in garden',
  reminders:        'Smart watering reminders',
  priorityAI:       'Priority AI responses',
};

export interface PlanDef {
  id: PlanId;
  label: string;
  price: number;
  period: string;
  perMonthNote?: string;
  savingsBadge?: string;
  isPopular?: boolean;
  scanLimit: number;   // scans per period (free: per week · premium: per month)
  plantLimit: number;  // -1 = unlimited
  features: FeatureName[];
}

export const PLAN_DEFS: PlanDef[] = [
  {
    id: 'free',
    label: 'Free',
    price: 0,
    period: 'forever',
    scanLimit: FREE_WEEKLY_SCAN_LIMIT,
    plantLimit: -1,
    features: [],
  },
  {
    id: 'premium_monthly',
    label: 'Premium Monthly',
    price: 199,
    period: '/ month',
    scanLimit: PREMIUM_MONTHLY_SCAN_LIMIT,
    plantLimit: -1,
    features: PREMIUM_FEATURES,
  },
  {
    id: 'premium_annual',
    label: 'Premium Annual',
    price: 1990,
    period: '/ year',
    perMonthNote: 'Just ₹166 per month',
    savingsBadge: 'SAVE 17%',
    isPopular: true,
    scanLimit: PREMIUM_ANNUAL_SCAN_LIMIT,
    plantLimit: -1,
    features: PREMIUM_FEATURES,
  },
];
