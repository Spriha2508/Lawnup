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

  if (weather.isRaining) {
    return {
      eyebrow: 'WEATHER · GARDEN SYNC',
      title: 'Rain is doing the watering',
      body: `Showers around ${where} today — skip outdoor watering and let the soil drink naturally.`,
    };
  }
  if (weather.isHumid) {
    return {
      eyebrow: 'WEATHER · GARDEN SYNC',
      title: `${weather.humidity}% humidity in ${where}`,
      body: 'Damp air invites fungus — keep airflow moving and check leaf undersides for spots.',
    };
  }
  if (weather.isHot) {
    return {
      eyebrow: 'WEATHER · GARDEN SYNC',
      title: `${weather.tempC}° and rising`,
      body: 'Water early morning and move tender plants out of the harsh afternoon sun.',
    };
  }
  return {
    eyebrow: 'WEATHER · GARDEN SYNC',
    title: `A gentle ${weather.tempC}° in ${where}`,
    body: 'Calm weather for your garden — a good moment to check soil moisture and turn pots to the light.',
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
