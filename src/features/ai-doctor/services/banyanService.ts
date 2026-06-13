/**
 * Dr. Banyan service — the single entry point for an AI reply.
 *
 * Flow (retrieval-FIRST, every request):
 *   1. Load this plant's long-term memory (recurring issues, care pattern, summary).
 *   2. assembleBanyanContext() → retrieve plant facts, soil, propagation, diseases,
 *      city/season, weather, AQI, and build the grounded system prompt (70%).
 *   3. Call OpenAI with the system prompt + recent conversation turns (30% reasoning).
 *   4. Update plant memory (rolling summary + recurring issues) — never full history.
 */
import { assembleBanyanContext, type BanyanDiagnosis } from '../../../services/knowledge';
import { chatComplete, isOpenAIConfigured, type ChatMessage } from '../../../services/ai/openaiClient';
import { localBanyanReply } from './localResponder';
import { usePlantMemoryStore } from '../store/plantMemoryStore';
import type { ActivePlant } from '../store/chatStore';
import type { ChatDoc } from '../../../types/firestore.types';
import type { WeatherData } from '../../../services/weather/weatherService';

const MAX_HISTORY_TURNS = 8; // recent context only — long-term lives in plant memory

export interface AskBanyanInput {
  userQuery: string;
  activePlant?: ActivePlant | null;
  userProfile?: { name?: string; city?: string | null; climateZone?: string; skillLevel?: string };
  weather?: WeatherData | null;
  aqi?: number | null;
  diagnosis?: BanyanDiagnosis | null;
  history: ChatDoc[];
  signal?: AbortSignal;
}

export interface BanyanReply {
  reply: string;
  retrievalHit: boolean;
}

export { isOpenAIConfigured };

export async function askBanyan(input: AskBanyanInput): Promise<BanyanReply> {
  const { userQuery, activePlant, userProfile, weather, aqi, diagnosis, history, signal } = input;

  // 1. memory
  const plantId = activePlant?.plantId;
  const mem = plantId ? usePlantMemoryStore.getState().getMemory(plantId) : null;

  // 2. retrieval + grounded prompt
  const ctx = assembleBanyanContext({
    userQuery,
    plantProfile: activePlant ?? undefined,
    plantMemory: mem
      ? { memorySummary: mem.memorySummary, recurringIssues: mem.recurringIssues, userCarePattern: mem.userCarePattern }
      : undefined,
    userProfile: userProfile ?? undefined,
    weather: weather ?? null,
    aqi: aqi ?? null,
    conversationSummary: mem?.memorySummary,
    diagnosis: diagnosis ?? undefined,
  });

  // 3. generate the reply — OpenAI when configured, else a grounded local
  //    answer composed from the same retrieved knowledge (internal-testing mode).
  let reply: string;
  if (isOpenAIConfigured()) {
    const turns: ChatMessage[] = history
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));
    turns.push({ role: 'user', content: userQuery });
    reply = await chatComplete({ system: ctx.systemPrompt, messages: turns, signal });
  } else {
    reply = localBanyanReply(userQuery, ctx, {
      nickname: activePlant?.nickname,
      diagnosis: diagnosis ?? null,
    });
  }

  // 4. update memory (rolling summary + recurring issues) — never full history
  if (plantId) {
    const issues = ctx.resolved?.diseases.map((d) => d.name) ?? [];
    usePlantMemoryStore.getState().recordExchange(plantId, activePlant?.nickname ?? '', {
      topic: userQuery,
      issues,
    });
  }

  return { reply, retrievalHit: ctx.retrievalHit };
}
