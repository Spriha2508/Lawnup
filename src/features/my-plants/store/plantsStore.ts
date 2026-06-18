import { create } from 'zustand';
import type { UserPlantDoc } from '../../../types/firestore.types';

interface PlantsState {
  plants: UserPlantDoc[];
  selectedPlantId: string | null;
  isLoading: boolean;
  // True once the Firestore garden subscription has delivered at least one
  // snapshot for the current user. Screens must not decide "new user / empty
  // garden" vs "show the garden" until this is true — otherwise the initial
  // empty `plants` array flashes a first-run/empty state before data loads (LB-030).
  hydrated: boolean;
  setPlants: (plants: UserPlantDoc[]) => void;
  beginSync: () => void;
  addPlant: (plant: UserPlantDoc) => void;
  updatePlant: (id: string, updates: Partial<UserPlantDoc>) => void;
  removePlant: (id: string) => void;
  selectPlant: (id: string | null) => void;
  getSelectedPlant: () => UserPlantDoc | null;
  getSelectedNickname: () => string | null;
}

export const usePlantsStore = create<PlantsState>((set, get) => ({
  plants: [],
  selectedPlantId: null,
  isLoading: false,
  hydrated: false,

  setPlants: (plants) => set({ plants, isLoading: false, hydrated: true }),

  // Call when (re)subscribing for a user, before the first snapshot, so screens
  // show a loader rather than a premature empty/first-run state.
  beginSync: () => set({ hydrated: false, isLoading: true }),

  addPlant: (plant) =>
    set((state) => ({ plants: [plant, ...state.plants] })),

  updatePlant: (id, updates) =>
    set((state) => ({
      plants: state.plants.map((p) => (p.plantId === id ? { ...p, ...updates } : p)),
    })),

  removePlant: (id) =>
    set((state) => ({
      plants: state.plants.filter((p) => p.plantId !== id),
      selectedPlantId: state.selectedPlantId === id ? null : state.selectedPlantId,
    })),

  selectPlant: (id) => set({ selectedPlantId: id }),

  getSelectedPlant: () => {
    const { plants, selectedPlantId } = get();
    return plants.find((p) => p.plantId === selectedPlantId) ?? null;
  },

  getSelectedNickname: () => {
    const { plants, selectedPlantId } = get();
    return plants.find((p) => p.plantId === selectedPlantId)?.nickname ?? null;
  },
}));

// Preview-mode window bridge — stripped by tree-shaking in production
if (process.env.EXPO_PUBLIC_APP_ENV === 'preview' && typeof window !== 'undefined') {
  (window as any).__plantsStoreSetPlants = (plants: UserPlantDoc[]) =>
    usePlantsStore.setState({ plants });
}
