// Phase 3+4 — Smart reminder generation, water status, garden summary.
// Pure functions — no side effects, safe to call anywhere.

import type { UserPlantDoc } from '../../types/firestore.types';
import type { WeatherData } from '../weather/weatherService';

// ── Water status ───────────────────────────────────────────────────────────────

export type WaterStatus = 'overdue' | 'today' | 'soon' | 'ok';

export interface WaterInfo {
  status: WaterStatus;
  daysUntil: number;    // negative when overdue
  label: string;        // short: "Water now", "In 3d"
  urgentLabel: string;  // longer: "2d overdue", "Water today"
}

export function getWaterInfo(plant: UserPlantDoc): WaterInfo {
  // lastWateredAt may be a Firestore Timestamp, a plain JS Date, or a string
  // if the plant doc was written before schema stabilisation. Guard all three.
  let last: Date;
  const raw = plant.lastWateredAt as any;
  if (raw && typeof raw.toDate === 'function') {
    last = raw.toDate();
  } else if (raw instanceof Date) {
    last = raw;
  } else if (raw) {
    last = new Date(raw);
  } else {
    last = new Date();
  }
  if (isNaN(last.getTime())) last = new Date();

  const freq = plant.wateringFrequencyDays > 0 ? plant.wateringFrequencyDays : 3;
  const nextWater = new Date(last);
  nextWater.setDate(nextWater.getDate() + freq);

  const msDiff = nextWater.getTime() - Date.now();
  const daysUntil = Math.ceil(msDiff / 86_400_000);

  if (daysUntil < 0)
    return { status: 'overdue', daysUntil, label: 'Water now',   urgentLabel: `${Math.abs(daysUntil)}d overdue` };
  if (daysUntil === 0)
    return { status: 'today',   daysUntil, label: 'Water today', urgentLabel: 'Water today' };
  if (daysUntil <= 2)
    return { status: 'soon',    daysUntil, label: `In ${daysUntil}d`, urgentLabel: `Water in ${daysUntil}d` };
  return   { status: 'ok',      daysUntil, label: `In ${daysUntil}d`, urgentLabel: `Water in ${daysUntil}d` };
}

// ── Reminder message generation (Phase 4) ─────────────────────────────────────

export function generateWateringMessage(
  plant: UserPlantDoc,
  weather?: WeatherData | null,
): string {
  const name = plant.nickname || plant.speciesName;
  const info = getWaterInfo(plant);

  if (weather?.isRaining && info.status !== 'overdue') {
    return `${name} is getting a natural drink today — skip watering.`;
  }
  if (weather?.isHot && info.status === 'overdue') {
    return `${name} is overdue for water and it's hot outside — water urgently.`;
  }
  if (weather?.isHot && info.status === 'today') {
    return `${name} needs water today — the heat dries the soil faster.`;
  }
  if (weather?.isHumid && info.status === 'ok') {
    return `${name} is fine for now — high humidity keeps soil moist longer.`;
  }

  if (info.status === 'overdue')
    return `${name} is waiting for water — ${Math.abs(info.daysUntil)} day(s) overdue.`;
  if (info.status === 'today')
    return `Give ${name} some water today.`;
  if (info.status === 'soon')
    return `${name} will need water in ${info.daysUntil} day(s).`;
  return `${name} is well-watered for now.`;
}

export function generateWeatherAlert(
  plant: UserPlantDoc,
  weather: WeatherData,
): string | null {
  const name = plant.nickname || plant.speciesName;

  if (weather.isHot && weather.humidity < 35)
    return `Dry heat today — ${name} may appreciate a light mist on the leaves.`;
  if (weather.isHot)
    return `High heat — ${name}'s soil will dry out faster than usual today.`;
  if (weather.isHumid && plant.healthStatus !== 'Healthy')
    return `High humidity increases fungal risk for ${name}. Ensure good air circulation.`;
  if (weather.isRaining)
    return `Rain today — outdoor plants like ${name} are getting natural watering.`;
  if (weather.tempC < 15)
    return `Cool weather slows ${name}'s growth — reduce watering frequency.`;
  return null;
}

// ── Garden-level summary line (Phase 5) ───────────────────────────────────────

export function getGardenSummary(
  plants: UserPlantDoc[],
  weather?: WeatherData | null,
): string {
  const total = plants.length;
  if (total === 0) return 'Your garden is waiting for its first resident.';

  const thriving = plants.filter(p => p.healthStatus === 'Healthy').length;
  const overdue  = plants.filter(p => getWaterInfo(p).status === 'overdue').length;

  if (weather?.isRaining)
    return `Rain today means free watering. ${thriving} of ${total} plants thriving.`;
  if (overdue > 0)
    return `${overdue} plant${overdue !== 1 ? 's' : ''} need${overdue === 1 ? 's' : ''} water today · ${thriving} thriving`;
  if (weather?.isHot)
    return `Hot day — check soil moisture. ${thriving} of ${total} plants looking good.`;
  return `${thriving} of ${total} plant${total !== 1 ? 's' : ''} thriving today`;
}

// ── Today in your garden narrative (Phase 5) ──────────────────────────────────

export function getTodayNarrative(
  plants: UserPlantDoc[],
  weather?: WeatherData | null,
  city?: string,
): string {
  if (plants.length === 0)
    return "Your garden is quiet today — scan a plant to bring it to life.";

  const overdue = plants.filter(p => getWaterInfo(p).status === 'overdue');
  const waterToday = plants.filter(p => getWaterInfo(p).status === 'today');

  if (weather?.isRaining && city)
    return `It's raining in ${city} — skip outdoor watering today.`;
  if (weather?.isRaining)
    return `Rain today — outdoor plants are getting a natural drink.`;
  if (overdue.length > 0 && weather?.isHot)
    return `Hot day and ${overdue.length} plant${overdue.length !== 1 ? 's are' : ' is'} overdue for water — check soon.`;
  if (overdue.length > 0)
    return `${overdue.length} plant${overdue.length !== 1 ? 's need' : ' needs'} water today.`;
  if (waterToday.length > 0)
    return `Time to water ${waterToday.length} plant${waterToday.length !== 1 ? 's' : ''} today.`;
  if (weather?.isHumid)
    return `High humidity today — your plants are loving it.`;
  if (weather?.isHot)
    return `It's hot today — keep an eye on soil moisture.`;

  const healthy = plants.filter(p => p.healthStatus === 'Healthy').length;
  return `${healthy} of ${plants.length} plants thriving — all looks well.`;
}
