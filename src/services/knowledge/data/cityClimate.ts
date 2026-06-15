import type { CityClimate } from '../types';

/**
 * India knowledge layer — per-city climate, seasonal care emphasis, and AQI
 * tendency. Keyed by lowercase city name. Dr. Banyan uses the user's city to
 * ground seasonal + air-quality guidance.
 */
export const CITY_CLIMATES: Record<string, CityClimate> = {
  delhi: {
    city: 'Delhi',
    zone: 'north',
    seasonal: {
      summer: 'Extreme dry heat (40°C+). Shade plants from harsh afternoon sun, water early morning, raise humidity.',
      winter: 'Cold nights (down to ~5°C). Move tender tropicals indoors; reduce watering sharply.',
      monsoon: 'Humid with heavy rain. Cut watering, ensure drainage, watch for fungal disease.',
    },
    aqiTendency: 'Severe in winter (Nov–Jan) — among the worst in India; dust settles heavily on foliage.',
  },
  mumbai: {
    city: 'Mumbai',
    zone: 'coastal',
    seasonal: {
      summer: 'Hot and very humid. Good for tropicals; ensure airflow to prevent fungal issues.',
      winter: 'Mild (20–30°C) — comfortable growing season for most plants.',
      monsoon: 'Very heavy rain for months. Protect from waterlogging; move sensitive pots under cover.',
    },
    aqiTendency: 'Moderate; coastal breeze helps, but humidity raises fungal/mildew risk.',
  },
  bangalore: {
    city: 'Bangalore',
    zone: 'south',
    seasonal: {
      summer: 'Mild and pleasant (28–34°C). Excellent growing conditions.',
      winter: 'Cool and dry nights. Most plants thrive; reduce watering slightly.',
      monsoon: 'Steady rain. Ensure drainage; ideal time to propagate.',
    },
    aqiTendency: 'Generally good to moderate year-round.',
  },
  pune: {
    city: 'Pune',
    zone: 'south',
    seasonal: {
      summer: 'Warm and dry (35–40°C). Water more often; shade from afternoon sun.',
      winter: 'Cool, dry, pleasant. Comfortable for most plants.',
      monsoon: 'Good rainfall. Reduce watering; watch drainage.',
    },
    aqiTendency: 'Moderate; can worsen in winter.',
  },
  hyderabad: {
    city: 'Hyderabad',
    zone: 'south',
    seasonal: {
      summer: 'Hot and dry (40°C+). Protect from sun, water early, mist humidity-lovers.',
      winter: 'Mild and dry. Good growing season; trim watering.',
      monsoon: 'Moderate rain. Ensure pots drain freely.',
    },
    aqiTendency: 'Moderate; dust common in dry months.',
  },
  chennai: {
    city: 'Chennai',
    zone: 'coastal',
    seasonal: {
      summer: 'Very hot and humid (38–42°C). Provide shade and steady moisture.',
      winter: 'Warm (24–30°C) — minimal dormancy; plants keep growing.',
      monsoon: 'Heavy NE monsoon (Oct–Dec). Protect from flooding; cut watering.',
    },
    aqiTendency: 'Moderate; sea breeze helps, humidity raises fungal risk.',
  },
  kolkata: {
    city: 'Kolkata',
    zone: 'coastal',
    seasonal: {
      summer: 'Hot and extremely humid. Great for tropicals; prioritise airflow.',
      winter: 'Mild and pleasant (12–25°C). Comfortable growing season.',
      monsoon: 'Very heavy rain and humidity. Strong fungal risk; ensure drainage and airflow.',
    },
    aqiTendency: 'Poor in winter; high humidity increases mildew risk.',
  },
  ahmedabad: {
    city: 'Ahmedabad',
    zone: 'north',
    seasonal: {
      summer: 'Extreme dry heat (42–45°C). Heavy shade and twice-daily watering for pots; misting helps.',
      winter: 'Mild and dry (12–28°C) — a comfortable growing season.',
      monsoon: 'Moderate rain with high humidity. Ensure drainage; watch for fungal spots.',
    },
    aqiTendency: 'Moderate to poor in winter; dust from dry surroundings settles on leaves.',
  },
  jaipur: {
    city: 'Jaipur',
    zone: 'north',
    seasonal: {
      summer: 'Very hot, dry desert heat (40–45°C) with dust storms. Shade and water at dawn/dusk.',
      winter: 'Cold, dry nights (5–10°C). Protect tender tropicals; reduce watering.',
      monsoon: 'Light-to-moderate rain. Welcome relief; ensure pots drain.',
    },
    aqiTendency: 'Moderate to poor in winter; arid dust is the main issue — wipe foliage often.',
  },
  lucknow: {
    city: 'Lucknow',
    zone: 'north',
    seasonal: {
      summer: 'Hot and dry (40–43°C). Shade from afternoon sun; water early morning.',
      winter: 'Cold and foggy (7–22°C). Move tender plants in; reduce watering; fog limits light.',
      monsoon: 'Humid with good rain. Cut watering; ensure drainage and airflow.',
    },
    aqiTendency: 'Poor to very poor in winter (Gangetic-plain smog); dust and haze settle heavily.',
  },
  kochi: {
    city: 'Kochi',
    zone: 'coastal',
    seasonal: {
      summer: 'Hot and very humid (30–35°C). Excellent for tropicals; prioritise airflow.',
      winter: 'Warm and humid (23–32°C) — minimal dormancy; plants keep growing.',
      monsoon: 'Very heavy SW monsoon (Jun–Sep). Strong fungal risk; shelter pots, ensure drainage.',
    },
    aqiTendency: 'Generally good; sea breeze keeps air clean, but humidity raises mildew risk.',
  },
  nagpur: {
    city: 'Nagpur',
    zone: 'south',
    seasonal: {
      summer: 'Extreme dry central-India heat (44–47°C). Heavy shade, mulch, water at dawn/dusk.',
      winter: 'Mild and dry (10–28°C) — a good growing season.',
      monsoon: 'Good rain with humidity. Ensure drainage; watch for fungal disease.',
    },
    aqiTendency: 'Moderate; dust in the dry season — wipe leaves weekly.',
  },
  chandigarh: {
    city: 'Chandigarh',
    zone: 'north',
    seasonal: {
      summer: 'Hot (38–42°C). Shade from harsh sun; water early morning.',
      winter: 'Cold (4–20°C) with fog. Protect tender tropicals; reduce watering sharply.',
      monsoon: 'Humid with good rain. Cut watering; ensure drainage and airflow.',
    },
    aqiTendency: 'Moderate to poor in winter; cleaner than the Delhi belt but haze settles on foliage.',
  },
};

/** Lookup helper tolerant of casing and common spellings (Bengaluru → bangalore). */
export function findCityClimate(city: string | null | undefined): CityClimate | null {
  if (!city) return null;
  const key = city.trim().toLowerCase();
  if (CITY_CLIMATES[key]) return CITY_CLIMATES[key];
  if (key === 'bengaluru') return CITY_CLIMATES.bangalore;
  return null;
}

export const ALL_CITY_CLIMATES: CityClimate[] = Object.values(CITY_CLIMATES);
