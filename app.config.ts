import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.config.ts takes precedence over app.json when present.
 * It runs in Node.js during Metro bundling, so process.env reads from .env here.
 * Values passed in `extra` are baked into the bundle and accessible via
 * Constants.expoConfig.extra — more reliable than process.env in the device runtime.
 *
 * Long-term, plant identification runs through the processPlantScan Cloud
 * Function (key in a server secret) so the paid key never ships in the bundle.
 *
 * INTERNAL-TESTING MODE (2026-06-10 pivot): while we stay on Spark and scan
 * client-side, the Plant.id key is read from the NON-PUBLIC `PLANT_ID_KEY` env
 * var (deliberately NOT `EXPO_PUBLIC_*`, so it isn't auto-inlined) and surfaced
 * via `extra.plantIdKey`. It is still bundled — accepted risk because there is
 * no public APK. Remove this when the server scan route becomes the default.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const openWeatherKey = process.env.EXPO_PUBLIC_OPENWEATHER_KEY ?? '';
  const plantIdKey = process.env.PLANT_ID_KEY ?? '';
  const openaiKey = process.env.OPENAI_API_KEY ?? '';

  if (!openWeatherKey) {
    console.warn('[LawnUp] EXPO_PUBLIC_OPENWEATHER_KEY not set — weather card will be hidden');
  }
  if (!plantIdKey) {
    console.warn('[LawnUp] PLANT_ID_KEY not set — client-side scanning will fail (internal-testing mode)');
  }
  if (!openaiKey) {
    console.warn('[LawnUp] OPENAI_API_KEY not set — Dr. Banyan AI replies will be disabled (internal-testing mode)');
  }

  return {
    ...config,
    extra: {
      ...config.extra,
      openWeatherKey,
      plantIdKey,
      openaiKey,
    },
  } as ExpoConfig;
};
