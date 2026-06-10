// PARKED (launch decision 2026-06-10): not exported from index.ts.
// In-app subscriptions use RevenueCat + Play Billing; kept for future web checkout.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';

const db = admin.firestore();

const CASHFREE_APP_ID = defineSecret('CASHFREE_APP_ID');
const CASHFREE_SECRET_KEY = defineSecret('CASHFREE_SECRET_KEY');

export const verifyPayment = onCall(
  { secrets: [CASHFREE_APP_ID, CASHFREE_SECRET_KEY] },
  async (request) => {
      const data = request.data as { orderId: string; planType: 'monthly' | 'annual' };
      const uid = requireAuth(request);

      if (!data.orderId) {
        throw new HttpsError('invalid-argument', 'orderId is required.');
      }

      const cfAppId = CASHFREE_APP_ID.value();
      const cfSecretKey = CASHFREE_SECRET_KEY.value();
      const cfBaseUrl = 'https://api.cashfree.com/pg';

      // Server-side verification — never trust the client's payment status
      const orderRes = await axios.get(`${cfBaseUrl}/orders/${data.orderId}`, {
        headers: {
          'x-client-id': cfAppId,
          'x-client-secret': cfSecretKey,
          'x-api-version': '2023-08-01',
        },
      });

      const orderData = orderRes.data;
      if (orderData.order_status !== 'PAID') {
        throw new HttpsError('failed-precondition', 'Payment not completed.');
      }

      const subRef = db.collection('subscriptions').doc(uid);
      const usageRef = db.collection('usage').doc(uid);

      // Idempotency check — safe to call multiple times
      const existingSub = await subRef.get();
      if (existingSub.exists && existingSub.data()?.cashfreePaymentId === orderData.cf_payment_id) {
        logger.info('Duplicate verifyPayment call, skipping', { uid, orderId: data.orderId });
        return { success: true, plan: 'premium', expiresAt: existingSub.data()?.endDate?.toDate()?.toISOString() };
      }

      const now = new Date();
      const endDate = new Date(now);
      if (data.planType === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const batch = db.batch();

      batch.set(subRef, {
        uid,
        plan: 'premium',
        status: 'active',
        cashfreeOrderId: data.orderId,
        cashfreePaymentId: orderData.cf_payment_id,
        planType: data.planType,
        startDate: admin.firestore.Timestamp.fromDate(now),
        endDate: admin.firestore.Timestamp.fromDate(endDate),
        autoRenew: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Premium = unlimited scans and chats
      batch.set(usageRef, {
        scanLimit: -1,
        aiChatLimit: -1,
      }, { merge: true });

      await batch.commit();

      await db.collection('users').doc(uid).update({
        subscription: 'premium',
        subscriptionExpiry: admin.firestore.Timestamp.fromDate(endDate),
      });

      // Send FCM confirmation
      const userSnap = await db.collection('users').doc(uid).get();
      const fcmToken = userSnap.data()?.fcmToken;
      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: '✨ Welcome to Premium!',
            body: 'You now have unlimited plant scans and AI chats.',
          },
        }).catch(() => { /* FCM errors should not fail the function */ });
      }

      return { success: true, plan: 'premium', expiresAt: endDate.toISOString() };
    }
  );
