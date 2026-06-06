import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';

const db = admin.firestore();

export const verifyPayment = functions
  .region('asia-south1')
  .https.onCall(
    async (data: { orderId: string; planType: 'monthly' | 'annual' }, context) => {
      const uid = requireAuth(context);

      if (!data.orderId) {
        throw new functions.https.HttpsError('invalid-argument', 'orderId is required.');
      }

      const cfAppId = functions.config().cashfree?.app_id;
      const cfSecretKey = functions.config().cashfree?.secret_key;
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
        throw new functions.https.HttpsError('failed-precondition', 'Payment not completed.');
      }

      const subRef = db.collection('subscriptions').doc(uid);
      const usageRef = db.collection('usage').doc(uid);

      // Idempotency check — safe to call multiple times
      const existingSub = await subRef.get();
      if (existingSub.exists && existingSub.data()?.cashfreePaymentId === orderData.cf_payment_id) {
        functions.logger.info('Duplicate verifyPayment call, skipping', { uid, orderId: data.orderId });
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

      batch.update(usageRef, {
        scanLimit: 20,
        aiChatLimit: -1,
      });

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
            body: 'You now have unlimited AI chats and 20 scans per month.',
          },
        }).catch(() => { /* FCM errors should not fail the function */ });
      }

      return { success: true, plan: 'premium', expiresAt: endDate.toISOString() };
    }
  );
