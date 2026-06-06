import { DiseaseResult } from './firestore.types';

// Firebase Function request/response shapes

export interface ProcessPlantScanRequest {
  imageBase64: string;
}

export interface ProcessPlantScanResponse {
  scanId: string;
  plantName: string;
  confidence: number;
  isHealthy: boolean;
  diseases: DiseaseResult[];
  suggestedActions: string[];
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
  resetDate: string; // ISO date of next monthly reset
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
