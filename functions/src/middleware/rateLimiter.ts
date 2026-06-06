import * as functions from 'firebase-functions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const checkAndDecrementQuota = async (
  uid: string,
  action: 'scan' | 'chat'
): Promise<{ allowed: boolean }> => {
  const usageRef = db.collection('usage').doc(uid);

  return db.runTransaction(async (t) => {
    const usageSnap = await t.get(usageRef);

    if (!usageSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Usage record not found.');
    }

    const data = usageSnap.data()!;
    const currentMonth = getCurrentMonth();

    // Monthly reset
    if (data.month !== currentMonth) {
      t.update(usageRef, {
        month: currentMonth,
        scansUsed: 0,
        aiChatsUsed: 0,
        lastResetAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true };
    }

    if (action === 'scan') {
      if (data.scansUsed >= data.scanLimit) {
        throw new functions.https.HttpsError('resource-exhausted', 'QUOTA_EXCEEDED');
      }
      t.update(usageRef, { scansUsed: FieldValue.increment(1) });
    } else {
      if (data.aiChatLimit !== -1 && data.aiChatsUsed >= data.aiChatLimit) {
        throw new functions.https.HttpsError('resource-exhausted', 'QUOTA_EXCEEDED');
      }
      t.update(usageRef, { aiChatsUsed: FieldValue.increment(1) });
    }

    return { allowed: true };
  });
};
