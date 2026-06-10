// PARKED (launch decision 2026-06-10): not exported from index.ts.
// In-app subscriptions use RevenueCat + Play Billing; this is kept for a
// future website checkout flow.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';

const db = admin.firestore();

const CASHFREE_APP_ID = defineSecret('CASHFREE_APP_ID');
const CASHFREE_SECRET_KEY = defineSecret('CASHFREE_SECRET_KEY');

const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 19900,   // ₹199/month in paise
  annual: 199000,   // ₹1990/year in paise
};

export const createCashfreeOrder = onCall(
  { secrets: [CASHFREE_APP_ID, CASHFREE_SECRET_KEY] },
  async (request) => {
    const data = request.data as { planType: 'monthly' | 'annual' };
    const uid = requireAuth(request);

    if (!PLAN_AMOUNTS[data.planType]) {
      throw new HttpsError('invalid-argument', 'Invalid plan type.');
    }

    const userSnap = await db.collection('users').doc(uid).get();
    const user = userSnap.data();
    if (!user) throw new HttpsError('not-found', 'User not found.');

    const orderId = `LAWNUP_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = PLAN_AMOUNTS[data.planType] / 100; // Cashfree uses rupees, not paise

    const cfAppId = CASHFREE_APP_ID.value();
    const cfSecretKey = CASHFREE_SECRET_KEY.value();
    const cfBaseUrl = 'https://api.cashfree.com/pg';

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: uid,
        customer_email: user.email,
        customer_phone: '9999999999', // Required by Cashfree; update when phone is collected
        customer_name: user.name,
      },
      order_meta: {
        return_url: `lawnup://subscription/success?order_id=${orderId}`,
        // GCLOUD_PROJECT is set automatically in the Functions runtime
        notify_url: `https://asia-south1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/cashfreeWebhook`,
      },
    };

    const response = await axios.post(`${cfBaseUrl}/orders`, orderPayload, {
      headers: {
        'x-client-id': cfAppId,
        'x-client-secret': cfSecretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json',
      },
    });

    const { order_id, payment_session_id } = response.data;

    // Save pending order reference
    await db.collection('subscriptions').doc(uid).set(
      {
        uid,
        cashfreeOrderId: order_id,
        plan: 'free',
        status: 'pending',
        planType: data.planType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      orderId: order_id,
      paymentSessionId: payment_session_id,
      amount,
      currency: 'INR',
    };
  });
