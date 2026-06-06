import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { requireAuth } from '../middleware/authMiddleware';

const db = admin.firestore();

interface UsageStatus {
  scansUsed: number;
  scanLimit: number;
  scansRemaining: number;
  aiChatsUsed: number;
  aiChatLimit: number;
  aiChatsRemaining: number;
  plan: 'free' | 'premium';
  resetDate: string; // ISO date of next monthly reset
  isOverLimit: boolean;
}

export const checkUsageLimit = functions
  .region('asia-south1')
  .https.onCall(async (_data, context): Promise<UsageStatus> => {
    const uid = requireAuth(context);

    const [usageSnap, subSnap] = await Promise.all([
      db.collection('usage').doc(uid).get(),
      db.collection('subscriptions').doc(uid).get(),
    ]);

    const usage = usageSnap.data();
    const sub = subSnap.data();

    const plan = sub?.status === 'active' && sub?.plan === 'premium' ? 'premium' : 'free';

    const scansUsed: number = usage?.scansUsed ?? 0;
    const scanLimit: number = usage?.scanLimit ?? (plan === 'premium' ? 20 : 5);
    const aiChatsUsed: number = usage?.aiChatsUsed ?? 0;
    const aiChatLimit: number = usage?.aiChatLimit ?? (plan === 'premium' ? -1 : 20);

    const scansRemaining = scanLimit === -1 ? 999 : Math.max(0, scanLimit - scansUsed);
    const aiChatsRemaining = aiChatLimit === -1 ? 999 : Math.max(0, aiChatLimit - aiChatsUsed);

    // Next reset is the first day of next month
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      scansUsed,
      scanLimit,
      scansRemaining,
      aiChatsUsed,
      aiChatLimit,
      aiChatsRemaining,
      plan,
      resetDate: resetDate.toISOString(),
      isOverLimit: scansRemaining === 0 || (aiChatLimit !== -1 && aiChatsRemaining === 0),
    };
  });
