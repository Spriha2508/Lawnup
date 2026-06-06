export const config = {
  // Feature flags — toggle without redeploy via this file
  ENABLE_AI_CHAT: true,
  ENABLE_PLANT_MEMORY: true,
  ENABLE_SUBSCRIPTIONS: true,
  ENABLE_POSTHOG: true,

  // Quota defaults
  FREE_SCAN_LIMIT: 2,
  FREE_CHAT_LIMIT: 10,
  PREMIUM_SCAN_LIMIT: 20,
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
