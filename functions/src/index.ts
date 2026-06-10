import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';

// Must be called once before any other admin SDK usage
admin.initializeApp();

// All functions deploy to asia-south1 (Mumbai)
setGlobalOptions({ region: 'asia-south1' });

// All functions exported from this file — Firebase CLI discovers them here
export { processPlantScan } from './plant/processPlantScan';
export { generateAIResponse } from './ai/generateAIResponse';
export { fetchWeather } from './weather/fetchWeather';
export { sendReminder } from './reminders/sendReminder';
export { checkUsageLimit } from './usage/checkUsageLimit';

// NOTE (launch decision, 2026-06-10): Cashfree functions are intentionally NOT
// exported — in-app subscriptions go through RevenueCat + Play Billing (Phase 2.1).
// The source in ./subscription/ is kept for a future website checkout flow.
