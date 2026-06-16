import type { WeatherData } from '../../weather/weatherService';

/**
 * Weather Rules Engine — deterministic care adjustments from current weather.
 * Returns structured advice strings that Doc. Sage retrieves (not invents)
 * and weaves into its reasoning. Pure function, no LLM.
 */
export interface WeatherAdvice {
  headline: string;
  rules: string[];
}

export function weatherRules(weather: WeatherData | null): WeatherAdvice | null {
  if (!weather) return null;
  const rules: string[] = [];

  if (weather.isHot) {
    rules.push('High heat: water early morning or evening; shade tender plants from harsh afternoon sun.');
    rules.push('Check soil more often — pots dry out fast above 35°C.');
  }
  if (weather.isHumid) {
    rules.push('High humidity: improve airflow and avoid wetting foliage to prevent fungal disease (powdery mildew, leaf spot).');
  } else if (weather.humidity > 0 && weather.humidity < 35) {
    rules.push('Dry air: mist humidity-lovers (ferns, calathea) or use a pebble tray; expect crispy leaf tips.');
  }
  if (weather.isRaining) {
    rules.push('Rain now: skip watering; move pots under cover if rain is heavy/continuous; ensure drainage to avoid root rot.');
  }
  if (weather.tempC > 0 && weather.tempC < 12) {
    rules.push('Cold snap: reduce watering, move tropical plants indoors, and keep away from cold drafts.');
  }

  if (rules.length === 0) {
    rules.push('Mild conditions — maintain normal care for the season.');
  }

  const headline = `${weather.city}: ${weather.tempC}°C, ${weather.humidity}% humidity, ${weather.description}.`;
  return { headline, rules };
}
