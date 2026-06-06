import { create } from 'zustand';
import type { ClimateZone } from '../../../constants/plants';

interface OnboardingState {
  city: string;
  climateZone: ClimateZone | null;
  goals: string[];
  setCity: (city: string, zone: ClimateZone) => void;
  setGoals: (goals: string[]) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  city: '',
  climateZone: null,
  goals: [],

  setCity: (city, zone) => set({ city, climateZone: zone }),
  setGoals: (goals) => set({ goals }),
  reset: () => set({ city: '', climateZone: null, goals: [] }),
}));
