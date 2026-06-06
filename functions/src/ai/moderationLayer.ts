import * as functions from 'firebase-functions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import OpenAI from 'openai';

const db = getFirestore();

const openai = new OpenAI({
  apiKey: functions.config().openai?.key,
});

export const moderateMessage = async (
  uid: string,
  message: string
): Promise<{ safe: boolean; reason?: string }> => {
  const result = await openai.moderations.create({ input: message });
  const [output] = result.results;

  if (output.flagged) {
    // Increment abuse counter
    await db.collection('usage').doc(uid).update({
      moderationFlags: FieldValue.increment(1),
    });

    const reason = getModerationReason(output.categories as Record<string, boolean>);
    functions.logger.warn('Moderation flag', { uid, reason });

    return { safe: false, reason };
  }

  return { safe: true };
};

const getModerationReason = (categories: Record<string, boolean>): string => {
  if (categories['violence']) return 'VIOLENCE';
  if (categories['hate']) return 'HATE';
  if (categories['self-harm']) return 'SELF_HARM';
  if (categories['sexual']) return 'SEXUAL';
  return 'POLICY_VIOLATION';
};

const SAFE_DECLINE_MESSAGES: Record<string, string> = {
  VIOLENCE: "Let's keep things peaceful! I'm here to help with plant care 🌿",
  HATE: "I can only assist with gardening and plant care topics.",
  SELF_HARM: "For personal wellbeing, please reach out to a professional. I'm here for plant care!",
  POLICY_VIOLATION: "I can only assist with gardening and plant care. Ask me about your plants!",
};

export const getSafeDeclineMessage = (reason: string): string =>
  SAFE_DECLINE_MESSAGES[reason] ?? SAFE_DECLINE_MESSAGES.POLICY_VIOLATION;
