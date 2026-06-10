export type PlanId = 'free' | 'premium_monthly' | 'premium_annual';

export type FeatureName =
  | 'unlimitedScans'
  | 'aiDoctor'
  | 'diseaseDetection'
  | 'advancedWeather'
  | 'unlimitedPlants'
  | 'reminders'
  | 'priorityAI';

// Single source of truth for scan quotas (client UX gate; server enforces the same).
// Free users: 3 scans per calendar week (resets Monday). Premium: unlimited (-1).
export const FREE_WEEKLY_SCAN_LIMIT = 3;
export const PREMIUM_WEEKLY_SCAN_LIMIT = -1;

export const PREMIUM_FEATURES: FeatureName[] = [
  'unlimitedScans',
  'aiDoctor',
  'diseaseDetection',
  'advancedWeather',
  'unlimitedPlants',
  'reminders',
  'priorityAI',
];

export const FEATURE_LABELS: Record<FeatureName, string> = {
  unlimitedScans:   'Unlimited AI scans',
  aiDoctor:         'AI Doctor — personalised care',
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
  scanLimit: number;
  plantLimit: number;
  features: FeatureName[];
}

export const PLAN_DEFS: PlanDef[] = [
  {
    id: 'free',
    label: 'Free',
    price: 0,
    period: 'forever',
    scanLimit: FREE_WEEKLY_SCAN_LIMIT,
    plantLimit: 10,
    features: [],
  },
  {
    id: 'premium_monthly',
    label: 'Premium Monthly',
    price: 199,
    period: '/ month',
    scanLimit: PREMIUM_WEEKLY_SCAN_LIMIT,
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
    scanLimit: PREMIUM_WEEKLY_SCAN_LIMIT,
    plantLimit: -1,
    features: PREMIUM_FEATURES,
  },
];
