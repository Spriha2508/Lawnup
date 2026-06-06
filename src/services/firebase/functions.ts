import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from './firebaseConfig';
import type {
  ProcessPlantScanRequest,
  ProcessPlantScanResponse,
  GenerateAIResponseRequest,
  GenerateAIResponseResponse,
  CreateCashfreeOrderRequest,
  CreateCashfreeOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  CheckUsageLimitResponse,
  FetchWeatherRequest,
  FetchWeatherResponse,
} from '../../types/api.types';

// Typed wrappers around each Firebase Function

export const processPlantScan = async (
  data: ProcessPlantScanRequest
): Promise<ProcessPlantScanResponse> => {
  const fn = httpsCallable<ProcessPlantScanRequest, ProcessPlantScanResponse>(
    functions,
    'processPlantScan'
  );
  const result: HttpsCallableResult<ProcessPlantScanResponse> = await fn(data);
  return result.data;
};

export const generateAIResponse = async (
  data: GenerateAIResponseRequest
): Promise<GenerateAIResponseResponse> => {
  const fn = httpsCallable<GenerateAIResponseRequest, GenerateAIResponseResponse>(
    functions,
    'generateAIResponse'
  );
  const result = await fn(data);
  return result.data;
};

export const createCashfreeOrder = async (
  data: CreateCashfreeOrderRequest
): Promise<CreateCashfreeOrderResponse> => {
  const fn = httpsCallable<CreateCashfreeOrderRequest, CreateCashfreeOrderResponse>(
    functions,
    'createCashfreeOrder'
  );
  const result = await fn(data);
  return result.data;
};

export const verifyPayment = async (
  data: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  const fn = httpsCallable<VerifyPaymentRequest, VerifyPaymentResponse>(
    functions,
    'verifyPayment'
  );
  const result = await fn(data);
  return result.data;
};

export const checkUsageLimit = async (): Promise<CheckUsageLimitResponse> => {
  const fn = httpsCallable<void, CheckUsageLimitResponse>(functions, 'checkUsageLimit');
  const result: HttpsCallableResult<CheckUsageLimitResponse> = await fn();
  return result.data;
};

export const fetchWeather = async (
  data: FetchWeatherRequest
): Promise<FetchWeatherResponse> => {
  const fn = httpsCallable<FetchWeatherRequest, FetchWeatherResponse>(functions, 'fetchWeather');
  const result: HttpsCallableResult<FetchWeatherResponse> = await fn(data);
  return result.data;
};
