// PARKED (launch decision 2026-06-10): not exported from index.ts.
// In-app subscriptions use RevenueCat + Play Billing; kept for future web checkout.
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

const CASHFREE_WEBHOOK_SECRET = defineSecret('CASHFREE_WEBHOOK_SECRET');

// Cashfree sends webhooks as HTTP POST with HMAC-SHA256 signature
export const cashfreeWebhook = onRequest(
  { secrets: [CASHFREE_WEBHOOK_SECRET], region: 'asia-south1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const cfSecret = CASHFREE_WEBHOOK_SECRET.value();
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    const receivedSignature = req.headers['x-webhook-signature'] as string;

    if (!timestamp || !receivedSignature) {
      logger.warn('Missing Cashfree webhook headers');
      res.status(400).send('Bad Request');
      return;
    }

    // Verify HMAC-SHA256 signature over the RAW request body Cashfree signed.
    // Re-serializing req.body with JSON.stringify produces different bytes
    // (key order / spacing) and breaks verification — use req.rawBody.
    const rawBody = (req as { rawBody?: Buffer }).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    const signaturePayload = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', cfSecret)
      .update(signaturePayload)
      .digest('base64');

    if (expectedSignature !== receivedSignature) {
      logger.error('Invalid Cashfree webhook signature');
      res.status(401).send('Unauthorized');
      return;
    }

    const event = req.body;
    const eventType: string = event?.type;
    const orderId: string = event?.data?.order?.order_id ?? '';
    const paymentId: string = event?.data?.payment?.cf_payment_id ?? '';

    logger.info('Cashfree webhook received', { eventType, orderId });

    try {
      if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
        await handlePaymentSuccess(orderId, paymentId);
      } else if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
        await handlePaymentFailed(orderId);
      } else if (eventType === 'SUBSCRIPTION_CANCELLED') {
        await handleSubscriptionCancelled(orderId);
      } else {
        logger.info('Unhandled webhook event type', { eventType });
      }

      res.status(200).send('OK');
    } catch (err) {
      logger.error('Webhook processing error', err);
      res.status(500).send('Internal Server Error');
    }
  });

const handlePaymentSuccess = async (orderId: string, paymentId: string) => {
  // Find the subscription with this orderId
  const subSnap = await db
    .collection('subscriptions')
    .where('cashfreeOrderId', '==', orderId)
    .limit(1)
    .get();

  if (subSnap.empty) {
    logger.warn('No subscription found for orderId', { orderId });
    return;
  }

  const subDoc = subSnap.docs[0];
  const subData = subDoc.data();

  // Idempotency guard
  if (subData.status === 'active') return;

  const uid = subData.uid;
  const now = new Date();
  const endDate = new Date(now);
  if (subData.planType === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const batch = db.batch();

  batch.update(subDoc.ref, {
    status: 'active',
    plan: 'premium',
    cashfreePaymentId: paymentId,
    startDate: admin.firestore.Timestamp.fromDate(now),
    endDate: admin.firestore.Timestamp.fromDate(endDate),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection('usage').doc(uid), {
    scanLimit: -1,
    aiChatLimit: -1,
  }, { merge: true });

  batch.update(db.collection('users').doc(uid), {
    subscription: 'premium',
    subscriptionExpiry: admin.firestore.Timestamp.fromDate(endDate),
  });

  await batch.commit();

  logger.info('Subscription activated via webhook', { uid, orderId });
};

const handlePaymentFailed = async (orderId: string) => {
  const subSnap = await db
    .collection('subscriptions')
    .where('cashfreeOrderId', '==', orderId)
    .limit(1)
    .get();

  if (subSnap.empty) return;

  await subSnap.docs[0].ref.update({
    status: 'payment_failed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const handleSubscriptionCancelled = async (orderId: string) => {
  const subSnap = await db
    .collection('subscriptions')
    .where('cashfreeOrderId', '==', orderId)
    .limit(1)
    .get();

  if (subSnap.empty) return;

  const subDoc = subSnap.docs[0];
  const uid = subDoc.data().uid;

  const batch = db.batch();

  batch.update(subDoc.ref, {
    status: 'cancelled',
    autoRenew: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.update(db.collection('users').doc(uid), {
    subscription: 'free',
  });

  await batch.commit();

  logger.info('Subscription cancelled via webhook', { uid, orderId });
};
