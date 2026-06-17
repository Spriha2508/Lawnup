export const config = {
  // Build environment — set per EAS profile (development | preview | staging |
  // production). Used to gate behaviours that are safe for internal testing but
  // must NEVER reach the production store build (e.g. the mock premium CTA).
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',

  // Feature flags — toggle without redeploy via this file
  ENABLE_AI_CHAT: true,
  ENABLE_PLANT_MEMORY: true,
  ENABLE_SUBSCRIPTIONS: true,
  ENABLE_POSTHOG: true,

  // Backend (Firebase Functions) — OFF during client-side internal-testing.
  // When false, the app makes NO server-Function calls for usage limits;
  // enforcement is the LOCAL period counters in subscriptionStore
  // (canScanThisWeek / canSendMessageToday). Flip to true (set
  // EXPO_PUBLIC_BACKEND_ENABLED=true) only once the Functions — checkUsageLimit
  // et al. — are deployed. NOTE: local-only quotas are resettable by clearing
  // app storage; tamper-proof enforcement requires the backend. See QA H2.
  BACKEND_ENABLED: process.env.EXPO_PUBLIC_BACKEND_ENABLED === 'true',

  // Scan quotas live in src/features/subscription/constants/plans.ts
  // (FREE_WEEKLY_SCAN_LIMIT) — single source of truth, mirrored server-side.

  // AI chat quota defaults (AI Doctor ships v1.1)
  FREE_CHAT_LIMIT: 20,
  PREMIUM_CHAT_LIMIT: -1, // unlimited

  // AI
  AI_MAX_HISTORY_TURNS: 5,
  AI_MAX_RESPONSE_TOKENS: 200,
  MEMORY_UPDATE_INTERVAL: 5, // summarize every N interactions

  // Cache TTLs (ms)
  WEATHER_CACHE_TTL: 3 * 60 * 60 * 1000,       // 3 hours
  PLANTS_STALE_TIME: 5 * 60 * 1000,             // 5 minutes
  KNOWLEDGE_STALE_TIME: 24 * 60 * 60 * 1000,    // 24 hours

  // ImageKit
  IMAGEKIT_URL: process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '',
} as const;
