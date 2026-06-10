import { HealthStatus, ReminderType, ClimateZone } from '../constants/plants';

// Firestore Timestamp — use this type instead of importing firebase directly in feature code
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
}

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  city: string;
  climateZone: ClimateZone;
  subscription: 'free' | 'premium';
  subscriptionExpiry?: Timestamp;
  fcmToken: string;
  onboardingComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserPlantDoc {
  plantId: string;
  userId: string;
  nickname: string;
  speciesName: string;
  scientificName?: string;
  imageUrl: string;
  healthStatus: HealthStatus;
  wateringFrequencyDays: number;
  lastWateredAt: Timestamp;
  nextWaterAt: Timestamp;
  fertilizeFrequencyDays?: number;
  lastFertilizedAt?: Timestamp;
  notes?: string;
  location?: string;
  addedFromScanId?: string;
  // Phase 6 — My Garden extended structure
  scanDate?: string;             // ISO date string from scan
  scanConfidence?: number;       // 0–1 confidence from Plant.id at scan time
  city?: string;                 // city at time of scan
  weatherSnapshot?: {
    tempC: number;
    humidity: number;
    conditionId: number;
  };
  remindersEnabled?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DiseaseResult {
  name: string;
  probability: number;
  description: string;
  treatment: {
    chemical?: string;
    biological?: string;
    prevention: string;
  };
}

export interface PlantScanDoc {
  scanId: string;
  userId: string;
  imageUrl: string;
  status: 'processing' | 'completed' | 'failed';
  plantIdResult: {
    commonName: string;
    scientificName: string;
    confidence: number;
    isHealthy: boolean;
    diseases: DiseaseResult[];
  } | null;
  createdAt: Timestamp;
}

export interface ChatDoc {
  chatId: string;
  plantId?: string;
  plantNickname?: string;
  role: 'user' | 'assistant';
  content: string;
  contextSnapshot?: {
    weather: string;
    plantHealth: string;
  };
  tokensUsed?: number;
  createdAt: Timestamp;
}

export interface ReminderDoc {
  reminderId: string;
  userId: string;
  plantId: string;
  plantNickname: string;
  type: ReminderType;
  message: string;
  frequencyDays: number;
  nextReminderAt: Timestamp;
  lastNotifiedAt?: Timestamp;
  isActive: boolean;
  timezone: string;
  createdAt: Timestamp;
}

export interface SubscriptionDoc {
  uid: string;
  plan: 'free' | 'premium';
  status: 'active' | 'expired' | 'cancelled' | 'grace_period' | 'pending' | 'payment_failed';
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  cashfreeSubscriptionId?: string;
  planType?: 'monthly' | 'annual';
  startDate: Timestamp;
  endDate: Timestamp;
  autoRenew: boolean;
  gracePeriodEndsAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UsageDoc {
  uid: string;
  month: string;
  scansUsed: number;
  scanLimit: number;
  aiChatsUsed: number;
  aiChatLimit: number;
  lastResetAt: Timestamp;
}

export interface PlantMemoryDoc {
  plantId: string;
  nickname: string;
  memorySummary: string;
  recurringIssues: string[];
  userCarePattern: string;
  recoveryHistory: string[];
  lastUpdated: Timestamp;
  totalInteractions: number;
}

export interface PlantKnowledgeDoc {
  plantId: string;
  commonName: string;
  hindiName?: string;
  scientificName: string;
  tags: string[];
  regions: string[];
  watering: { summer: string; winter: string; monsoon: string };
  sunlight: string;
  soil: string;
  commonDiseases: string[];
  tips: string[];
  seasonalCare: { summer: string; winter: string; monsoon: string };
  updatedAt: Timestamp;
}
