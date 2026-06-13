import type { Season } from '../types';

/**
 * India-first season model:
 *   Summer  — March–June
 *   Monsoon — July–September
 *   Winter  — October–February
 */
export function currentSeason(date: Date = new Date()): Season {
  const m = date.getMonth() + 1; // 1–12
  if (m >= 3 && m <= 6) return 'summer';
  if (m >= 7 && m <= 9) return 'monsoon';
  return 'winter';
}

export const SEASON_LABEL: Record<Season, string> = {
  summer: 'Summer (Mar–Jun)',
  monsoon: 'Monsoon (Jul–Sep)',
  winter: 'Winter (Oct–Feb)',
};
