import { create } from 'zustand';
import type { ChatDoc } from '../../../types/firestore.types';
import type { BanyanDiagnosis } from '../../../services/knowledge';

/** The plant Doc. Sage is currently focused on (drives context retrieval). */
export interface ActivePlant {
  plantId?: string;
  nickname?: string;
  speciesName?: string;
  scientificName?: string;
  healthStatus?: string;
  wateringFrequencyDays?: number;
}

/** Where the user entered the conversation from (for the opening framing). */
export type BanyanSource = 'tab' | 'plant-detail' | 'scan-result' | 'soil-advisor' | 'light-assessment';

interface ChatState {
  messages: ChatDoc[];
  isTyping: boolean;
  activePlant: ActivePlant | null;
  /** Diagnosis carried in from a scan / advisor result (one-shot context). */
  pendingDiagnosis: BanyanDiagnosis | null;
  /** Suggested opening question seeded by an entry point (one-shot). */
  pendingPrompt: string | null;

  appendMessage: (msg: ChatDoc) => void;
  setMessages: (msgs: ChatDoc[]) => void;
  setTyping: (v: boolean) => void;
  setActivePlant: (plant: ActivePlant | null) => void;

  /** Continuity entry: focus a plant, optionally with a diagnosis + opening prompt. */
  startContext: (ctx: { plant?: ActivePlant | null; diagnosis?: BanyanDiagnosis | null; prompt?: string | null; resetThread?: boolean }) => void;
  consumePendingPrompt: () => string | null;
  consumePendingDiagnosis: () => BanyanDiagnosis | null;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  activePlant: null,
  pendingDiagnosis: null,
  pendingPrompt: null,

  appendMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setTyping: (v) => set({ isTyping: v }),
  setActivePlant: (plant) => set({ activePlant: plant }),

  startContext: ({ plant, diagnosis, prompt, resetThread }) =>
    set((state) => ({
      activePlant: plant !== undefined ? plant : state.activePlant,
      pendingDiagnosis: diagnosis ?? null,
      pendingPrompt: prompt ?? null,
      // a new plant focus starts a fresh thread unless told otherwise
      messages: resetThread === false ? state.messages : [],
    })),

  consumePendingPrompt: () => {
    const p = get().pendingPrompt;
    if (p) set({ pendingPrompt: null });
    return p;
  },
  consumePendingDiagnosis: () => {
    const d = get().pendingDiagnosis;
    if (d) set({ pendingDiagnosis: null });
    return d;
  },

  clearChat: () => set({ messages: [], activePlant: null, pendingDiagnosis: null, pendingPrompt: null }),
}));
