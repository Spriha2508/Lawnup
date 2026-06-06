import type { Timestamp } from '../../types/firestore.types';

export const toDate = (ts: Timestamp): Date => ts.toDate();

export const formatRelative = (ts: Timestamp): string => {
  const date = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getIndianSeason = (): 'summer' | 'monsoon' | 'winter' => {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 5) return 'summer';   // Mar–Jun
  if (month >= 6 && month <= 9) return 'monsoon';  // Jul–Oct
  return 'winter';                                   // Nov–Feb
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
