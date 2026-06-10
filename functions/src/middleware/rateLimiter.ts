import { HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Free-tier defaults — keep aligned with checkUsageLimit.ts and client plans.ts
const FREE_WEEKLY_SCAN_LIMIT = 3;
const FREE_CHAT_LIMIT = 20;

/**
 * Key for the current quota week: the date (YYYY-MM-DD) of this week's Monday.
 * Free scan quota resets every Monday. Must stay semantically aligned with the
 * client-side weekKey() in src/features/subscription/store/subscriptionStore.ts.
 */
const getCurrentWeek = (): string => {
  const d = new Date();
  const daysSinceMonday = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - daysSinceMonday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const checkAndDecrementQuota = async (
  uid: string,
  action: 'scan' | 'chat'
): Promise<{ allowed: boolean }> => {
  const usageRef = db.collection('usage').doc(uid);

  return db.runTransaction(async (t) => {
    const usageSnap = await t.get(usageRef);

    // Usage docs are created lazily here (clients cannot write /usage by rules)
    if (!usageSnap.exists) {
      t.set(usageRef, {
        uid,
        week: getCurrentWeek(),
        scansUsed: action === 'scan' ? 1 : 0,
        scanLimit: FREE_WEEKLY_SCAN_LIMIT,
        aiChatsUsed: action === 'chat' ? 1 : 0,
        aiChatLimit: FREE_CHAT_LIMIT,
        lastResetAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true };
    }

    const data = usageSnap.data()!;
    const currentWeek = getCurrentWeek();

    // Weekly reset (also migrates legacy docs that tracked `month`)
    if (data.week !== currentWeek) {
      t.update(usageRef, {
        week: currentWeek,
        scansUsed: action === 'scan' ? 1 : 0,
        aiChatsUsed: action === 'chat' ? 1 : 0,
        lastResetAt: FieldValue.serverTimestamp(),
      });
      return { allowed: true };
    }

    if (action === 'scan') {
      // scanLimit -1 = unlimited (premium) — count usage but never block
      if (data.scanLimit !== -1 && data.scansUsed >= data.scanLimit) {
        throw new HttpsError('resource-exhausted', 'QUOTA_EXCEEDED');
      }
      t.update(usageRef, { scansUsed: FieldValue.increment(1) });
    } else {
      if (data.aiChatLimit !== -1 && data.aiChatsUsed >= data.aiChatLimit) {
        throw new HttpsError('resource-exhausted', 'QUOTA_EXCEEDED');
      }
      t.update(usageRef, { aiChatsUsed: FieldValue.increment(1) });
    }

    return { allowed: true };
  });
};

/**
 * Read-only quota gate — throws QUOTA_EXCEEDED without consuming quota.
 * Use with incrementUsage() when the action can fail after the gate
 * (e.g. processPlantScan: a "not a plant" result must not burn a scan).
 */
export const assertQuotaAvailable = async (
  uid: string,
  action: 'scan' | 'chat'
): Promise<void> => {
  const usageSnap = await db.collection('usage').doc(uid).get();
  if (!usageSnap.exists) return; // doc is created lazily on first increment

  const data = usageSnap.data()!;
  if (data.week !== getCurrentWeek()) return; // stale week — counters reset on next write

  const used = action === 'scan' ? data.scansUsed : data.aiChatsUsed;
  const limit = action === 'scan' ? data.scanLimit : data.aiChatLimit;
  if (limit !== -1 && used >= limit) {
    throw new HttpsError('resource-exhausted', 'QUOTA_EXCEEDED');
  }
};

/** Consumes one unit of quota (creates/resets the usage doc as needed). */
export const incrementUsage = async (
  uid: string,
  action: 'scan' | 'chat'
): Promise<void> => {
  const usageRef = db.collection('usage').doc(uid);

  await db.runTransaction(async (t) => {
    const usageSnap = await t.get(usageRef);
    const currentWeek = getCurrentWeek();

    if (!usageSnap.exists || usageSnap.data()!.week !== currentWeek) {
      t.set(usageRef, {
        uid,
        week: currentWeek,
        scansUsed: action === 'scan' ? 1 : 0,
        scanLimit: usageSnap.data()?.scanLimit ?? FREE_WEEKLY_SCAN_LIMIT,
        aiChatsUsed: action === 'chat' ? 1 : 0,
        aiChatLimit: usageSnap.data()?.aiChatLimit ?? FREE_CHAT_LIMIT,
        lastResetAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }

    t.update(usageRef, action === 'scan'
      ? { scansUsed: FieldValue.increment(1) }
      : { aiChatsUsed: FieldValue.increment(1) });
  });
};
