import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlantMemoryDoc } from '../../../types/firestore.types';

/**
 * Dr. Banyan's long-term PLANT MEMORY (per plant).
 *
 * Stores ONLY durable signal — recurring issues, nickname, recent diagnoses,
 * watering pattern, and a rolling conversation summary. It does NOT store full
 * conversation history (per product decision). Shape is kept compatible with
 * Firestore's `PlantMemoryDoc` (Timestamp → ISO string locally) so a later
 * server sync to `plant_memory` is a drop-in, not a migration.
 */
export type PlantMemory = Omit<PlantMemoryDoc, 'lastUpdated'> & { lastUpdated: string };

const MAX_DIAGNOSES = 5;
const MAX_ISSUES = 8;
const MAX_SUMMARY_TOPICS = 4;

function emptyMemory(plantId: string, nickname: string): PlantMemory {
  return {
    plantId,
    nickname,
    memorySummary: '',
    recurringIssues: [],
    userCarePattern: '',
    recoveryHistory: [],
    recentDiagnoses: [],
    lastUpdated: new Date().toISOString(),
    totalInteractions: 0,
  };
}

function dedupePush(list: string[], items: string[], max: number): string[] {
  const seen = new Set(list.map(s => s.toLowerCase()));
  const out = [...list];
  for (const it of items) {
    if (it && !seen.has(it.toLowerCase())) { out.push(it); seen.add(it.toLowerCase()); }
  }
  return out.slice(-max);
}

interface PlantMemoryState {
  memories: Record<string, PlantMemory>;
  getMemory: (plantId: string) => PlantMemory | null;
  recordDiagnosis: (plantId: string, nickname: string, diagnosis: { name: string; healthy: boolean; issues?: string[] }) => void;
  recordCarePattern: (plantId: string, nickname: string, wateringFrequencyDays?: number) => void;
  recordExchange: (plantId: string, nickname: string, opts: { topic: string; issues?: string[] }) => void;
  clearMemory: (plantId: string) => void;
}

export const usePlantMemoryStore = create<PlantMemoryState>()(
  persist(
    (set, get) => ({
      memories: {},

      getMemory: (plantId) => get().memories[plantId] ?? null,

      recordDiagnosis: (plantId, nickname, diagnosis) =>
        set((s) => {
          const mem = s.memories[plantId] ?? emptyMemory(plantId, nickname);
          const recentDiagnoses = [
            { name: diagnosis.name, date: new Date().toISOString(), healthy: diagnosis.healthy },
            ...(mem.recentDiagnoses ?? []),
          ].slice(0, MAX_DIAGNOSES);
          const recurringIssues = dedupePush(mem.recurringIssues, diagnosis.issues ?? [], MAX_ISSUES);
          return {
            memories: {
              ...s.memories,
              [plantId]: { ...mem, nickname, recentDiagnoses, recurringIssues, lastUpdated: new Date().toISOString(), totalInteractions: mem.totalInteractions + 1 },
            },
          };
        }),

      recordCarePattern: (plantId, nickname, wateringFrequencyDays) =>
        set((s) => {
          const mem = s.memories[plantId] ?? emptyMemory(plantId, nickname);
          const userCarePattern = wateringFrequencyDays ? `Waters roughly every ${wateringFrequencyDays} days` : mem.userCarePattern;
          return { memories: { ...s.memories, [plantId]: { ...mem, nickname, userCarePattern, lastUpdated: new Date().toISOString() } } };
        }),

      recordExchange: (plantId, nickname, { topic, issues }) =>
        set((s) => {
          const mem = s.memories[plantId] ?? emptyMemory(plantId, nickname);
          // rolling topic-based summary (cheap, no extra LLM call)
          const prevTopics = mem.memorySummary
            ? mem.memorySummary.replace(/^Recent topics:\s*/i, '').split(' · ').filter(Boolean)
            : [];
          const topics = dedupePush(prevTopics, [topic.slice(0, 60)], MAX_SUMMARY_TOPICS);
          const recurringIssues = dedupePush(mem.recurringIssues, issues ?? [], MAX_ISSUES);
          return {
            memories: {
              ...s.memories,
              [plantId]: {
                ...mem, nickname,
                memorySummary: `Recent topics: ${topics.join(' · ')}`,
                recurringIssues,
                lastUpdated: new Date().toISOString(),
                totalInteractions: mem.totalInteractions + 1,
              },
            },
          };
        }),

      clearMemory: (plantId) =>
        set((s) => {
          const next = { ...s.memories };
          delete next[plantId];
          return { memories: next };
        }),
    }),
    {
      name: 'plant-memory-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Pass-through; per-plant memory keys merge with the current shape.
      migrate: (persisted: any) => persisted,
    },
  ),
);
