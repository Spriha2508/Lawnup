import * as admin from 'firebase-admin';

// Must be called once before any other admin SDK usage
admin.initializeApp();

// All functions exported from this file — Firebase CLI discovers them here
export { processPlantScan } from './plant/processPlantScan';
export { generateAIResponse } from './ai/generateAIResponse';
export { fetchWeather } from './weather/fetchWeather';
export { createCashfreeOrder } from './subscription/createCashfreeOrder';
export { verifyPayment } from './subscription/verifyPayment';
export { cashfreeWebhook } from './subscription/cashfreeWebhook';
export { sendReminder } from './reminders/sendReminder';
export { checkUsageLimit } from './usage/checkUsageLimit';
