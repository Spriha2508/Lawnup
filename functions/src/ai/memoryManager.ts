import * as functions from 'firebase-functions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import OpenAI from 'openai';
import type { PlantMemoryDoc } from '../types';

const db = getFirestore();
const openai = new OpenAI({ apiKey: functions.config().openai?.key });

export const getPlantMemory = async (
  uid: string,
  plantId: string
): Promise<PlantMemoryDoc | null> => {
  const snap = await db
    .collection('users')
    .doc(uid)
    .collection('plant_memory')
    .doc(plantId)
    .get();
  return snap.exists ? (snap.data() as PlantMemoryDoc) : null;
};

// Fire-and-forget — called after returning the AI response to avoid latency impact
export const updatePlantMemoryAsync = (
  uid: string,
  plantId: string,
  nickname: string,
  userMessage: string,
  aiResponse: string
): void => {
  updateMemory(uid, plantId, nickname, userMessage, aiResponse).catch((err) =>
    functions.logger.error('Memory update failed', { uid, plantId, err })
  );
};

const updateMemory = async (
  uid: string,
  plantId: string,
  nickname: string,
  userMessage: string,
  aiResponse: string
): Promise<void> => {
  const memRef = db.collection('users').doc(uid).collection('plant_memory').doc(plantId);
  const snap = await memRef.get();
  const existing = snap.exists ? (snap.data() as PlantMemoryDoc) : null;
  const totalInteractions = (existing?.totalInteractions ?? 0) + 1;

  // Only re-summarize every 5 interactions to control cost
  if (totalInteractions % 5 !== 0) {
    await memRef.set({ totalInteractions, nickname }, { merge: true });
    return;
  }

  const summaryPrompt = `You are summarizing a plant's care history for ${nickname} (a ${plantId} plant).

Existing summary: "${existing?.memorySummary ?? 'None yet.'}"
Recurring issues so far: ${existing?.recurringIssues?.join(', ') ?? 'none'}

Latest conversation turn:
User: "${userMessage}"
AI: "${aiResponse}"

Write a NEW compressed summary (max 200 chars) of this plant's history, care patterns, and any recurring issues.
Also list up to 3 recurring issues as a JSON array on the last line, format: ISSUES:["issue1","issue2"]`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: summaryPrompt }],
    max_tokens: 200,
  });

  const responseText = completion.choices[0].message.content ?? '';
  const issuesMatch = responseText.match(/ISSUES:(\[.*\])/);
  let recurringIssues: string[] = existing?.recurringIssues ?? [];
  try {
    if (issuesMatch) recurringIssues = JSON.parse(issuesMatch[1]);
  } catch { /* keep existing */ }

  const summary = responseText.replace(/ISSUES:\[.*\]/, '').trim();

  await memRef.set(
    {
      plantId,
      nickname,
      memorySummary: summary,
      recurringIssues,
      totalInteractions,
      lastUpdated: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
};
