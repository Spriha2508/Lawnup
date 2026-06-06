import { create } from 'zustand';
import type { UserPlantDoc } from '../../../types/firestore.types';

interface PlantsState {
  plants: UserPlantDoc[];
  selectedPlantId: string | null;
  isLoading: boolean;
  setPlants: (plants: UserPlantDoc[]) => void;
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

  setPlants: (plants) => set({ plants, isLoading: false }),

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
