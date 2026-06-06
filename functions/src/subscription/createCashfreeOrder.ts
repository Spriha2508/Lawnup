import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';

const db = admin.firestore();

const PLAN_AMOUNTS: Record<string, number> = {
  monthly: 9900,   // ₹99/month in paise
  annual: 79900,   // ₹799/year in paise
};

export const createCashfreeOrder = functions
  .region('asia-south1')
  .https.onCall(async (data: { planType: 'monthly' | 'annual' }, context) => {
    const uid = requireAuth(context);

    if (!PLAN_AMOUNTS[data.planType]) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid plan type.');
    }

    const userSnap = await db.collection('users').doc(uid).get();
    const user = userSnap.data();
    if (!user) throw new functions.https.HttpsError('not-found', 'User not found.');

    const orderId = `LAWNUP_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = PLAN_AMOUNTS[data.planType] / 100; // Cashfree uses rupees, not paise

    const cfAppId = functions.config().cashfree?.app_id;
    const cfSecretKey = functions.config().cashfree?.secret_key;
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
        notify_url: `https://asia-south1-${functions.config().firebase?.project_id}.cloudfunctions.net/cashfreeWebhook`,
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
