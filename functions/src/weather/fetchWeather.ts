import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { requireAuth } from '../middleware/authMiddleware';

const db = admin.firestore();

// Set once with: firebase functions:secrets:set OPENWEATHER_KEY
const OPENWEATHER_KEY = defineSecret('OPENWEATHER_KEY');

interface WeatherResult {
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  season: 'summer' | 'monsoon' | 'winter';
  icon: string;
  cachedAt: string;
}

// 3-hour cache per city — shared across all users in that city
const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

export const fetchWeather = onCall(
  { secrets: [OPENWEATHER_KEY] },
  async (request): Promise<WeatherResult> => {
    requireAuth(request);

    const city = ((request.data as { city?: string })?.city ?? 'Delhi').trim();

    // Check cache
    const cacheRef = db.collection('cache').doc(`weather_${city.toLowerCase().replace(/\s+/g, '_')}`);
    const cached = await cacheRef.get();

    if (cached.exists) {
      const d = cached.data()!;
      const ageMs = Date.now() - (d.fetchedAt?.toMillis?.() ?? 0);
      if (ageMs < CACHE_TTL_MS) {
        return { ...d.weather, cachedAt: new Date(d.fetchedAt.toMillis()).toISOString() };
      }
    }

    const owmKey = OPENWEATHER_KEY.value();
    if (!owmKey) {
      throw new HttpsError('internal', 'Weather service not configured.');
    }

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&appid=${owmKey}&units=metric`
      );
      const d = res.data;

      const weather: WeatherResult = {
        city,
        temp: Math.round(d.main.temp),
        feelsLike: Math.round(d.main.feels_like),
        condition: d.weather[0]?.description ?? 'clear sky',
        humidity: d.main.humidity,
        windSpeed: Math.round(d.wind?.speed ?? 0),
        season: getIndianSeason(),
        icon: d.weather[0]?.icon ?? '01d',
        cachedAt: new Date().toISOString(),
      };

      await cacheRef.set({
        weather,
        fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return weather;
    } catch (err: unknown) {
      // City not found or OWM error — return safe defaults
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new HttpsError('not-found', `City "${city}" not found. Try a major Indian city name.`);
      }
      logger.error('fetchWeather failed', { city, err });
      throw new HttpsError('internal', 'Weather service temporarily unavailable.');
    }
  });

export const getIndianSeason = (): 'summer' | 'monsoon' | 'winter' => {
  const m = new Date().getMonth(); // 0-indexed
  if (m >= 2 && m <= 5) return 'summer';   // Mar–Jun
  if (m >= 6 && m <= 9) return 'monsoon';  // Jul–Oct
  return 'winter';                           // Nov–Feb
};
