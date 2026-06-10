// Climate-aware plant care advice tuned for Indian conditions:
// Delhi dry heat, Mumbai humidity, Bangalore rain, North Indian winters.

import type { WeatherData } from './weatherService';

export interface WeatherAdvice {
  icon: string;
  headline: string;
  stats: string;   // e.g. "39°C · 72% humidity"
  tips: string[];
  riskLevel: 'low' | 'moderate' | 'high';
}

export function getWeatherPlantAdvice(weather: WeatherData): WeatherAdvice {
  const tips: string[] = [];
  let riskLevel: WeatherAdvice['riskLevel'] = 'low';
  let icon = '☀️';

  // ── Extreme heat + low humidity (Delhi summer) ────────────────────────────
  if (weather.tempC > 38 && weather.humidity < 45) {
    riskLevel = 'high';
    icon = '🌡';
    tips.push('Water deeply in the evening — soil dries out fast today');
    tips.push('Keep pots away from direct afternoon sun (12–4 pm)');
    tips.push('Mist leaves in the morning to raise moisture');
  }
  // ── Hot but manageable ────────────────────────────────────────────────────
  else if (weather.tempC > 35) {
    riskLevel = 'moderate';
    icon = '☀️';
    tips.push('Water in early morning or after 5 pm to reduce evaporation');
    tips.push('Provide shade during peak heat hours');
  }

  // ── Rain today (any Indian city monsoon) ─────────────────────────────────
  if (weather.isRaining) {
    riskLevel = 'low';
    icon = '🌧';
    tips.push('Rain expected — skip outdoor watering today');
    tips.push('Check drainage holes; waterlogged roots cause root rot');
  }

  // ── Very humid without rain (Mumbai coastal) ─────────────────────────────
  if (weather.isHumid && !weather.isRaining) {
    if (riskLevel === 'low') riskLevel = 'moderate';
    icon = '💧';
    tips.push('High humidity — check soil and roots for early fungal signs');
    tips.push('Ensure leaves have good air circulation');
  }

  // ── Cool / winter (North India Nov–Feb) ──────────────────────────────────
  if (weather.tempC < 15) {
    riskLevel = 'moderate';
    icon = '🌤';
    tips.push('Move sun-loving plants to the brightest spot indoors');
    tips.push('Reduce watering — plants slow down in cool weather');
    tips.push('Avoid placing pots near cold draughts or AC vents');
  }

  // ── Pleasant conditions ───────────────────────────────────────────────────
  if (tips.length === 0) {
    tips.push('Good conditions today — maintain your regular care routine');
    tips.push('A good day to repot or propagate plants');
  }

  // ── Compose headline ─────────────────────────────────────────────────────
  let headline = '';
  if (weather.isRaining) {
    headline = `Rainy in ${weather.city} — skip watering today`;
  } else if (weather.tempC > 38) {
    headline = `${weather.tempC}°C — protect plants from the heat`;
  } else if (weather.tempC < 15) {
    headline = `${weather.tempC}°C — cool weather, reduce watering`;
  } else if (weather.isHumid) {
    headline = `High humidity in ${weather.city} today`;
  } else {
    headline = `Good conditions for your plants today`;
  }

  return {
    icon,
    headline,
    stats: `${weather.tempC}°C · ${weather.humidity}% humidity`,
    tips,
    riskLevel,
  };
}
