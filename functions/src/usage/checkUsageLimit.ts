import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { requireAuth } from '../middleware/authMiddleware';

const db = admin.firestore();

// Scan quota: free = 3/week (resets Monday), premium = unlimited (-1).
// Chat quota: free = 20/week, premium = unlimited (AI Doctor ships v1.1).
const FREE_WEEKLY_SCAN_LIMIT = 3;
const FREE_CHAT_LIMIT = 20;

interface UsageStatus {
  scansUsed: number;
  scanLimit: number;
  scansRemaining: number;
  aiChatsUsed: number;
  aiChatLimit: number;
  aiChatsRemaining: number;
  plan: 'free' | 'premium';
  resetDate: string; // ISO date of next weekly reset (Monday)
  isOverLimit: boolean;
}

export const checkUsageLimit = onCall(async (request): Promise<UsageStatus> => {
  const uid = requireAuth(request);

  const usageRef = db.collection('usage').doc(uid);
  const [usageSnap, subSnap] = await Promise.all([
    usageRef.get(),
    db.collection('subscriptions').doc(uid).get(),
  ]);

  const usage = usageSnap.data();
  const sub = subSnap.data();

  const plan = sub?.status === 'active' && sub?.plan === 'premium' ? 'premium' : 'free';

  // Lazily create the usage doc on first call after signup
  // (clients cannot write /usage — Firestore rules block it)
  if (!usageSnap.exists) {
    await usageRef.set({
      uid,
      scansUsed: 0,
      scanLimit: plan === 'premium' ? -1 : FREE_WEEKLY_SCAN_LIMIT,
      aiChatsUsed: 0,
      aiChatLimit: plan === 'premium' ? -1 : FREE_CHAT_LIMIT,
      lastResetAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Premium is always unlimited regardless of what the usage doc says
  const scansUsed: number = usage?.scansUsed ?? 0;
  const scanLimit: number =
    plan === 'premium' ? -1 : (usage?.scanLimit ?? FREE_WEEKLY_SCAN_LIMIT);
  const aiChatsUsed: number = usage?.aiChatsUsed ?? 0;
  const aiChatLimit: number =
    plan === 'premium' ? -1 : (usage?.aiChatLimit ?? FREE_CHAT_LIMIT);

  const scansRemaining = scanLimit === -1 ? 999 : Math.max(0, scanLimit - scansUsed);
  const aiChatsRemaining = aiChatLimit === -1 ? 999 : Math.max(0, aiChatLimit - aiChatsUsed);

  // Next reset is the coming Monday
  const now = new Date();
  const daysUntilMonday = ((8 - now.getDay()) % 7) || 7; // Sun=1 … Mon=7
  const resetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);

  return {
    scansUsed,
    scanLimit,
    scansRemaining,
    aiChatsUsed,
    aiChatLimit,
    aiChatsRemaining,
    plan,
    resetDate: resetDate.toISOString(),
    isOverLimit:
      (scanLimit !== -1 && scansRemaining === 0) ||
      (aiChatLimit !== -1 && aiChatsRemaining === 0),
  };
});
