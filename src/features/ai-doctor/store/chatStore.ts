import { create } from 'zustand';
import type { ChatDoc } from '../../../types/firestore.types';

interface ChatState {
  messages: ChatDoc[];
  isTyping: boolean;
  currentPlantId: string | null;
  currentPlantNickname: string | null;
  appendMessage: (msg: ChatDoc) => void;
  setMessages: (msgs: ChatDoc[]) => void;
  setTyping: (v: boolean) => void;
  setActivePlant: (plantId: string, nickname: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  currentPlantId: null,
  currentPlantNickname: null,

  appendMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  setMessages: (msgs) => set({ messages: msgs }),

  setTyping: (v) => set({ isTyping: v }),

  setActivePlant: (plantId, nickname) =>
    set({ currentPlantId: plantId, currentPlantNickname: nickname }),

  clearChat: () =>
    set({ messages: [], currentPlantId: null, currentPlantNickname: null }),
}));
