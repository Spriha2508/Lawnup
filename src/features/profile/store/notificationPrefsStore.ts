import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User-facing notification category preferences.
 *
 * These are stored locally and gate which kinds of notifications LawnUp will
 * surface. The OS permission (handled separately) is the hard gate; these are
 * the in-app per-category opt-ins on top of it.
 *
 *   water         — per-plant watering reminders (wired to the scheduler today)
 *   fertilizer    — seasonal feeding nudges
 *   care          — general care tips (turning, light, repotting)
 *   productUpdates — new features & app news
 *   marketing     — offers & promotions (opt-IN, default off)
 */
export type NotificationCategory =
  | 'water'
  | 'fertilizer'
  | 'care'
  | 'productUpdates'
  | 'marketing';

interface NotificationPrefsState {
  water: boolean;
  fertilizer: boolean;
  care: boolean;
  productUpdates: boolean;
  marketing: boolean;
  setPref: (key: NotificationCategory, value: boolean) => void;
}

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      water: true,
      fertilizer: true,
      care: true,
      productUpdates: true,
      // Marketing is opt-in by default for a respectful first-run experience.
      marketing: false,
      setPref: (key, value) => set({ [key]: value } as Partial<NotificationPrefsState>),
    }),
    {
      name: 'notification-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
