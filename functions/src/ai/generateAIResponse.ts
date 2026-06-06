import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';
import { checkAndDecrementQuota } from '../middleware/rateLimiter';
import { moderateMessage, getSafeDeclineMessage } from './moderationLayer';
import { buildSystemPrompt, sanitizeInput } from './promptBuilder';
import { getPlantMemory, updatePlantMemoryAsync } from './memoryManager';
import { getIndianSeason } from '../weather/fetchWeather';

const db = admin.firestore();
const openai = new OpenAI({ apiKey: functions.config().openai?.key });

export const generateAIResponse = functions
  .region('asia-south1')
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(
    async (data: { message: string; plantId?: string; sessionId?: string }, context) => {
      const uid = requireAuth(context);

      // Sanitize input
      const userMessage = sanitizeInput(data.message);
      if (!userMessage) {
        throw new functions.https.HttpsError('invalid-argument', 'Message is empty.');
      }

      // Check quota
      await checkAndDecrementQuota(uid, 'chat');

      // Safety gate
      const modResult = await moderateMessage(uid, userMessage);
      if (!modResult.safe) {
        return {
          reply: getSafeDeclineMessage(modResult.reason ?? 'POLICY_VIOLATION'),
          chatId: null,
          tokensUsed: 0,
          chatsRemaining: -1,
        };
      }

      // Fetch user data
      const userSnap = await db.collection('users').doc(uid).get();
      const user = userSnap.data();
      if (!user) throw new functions.https.HttpsError('not-found', 'User not found.');

      // Fetch active plant
      let plant = null;
      let memory = null;
      if (data.plantId) {
        const plantSnap = await db
          .collection('users').doc(uid)
          .collection('plants').doc(data.plantId).get();
        if (plantSnap.exists) plant = plantSnap.data();
        memory = await getPlantMemory(uid, data.plantId);
      }

      // Fetch all plant nicknames for context
      const plantsSnap = await db
        .collection('users').doc(uid).collection('plants').limit(10).get();
      const allPlants = plantsSnap.docs.map((d) => ({
        nickname: d.data().nickname,
        species: d.data().speciesName,
      }));

      // Fetch weather (cached)
      const weather = await getWeather(user.city ?? 'Delhi');

      // Fetch last 5 chat turns
      const historySnap = await db
        .collection('users').doc(uid).collection('chat_history')
        .where('plantId', '==', data.plantId ?? null)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const last5 = historySnap.docs
        .map((d) => d.data())
        .reverse()
        .slice(-5);

      // Build prompt
      const systemPrompt = buildSystemPrompt(
        plant
          ? {
              nickname: plant.nickname,
              speciesName: plant.speciesName,
              healthStatus: plant.healthStatus,
              lastWateredAt: plant.lastWateredAt?.toDate?.()?.toLocaleDateString('en-IN') ?? 'unknown',
              wateringFrequencyDays: plant.wateringFrequencyDays,
            }
          : null,
        weather,
        [],
        memory ? { summary: memory.memorySummary, recurringIssues: memory.recurringIssues } : null,
        allPlants
      );

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...last5.map((turn) => ({
          role: turn.role as 'user' | 'assistant',
          content: turn.content as string,
        })),
        { role: 'user', content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages,
        max_tokens: 200,
        temperature: 0.7,
      });

      const reply = completion.choices[0].message.content ?? 'Sorry, I could not respond right now.';
      const tokensUsed = completion.usage?.total_tokens ?? 0;

      // Save chat turns
      const batch = db.batch();
      const userChatRef = db.collection('users').doc(uid).collection('chat_history').doc();
      const aiChatRef = db.collection('users').doc(uid).collection('chat_history').doc();

      batch.set(userChatRef, {
        chatId: userChatRef.id,
        plantId: data.plantId ?? null,
        plantNickname: plant?.nickname ?? null,
        role: 'user',
        content: userMessage,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batch.set(aiChatRef, {
        chatId: aiChatRef.id,
        plantId: data.plantId ?? null,
        plantNickname: plant?.nickname ?? null,
        role: 'assistant',
        content: reply,
        tokensUsed,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();

      // Update memory async — does not block response
      if (data.plantId && plant) {
        updatePlantMemoryAsync(uid, data.plantId, plant.nickname, userMessage, reply);
      }

      // Fetch remaining chats
      const usageSnap = await db.collection('usage').doc(uid).get();
      const usage = usageSnap.data();
      const chatsRemaining =
        usage?.aiChatLimit === -1
          ? -1
          : Math.max(0, (usage?.aiChatLimit ?? 0) - (usage?.aiChatsUsed ?? 0));

      return { reply, chatId: aiChatRef.id, tokensUsed, chatsRemaining };
    }
  );

const getWeather = async (city: string) => {
  const cacheRef = db.collection('cache').doc(`weather_${city}`);
  const cached = await cacheRef.get();

  if (cached.exists) {
    const data = cached.data()!;
    const age = Date.now() - data.fetchedAt?.toMillis?.();
    if (age < 3 * 60 * 60 * 1000) return data.weather;
  }

  try {
    const owmKey = functions.config().openweather?.key;
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${owmKey}&units=metric`
    );
    const d = res.data;
    const weather = {
      city,
      temp: Math.round(d.main.temp),
      condition: d.weather[0]?.description ?? 'clear',
      humidity: d.main.humidity,
      season: getIndianSeason(),
    };
    await cacheRef.set({ weather, fetchedAt: admin.firestore.FieldValue.serverTimestamp() });
    return weather;
  } catch {
    return { city, temp: 30, condition: 'clear', humidity: 60, season: getIndianSeason() };
  }
};

