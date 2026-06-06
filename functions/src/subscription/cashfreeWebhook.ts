import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

// Cashfree sends webhooks as HTTP POST with HMAC-SHA256 signature
export const cashfreeWebhook = functions
  .region('asia-south1')
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const cfSecret = functions.config().cashfree?.webhook_secret;
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    const receivedSignature = req.headers['x-webhook-signature'] as string;

    if (!timestamp || !receivedSignature) {
      functions.logger.warn('Missing Cashfree webhook headers');
      res.status(400).send('Bad Request');
      return;
    }

    // Verify HMAC-SHA256 signature
    const body = JSON.stringify(req.body);
    const signaturePayload = `${timestamp}${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', cfSecret)
      .update(signaturePayload)
      .digest('base64');

    if (expectedSignature !== receivedSignature) {
      functions.logger.error('Invalid Cashfree webhook signature');
      res.status(401).send('Unauthorized');
      return;
    }

    const event = req.body;
    const eventType: string = event?.type;
    const orderId: string = event?.data?.order?.order_id ?? '';
    const paymentId: string = event?.data?.payment?.cf_payment_id ?? '';

    functions.logger.info('Cashfree webhook received', { eventType, orderId });

    try {
      if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
        await handlePaymentSuccess(orderId, paymentId);
      } else if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
        await handlePaymentFailed(orderId);
      } else if (eventType === 'SUBSCRIPTION_CANCELLED') {
        await handleSubscriptionCancelled(orderId);
      } else {
        functions.logger.info('Unhandled webhook event type', { eventType });
      }

      res.status(200).send('OK');
    } catch (err) {
      functions.logger.error('Webhook processing error', err);
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
    functions.logger.warn('No subscription found for orderId', { orderId });
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

  batch.update(db.collection('usage').doc(uid), {
    scanLimit: 20,
    aiChatLimit: -1,
  });

  batch.update(db.collection('users').doc(uid), {
    subscription: 'premium',
    subscriptionExpiry: admin.firestore.Timestamp.fromDate(endDate),
  });

  await batch.commit();

  functions.logger.info('Subscription activated via webhook', { uid, orderId });
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

  functions.logger.info('Subscription cancelled via webhook', { uid, orderId });
};
