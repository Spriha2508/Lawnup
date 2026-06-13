import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanHistoryItem {
  scanId: string;
  imageUri: string;
  commonName: string;
  scientificName: string;
  confidence: number;
  isHealthy: boolean;
  date: string; // ISO timestamp
}

interface ScanHistoryState {
  entries: ScanHistoryItem[];
  addEntry: (e: ScanHistoryItem) => void;
  clear: () => void;
}

const MAX_ENTRIES = 60;

export const useScanHistoryStore = create<ScanHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (e) =>
        set((s) => ({
          entries: [e, ...s.entries.filter((x) => x.scanId !== e.scanId)].slice(0, MAX_ENTRIES),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'scan-history', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
