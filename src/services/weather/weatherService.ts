// Weather data for Indian cities via OpenWeatherMap free tier.
// Key is baked at bundle time via app.config.ts → Constants.expoConfig.extra.openWeatherKey

import Constants from 'expo-constants';

// Resolved at bundle time (reliable) with process.env as fallback
const OWM_API_KEY: string =
  (Constants.expoConfig?.extra?.openWeatherKey as string | undefined) ??
  process.env.EXPO_PUBLIC_OPENWEATHER_KEY ??
  '';

export interface WeatherData {
  city: string;
  tempC: number;
  humidity: number;    // 0-100 %
  conditionId: number; // OWM weather condition code
  description: string;
  isRaining: boolean;
  isHot: boolean;      // tempC > 35
  isHumid: boolean;    // humidity > 75
}

const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Simple in-memory cache — one entry per city, expires after 30 min
const cache: Map<string, { data: WeatherData; expiresAt: number }> = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function getCurrentWeather(city: string): Promise<WeatherData | null> {
  if (!OWM_API_KEY || !city.trim()) return null;
  const apiKey = OWM_API_KEY;

  const cacheKey = city.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  try {
    const url =
      `${OWM_URL}?q=${encodeURIComponent(city)},IN` +
      `&units=metric&appid=${apiKey}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      if (__DEV__) console.warn('[Weather] fetch failed — HTTP', res.status, 'city:', city);
      return null;
    }

    const raw = await res.json();
    const tempC: number = Math.round(raw.main?.temp ?? 0);
    const humidity: number = raw.main?.humidity ?? 0;
    const conditionId: number = raw.weather?.[0]?.id ?? 800;
    const description: string = raw.weather?.[0]?.description ?? 'clear sky';

    const data: WeatherData = {
      city,
      tempC,
      humidity,
      conditionId,
      description,
      isRaining: conditionId >= 200 && conditionId < 700,
      isHot: tempC > 35,
      isHumid: humidity > 75,
    };

    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    return null;
  }
}
