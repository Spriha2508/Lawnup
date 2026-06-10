// Firebase Function request/response shapes

export interface ProcessPlantScanRequest {
  imageBase64: string;
  extraImagesBase64?: string[];
}

// Structured Plant.id data returned by the server. Presentation logic
// (name normalization, care guide, confidence labels) lives client-side
// in src/services/api/plantIdentification.ts.
export interface ProcessPlantScanSuggestion {
  name: string;            // latin/scientific name
  probability: number;
  commonNames: string[];
  watering?: { min?: number; max?: number };
}

export interface ProcessPlantScanDisease {
  name: string;
  probability: number;
  description?: string;
  treatment?: {
    prevention?: string[];
    chemical?: string[];
    biological?: string[];
  };
}

export interface ProcessPlantScanResponse {
  scanId: string;
  imageUrl: string;
  isPlantProbability: number;
  isHealthyBinary: boolean;
  suggestions: ProcessPlantScanSuggestion[];
  diseases: ProcessPlantScanDisease[];
}

export interface GenerateAIResponseRequest {
  message: string;
  plantId?: string;
  sessionId?: string;
}

export interface GenerateAIResponseResponse {
  reply: string;
  chatId: string;
  tokensUsed: number;
  chatsRemaining: number;
}

export interface CreateCashfreeOrderRequest {
  planType: 'monthly' | 'annual';
}

export interface CreateCashfreeOrderResponse {
  orderId: string;
  paymentSessionId: string;
  amount: number;
  currency: 'INR';
}

export interface VerifyPaymentRequest {
  orderId: string;
  planType: 'monthly' | 'annual';
}

export interface VerifyPaymentResponse {
  success: boolean;
  plan: string;
  expiresAt: string;
}

// No data needed — returns full usage snapshot for the authenticated user
export type CheckUsageLimitRequest = Record<string, never>;

export interface CheckUsageLimitResponse {
  scansUsed: number;
  scanLimit: number;
  scansRemaining: number;
  aiChatsUsed: number;
  aiChatLimit: number;
  aiChatsRemaining: number;
  plan: 'free' | 'premium';
  resetDate: string; // ISO date of next weekly reset (Monday)
  isOverLimit: boolean;
}

export interface FetchWeatherRequest {
  city?: string;
}

export interface FetchWeatherResponse {
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  season: 'summer' | 'monsoon' | 'winter';
  icon: string;
  cachedAt: string;
}

// Generic API error
export interface ApiError {
  code: string;
  message: string;
}
