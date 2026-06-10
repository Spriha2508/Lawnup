import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_WEEKLY_SCAN_LIMIT, PREMIUM_FEATURES } from '../constants/plans';
import type { FeatureName } from '../constants/plans';

/**
 * Key for the current quota week: the date (YYYY-MM-DD) of this week's Monday.
 * Free scan quota resets every Monday at local midnight.
 * Must stay semantically aligned with the server-side week key in
 * functions/src/middleware/rateLimiter.ts.
 */
function weekKey(): string {
  const d = new Date();
  const daysSinceMonday = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - daysSinceMonday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface SubscriptionState {
  plan: 'free' | 'premium';
  planExpiresAt: string | null;

  // Server-synced quota (hydrated from checkUsageLimit)
  scansUsed: number;
  scanLimit: number;
  chatsUsed: number;
  chatLimit: number;

  // Local weekly scan tracking — resets every Monday
  scansThisWeek: number;
  lastScanWeekKey: string;

  // Dev-only toggle — never persisted
  mockPremium: boolean;

  isUsageHydrated: boolean;

  // Setters
  setPlan: (plan: 'free' | 'premium', expiresAt?: string) => void;
  setUsage: (scansUsed: number, chatsUsed: number) => void;
  setLimits: (scanLimit: number, chatLimit: number) => void;
  setUsageHydrated: (v: boolean) => void;
  resetUsage: () => void;
  incrementScan: () => void;
  activateMockPremium: (active: boolean) => void;

  // Computed
  isPremiumActive: () => boolean;
  canScan: () => boolean;
  canChat: () => boolean;
  canScanThisWeek: () => boolean;
  scansRemainingThisWeek: () => number;
  isFeatureEnabled: (feature: FeatureName) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      planExpiresAt: null,
      scansUsed: 0,
      scanLimit: FREE_WEEKLY_SCAN_LIMIT,
      chatsUsed: 0,
      chatLimit: 20,
      scansThisWeek: 0,
      lastScanWeekKey: '',
      mockPremium: false,
      isUsageHydrated: false,

      setPlan: (plan, expiresAt) =>
        set({
          plan,
          planExpiresAt: expiresAt ?? null,
          scanLimit: plan === 'premium' ? -1 : FREE_WEEKLY_SCAN_LIMIT,
          chatLimit: plan === 'premium' ? -1 : 20,
        }),

      setUsage: (scansUsed, chatsUsed) => set({ scansUsed, chatsUsed }),

      setLimits: (scanLimit, chatLimit) => set({ scanLimit, chatLimit }),

      setUsageHydrated: (v) => set({ isUsageHydrated: v }),

      resetUsage: () => set({ scansUsed: 0, chatsUsed: 0, isUsageHydrated: false }),

      incrementScan: () => {
        const { lastScanWeekKey, scansThisWeek } = get();
        const week = weekKey();
        set(
          lastScanWeekKey !== week
            ? { scansThisWeek: 1, lastScanWeekKey: week }
            : { scansThisWeek: scansThisWeek + 1 },
        );
      },

      activateMockPremium: (active) => set({ mockPremium: active }),

      isPremiumActive: () => {
        const { plan, planExpiresAt, mockPremium } = get();
        if (mockPremium) return true;
        if (plan !== 'premium') return false;
        if (!planExpiresAt) return true;
        return new Date(planExpiresAt) > new Date();
      },

      canScan: () => {
        const { scansUsed, scanLimit } = get();
        return scanLimit === -1 || scansUsed < scanLimit;
      },

      canChat: () => {
        const { chatsUsed, chatLimit } = get();
        return chatLimit === -1 || chatsUsed < chatLimit;
      },

      // Premium bypasses the weekly gate entirely (intended for MVP)
      canScanThisWeek: () => {
        if (get().isPremiumActive()) return true;
        const { lastScanWeekKey, scansThisWeek } = get();
        const effectiveThisWeek = lastScanWeekKey !== weekKey() ? 0 : scansThisWeek;
        return effectiveThisWeek < FREE_WEEKLY_SCAN_LIMIT;
      },

      scansRemainingThisWeek: () => {
        if (get().isPremiumActive()) return -1;
        const { lastScanWeekKey, scansThisWeek } = get();
        const effectiveThisWeek = lastScanWeekKey !== weekKey() ? 0 : scansThisWeek;
        return Math.max(0, FREE_WEEKLY_SCAN_LIMIT - effectiveThisWeek);
      },

      isFeatureEnabled: (feature) => {
        if (get().isPremiumActive()) return true;
        return !PREMIUM_FEATURES.includes(feature);
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // v2: daily keys (scansToday/lastScanDateKey) replaced by weekly keys.
      // Old persisted daily fields are simply ignored; counters start fresh.
      version: 2,
      // isUsageHydrated + mockPremium never persist
      partialize: (state) => ({
        plan: state.plan,
        planExpiresAt: state.planExpiresAt,
        scansUsed: state.scansUsed,
        scanLimit: state.scanLimit,
        chatsUsed: state.chatsUsed,
        chatLimit: state.chatLimit,
        scansThisWeek: state.scansThisWeek,
        lastScanWeekKey: state.lastScanWeekKey,
      }),
    },
  ),
);
