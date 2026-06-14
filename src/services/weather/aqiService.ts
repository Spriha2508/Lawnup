// Air-quality data via the OpenWeather Air Pollution API — reuses the existing
// EXPO_PUBLIC_OPENWEATHER_KEY (no separate provider). The endpoint needs
// lat/lon, so we map known Indian cities to coordinates (avoids a geocoding
// call). Returns a 0–500 AQI computed from PM2.5/PM10 (US-EPA breakpoints), which
// feeds the knowledge layer's aqiRules engine.

import Constants from 'expo-constants';

const OWM_API_KEY: string =
  (Constants.expoConfig?.extra?.openWeatherKey as string | undefined) ??
  process.env.EXPO_PUBLIC_OPENWEATHER_KEY ??
  '';

const AIR_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

// Approx coordinates for supported India-first cities (lowercased keys).
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  delhi: { lat: 28.6139, lon: 77.209 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  pune: { lat: 18.5204, lon: 73.8567 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  lucknow: { lat: 26.8467, lon: 80.9462 },
  // Remaining INDIAN_CITIES (onboarding picker) — full AQI coverage
  chandigarh: { lat: 30.7333, lon: 76.7794 },
  bhopal: { lat: 23.2599, lon: 77.4126 },
  indore: { lat: 22.7196, lon: 75.8577 },
  kochi: { lat: 9.9312, lon: 76.2673 },
  nagpur: { lat: 21.1458, lon: 79.0882 },
  patna: { lat: 25.5941, lon: 85.1376 },
  vadodara: { lat: 22.3072, lon: 73.1812 },
  surat: { lat: 21.1702, lon: 72.8311 },
  coimbatore: { lat: 11.0168, lon: 76.9558 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
};

export interface AirQualityData {
  city: string;
  aqi: number;        // 0–500 (computed from PM2.5/PM10)
  pm25: number;       // µg/m³
  pm10: number;       // µg/m³
}

const cache = new Map<string, { data: AirQualityData; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

// US-EPA piecewise-linear AQI from a pollutant concentration.
function linearAqi(c: number, bp: [number, number, number, number][]): number {
  for (const [cLow, cHigh, iLow, iHigh] of bp) {
    if (c <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
    }
  }
  return 500;
}
const PM25_BP: [number, number, number, number][] = [
  [0, 12, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500],
];
const PM10_BP: [number, number, number, number][] = [
  [0, 54, 0, 50], [55, 154, 51, 100], [155, 254, 101, 150],
  [255, 354, 151, 200], [355, 424, 201, 300], [425, 604, 301, 500],
];

export async function getAirQuality(city: string | null | undefined): Promise<AirQualityData | null> {
  if (!OWM_API_KEY || !city) return null;
  const key = city.trim().toLowerCase();
  const coords = CITY_COORDS[key];
  if (!coords) return null; // unsupported city — caller omits AQI guidance

  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  try {
    const url = `${AIR_URL}?lat=${coords.lat}&lon=${coords.lon}&appid=${OWM_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      if (__DEV__) console.warn('[AQI] fetch failed — HTTP', res.status, 'city:', city);
      return null;
    }
    const raw = await res.json();
    const comp = raw.list?.[0]?.components;
    if (!comp) return null;

    const pm25: number = comp.pm2_5 ?? 0;
    const pm10: number = comp.pm10 ?? 0;
    const aqi = Math.max(linearAqi(pm25, PM25_BP), linearAqi(pm10, PM10_BP));

    const data: AirQualityData = { city, aqi, pm25: Math.round(pm25), pm10: Math.round(pm10) };
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    return null;
  }
}
