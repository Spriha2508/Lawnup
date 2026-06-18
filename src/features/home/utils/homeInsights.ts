/**
 * homeInsights — small, deterministic content helpers for the home dashboard.
 * Pure functions over data we already have (weather + calendar). No backend.
 */

import type { WeatherData } from '../../../services/weather/weatherService';

export interface Insight {
  eyebrow: string;
  title: string;
  body: string;
}

export const getWeatherInsight = (weather: WeatherData | null, city?: string): Insight | null => {
  if (!weather) return null;
  const where = city || weather.city;

  // Two-part, directive copy: a crisp condition line + ONE concrete action tuned
  // to *your* city and *today's* weather (LawnUp's USP). e.g. "Today is 36°C in
  // Delhi. Water outdoor plants before 9 AM."
  if (weather.isRaining) {
    return {
      eyebrow: 'WEATHER · GARDEN SYNC',
      title: 'Rain is doing the watering',
      body: `Today it's raining in ${where}. Skip outdoor watering and let the soil drink naturally.`,
    };
  }
  if (weather.isHumid) {
    return {
      eyebrow: 'WEATHER · GARDEN SYNC',
      title: `${weather.humidity}% humidity in ${where}`,
      body: `Today it's ${weather.tempC}°C and humid in ${where}. Keep airflow moving and check leaf undersides for spots.`,
    };
  }
  if (weather.isHot) {
    return {
      eyebrow: 'WEATHER · GARDEN SYNC',
      title: `${weather.tempC}° and rising`,
      body: `Today is ${weather.tempC}°C in ${where}. Water outdoor plants before 9 AM and move tender pots out of the afternoon sun.`,
    };
  }
  return {
    eyebrow: 'WEATHER · GARDEN SYNC',
    title: `A gentle ${weather.tempC}° in ${where}`,
    body: `Today is a mild ${weather.tempC}°C in ${where}. Check soil moisture and turn pots toward the light.`,
  };
};

export const getSeasonalTip = (month: number = new Date().getMonth()): Insight => {
  // 0=Jan … 11=Dec — India-first seasonal rhythm.
  if (month >= 5 && month <= 8) {
    return {
      eyebrow: 'THIS SEASON · MONSOON',
      title: 'Ease off the watering can',
      body: 'Monsoon humidity keeps soil moist longer. Water less, improve drainage, and watch for root rot and fungus.',
    };
  }
  if (month >= 2 && month <= 4) {
    return {
      eyebrow: 'THIS SEASON · SUMMER',
      title: 'Beat the summer stress',
      body: 'Heat is climbing — mulch the soil, water deeply at dawn, and shade delicate leaves from midday sun.',
    };
  }
  if (month >= 9 && month <= 10) {
    return {
      eyebrow: 'THIS SEASON · POST-MONSOON',
      title: 'The best time to repot',
      body: 'Mild, festive weather — refresh tired soil, feed your plants, and let new growth settle before winter.',
    };
  }
  return {
    eyebrow: 'THIS SEASON · WINTER',
    title: 'Slow, cosy and dry',
    body: 'Growth slows in the cool months — water sparingly and keep plants away from cold drafts and heaters.',
  };
};
