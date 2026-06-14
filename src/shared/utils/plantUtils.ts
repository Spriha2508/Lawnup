import type { UserPlantDoc } from '../../types/firestore.types';
import type { HealthStatus , ReminderType } from '../../constants/plants';
import { REMINDER_MESSAGES } from '../../constants/plants';

function safeToDate(raw: any): Date {
  if (raw && typeof raw.toDate === 'function') return raw.toDate();
  if (raw instanceof Date) return raw;
  if (raw) { const d = new Date(raw); if (!isNaN(d.getTime())) return d; }
  return new Date();
}

export const getNextWaterDate = (plant: UserPlantDoc): Date => {
  const last = safeToDate(plant.lastWateredAt);
  const next = new Date(last);
  const freq = plant.wateringFrequencyDays > 0 ? plant.wateringFrequencyDays : 3;
  next.setDate(next.getDate() + freq);
  return next;
};

export const isDueForWater = (plant: UserPlantDoc): boolean => {
  return getNextWaterDate(plant) <= new Date();
};

export const getHealthColor = (status: HealthStatus): string => {
  const map: Record<HealthStatus, string> = {
    Healthy: '#22C55E',
    'Needs Attention': '#F59E0B',
    Critical: '#EF4444',
  };
  return map[status];
};

export const buildReminderMessage = (nickname: string, type: ReminderType): string => {
  const templates = REMINDER_MESSAGES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{nickname}', nickname);
};

/**
 * 0-100 health score: blends health status + watering overdue penalty.
 * Used by the plant card badge.
 */
export const computeHealthScore = (plant: UserPlantDoc): number => {
  let score = 100;
  if (plant.healthStatus === 'Needs Attention') score -= 22;
  if (plant.healthStatus === 'Critical')        score -= 58;
  const nextWater = getNextWaterDate(plant);
  const daysLate  = Math.max(0, Math.floor((Date.now() - nextWater.getTime()) / 86_400_000));
  score -= Math.min(daysLate * 6, 25);
  return Math.max(5, Math.min(100, Math.round(score)));
};

export const getDaysSince = (date: Date): number => {
  const diffMs = new Date().getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const getIKImageUrl = (
  firebaseUrl: string,
  transform = 'tr=w-400,h-400,q-80'
): string => {
  const ikBase = process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!ikBase || !firebaseUrl) return firebaseUrl;
  // Extract path from Firebase Storage URL
  const pathMatch = firebaseUrl.match(/\/o\/(.+)\?/);
  if (!pathMatch) return firebaseUrl;
  const path = decodeURIComponent(pathMatch[1]);
  return `${ikBase}/${path}?${transform}`;
};
