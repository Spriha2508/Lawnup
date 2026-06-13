import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FREE_WEEKLY_SCAN_LIMIT,
  FREE_DAILY_MESSAGE_LIMIT,
  PREMIUM_DAILY_MESSAGE_LIMIT,
  PREMIUM_FEATURES,
  premiumScanLimit,
} from '../constants/plans';
import type { FeatureName, PremiumTier } from '../constants/plans';

/**
 * Period keys (local enforcement, mirrors server later):
 *   week  — Monday-anchored YYYY-MM-DD : free scan quota (3 / week)
 *   month — YYYY-MM                     : premium scan quota (80 / 100 per month)
 *   day   — YYYY-MM-DD                  : free AI message quota (20 / day)
 */
function weekKey(): string {
  const d = new Date();
  const daysSinceMonday = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - daysSinceMonday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function dayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface SubscriptionState {
  plan: 'free' | 'premium';
  premiumTier: PremiumTier | null;
  planExpiresAt: string | null;

  // Server-synced quota (hydrated from checkUsageLimit, when deployed)
  scansUsed: number;
  scanLimit: number;
  chatsUsed: number;
  chatLimit: number;

  // Local scan tracking — free resets weekly (Mon), premium resets monthly
  scansThisWeek: number;
  lastScanWeekKey: string;
  scansThisMonth: number;
  lastScanMonthKey: string;

  // Local AI message tracking — free resets daily
  messagesToday: number;
  lastMessageDayKey: string;

  // Dev-only toggle — never persisted
  mockPremium: boolean;

  isUsageHydrated: boolean;

  // Setters
  setPlan: (plan: 'free' | 'premium', expiresAt?: string, tier?: PremiumTier) => void;
  setUsage: (scansUsed: number, chatsUsed: number) => void;
  setLimits: (scanLimit: number, chatLimit: number) => void;
  setUsageHydrated: (v: boolean) => void;
  resetUsage: () => void;
  incrementScan: () => void;
  incrementMessage: () => void;
  activateMockPremium: (active: boolean) => void;

  // Computed
  isPremiumActive: () => boolean;
  canScan: () => boolean;
  canChat: () => boolean;
  /** Tier-aware scan gate: free → 3/week, premium → 80–100/month. */
  canScanThisWeek: () => boolean;
  /** Remaining scans in the active period (free week / premium month). */
  scansRemainingThisWeek: () => number;
  /** Active-period scan limit (free: weekly · premium: monthly). */
  activeScanLimit: () => number;
  /** Scans used in the active period. */
  scanPeriodUsed: () => number;
  canSendMessageToday: () => boolean;
  messagesRemainingToday: () => number;
  isFeatureEnabled: (feature: FeatureName) => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      premiumTier: null,
      planExpiresAt: null,
      scansUsed: 0,
      scanLimit: FREE_WEEKLY_SCAN_LIMIT,
      chatsUsed: 0,
      chatLimit: FREE_DAILY_MESSAGE_LIMIT,
      scansThisWeek: 0,
      lastScanWeekKey: '',
      scansThisMonth: 0,
      lastScanMonthKey: '',
      messagesToday: 0,
      lastMessageDayKey: '',
      mockPremium: false,
      isUsageHydrated: false,

      setPlan: (plan, expiresAt, tier) =>
        set((s) => {
          const resolvedTier: PremiumTier | null =
            plan === 'premium' ? (tier ?? s.premiumTier ?? 'monthly') : null;
          return {
            plan,
            premiumTier: resolvedTier,
            planExpiresAt: expiresAt ?? null,
            scanLimit: resolvedTier ? premiumScanLimit(resolvedTier) : FREE_WEEKLY_SCAN_LIMIT,
            chatLimit: plan === 'premium' ? PREMIUM_DAILY_MESSAGE_LIMIT : FREE_DAILY_MESSAGE_LIMIT,
          };
        }),

      setUsage: (scansUsed, chatsUsed) => set({ scansUsed, chatsUsed }),

      setLimits: (scanLimit, chatLimit) => set({ scanLimit, chatLimit }),

      setUsageHydrated: (v) => set({ isUsageHydrated: v }),

      resetUsage: () => set({ scansUsed: 0, chatsUsed: 0, isUsageHydrated: false }),

      incrementScan: () => {
        const { lastScanWeekKey, scansThisWeek, lastScanMonthKey, scansThisMonth } = get();
        const wk = weekKey();
        const mo = monthKey();
        set({
          scansThisWeek: lastScanWeekKey !== wk ? 1 : scansThisWeek + 1,
          lastScanWeekKey: wk,
          scansThisMonth: lastScanMonthKey !== mo ? 1 : scansThisMonth + 1,
          lastScanMonthKey: mo,
        });
      },

      incrementMessage: () => {
        const { lastMessageDayKey, messagesToday } = get();
        const dk = dayKey();
        set({
          messagesToday: lastMessageDayKey !== dk ? 1 : messagesToday + 1,
          lastMessageDayKey: dk,
        });
      },

      activateMockPremium: (active) => set({ mockPremium: active }),

      isPremiumActive: () => {
        const { plan, planExpiresAt, mockPremium } = get();
        if (mockPremium) return true;
        if (plan !== 'premium') return false;
        if (!planExpiresAt) return true;
        return new Date(planExpiresAt) > new Date();
      },

      activeScanLimit: () => {
        const { premiumTier } = get();
        if (get().isPremiumActive()) return premiumScanLimit(premiumTier ?? 'monthly');
        return FREE_WEEKLY_SCAN_LIMIT;
      },

      scanPeriodUsed: () => {
        const { scansThisWeek, lastScanWeekKey, scansThisMonth, lastScanMonthKey } = get();
        if (get().isPremiumActive()) {
          return lastScanMonthKey !== monthKey() ? 0 : scansThisMonth;
        }
        return lastScanWeekKey !== weekKey() ? 0 : scansThisWeek;
      },

      canScan: () => get().canScanThisWeek(),

      canChat: () => get().canSendMessageToday(),

      // Tier-aware: premium checks the monthly cap, free checks the weekly cap.
      canScanThisWeek: () => get().scanPeriodUsed() < get().activeScanLimit(),

      scansRemainingThisWeek: () => Math.max(0, get().activeScanLimit() - get().scanPeriodUsed()),

      canSendMessageToday: () => {
        if (get().isPremiumActive()) return true;
        const { messagesToday, lastMessageDayKey } = get();
        const used = lastMessageDayKey !== dayKey() ? 0 : messagesToday;
        return used < FREE_DAILY_MESSAGE_LIMIT;
      },

      messagesRemainingToday: () => {
        if (get().isPremiumActive()) return -1;
        const { messagesToday, lastMessageDayKey } = get();
        const used = lastMessageDayKey !== dayKey() ? 0 : messagesToday;
        return Math.max(0, FREE_DAILY_MESSAGE_LIMIT - used);
      },

      isFeatureEnabled: (feature) => {
        if (get().isPremiumActive()) return true;
        return !PREMIUM_FEATURES.includes(feature);
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // v3 (2026-06-13): PRD model — premium tier + monthly scan cap + daily
      // message quota. Old persisted counters are ignored; they start fresh.
      version: 3,
      partialize: (state) => ({
        plan: state.plan,
        premiumTier: state.premiumTier,
        planExpiresAt: state.planExpiresAt,
        scansUsed: state.scansUsed,
        scanLimit: state.scanLimit,
        chatsUsed: state.chatsUsed,
        chatLimit: state.chatLimit,
        scansThisWeek: state.scansThisWeek,
        lastScanWeekKey: state.lastScanWeekKey,
        scansThisMonth: state.scansThisMonth,
        lastScanMonthKey: state.lastScanMonthKey,
        messagesToday: state.messagesToday,
        lastMessageDayKey: state.lastMessageDayKey,
      }),
    },
  ),
);
