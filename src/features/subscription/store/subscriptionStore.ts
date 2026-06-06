import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../../../constants/config';

interface SubscriptionState {
  plan: 'free' | 'premium';
  scansUsed: number;
  scanLimit: number;
  chatsUsed: number;
  chatLimit: number;
  setPlan: (plan: 'free' | 'premium') => void;
  setUsage: (scansUsed: number, chatsUsed: number) => void;
  setLimits: (scanLimit: number, chatLimit: number) => void;
  canScan: () => boolean;
  canChat: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      scansUsed: 0,
      scanLimit: config.FREE_SCAN_LIMIT,
      chatsUsed: 0,
      chatLimit: config.FREE_CHAT_LIMIT,

      setPlan: (plan) =>
        set({
          plan,
          scanLimit: plan === 'premium' ? config.PREMIUM_SCAN_LIMIT : config.FREE_SCAN_LIMIT,
          chatLimit: plan === 'premium' ? config.PREMIUM_CHAT_LIMIT : config.FREE_CHAT_LIMIT,
        }),

      setUsage: (scansUsed, chatsUsed) => set({ scansUsed, chatsUsed }),

      setLimits: (scanLimit, chatLimit) => set({ scanLimit, chatLimit }),

      canScan: () => {
        const { scansUsed, scanLimit } = get();
        return scanLimit === -1 || scansUsed < scanLimit;
      },

      canChat: () => {
        const { chatsUsed, chatLimit } = get();
        return chatLimit === -1 || chatsUsed < chatLimit;
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
